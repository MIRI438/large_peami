import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    storeName?: string;
    whatsappPhone?: string;
    welcomeText?: string;
    adminPassword?: string;
  };

  const settings = await prisma.storeSettings.update({
    where: { id: "singleton" },
    data: {
      ...(body.storeName ? { storeName: body.storeName } : {}),
      ...(body.whatsappPhone ? { whatsappPhone: body.whatsappPhone.replace(/[^0-9]/g, "") } : {}),
      ...(body.welcomeText ? { welcomeText: body.welcomeText } : {}),
      ...(body.adminPassword ? { adminPassword: body.adminPassword } : {}),
    },
  });

  return NextResponse.json({ settings });
}
