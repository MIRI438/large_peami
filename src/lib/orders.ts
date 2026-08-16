import { prisma } from "@/lib/prisma";
import { formatOrderMessage } from "@/lib/whatsapp";

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderParams = {
  customerName: string;
  phone: string;
  address?: string;
  notes?: string;
  deliveryType?: "pickup" | "delivery";
  items: CartItemInput[];
  source?: "web" | "whatsapp-bot";
};

export class OrderValidationError extends Error {}

export async function createOrder(params: CreateOrderParams) {
  if (!params.customerName?.trim() || !params.phone?.trim()) {
    throw new OrderValidationError("יש למלא שם וטלפון");
  }
  if (!params.items?.length) {
    throw new OrderValidationError("העגלה ריקה");
  }

  const productIds = params.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    throw new OrderValidationError("אחד המוצרים אינו קיים");
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const itemsWithPrice = params.items.map((i) => {
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
    where: { phone: params.phone.trim() },
    update: {
      name: params.customerName.trim(),
      address: params.address?.trim() || "",
    },
    create: {
      name: params.customerName.trim(),
      phone: params.phone.trim(),
      address: params.address?.trim() || "",
    },
  });

  const lastOrder = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" } });
  const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

  const deliveryType = params.deliveryType === "delivery" ? "delivery" : "pickup";

  const waMessage = formatOrderMessage({
    storeName: settings.storeName,
    orderNumber,
    customerName: customer.name,
    phone: customer.phone,
    deliveryType,
    address: params.address?.trim() || "",
    notes: params.notes?.trim() || "",
    items: itemsWithPrice,
    total,
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      total,
      deliveryType,
      address: params.address?.trim() || "",
      notes: params.notes?.trim() || "",
      waMessage,
      source: params.source ?? "web",
      items: {
        create: itemsWithPrice.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
  });

  return { order, waMessage, total, settings, items: itemsWithPrice };
}
