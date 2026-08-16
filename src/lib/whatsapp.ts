type OrderMessageItem = {
  name: string;
  quantity: number;
  unit: string;
  price: number;
};

export function formatOrderMessage(params: {
  storeName: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  deliveryType: "pickup" | "delivery";
  address: string;
  notes: string;
  items: OrderMessageItem[];
  total: number;
}) {
  const { storeName, orderNumber, customerName, deliveryType, address, notes, items, total } = params;

  const lines: string[] = [];
  lines.push(`🛍️ *הזמנה חדשה #${orderNumber}* — ${storeName}`);
  lines.push("");
  lines.push(`👤 שם: ${customerName}`);
  lines.push(
    deliveryType === "delivery" ? `🚚 משלוח לכתובת: ${address || "-"}` : "🏪 איסוף עצמי מהחנות"
  );
  lines.push("");
  lines.push("📋 *פריטים:*");
  for (const item of items) {
    lines.push(`• ${item.name} — ${item.quantity} ${item.unit} × ₪${item.price.toFixed(2)}`);
  }
  lines.push("");
  lines.push(`💰 *סה״כ לתשלום: ₪${total.toFixed(2)}*`);
  if (notes.trim()) {
    lines.push("");
    lines.push(`📝 הערות: ${notes.trim()}`);
  }
  lines.push("");
  lines.push("תודה על ההזמנה! 🙏");

  return lines.join("\n");
}

export function buildWaLink(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
