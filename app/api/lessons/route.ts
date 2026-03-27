import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phase = searchParams.get("phase"); // "scheduled" | "pending_log" | "pending_confirm" | "completed"

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[] };
  const isSuperAdmin = sessionUser.roles.includes("SUPER_ADMIN" as Role);
  const isTeacher = sessionUser.roles.includes("TEACHER" as Role);

  const baseWhere: Record<string, unknown> = {};
  if (!isSuperAdmin) {
    if (isTeacher && !sessionUser.roles.some(r => ["ACADEMIC_ADMIN", "PRINCIPAL", "FINANCE"].includes(r as string))) {
      baseWhere.teacherId = sessionUser.id;
    } else {
      baseWhere.student = { campusId: { in: sessionUser.campusIds } };
    }
  }

  let where: Record<string, unknown> = { ...baseWhere };

  if (phase === "pending_log") {
    where.log = null;
    where.startTime = { lt: new Date() }; // Past lessons without log
  } else if (phase === "pending_confirm") {
    where.log = { isNot: null, confirmedAt: null };
  } else if (phase === "completed") {
    where.log = { confirmedAt: { not: null } };
  }

  const lessons = await prisma.scheduledLesson.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true } },
      student: { select: { id: true, name: true } },
      classroom: { select: { name: true } },
      package: { include: { subject: true } },
      log: {
        include: {
          subject: true,
          confirmer: { select: { name: true } },
          deduction: { include: { reverser: { select: { name: true } } } },
        },
      },
    },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return NextResponse.json(lessons);
}
