import { prisma } from "../src/lib/prisma";
import { createOrder, OrderValidationError } from "../src/lib/orders";
import { getCatalog, categoryListText, productListText } from "./catalog";

export type BotOutgoing =
  | { kind: "text"; text: string }
  | { kind: "image"; url: string; caption?: string };

const RESET_WORDS = ["תפריט", "menu", "reset", "היי", "שלום", "hi", "hello", "התחלה", "start"];

type Cart = Record<string, number>;

function parseCart(json: string): Cart {
  try {
    return JSON.parse(json) as Cart;
  } catch {
    return {};
  }
}

async function categoriesMessage(): Promise<BotOutgoing> {
  const categories = await getCatalog();
  return {
    kind: "text",
    text: `📋 *הקטלוג שלנו*\nבחרי קטגוריה — שלחי את המספר שלה בהודעה:\n\n${categoryListText(categories)}`,
  };
}

async function productsMessage(categoryId: string): Promise<BotOutgoing | null> {
  const categories = await getCatalog();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return null;
  return {
    kind: "text",
    text: `${category.emoji} *${category.name}*\nבחרי מוצר — שלחי את המספר שלו:\n\n${productListText(category)}`,
  };
}

async function cartSummaryText(cart: Cart): Promise<{ text: string; total: number; empty: boolean }> {
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  if (entries.length === 0) {
    return { text: "העגלה שלך ריקה כרגע 🛒", total: 0, empty: true };
  }
  const products = await prisma.product.findMany({ where: { id: { in: entries.map(([id]) => id) } } });
  const lines = ["🛒 *העגלה שלך:*"];
  let total = 0;
  for (const [productId, qty] of entries) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) continue;
    lines.push(`• ${p.name} × ${qty} ${p.unit} — ₪${(p.price * qty).toFixed(2)}`);
    total += p.price * qty;
  }
  lines.push("", `💰 סה״כ: ₪${total.toFixed(2)}`);
  return { text: lines.join("\n"), total, empty: false };
}

function cartMenuMessage(summary: string): BotOutgoing {
  return {
    kind: "text",
    text: `${summary}\n\nמה תרצי לעשות?\n*1.* ➕ להוסיף עוד מוצרים\n*2.* ✅ לסיים ולהזמין\n*3.* 🗑️ לרוקן את העגלה`,
  };
}

function deliveryMessage(): BotOutgoing {
  return {
    kind: "text",
    text: "איך תרצי לקבל את ההזמנה?\n*1.* 🏪 איסוף עצמי מהחנות\n*2.* 🚚 משלוח עד הבית",
  };
}

async function confirmMessage(phone: string): Promise<BotOutgoing> {
  const convo = await prisma.botConversation.findUniqueOrThrow({ where: { phone } });
  const cart = parseCart(convo.cartJson);
  const { text } = await cartSummaryText(cart);

  const lines = [
    text,
    "",
    `👤 שם: ${convo.customerName}`,
    convo.deliveryType === "delivery" ? `🚚 משלוח לכתובת: ${convo.address}` : "🏪 איסוף עצמי מהחנות",
    "",
    "לאשר את ההזמנה?",
    "*1.* ✅ אישור ושליחת ההזמנה",
    "*2.* ❌ ביטול והתחלה מחדש",
  ];

  return { kind: "text", text: lines.join("\n") };
}

async function resetConversation(phone: string) {
  await prisma.botConversation.upsert({
    where: { phone },
    update: {
      step: "category",
      cartJson: "{}",
      customerName: "",
      deliveryType: "pickup",
      address: "",
      pendingProductId: "",
      currentCategoryId: "",
    },
    create: { phone, step: "category" },
  });
}

async function resetConversationToIdle(phone: string) {
  await prisma.botConversation.update({
    where: { phone },
    data: {
      step: "idle",
      cartJson: "{}",
      customerName: "",
      deliveryType: "pickup",
      address: "",
      pendingProductId: "",
      currentCategoryId: "",
    },
  });
}

