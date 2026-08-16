import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json({ orders });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { orderId, status } = (await request.json()) as { orderId: string; status: string };
  const allowed = ["new", "confirmed", "packed", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { id: orderId }, data: { status } });
  return NextResponse.json({ order });
}
