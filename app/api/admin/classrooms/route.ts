import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[]; campusIds: string[] };
  const isSuperAdmin = sessionUser.roles.includes("SUPER_ADMIN" as Role);

  const classrooms = await prisma.classroom.findMany({
    where: isSuperAdmin ? {} : { campusId: { in: sessionUser.campusIds } },
    include: { campus: { select: { id: true, name: true } } },
    orderBy: [{ campus: { name: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json(classrooms);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { roles: Role[]; campusIds: string[] };
  if (!sessionUser.roles.some(r => ["SUPER_ADMIN", "PRINCIPAL"].includes(r as string))) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { name, campusId, capacity, notes } = await req.json();
  if (!name || !campusId) return NextResponse.json({ error: "名称和校区必填" }, { status: 400 });
  if (!sessionUser.roles.includes("SUPER_ADMIN" as Role) && !sessionUser.campusIds.includes(campusId)) {
    return NextResponse.json({ error: "无权操作该校区" }, { status: 403 });
  }

  const classroom = await prisma.classroom.create({
    data: { name, campusId, capacity: capacity ? Number(capacity) : null, notes: notes || null },
    include: { campus: { select: { id: true, name: true } } },
  });
  return NextResponse.json(classroom, { status: 201 });
}
