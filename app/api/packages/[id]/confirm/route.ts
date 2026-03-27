import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canConfirmPackage } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; roles: Role[]; campusIds: string[]; name: string };
  if (!canConfirmPackage(sessionUser)) {
    return NextResponse.json({ error: "仅校长或超管可确认课包" }, { status: 403 });
  }

  const { id } = await params;
  const pkg = await prisma.coursePackage.findUnique({ where: { id } });
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pkg.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "课包已不是待确认状态" }, { status: 400 });
  }

  const updated = await prisma.coursePackage.update({
    where: { id },
    data: {
      status: "ACTIVE",
      confirmedById: sessionUser.id,
      confirmedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
