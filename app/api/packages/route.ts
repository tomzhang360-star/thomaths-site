import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreatePackage } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  studentId: z.string().min(1),
  gradeId: z.string().min(1),
  subjectId: z.string().min(1),
  totalHours: z.number().positive(),
  pricePerHour: z.number().positive(),
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const studentId = searchParams.get("studentId");

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[] };
  const isSuperAdmin = sessionUser.roles.includes("SUPER_ADMIN" as Role);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (studentId) where.studentId = studentId;
  if (!isSuperAdmin) {
    where.student = { campusId: { in: sessionUser.campusIds } };
  }

  const packages = await prisma.coursePackage.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, campusId: true } },
      grade: true,
      subject: true,
      creator: { select: { name: true } },
      confirmer: { select: { name: true } },
      deductions: { where: { reversedAt: null }, select: { hoursDeducted: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(packages);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[]; name: string };
  if (!canCreatePackage(sessionUser)) {
    return NextResponse.json({ error: "无权创建课包" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { studentId, gradeId, subjectId, totalHours, pricePerHour, totalAmount, notes } = parsed.data;

  const pkg = await prisma.coursePackage.create({
    data: {
      studentId,
      gradeId,
      subjectId,
      totalHours,
      pricePerHour,
      totalAmount,
      remainingHours: totalHours,
      notes,
      createdById: sessionUser.id,
      status: "PENDING_APPROVAL",
    },
    include: {
      student: { select: { name: true } },
      grade: true,
      subject: true,
      creator: { select: { name: true } },
    },
  });

  return NextResponse.json(pkg, { status: 201 });
}
