import { z } from "zod";

export const interviewSetupSchema = z.object({
  role: z.string().min(2, "Indica el puesto al que aplicas"),
  candidateName: z.string().min(2, "Indica tu nombre"),
  level: z.enum(["junior", "mid", "senior"], {
    message: "Selecciona tu nivel de experiencia",
  }),
  interviewType: z.enum(["hr", "tecnico", "no_tecnico", "agresivo"], {
    message: "Selecciona un tipo de entrevista",
  }),
  extraContext: z
    .string()
    .min(10, "Describe el perfil con al menos 10 caracteres"),
});

export type InterviewSetupFormValues = z.infer<typeof interviewSetupSchema>;
