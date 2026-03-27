import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(8),
  password: z.string().min(6),
  roles: z.array(z.nativeEnum({ SUPER_ADMIN: "SUPER_ADMIN", HR: "HR", SALES: "SALES", TEACHER: "TEACHER", ACADEMIC_ADMIN: "ACADEMIC_ADMIN", PRINCIPAL: "PRINCIPAL", FINANCE: "FINANCE" } as const)),
  campusIds: z.array(z.string()),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { roles: Role[]; campusIds: string[]; id: string; name: string };
  if (!canManageUsers(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    include: {
      roles: true,
      campuses: { include: { campus: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { roles: Role[]; campusIds: string[]; id: string; name: string };
  if (!canManageUsers(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { name, phone, password, roles, campusIds } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return NextResponse.json({ error: "该手机号已被注册" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      name,
      phone,
      passwordHash,
      roles: { create: roles.map((r) => ({ role: r as Role })) },
      campuses: { create: campusIds.map((campusId) => ({ campusId })) },
    },
    include: { roles: true, campuses: { include: { campus: true } } },
  });

  return NextResponse.json(newUser, { status: 201 });
}
