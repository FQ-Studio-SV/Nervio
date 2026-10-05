"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import {
  IconBolt,
  IconBriefcase,
  IconHeartHandshake,
  IconTerminal2,
} from "@tabler/icons-react";
import { InterviewSetupCard } from "@/components/interview/interview-setup-card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPERIENCE_LEVEL_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  mockInterviewService,
} from "@/lib/interview";
import type { InterviewType } from "@/lib/interview/types";
import {
  type InterviewSetupFormValues,
  interviewSetupSchema,
} from "@/lib/validations/interview";
import { createZodResolver } from "@/lib/validations/create-zod-resolver";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<InterviewType, typeof IconHeartHandshake> = {
  hr: IconHeartHandshake,
  tecnico: IconTerminal2,
  no_tecnico: IconBriefcase,
  agresivo: IconBolt,
};

const TYPE_STYLES: Record<InterviewType, string> = {
  hr: "border-primary/40 bg-primary/10 hover:bg-primary/15 data-[selected=true]:border-primary data-[selected=true]:bg-primary/20",
  tecnico:
    "border-secondary/40 bg-secondary/10 hover:bg-secondary/15 data-[selected=true]:border-secondary data-[selected=true]:bg-secondary/20",
  no_tecnico:
    "border-white/20 bg-muted/40 hover:bg-muted/60 data-[selected=true]:border-white/40 data-[selected=true]:bg-muted",
  agresivo:
    "border-destructive/40 bg-destructive/10 hover:bg-destructive/15 data-[selected=true]:border-destructive data-[selected=true]:bg-destructive/20",
};

export function InterviewSetupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InterviewSetupFormValues>({
    resolver: createZodResolver(interviewSetupSchema),
    defaultValues: {
      role: "",
      candidateName: "",
      level: undefined,
      interviewType: undefined,
      extraContext: "",
    },
  });

  const onSubmit = async (values: InterviewSetupFormValues) => {
    try {
      const { sessionId } = await mockInterviewService.start(values);
      router.push(`/interview/${sessionId}`);
    } catch {
      setError("root", {
        message: "No se pudo iniciar la sesión. Intenta de nuevo.",
      });
    }
  };

  return (
    <InterviewSetupCard
      title="Configura tu entrevista"
      description="Personaliza la simulación según el puesto y el tipo de entrevistador"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field data-invalid={!!errors.role}>
              <FieldLabel htmlFor="role">Puesto al que aplicas</FieldLabel>
              <Input
                id="role"
                placeholder="Ej. Frontend Developer"
                aria-invalid={!!errors.role}
                {...register("role")}
              />
              <FieldError errors={[errors.role]} />
            </Field>

            <Field data-invalid={!!errors.candidateName}>
              <FieldLabel htmlFor="candidateName">Tu nombre</FieldLabel>
              <Input
                id="candidateName"
                placeholder="Tu nombre completo"
                aria-invalid={!!errors.candidateName}
                {...register("candidateName")}
              />
              <FieldError errors={[errors.candidateName]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.level}>
            <FieldLabel htmlFor="level">Experiencia</FieldLabel>
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <Select
                  id="level"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.level}
                  placeholder="Selecciona tu nivel"
                >
                  {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FieldError errors={[errors.level]} />
          </Field>

          <Field data-invalid={!!errors.interviewType}>
            <FieldLabel>Tipo de entrevista</FieldLabel>
            <Controller
              name="interviewType"
              control={control}
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  {INTERVIEW_TYPE_OPTIONS.map((opt) => {
                    const Icon = TYPE_ICONS[opt.value];
                    const selected = field.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-selected={selected}
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                          TYPE_STYLES[opt.value],
                        )}
                      >
                        <Icon className="size-5" stroke={1.5} />
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            <FieldError errors={[errors.interviewType]} />
          </Field>

          <Field data-invalid={!!errors.extraContext}>
            <FieldLabel htmlFor="extraContext">
              Perfil y contexto adicional
            </FieldLabel>
            <Textarea
              id="extraContext"
              placeholder="Describe el puesto, stack, expectativas o lo que quieras que considere el entrevistador..."
              rows={4}
              aria-invalid={!!errors.extraContext}
              {...register("extraContext")}
            />
            <FieldError errors={[errors.extraContext]} />
          </Field>

          {errors.root && <FieldError>{errors.root.message}</FieldError>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            Iniciar simulación
          </Button>
        </FieldGroup>
      </form>
    </InterviewSetupCard>
  );
}
