import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { readStatus } from "@/lib/whatsappStatus";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ status: readStatus() });
}
