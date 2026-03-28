import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[] };
  const isSuperAdmin = sessionUser.roles.includes("SUPER_ADMIN" as Role);

  const classrooms = await prisma.classroom.findMany({
    where: {
      isActive: true,
      ...(isSuperAdmin ? {} : { campusId: { in: sessionUser.campusIds } }),
    },
    include: { campus: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classrooms);
}
