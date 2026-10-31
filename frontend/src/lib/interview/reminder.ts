export const REMINDER_OFFSET_MIN = 1;
export const REMINDER_OFFSET_MAX_MINUTES = 30 * 24 * 60;

export type ReminderOffsetUnit = "minutes" | "hours" | "days";

export const REMINDER_OFFSET_PRESETS: {
  offsetMinutes: number;
  label: string;
  description: string;
}[] = [
  {
    offsetMinutes: 15,
    label: "15 minutos antes",
    description: "Aviso muy cercano a la cita.",
  },
  {
    offsetMinutes: 60,
    label: "1 hora antes",
    description: "Aviso corto, cerca de la hora de la cita.",
  },
  {
    offsetMinutes: 24 * 60,
    label: "24 horas antes",
    description: "Un día de anticipación.",
  },
  {
    offsetMinutes: 7 * 24 * 60,
    label: "1 semana antes",
    description: "Tiempo para prepararte con calma.",
  },
];

export function unitToMinutes(value: number, unit: ReminderOffsetUnit): number {
  if (unit === "minutes") return value;
  if (unit === "hours") return value * 60;
  return value * 24 * 60;
}

export function minutesToCustomParts(minutes: number): {
  value: number;
  unit: ReminderOffsetUnit;
} {
  if (minutes % (24 * 60) === 0) {
    return { value: minutes / (24 * 60), unit: "days" };
  }
  if (minutes % 60 === 0) {
    return { value: minutes / 60, unit: "hours" };
  }
  return { value: minutes, unit: "minutes" };
}

export function formatReminderOffset(offsetMinutes: number): string {
  if (offsetMinutes < 60) {
    return `${offsetMinutes} minuto${offsetMinutes === 1 ? "" : "s"} antes`;
  }
  if (offsetMinutes < 24 * 60) {
    const hours = Math.round(offsetMinutes / 60);
    return `${hours} hora${hours === 1 ? "" : "s"} antes`;
  }
  const days = Math.round(offsetMinutes / (24 * 60));
  return `${days} día${days === 1 ? "" : "s"} antes`;
}

export function reminderAtFrom(
  scheduledAt: Date,
  offsetMinutes: number,
): Date {
  return new Date(scheduledAt.getTime() - offsetMinutes * 60 * 1000);
}

export function isPresetOffset(offsetMinutes: number): boolean {
  return REMINDER_OFFSET_PRESETS.some(
    (preset) => preset.offsetMinutes === offsetMinutes,
  );
}
