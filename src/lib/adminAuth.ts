import { createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE = "admin_auth";

export function hashAdminPassword(password: string) {
  return createHash("sha256").update(`peami-store::${password}`).digest("hex");
}

export async function isAdminAuthed() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const settings = await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return token === hashAdminPassword(settings.adminPassword);
}
