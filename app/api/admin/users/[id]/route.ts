import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  roles: z.array(z.string()).optional(),
  campusIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[]; campusIds: string[]; id: string; name: string };
  if (!canManageUsers(sessionUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { name, password, roles, campusIds, isActive } = parsed.data;

  const updates: { name?: string; passwordHash?: string; isActive?: boolean } = {};
  if (name) updates.name = name;
  if (password) updates.passwordHash = await bcrypt.hash(password, 12);
  if (isActive !== undefined) updates.isActive = isActive;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: updates });
    if (roles) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({ data: roles.map((r) => ({ userId: id, role: r as Role })) });
    }
    if (campusIds) {
      await tx.userCampus.deleteMany({ where: { userId: id } });
      await tx.userCampus.createMany({ data: campusIds.map((campusId) => ({ userId: id, campusId })) });
    }
  });

  const updated = await prisma.user.findUnique({
    where: { id },
    include: { roles: true, campuses: { include: { campus: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[]; campusIds: string[]; id: string; name: string };
  if (!canManageUsers(sessionUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
