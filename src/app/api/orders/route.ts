import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatOrderMessage, buildWaLink } from "@/lib/whatsapp";

type CartItemInput = {
  productId: string;
  quantity: number;
};

type OrderBody = {
  customerName: string;
  phone: string;
  address?: string;
  notes?: string;
  deliveryType?: "pickup" | "delivery";
  items: CartItemInput[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as OrderBody;

  if (!body.customerName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "יש למלא שם וטלפון" }, { status: 400 });
  }
  if (!body.items?.length) {
    return NextResponse.json({ error: "העגלה ריקה" }, { status: 400 });
  }

  const productIds = body.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "אחד המוצרים אינו קיים" }, { status: 400 });
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const itemsWithPrice = body.items.map((i) => {
    const product = products.find((p) => p.id === i.productId)!;
    return {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      quantity: i.quantity,
      price: product.price,
    };
  });
  const total = itemsWithPrice.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const customer = await prisma.customer.upsert({
    where: { phone: body.phone.trim() },
    update: {
      name: body.customerName.trim(),
      address: body.address?.trim() || "",
    },
    create: {
      name: body.customerName.trim(),
      phone: body.phone.trim(),
      address: body.address?.trim() || "",
    },
  });

  const lastOrder = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" } });
  const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

  const waMessage = formatOrderMessage({
    storeName: settings.storeName,
    orderNumber,
    customerName: customer.name,
    phone: customer.phone,
    deliveryType: body.deliveryType === "delivery" ? "delivery" : "pickup",
    address: body.address?.trim() || "",
    notes: body.notes?.trim() || "",
    items: itemsWithPrice,
    total,
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      total,
      deliveryType: body.deliveryType === "delivery" ? "delivery" : "pickup",
      address: body.address?.trim() || "",
      notes: body.notes?.trim() || "",
      waMessage,
      items: {
        create: itemsWithPrice.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
  });

  const waLink = buildWaLink(settings.whatsappPhone, waMessage);

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    waLink,
    waMessage,
  });
}
