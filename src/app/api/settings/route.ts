import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json({
    storeName: settings.storeName,
    whatsappPhone: settings.whatsappPhone,
    welcomeText: settings.welcomeText,
  });
}
