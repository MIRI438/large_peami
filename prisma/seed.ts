import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "כלים חד פעמיים", emoji: "🍽️", sortOrder: 1 },
  { name: "כוסות ומיכלים", emoji: "🥤", sortOrder: 2 },
  { name: "מפות ומגבונים", emoji: "🧻", sortOrder: 3 },
  { name: "אירועים ומסיבות", emoji: "🎉", sortOrder: 4 },
];

const products: Record<
  string,
  { name: string; description: string; price: number; unit: string; imageEmoji: string; stockQty: number }[]
> = {
  "כלים חד פעמיים": [
    { name: "צלחות פלסטיק לבנות", description: "חבילת 25 יח׳, עמידות ואיכותיות", price: 14.9, unit: "חבילה", imageEmoji: "🍽️", stockQty: 120 },
    { name: "סכו״ם פלסטיק סט", description: "כף, מזלג וסכין - 30 סטים בחבילה", price: 19.9, unit: "חבילה", imageEmoji: "🍴", stockQty: 90 },
    { name: "קעריות מרק חד פעמיות", description: "20 יח׳, מתאימות למיקרוגל", price: 12.5, unit: "חבילה", imageEmoji: "🥣", stockQty: 60 },
    { name: "מגשי הגשה מקרטון", description: "3 יח׳ בגדלים שונים", price: 22.0, unit: "חבילה", imageEmoji: "🍱", stockQty: 40 },
  ],
  "כוסות ומיכלים": [
    { name: "כוסות פלסטיק שקופות 1 ליטר", description: "20 יח׳, לשתייה קרה", price: 9.9, unit: "חבילה", imageEmoji: "🥤", stockQty: 150 },
    { name: "כוסות חמות 200 מ״ל", description: "25 יח׳, מבודדות לקפה ותה חם", price: 15.9, unit: "חבילה", imageEmoji: "☕", stockQty: 100 },
    { name: "מיכלי אחסון עם מכסה", description: "מארז 10 יח׳ בגדלים שונים", price: 27.9, unit: "מארז", imageEmoji: "🍱", stockQty: 55 },
  ],
  "מפות ומגבונים": [
    { name: "מפת שולחן חד פעמית", description: "גליל 5 מ׳, עמיד לכתמים", price: 11.9, unit: "יחידה", imageEmoji: "🧻", stockQty: 70 },
    { name: "מגבוני נייר משי", description: "חבילת 100 יח׳, רכים ואיכותיים", price: 8.5, unit: "חבילה", imageEmoji: "🧻", stockQty: 200 },
    { name: "מגבות נייר לניגוב ידיים", description: "רול ג׳מבו, ספיגה גבוהה", price: 13.9, unit: "יחידה", imageEmoji: "🧻", stockQty: 80 },
  ],
  "אירועים ומסיבות": [
    { name: "בלוני לטקס צבעוניים", description: "50 יח׳, מגוון צבעים", price: 16.9, unit: "חבילה", imageEmoji: "🎈", stockQty: 65 },
    { name: "כלי הגשה חד״פ לאירועים", description: "סט זהב יוקרתי, 25 סועדים", price: 59.9, unit: "סט", imageEmoji: "🎉", stockQty: 20 },
    { name: "נרות יום הולדת", description: "24 יח׳ בצבעים שונים", price: 7.9, unit: "חבילה", imageEmoji: "🕯️", stockQty: 110 },
  ],
};

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    const items = products[cat.name] ?? [];
    for (const item of items) {
      await prisma.product.create({
        data: {
          ...item,
          categoryId: created.id,
        },
      });
    }
  }

  await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      storeName: "יבוא חד פעמי",
      whatsappPhone: "972500000000",
      adminPassword: "admin123",
      welcomeText: "ברוכים הבאים ל🛍️ יבוא חד פעמי! גלול, בחר, ושלח הזמנה ישירות בוואטסאפ 💬",
    },
  });

  console.log("Seed completed ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
