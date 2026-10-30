import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reminderAtFrom } from "@/lib/interview/reminder";
import { updateScheduleSchema } from "@/lib/validations/interview";

type RouteContext = { params: Promise<{ scheduleId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { scheduleId } = await context.params;
    const existing = await prisma.schedules.findFirst({
      where: { id: scheduleId, userId: session.user.id },
      include: { interviewSession: true },
    });

    if (!existing?.interviewSession) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (existing.scheduledAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "No se puede editar una cita que ya pasó" },
        { status: 400 },
      );
    }

    const parsed = updateScheduleSchema.safeParse(await request.json());
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

    const timingChanged =
      existing.scheduledAt.getTime() !== scheduledAt.getTime() ||
      existing.reminderOffsetMinutes !== parsed.data.reminderOffsetMinutes;
    const resetReminderEmail =
      timingChanged && reminderAt.getTime() > Date.now();

    await prisma.$transaction([
      prisma.interviewSession.update({
        where: { id: existing.sessionId! },
        data: {
          interviewType: parsed.data.interviewType,
          role: parsed.data.role,
          level: parsed.data.level,
          stack: parsed.data.stack?.trim() || null,
          extraContext: parsed.data.extraContext,
          stressMode: parsed.data.interviewType === "agresivo",
        },
      }),
      prisma.schedules.update({
        where: { id: scheduleId },
        data: {
          scheduledAt,
          candidateName: parsed.data.candidateName,
          reminderOffsetMinutes: parsed.data.reminderOffsetMinutes,
          reminderAt,
          reminderEmailSent: resetReminderEmail
            ? false
            : existing.reminderEmailSent,
        },
      }),
    ]);

    return NextResponse.json({
      scheduleId,
      sessionId: existing.sessionId,
      scheduledAt: scheduledAt.toISOString(),
    });
  } catch (error) {
    console.error("PATCH /api/interview/schedule/[scheduleId] error:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la cita" },
      { status: 500 },
    );
  }
}
