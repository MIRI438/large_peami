import { NextResponse } from "next/server";
import { createOrder, OrderValidationError, type CartItemInput } from "@/lib/orders";
import { buildWaLink } from "@/lib/whatsapp";

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

  try {
    const { order, waMessage, settings } = await createOrder({ ...body, source: "web" });
    const waLink = buildWaLink(settings.whatsappPhone, waMessage);

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      waLink,
      waMessage,
    });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
