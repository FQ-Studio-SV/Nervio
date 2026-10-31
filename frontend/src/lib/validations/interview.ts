import { z } from "zod";
import {
  REMINDER_OFFSET_MAX_MINUTES,
  REMINDER_OFFSET_MIN,
} from "@/lib/interview/reminder";

export const interviewSetupSchema = z.object({
  role: z.string().min(2, "Indica el puesto al que aplicas"),
  candidateName: z.string().min(2, "Indica tu nombre"),
  level: z.enum(["junior", "mid", "senior"], {
    message: "Selecciona tu nivel de experiencia",
  }),
  language: z.enum(["es", "en", "pt"], {
    message: "Selecciona el idioma de la entrevista",
  }),
  interviewType: z.enum(["hr", "tecnico", "no_tecnico", "agresivo"], {
    message: "Selecciona un tipo de entrevista",
  }),
  extraContext: z
    .string()
    .min(10, "Describe el perfil con al menos 10 caracteres"),
  stack: z.string().optional(),
});

export const scheduleInterviewSchema = interviewSetupSchema.extend({
  scheduledAt: z
    .string()
    .min(1, "Selecciona fecha y hora")
    .refine((value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
    }, "Selecciona una fecha futura"),
  reminderOffsetMinutes: z
    .number()
    .int("El recordatorio debe ser un número entero")
    .min(
      REMINDER_OFFSET_MIN,
      `El recordatorio debe ser al menos ${REMINDER_OFFSET_MIN} minuto`,
    )
    .max(
      REMINDER_OFFSET_MAX_MINUTES,
      "El recordatorio no puede ser mayor a 30 días",
    ),
}).superRefine((data, ctx) => {
  const scheduledAt = new Date(data.scheduledAt);
  const reminderAt = scheduledAt.getTime() - data.reminderOffsetMinutes * 60 * 1000;
  if (reminderAt <= Date.now()) {
    ctx.addIssue({
      code: "custom",
      message:
        "El recordatorio quedaría en el pasado. Elige una cita más lejana o un aviso más corto.",
      path: ["reminderOffsetMinutes"],
    });
  }
});

export const updateScheduleSchema = scheduleInterviewSchema;

export type InterviewSetupFormValues = z.infer<typeof interviewSetupSchema>;
export type ScheduleInterviewFormValues = z.infer<typeof scheduleInterviewSchema>;
export type UpdateScheduleFormValues = z.infer<typeof updateScheduleSchema>;