export async function handleIncomingMessage(phone: string, rawText: string): Promise<BotOutgoing[]> {
  const text = (rawText ?? "").trim();
  const selection = /^\d+$/.test(text) ? text : null;

  const convo = await prisma.botConversation.upsert({
    where: { phone },
    update: {},
    create: { phone, step: "idle" },
  });

  if (RESET_WORDS.includes(text.toLowerCase()) && convo.step !== "idle") {
    await resetConversation(phone);
    return [{ kind: "text", text: "התחלנו מחדש 🙂" }, await categoriesMessage()];
  }

  switch (convo.step) {
    case "idle": {
      await prisma.botConversation.update({ where: { phone }, data: { step: "category" } });
      const settings = await prisma.storeSettings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
      });
      return [{ kind: "text", text: settings.welcomeText }, await categoriesMessage()];
    }

    case "category": {
      const categories = await getCatalog();
      const idx = selection ? parseInt(selection, 10) : NaN;
      const category = categories[idx - 1];
      if (!category) {
        return [{ kind: "text", text: "לא הבנתי 🤔 בחרי מספר מהרשימה למטה:" }, await categoriesMessage()];
      }
      await prisma.botConversation.update({
        where: { phone },
        data: { step: "product", currentCategoryId: category.id },
      });
      const msg = await productsMessage(category.id);
      return [msg!];
    }

    case "product": {
      if (selection === "0") {
        await prisma.botConversation.update({ where: { phone }, data: { step: "category" } });
        return [await categoriesMessage()];
      }
      const categories = await getCatalog();
      const category = categories.find((c) => c.id === convo.currentCategoryId);
      if (!category) {
        await prisma.botConversation.update({ where: { phone }, data: { step: "category" } });
        return [await categoriesMessage()];
      }
      const idx = selection ? parseInt(selection, 10) : NaN;
      const product = category.products[idx - 1];
      if (!product) {
        const msg = await productsMessage(category.id);
        return [{ kind: "text", text: "לא הבנתי 🤔 בחרי מספר מהרשימה למטה:" }, msg!];
      }
      if (!product.inStock) {
        const msg = await productsMessage(category.id);
        return [{ kind: "text", text: `${product.name} אזל המלאי כרגע 😔 בחרי מוצר אחר:` }, msg!];
      }
      await prisma.botConversation.update({
        where: { phone },
        data: { step: "quantity", pendingProductId: product.id },
      });
      const prompt: BotOutgoing = {
        kind: "text",
        text: `כמה יחידות של *${product.name}* (₪${product.price.toFixed(2)}/${product.unit}) תרצי? שלחי מספר, לדוגמה 2`,
      };
      if (product.imageUrl) {
        return [{ kind: "image", url: product.imageUrl, caption: product.name }, prompt];
      }
      return [prompt];
    }

    case "quantity": {
      const qty = parseInt(text, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
        return [{ kind: "text", text: "נא לשלוח מספר תקין של יחידות (לדוגמה 2) 🙂" }];
      }
      const cart = parseCart(convo.cartJson);
      cart[convo.pendingProductId] = (cart[convo.pendingProductId] ?? 0) + qty;
      await prisma.botConversation.update({
        where: { phone },
        data: { step: "cart_menu", cartJson: JSON.stringify(cart), pendingProductId: "" },
      });
      const { text: summary } = await cartSummaryText(cart);
      return [{ kind: "text", text: "נוסף לעגלה ✅" }, cartMenuMessage(summary)];
    }

    case "cart_menu": {
      const cart = parseCart(convo.cartJson);
      if (selection === "1") {
        await prisma.botConversation.update({ where: { phone }, data: { step: "category" } });
        return [await categoriesMessage()];
      }
      if (selection === "2") {
        const { empty, text: summary } = await cartSummaryText(cart);
        if (empty) {
          return [{ kind: "text", text: "העגלה ריקה, בחרי קודם מוצרים 🙂" }, await categoriesMessage()];
        }
        await prisma.botConversation.update({ where: { phone }, data: { step: "ask_name" } });
        return [{ kind: "text", text: summary }, { kind: "text", text: "מה השם המלא שלך?" }];
      }
      if (selection === "3") {
        await prisma.botConversation.update({
          where: { phone },
          data: { step: "category", cartJson: "{}" },
        });
        return [{ kind: "text", text: "העגלה רוקנה 🗑️" }, await categoriesMessage()];
      }
      const { text: summary } = await cartSummaryText(cart);
      return [{ kind: "text", text: "לא הבנתי, בחרי אחת מהאפשרויות 👇" }, cartMenuMessage(summary)];
    }

    case "ask_name": {
      if (text.length < 2) {
        return [{ kind: "text", text: "נא לשלוח שם מלא תקין 🙂" }];
      }
      await prisma.botConversation.update({
        where: { phone },
        data: { step: "ask_delivery", customerName: text },
      });
      return [deliveryMessage()];
    }

    case "ask_delivery": {
      if (selection === "1") {
        await prisma.botConversation.update({
          where: { phone },
          data: { step: "confirm", deliveryType: "pickup", address: "" },
        });
        return [await confirmMessage(phone)];
      }
      if (selection === "2") {
        await prisma.botConversation.update({
          where: { phone },
          data: { step: "ask_address", deliveryType: "delivery" },
        });
        return [{ kind: "text", text: "מה הכתובת למשלוח? (רחוב, מספר, עיר)" }];
      }
      return [{ kind: "text", text: "בחרי אפשרות מהרשימה 👇" }, deliveryMessage()];
    }

    case "ask_address": {
      if (text.length < 3) {
        return [{ kind: "text", text: "נא לשלוח כתובת מלאה 🙂" }];
      }
      await prisma.botConversation.update({ where: { phone }, data: { step: "confirm", address: text } });
      return [await confirmMessage(phone)];
    }

    case "confirm": {
      if (selection === "1") {
        const cart = parseCart(convo.cartJson);
        try {
          const { order } = await createOrder({
            customerName: convo.customerName,
            phone,
            deliveryType: convo.deliveryType === "delivery" ? "delivery" : "pickup",
            address: convo.address,
            items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
            source: "whatsapp-bot",
          });
          const customerName = convo.customerName;
          await resetConversationToIdle(phone);
          return [
            {
              kind: "text",
              text: `תודה ${customerName}! 🙏 ההזמנה שלך מספר *#${order.orderNumber}* התקבלה בהצלחה ונשמרה אצלנו. ניצור איתך קשר בקרוב 💬`,
            },
          ];
        } catch (err) {
          if (err instanceof OrderValidationError) {
            await resetConversationToIdle(phone);
            return [{ kind: "text", text: `אופס, ${err.message}. אפשר להתחיל מחדש 🙂` }];
          }
          throw err;
        }
      }
      if (selection === "2") {
        await resetConversationToIdle(phone);
        return [{ kind: "text", text: "ההזמנה בוטלה. אפשר להתחיל מחדש בכל עת — רק תכתבי לי משהו 😊" }];
      }
      return [{ kind: "text", text: "בחרי אפשרות מהרשימה 👇" }, await confirmMessage(phone)];
    }

    default: {
      await resetConversation(phone);
      return [await categoriesMessage()];
    }
  }
}
