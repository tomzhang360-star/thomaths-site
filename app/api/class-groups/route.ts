import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[]; campusIds: string[] };
  const isSuperAdmin = sessionUser.roles.includes("SUPER_ADMIN" as Role);
  const { searchParams } = new URL(req.url);
  const campusId = searchParams.get("campusId");

  const classGroups = await prisma.classGroup.findMany({
    where: {
      ...(campusId ? { campusId } : !isSuperAdmin ? { campusId: { in: sessionUser.campusIds } } : {}),
    },
    include: {
      campus: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      grade: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      enrollments: {
        include: {
          package: { include: { student: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(classGroups);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[]; campusIds: string[] };
  if (!sessionUser.roles.some(r => ["SUPER_ADMIN", "PRINCIPAL", "ACADEMIC_ADMIN"].includes(r as string))) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { name, campusId, subjectId, gradeId, teacherId, maxStudents, notes } = await req.json();
  if (!name || !campusId || !subjectId || !gradeId || !teacherId) {
    return NextResponse.json({ error: "必填字段不完整" }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.create({
    data: {
      name, campusId, subjectId, gradeId, teacherId,
      maxStudents: maxStudents ? Number(maxStudents) : 6,
      notes: notes || null,
    },
    include: {
      campus: { select: { name: true } },
      subject: { select: { name: true } },
      grade: { select: { name: true } },
      teacher: { select: { name: true } },
      enrollments: true,
    },
  });
  return NextResponse.json(classGroup, { status: 201 });
}
