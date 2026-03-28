import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[] };
  if (!sessionUser.roles.some(r => ["FINANCE", "SUPER_ADMIN"].includes(r as string))) {
    return NextResponse.json({ error: "仅财务/超管可撤销核销" }, { status: 403 });
  }

  const { id } = await params;
  const lesson = await prisma.scheduledLesson.findUnique({
    where: { id },
    include: { log: { include: { deductions: true } } },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const activeDeductions = lesson.log?.deductions.filter(d => !d.reversedAt) ?? [];
  if (activeDeductions.length === 0) return NextResponse.json({ error: "该课程未核销" }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    // Reverse all active deductions (handles both 1-on-1 and group)
    const reversed = await Promise.all(activeDeductions.map(d =>
      tx.courseDeduction.update({
        where: { id: d.id },
        data: { reversedAt: new Date(), reversedById: sessionUser.id },
      })
    ));

    // Restore hours to each package
    for (const d of activeDeductions) {
      await tx.coursePackage.update({
        where: { id: d.packageId },
        data: { remainingHours: { increment: Number(d.hoursDeducted) } },
      });
    }

    await tx.lessonLog.update({
      where: { id: lesson.log!.id },
      data: { confirmedById: null, confirmedAt: null },
    });

    return reversed;
  });

  return NextResponse.json(result);
}
