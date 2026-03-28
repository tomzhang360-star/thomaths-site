import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";
import { z } from "zod";

const createOneOnOneSchema = z.object({
  lessonType: z.literal("ONE_ON_ONE"),
  teacherId:   z.string().min(1),
  studentId:   z.string().min(1),
  packageId:   z.string().min(1),
  classroomId: z.string().min(1),
  startTime:   z.string(),
  endTime:     z.string(),
});

const createGroupSchema = z.object({
  lessonType:   z.literal("GROUP"),
  teacherId:    z.string().min(1),
  classGroupId: z.string().min(1),
  classroomId:  z.string().min(1),
  startTime:    z.string(),
  endTime:      z.string(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start       = searchParams.get("start");
  const end         = searchParams.get("end");
  const teacherId   = searchParams.get("teacherId");
  const classroomId = searchParams.get("classroomId");

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[] };
  const isSuperAdmin = sessionUser.roles.includes("SUPER_ADMIN" as Role);

  const where: Record<string, unknown> = {};
  if (start)       where.startTime  = { gte: new Date(start) };
  if (end)         where.endTime    = { lte: new Date(end) };
  if (teacherId)   where.teacherId  = teacherId;
  if (classroomId) where.classroomId = classroomId;
  if (!isSuperAdmin) {
    where.classroom = { campusId: { in: sessionUser.campusIds } };
  }

  const lessons = await prisma.scheduledLesson.findMany({
    where,
    include: {
      teacher:    { select: { id: true, name: true } },
      student:    { select: { id: true, name: true } },
      classroom:  { select: { id: true, name: true } },
      package:    { include: { subject: true } },
      classGroup: { include: { subject: true, enrollments: true } },
      log:        { select: { id: true, confirmedAt: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const events = lessons.map(l => {
    const isGroup = l.lessonType === "GROUP";
    const subjectName = isGroup
      ? l.classGroup?.subject.name ?? ""
      : l.package?.subject.name ?? "";
    const studentLabel = isGroup
      ? `班课 ${l.classGroup?.enrollments.length ?? 0}人`
      : (l.student?.name ?? "");

    return {
      id: l.id,
      title: `${studentLabel} - ${subjectName} (${l.teacher.name})`,
      start: l.startTime,
      end: l.endTime,
      extendedProps: {
        teacherId:    l.teacherId,
        teacherName:  l.teacher.name,
        studentId:    l.studentId ?? "",
        studentName:  studentLabel,
        classroomId:  l.classroomId,
        classroomName: l.classroom.name,
        packageId:    l.packageId ?? "",
        subjectName,
        lessonType:   l.lessonType,
        classGroupId: l.classGroupId ?? "",
        classGroupName: l.classGroup?.subject.name ?? "",
        enrollCount:  l.classGroup?.enrollments.length ?? 0,
        hasLog:       !!l.log,
        isConfirmed:  !!l.log?.confirmedAt,
      },
      backgroundColor: l.log?.confirmedAt ? "#16a34a" : l.log ? "#d97706" : "#3b82f6",
      borderColor: "transparent",
    };
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const lessonType = body.lessonType ?? "ONE_ON_ONE";

  if (lessonType === "GROUP") {
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { teacherId, classGroupId, classroomId, startTime, endTime } = parsed.data;

    // Load class group with enrollments
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: { enrollments: true },
    });
    if (!classGroup) return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    if (classGroup.status === "CLOSED") return NextResponse.json({ error: "班级已结班" }, { status: 400 });
    if (classGroup.enrollments.length === 0) return NextResponse.json({ error: "班级暂无学生，请先报名" }, { status: 400 });

    // Classroom capacity check
    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!classroom) return NextResponse.json({ error: "教室不存在" }, { status: 404 });
    if (!classroom.isActive) return NextResponse.json({ error: "教室已停用" }, { status: 400 });
    if (classroom.capacity !== null && classGroup.enrollments.length > classroom.capacity) {
      return NextResponse.json({
        error: `学生人数（${classGroup.enrollments.length}）超过教室座位数（${classroom.capacity}）`,
      }, { status: 400 });
    }

    // Conflict check: teacher
    const teacherConflict = await prisma.scheduledLesson.findFirst({
      where: { teacherId, startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } },
    });
    if (teacherConflict) return NextResponse.json({ error: "该时段老师已有课程，存在冲突" }, { status: 409 });

    // Conflict check: classroom
    const classroomConflict = await prisma.scheduledLesson.findFirst({
      where: { classroomId, startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } },
    });
    if (classroomConflict) return NextResponse.json({ error: "该时段教室已被占用，存在冲突" }, { status: 409 });

    const lesson = await prisma.scheduledLesson.create({
      data: {
        teacherId, classGroupId, classroomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        lessonType: "GROUP",
      },
      include: {
        teacher:    { select: { name: true } },
        classGroup: { include: { subject: true, enrollments: true } },
        classroom:  true,
      },
    });
    return NextResponse.json(lesson, { status: 201 });

  } else {
    // ONE_ON_ONE
    const parsed = createOneOnOneSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { teacherId, studentId, packageId, classroomId, startTime, endTime } = parsed.data;

    const pkg = await prisma.coursePackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.status !== "ACTIVE") return NextResponse.json({ error: "课包未激活，无法排课" }, { status: 400 });

    const durationHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000;
    if (Number(pkg.remainingHours) < durationHours) return NextResponse.json({ error: "课包剩余课时不足" }, { status: 400 });

    // Classroom capacity check for 1-on-1 (just active status)
    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!classroom?.isActive) return NextResponse.json({ error: "教室已停用" }, { status: 400 });

    const teacherConflict = await prisma.scheduledLesson.findFirst({
      where: { teacherId, startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } },
    });
    if (teacherConflict) return NextResponse.json({ error: "该时段老师已有课程，存在冲突" }, { status: 409 });

    const classroomConflict = await prisma.scheduledLesson.findFirst({
      where: { classroomId, startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } },
    });
    if (classroomConflict) return NextResponse.json({ error: "该时段教室已被占用，存在冲突" }, { status: 409 });

    const lesson = await prisma.scheduledLesson.create({
      data: {
        teacherId, studentId, packageId, classroomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        lessonType: "ONE_ON_ONE",
      },
      include: {
        teacher:   { select: { name: true } },
        student:   { select: { name: true } },
        classroom: true,
        package:   { include: { subject: true } },
      },
    });
    return NextResponse.json(lesson, { status: 201 });
  }
}
