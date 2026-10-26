import { z } from "zod";

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
});

export type InterviewSetupFormValues = z.infer<typeof interviewSetupSchema>;
export type ScheduleInterviewFormValues = z.infer<typeof scheduleInterviewSchema>;
