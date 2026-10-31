import { sendScheduleReminderEmail } from "@/lib/email/schedule-reminder";
import { prisma } from "@/lib/prisma";

const POLL_MS = 60_000;

const globalForPoller = globalThis as typeof globalThis & {
  __nervioReminderPoller?: boolean;
};

export async function sendDueReminders(): Promise<number> {
  const now = new Date();
  const due = await prisma.schedules.findMany({
    where: {
      reminderEmailSent: false,
      reminderAt: { lte: now },
      scheduledAt: { gt: now },
      sessionId: { not: null },
    },
    include: {
      user: true,
      interviewSession: true,
    },
    take: 20,
  });

  const results = await Promise.all(
    due.map(async (schedule) => {
      const interview = schedule.interviewSession;
      const email = schedule.user?.email;
      if (!interview || !email || !schedule.sessionId) return false;

      const claimed = await prisma.schedules.updateMany({
        where: { id: schedule.id, reminderEmailSent: false },
        data: { reminderEmailSent: true },
      });
      if (claimed.count !== 1) return false;

      const reminderOffsetMinutes = schedule.reminderOffsetMinutes;
      const result = await sendScheduleReminderEmail({
        to: email,
        candidateName:
          schedule.candidateName.trim() || schedule.user?.name?.trim() || "Candidato",
        role: interview.role,
        level: interview.level,
        interviewType: interview.interviewType,
        stack: interview.stack,
        scheduledAt: schedule.scheduledAt,
        reminderOffsetMinutes,
        sessionId: schedule.sessionId,
      });

      if (result.ok) return true;

      await prisma.schedules.update({
        where: { id: schedule.id },
        data: { reminderEmailSent: false },
      });
      console.warn("Schedule reminder email:", result.error);
      return false;
    }),
  );

  return results.filter(Boolean).length;
}

export function startReminderPoller(): void {
  if (globalForPoller.__nervioReminderPoller) return;
  globalForPoller.__nervioReminderPoller = true;

  void sendDueReminders().catch((error) => {
    console.error("Reminder poller:", error);
  });

  setInterval(() => {
    void sendDueReminders().catch((error) => {
      console.error("Reminder poller:", error);
    });
  }, POLL_MS);
}
