import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditActivePackage } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pkg = await prisma.coursePackage.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, campusId: true } },
      grade: true, subject: true,
      creator: { select: { name: true } },
      confirmer: { select: { name: true } },
      deductions: {
        include: { reverser: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      lessons: {
        include: { teacher: { select: { name: true } }, classroom: true },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pkg);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[]; name: string };
  const { id } = await params;

  const pkg = await prisma.coursePackage.findUnique({ where: { id } });
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Active packages require FINANCE or SUPER_ADMIN
  if (pkg.status !== "PENDING_APPROVAL" && !canEditActivePackage(sessionUser)) {
    return NextResponse.json({ error: "已激活课包仅限财务修改" }, { status: 403 });
  }

  const schema = z.object({
    totalHours: z.number().positive().optional(),
    pricePerHour: z.number().positive().optional(),
    totalAmount: z.number().positive().optional(),
    notes: z.string().optional(),
  });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const updated = await prisma.coursePackage.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.totalHours ? { remainingHours: parsed.data.totalHours } : {}),
    },
    include: { grade: true, subject: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[]; name: string };
  const { id } = await params;

  const pkg = await prisma.coursePackage.findUnique({ where: { id } });
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (pkg.status !== "PENDING_APPROVAL" && !canEditActivePackage(sessionUser)) {
    return NextResponse.json({ error: "已激活课包仅限财务删除" }, { status: 403 });
  }

  await prisma.coursePackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
