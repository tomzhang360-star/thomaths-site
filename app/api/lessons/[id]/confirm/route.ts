import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[] };
  if (!sessionUser.roles.some(r => ["ACADEMIC_ADMIN", "PRINCIPAL", "SUPER_ADMIN"].includes(r as string))) {
    return NextResponse.json({ error: "仅教务/校长可确认核销" }, { status: 403 });
  }

  const { id } = await params;
  const lesson = await prisma.scheduledLesson.findUnique({
    where: { id },
    include: {
      log: { include: { deductions: true } },
      package: true,
      classGroup: {
        include: {
          enrollments: { include: { package: true } },
        },
      },
    },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!lesson.log) return NextResponse.json({ error: "老师尚未提交日志" }, { status: 400 });
  if (lesson.log.deductions.some(d => !d.reversedAt)) {
    return NextResponse.json({ error: "该课程已核销" }, { status: 400 });
  }

  const durationHours = (lesson.endTime.getTime() - lesson.startTime.getTime()) / 3600000;

  const result = await prisma.$transaction(async (tx) => {
    const updatedLog = await tx.lessonLog.update({
      where: { id: lesson.log!.id },
      data: { confirmedById: sessionUser.id, confirmedAt: new Date() },
    });

    if (lesson.lessonType === "ONE_ON_ONE" && lesson.packageId) {
      // ── 1-on-1: single deduction ──────────────────────────────────────────
      const pkg = lesson.package!;
      if (Number(pkg.remainingHours) < durationHours) {
        throw new Error("课包剩余课时不足，无法核销");
      }

      const updatedPkg = await tx.coursePackage.update({
        where: { id: lesson.packageId },
        data: { remainingHours: { decrement: durationHours } },
      });

      await tx.courseDeduction.create({
        data: { packageId: lesson.packageId!, logId: lesson.log!.id, hoursDeducted: durationHours },
      });

      // Low inventory notification
      const newRemaining = Number(updatedPkg.remainingHours);
      if (newRemaining < 3) {
        const student = await tx.student.findUnique({
          where: { id: lesson.studentId! },
          select: { salesId: true, campusId: true },
        });
        const recipients: string[] = [];
        if (student?.salesId) recipients.push(student.salesId);
        const principals = await tx.userCampus.findMany({
          where: { campusId: student?.campusId ?? "" },
          include: { user: { include: { roles: true } } },
        });
        for (const uc of principals) {
          if (uc.user.roles.some(r => r.role === "PRINCIPAL" || r.role === "SUPER_ADMIN")) {
            recipients.push(uc.userId);
          }
        }
        for (const userId of [...new Set(recipients)]) {
          await tx.notification.create({
            data: {
              userId,
              message: `续费提醒：课包剩余仅 ${newRemaining.toFixed(1)}h，请联系家长续费`,
              link: `/packages/${lesson.packageId}`,
            },
          });
        }
      }
    } else if (lesson.lessonType === "GROUP" && lesson.classGroup) {
      // ── Group: deduct from every enrolled student's package ───────────────
      const insufficient: string[] = [];
      for (const enrollment of lesson.classGroup.enrollments) {
        if (Number(enrollment.package.remainingHours) < durationHours) {
          insufficient.push(enrollment.package.id);
        }
      }
      if (insufficient.length === lesson.classGroup.enrollments.length && insufficient.length > 0) {
        throw new Error("所有学生课包课时均不足，无法核销");
      }

      for (const enrollment of lesson.classGroup.enrollments) {
        const pkg = enrollment.package;
        if (Number(pkg.remainingHours) < durationHours) continue; // skip insufficient

        const updatedPkg = await tx.coursePackage.update({
          where: { id: pkg.id },
          data: { remainingHours: { decrement: durationHours } },
        });

        await tx.courseDeduction.create({
          data: { packageId: pkg.id, logId: lesson.log!.id, hoursDeducted: durationHours },
        });

        const newRemaining = Number(updatedPkg.remainingHours);
        if (newRemaining < 3) {
          const student = await tx.student.findUnique({
            where: { id: pkg.studentId },
            select: { salesId: true, campusId: true },
          });
          if (student?.salesId) {
            await tx.notification.create({
              data: {
                userId: student.salesId,
                message: `续费提醒：课包剩余仅 ${newRemaining.toFixed(1)}h，请联系家长续费`,
                link: `/packages/${pkg.id}`,
              },
            });
          }
        }
      }
    }

    return { log: updatedLog };
  });

  return NextResponse.json(result);
}
