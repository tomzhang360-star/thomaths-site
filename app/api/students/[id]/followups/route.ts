import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  contactMethod: z.enum(["PHONE", "WECHAT"]),
  content: z.string().min(1),
  followedAt: z.string(),
  nextFollowUp: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const followUps = await prisma.followUp.findMany({
    where: { studentId: id },
    include: { sales: { select: { name: true } } },
    orderBy: { followedAt: "desc" },
  });
  return NextResponse.json(followUps);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const salesId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { contactMethod, content, followedAt, nextFollowUp } = parsed.data;

  const followUp = await prisma.followUp.create({
    data: {
      studentId: id,
      salesId,
      contactMethod,
      content,
      followedAt: new Date(followedAt),
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
    },
    include: { sales: { select: { name: true } } },
  });

  return NextResponse.json(followUp, { status: 201 });
}
