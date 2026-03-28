import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";
import { z } from "zod";

const schema = z.object({
  subjectId: z.string().min(1),
  notes: z.string().min(1, "上课日志不能为空"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[] };
  if (!sessionUser.roles.some(r => ["TEACHER", "SUPER_ADMIN"].includes(r as string))) {
    return NextResponse.json({ error: "仅老师可提交上课日志" }, { status: 403 });
  }

  const { id } = await params;
  const lesson = await prisma.scheduledLesson.findUnique({ where: { id }, include: { log: true } });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lesson.log) return NextResponse.json({ error: "已提交日志" }, { status: 400 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const log = await prisma.lessonLog.create({
    data: {
      lessonId: id,
      teacherId: sessionUser.id,
      subjectId: parsed.data.subjectId,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
