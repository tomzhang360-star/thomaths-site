import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  gradeId: z.string().optional(),
  publicSchool: z.string().optional(),
  salesId: z.string().optional(),
  campusId: z.string().optional(),
  leadSource: z.enum(["OUTREACH", "REFERRAL", "AD", "OTHER"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      grade: true,
      campus: true,
      sales: { select: { id: true, name: true } },
      leadInfo: true,
      followUps: {
        include: { sales: { select: { name: true } } },
        orderBy: { followedAt: "desc" },
      },
      packages: {
        include: { grade: true, subject: true, creator: { select: { name: true } }, confirmer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      lessons: {
        include: {
          teacher: { select: { name: true } },
          classroom: true,
          package: { include: { subject: true } },
          log: { include: { deductions: true } },
        },
        orderBy: { startTime: "desc" },
        take: 20,
      },
    },
  });

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { leadSource, salesId, ...rest } = parsed.data;

  await prisma.student.update({
    where: { id },
    data: { ...rest, salesId: salesId ?? undefined },
  });

  if (leadSource) {
    await prisma.lead.upsert({
      where: { studentId: id },
      create: { studentId: id, source: leadSource },
      update: { source: leadSource },
    });
  }

  const updated = await prisma.student.findUnique({
    where: { id },
    include: { grade: true, campus: true, leadInfo: true },
  });
  return NextResponse.json(updated);
}
