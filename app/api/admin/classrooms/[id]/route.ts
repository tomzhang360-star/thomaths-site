import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[]; campusIds: string[] };
  if (!sessionUser.roles.some(r => ["SUPER_ADMIN", "PRINCIPAL"].includes(r as string))) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { id } = await params;
  const { name, capacity, notes, isActive } = await req.json();

  const classroom = await prisma.classroom.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(capacity !== undefined && { capacity: capacity ? Number(capacity) : null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { campus: { select: { id: true, name: true } } },
  });
  return NextResponse.json(classroom);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[] };
  if (!sessionUser.roles.includes("SUPER_ADMIN" as Role)) {
    return NextResponse.json({ error: "仅超级管理员可删除教室" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.classroom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
