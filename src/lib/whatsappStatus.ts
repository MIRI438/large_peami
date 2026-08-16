import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";

const SESSION_DIR = path.join(process.cwd(), ".wa-session");
const STATUS_FILE = path.join(SESSION_DIR, "status.json");

export type BotStatus =
  | { state: "starting" }
  | { state: "qr"; qrDataUrl: string }
  | { state: "connected"; phone: string; connectedAt: string }
  | { state: "disconnected"; reason: string };

export function writeStatus(status: BotStatus) {
  mkdirSync(SESSION_DIR, { recursive: true });
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), "utf-8");
}

export function readStatus(): BotStatus {
  if (!existsSync(STATUS_FILE)) {
    return { state: "disconnected", reason: "הבוט לא הופעל עדיין (יש להריץ npm run bot)" };
  }
  try {
    return JSON.parse(readFileSync(STATUS_FILE, "utf-8"));
  } catch {
    return { state: "disconnected", reason: "שגיאה בקריאת סטטוס" };
  }
}

export function authFolder() {
  return path.join(SESSION_DIR, "auth");
}
