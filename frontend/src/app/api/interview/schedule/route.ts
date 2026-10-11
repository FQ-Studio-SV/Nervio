import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleInterviewSchema } from "@/lib/validations/interview";
import type { ScheduleInterviewResponse } from "@/lib/interview/types";

async function notifySchedule(sessionId: string, payload: Record<string, string>) {
  const endpoint = process.env.N8N_WEBHOOK_SCHEDULE_NOTIFICATION_URL;
  if (!endpoint) return;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responseBody = await response.text().catch(() => "");

    await prisma.webhook_logs.create({
      data: {
        sessionId,
        flowName: "schedule-notification",
        endpoint,
        requestPayload: payload,
        responsePayload: responseBody,
        status: response.ok ? "sent" : "error",
        errorMessage: response.ok ? null : `HTTP ${response.status}`,
      },
    });
  } catch (error) {
    await prisma.webhook_logs.create({
      data: {
        sessionId,
        flowName: "schedule-notification",
        endpoint,
        requestPayload: payload,
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Error notificando N8N",
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const parsed = scheduleInterviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const scheduledAt = new Date(parsed.data.scheduledAt);
    const interview = await prisma.interviewSession.create({
      data: {
        userId: session.user.id,
        interviewType: parsed.data.interviewType,
        role: parsed.data.role,
        level: parsed.data.level,
        stack: parsed.data.stack?.trim() || null,
        extraContext: parsed.data.extraContext,
        stressMode: parsed.data.interviewType === "agresivo",
        status: "scheduled",
        schedules: {
          create: {
            userId: session.user.id,
            scheduledAt,
          },
        },
      },
      include: { schedules: true },
    });

    const schedule = interview.schedules[0];
    if (!schedule) {
      return NextResponse.json(
        { error: "No se pudo crear la cita" },
        { status: 500 },
      );
    }

    void notifySchedule(interview.id, {
      session_id: interview.id,
      schedule_id: schedule.id,
      user_id: session.user.id,
      email: session.user.email,
      candidate_name: parsed.data.candidateName,
      role: parsed.data.role,
      scheduled_at: scheduledAt.toISOString(),
    });

    const response: ScheduleInterviewResponse = {
      sessionId: interview.id,
      scheduleId: schedule.id,
      scheduledAt: scheduledAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/interview/schedule error:", error);
    return NextResponse.json(
      { error: "No se pudo agendar la cita" },
      { status: 500 },
    );
  }
}
