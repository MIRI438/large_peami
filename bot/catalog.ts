import { prisma } from "../src/lib/prisma";

export async function getCatalog() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export function categoryListText(categories: Awaited<ReturnType<typeof getCatalog>>) {
  return categories
    .map((cat, i) => `*${i + 1}.* ${cat.emoji} ${cat.name}  _(${cat.products.length} מוצרים)_`)
    .join("\n");
}

export function productListText(category: Awaited<ReturnType<typeof getCatalog>>[number]) {
  const lines = category.products.map((p, i) => {
    const stock = p.inStock ? "" : " ⚠️ _אזל_";
    return `*${i + 1}.* ${p.imageEmoji} ${p.name}${stock}\n     ₪${p.price.toFixed(2)} / ${p.unit} — ${p.description}`;
  });
  lines.push("*0.* ⬅️ חזרה לתפריט הראשי");
  return lines.join("\n\n");
}
