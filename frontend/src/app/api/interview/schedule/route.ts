import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildInterviewJoinUrl,
  sendScheduleConfirmationEmail,
} from "@/lib/email/schedule-confirmation";
import type { InterviewType, ScheduleInterviewResponse } from "@/lib/interview/types";
import { reminderAtFrom } from "@/lib/interview/reminder";
import { scheduleInterviewSchema } from "@/lib/validations/interview";

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
    const reminderAt = reminderAtFrom(
      scheduledAt,
      parsed.data.reminderOffsetMinutes,
    );
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
            candidateName: parsed.data.candidateName,
            reminderOffsetMinutes: parsed.data.reminderOffsetMinutes,
            reminderAt,
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
      reminder_offset_minutes: String(parsed.data.reminderOffsetMinutes),
      reminder_at: reminderAt.toISOString(),
    });

    const joinUrl = buildInterviewJoinUrl(interview.id);
    let emailSent = false;

    const mailResult = await sendScheduleConfirmationEmail({
      to: session.user.email,
      candidateName: parsed.data.candidateName,
      role: parsed.data.role,
      interviewType: parsed.data.interviewType as InterviewType,
      scheduledAt,
      sessionId: interview.id,
      scheduleId: schedule.id,
    });

    if (mailResult.ok) {
      emailSent = true;
    } else {
      console.warn("Schedule confirmation email:", mailResult.error);
    }

    const response: ScheduleInterviewResponse = {
      sessionId: interview.id,
      scheduleId: schedule.id,
      scheduledAt: scheduledAt.toISOString(),
      emailSent,
      joinUrl,
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
