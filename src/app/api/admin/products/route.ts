import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { category: true },
  });

  return NextResponse.json({ products });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    productId: string;
    price?: number;
    stockQty?: number;
    inStock?: boolean;
  };

  const product = await prisma.product.update({
    where: { id: body.productId },
    data: {
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.stockQty !== undefined ? { stockQty: body.stockQty } : {}),
      ...(body.inStock !== undefined ? { inStock: body.inStock } : {}),
    },
  });

  return NextResponse.json({ product });
}
