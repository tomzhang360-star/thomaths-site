import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

// POST /api/class-groups/:id/enroll  — add a package (student) to a class group
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[] };
  if (!sessionUser.roles.some(r => ["SUPER_ADMIN", "PRINCIPAL", "ACADEMIC_ADMIN", "SALES"].includes(r as string))) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { id: classGroupId } = await params;
  const { packageId } = await req.json();
  if (!packageId) return NextResponse.json({ error: "packageId 必填" }, { status: 400 });

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classGroupId },
    include: { enrollments: true },
  });
  if (!classGroup) return NextResponse.json({ error: "班级不存在" }, { status: 404 });
  if (classGroup.status === "CLOSED") return NextResponse.json({ error: "班级已结班，不可报名" }, { status: 400 });

  // Capacity check
  if (classGroup.enrollments.length >= classGroup.maxStudents) {
    return NextResponse.json({ error: `班级已满（${classGroup.maxStudents}人）` }, { status: 400 });
  }

  // Verify package is ACTIVE and belongs to correct subject/grade
  const pkg = await prisma.coursePackage.findUnique({
    where: { id: packageId },
    include: { enrollment: true },
  });
  if (!pkg) return NextResponse.json({ error: "课包不存在" }, { status: 404 });
  if (pkg.status !== "ACTIVE") return NextResponse.json({ error: "课包未激活" }, { status: 400 });
  if (pkg.enrollment) return NextResponse.json({ error: "该课包已加入其他班级" }, { status: 400 });
  if (pkg.subjectId !== classGroup.subjectId) {
    return NextResponse.json({ error: "课包科目与班级不符" }, { status: 400 });
  }

  const enrollment = await prisma.classGroupEnrollment.create({
    data: { classGroupId, packageId },
    include: { package: { include: { student: { select: { name: true } } } } },
  });
  return NextResponse.json(enrollment, { status: 201 });
}

// DELETE /api/class-groups/:id/enroll  — remove a package from a class group
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[] };
  if (!sessionUser.roles.some(r => ["SUPER_ADMIN", "PRINCIPAL", "ACADEMIC_ADMIN"].includes(r as string))) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { packageId } = await req.json();
  await prisma.classGroupEnrollment.deleteMany({
    where: { classGroupId: (await params).id, packageId },
  });
  return NextResponse.json({ ok: true });
}
