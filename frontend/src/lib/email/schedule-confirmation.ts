import { Resend } from "resend";
import { buildNervioEmail } from "@/lib/email/nervio-email-layout";
import type { InterviewType } from "@/lib/interview/types";

const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  hr: "Recursos Humanos",
  tecnico: "Técnico",
  no_tecnico: "No técnico",
  agresivo: "Agresivo / Estrés",
};

const EVENT_DURATION_MS = 45 * 60 * 1000;

function formatIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildInterviewJoinUrl(sessionId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/interview/${sessionId}`;
}

export function buildGoogleCalendarUrl(params: {
  title: string;
  details: string;
  location: string;
  start: Date;
  end: Date;
}): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("details", params.details);
  url.searchParams.set("location", params.location);
  url.searchParams.set("dates", `${formatIcsUtc(params.start)}/${formatIcsUtc(params.end)}`);
  return url.toString();
}

function buildIcsAttachment(params: {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nervio//Interview Schedule//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(params.start)}`,
    `DTEND:${formatIcsUtc(params.end)}`,
    `SUMMARY:${escapeIcsText(params.title)}`,
    `DESCRIPTION:${escapeIcsText(params.description)}`,
    `LOCATION:${escapeIcsText(params.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export interface ScheduleConfirmationEmailInput {
  to: string;
  candidateName: string;
  role: string;
  interviewType: InterviewType;
  scheduledAt: Date;
  sessionId: string;
  scheduleId: string;
}

export async function sendScheduleConfirmationEmail(
  input: ScheduleConfirmationEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, error: "RESEND_API_KEY o EMAIL_FROM no configurados" };
  }

  const joinUrl = buildInterviewJoinUrl(input.sessionId);
  const typeLabel = INTERVIEW_TYPE_LABELS[input.interviewType];
  const endAt = new Date(input.scheduledAt.getTime() + EVENT_DURATION_MS);
  const formattedDate = new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(input.scheduledAt);

  const title = `Entrevista simulada: ${input.role}`;
  const calendarDetails = [
    `Candidato: ${input.candidateName}`,
    `Tipo: ${typeLabel}`,
    "",
    "Entra a la entrevista:",
    joinUrl,
  ].join("\n");

  const googleCalendarUrl = buildGoogleCalendarUrl({
    title,
    details: calendarDetails,
    location: joinUrl,
    start: input.scheduledAt,
    end: endAt,
  });

  const icsContent = buildIcsAttachment({
    uid: `${input.scheduleId}@nervio`,
    title,
    description: calendarDetails,
    location: joinUrl,
    start: input.scheduledAt,
    end: endAt,
  });

  const html = buildNervioEmail({
    preheader: `Cita agendada: ${input.role} — ${formattedDate}`,
    badge: "Confirmación",
    heading: `Hola, ${input.candidateName}`,
    intro: "Tu entrevista simulada quedó agendada. Guarda la fecha y entra desde el enlace cuando llegue el momento.",
    detailRows: [
      { label: "Puesto", value: input.role },
      { label: "Tipo", value: typeLabel },
      { label: "Fecha", value: formattedDate },
    ],
    ctaHref: joinUrl,
    ctaLabel: "Entrar a la entrevista",
    secondaryLink: {
      href: googleCalendarUrl,
      label: "Añadir a Google Calendar",
    },
    footerNote: "Adjuntamos un archivo .ics por si prefieres importarlo a tu calendario.",
  });

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: `Cita agendada: ${input.role}`,
      html,
      attachments: [
        {
          filename: "entrevista-nervio.ics",
          content: Buffer.from(icsContent, "utf-8"),
          contentType: "text/calendar; charset=utf-8",
        },
      ],
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error al enviar correo",
    };
  }
}
