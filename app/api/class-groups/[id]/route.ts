import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const classGroup = await prisma.classGroup.findUnique({
    where: { id },
    include: {
      campus: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      grade: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      enrollments: {
        include: {
          package: {
            include: {
              student: { select: { id: true, name: true, phone: true } },
              grade: { select: { name: true } },
              subject: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!classGroup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(classGroup);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[] };
  if (!sessionUser.roles.some(r => ["SUPER_ADMIN", "PRINCIPAL", "ACADEMIC_ADMIN"].includes(r as string))) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { id } = await params;
  const { name, status, maxStudents, notes, teacherId } = await req.json();

  const classGroup = await prisma.classGroup.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(status !== undefined && { status }),
      ...(maxStudents !== undefined && { maxStudents: Number(maxStudents) }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(teacherId !== undefined && { teacherId }),
    },
    include: {
      campus: { select: { name: true } },
      subject: { select: { name: true } },
      grade: { select: { name: true } },
      teacher: { select: { name: true } },
      enrollments: true,
    },
  });
  return NextResponse.json(classGroup);
}
