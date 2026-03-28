import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lesson = await prisma.scheduledLesson.findUnique({ where: { id }, include: { log: true } });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lesson.log) return NextResponse.json({ error: "已提交日志的课程不能删除" }, { status: 400 });

  await prisma.scheduledLesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
