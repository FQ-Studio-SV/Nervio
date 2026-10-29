import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/email/send-due-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const sent = await sendDueReminders();
    return NextResponse.json({ sent });
  } catch (error) {
    console.error("GET /api/cron/reminders error:", error);
    return NextResponse.json(
      { error: "No se pudieron enviar los recordatorios" },
      { status: 500 },
    );
  }
}
