import { Resend } from "resend";
import { buildInterviewJoinUrl } from "@/lib/email/schedule-confirmation";
import { buildNervioEmail } from "@/lib/email/nervio-email-layout";
import {
  EXPERIENCE_LEVEL_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
} from "@/lib/interview/constants";
import { formatReminderOffset } from "@/lib/interview/reminder";

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export interface ScheduleReminderEmailInput {
  to: string;
  candidateName: string;
  role: string;
  level: string;
  interviewType: string;
  stack: string | null;
  scheduledAt: Date;
  reminderOffsetMinutes: number;
  sessionId: string;
}

export async function sendScheduleReminderEmail(
  input: ScheduleReminderEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, error: "RESEND_API_KEY o EMAIL_FROM no configurados" };
  }

  const joinUrl = buildInterviewJoinUrl(input.sessionId);
  const typeLabel = optionLabel(INTERVIEW_TYPE_OPTIONS, input.interviewType);
  const levelLabel = optionLabel(EXPERIENCE_LEVEL_OPTIONS, input.level);
  const offsetLabel = formatReminderOffset(input.reminderOffsetMinutes);
  const formattedDate = new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(input.scheduledAt);

  const detailRows = [
    { label: "Puesto", value: input.role },
    { label: "Tipo", value: typeLabel },
    { label: "Nivel", value: levelLabel },
    ...(input.stack?.trim() ? [{ label: "Stack", value: input.stack.trim() }] : []),
    { label: "Fecha", value: formattedDate },
    { label: "Aviso", value: offsetLabel },
  ];

  const html = buildNervioEmail({
    preheader: `Tu entrevista ${offsetLabel}: ${input.role}`,
    badge: "Recordatorio",
    heading: `Hola, ${input.candidateName}`,
    intro: `Te avisamos ${offsetLabel} de tu entrevista simulada. Entra cuando quieras desde el enlace de abajo.`,
    detailRows,
    ctaHref: joinUrl,
    ctaLabel: "Entrar a la entrevista",
    footerNote: "Si ya practicaste, puedes ignorar este correo.",
  });

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: `Recordatorio: entrevista de ${input.role} (${offsetLabel})`,
      html,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error al enviar recordatorio",
    };
  }
}
