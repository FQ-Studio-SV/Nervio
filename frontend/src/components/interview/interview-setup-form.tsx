"use client";

import { useState } from "react";
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
  INTERVIEW_LANGUAGE_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  interviewService,
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

interface InterviewSetupFormProps {
  defaultCandidateName?: string;
}

export function InterviewSetupForm({
  defaultCandidateName = "",
}: InterviewSetupFormProps) {
  const router = useRouter();
  const [actionMode, setActionMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleConfirmation, setScheduleConfirmation] = useState<string | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<InterviewSetupFormValues>({
    resolver: createZodResolver(interviewSetupSchema),
    defaultValues: {
      role: "",
      candidateName: defaultCandidateName,
      level: undefined,
      language: "es",
      interviewType: undefined,
      extraContext: "",
      stack: "",
    },
  });

  const onSubmit = async (values: InterviewSetupFormValues) => {
    setScheduleError(null);
    setScheduleConfirmation(null);
    clearErrors("root");

    try {
      if (actionMode === "schedule") {
        const date = new Date(scheduledAt);
        if (!scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
          setScheduleError("Selecciona una fecha futura para agendar la cita.");
          return;
        }

        const schedule = await interviewService.schedule({
          ...values,
          scheduledAt,
        });
        setScheduleConfirmation(
          `Cita agendada para ${new Intl.DateTimeFormat("es", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(schedule.scheduledAt))}.`,
        );
        return;
      }

      const { sessionId } = await interviewService.start(values);
      router.push(`/interview/${sessionId}`);
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar la sesión. Intenta de nuevo.",
      });
    }
  };

  const submitLabel = isSubmitting
    ? actionMode === "schedule"
      ? "Guardando cita..."
      : "Conectando con entrevistador..."
    : actionMode === "schedule"
      ? "Agendar cita"
      : "Iniciar simulación";

  return (
    <InterviewSetupCard
      title="Configura tu entrevista"
      description="Personaliza la simulación según el puesto y el tipo de entrevistador"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel>¿Qué quieres hacer?</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                data-selected={actionMode === "now"}
                disabled={isSubmitting}
                onClick={() => setActionMode("now")}
                className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-left text-sm transition-all hover:bg-primary/15 disabled:opacity-50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/20"
              >
                <span className="font-medium">Iniciar ahora</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Conecta con el entrevistador al enviar el formulario.
                </span>
              </button>
              <button
                type="button"
                data-selected={actionMode === "schedule"}
                disabled={isSubmitting}
                onClick={() => setActionMode("schedule")}
                className="rounded-xl border border-secondary/30 bg-secondary/10 p-4 text-left text-sm transition-all hover:bg-secondary/15 disabled:opacity-50 data-[selected=true]:border-secondary data-[selected=true]:bg-secondary/20"
              >
                <span className="font-medium">Agendar cita</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Guarda fecha y hora para practicar después.
                </span>
              </button>
            </div>
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field data-invalid={!!errors.role}>
              <FieldLabel htmlFor="role">Puesto al que aplicas</FieldLabel>
              <Input
                id="role"
                placeholder="Ej. Frontend Developer"
                aria-invalid={!!errors.role}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                {...register("candidateName")}
              />
              <FieldError errors={[errors.candidateName]} />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
                    className={cn(!field.value && "text-muted-foreground")}
                    disabled={isSubmitting}
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

            <Field data-invalid={!!errors.language}>
              <FieldLabel htmlFor="language">Idioma de la entrevista</FieldLabel>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select
                    id="language"
                    value={field.value ?? "es"}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.language}
                    disabled={isSubmitting}
                  >
                    {INTERVIEW_LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
              <FieldError errors={[errors.language]} />
            </Field>
          </div>

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
                        disabled={isSubmitting}
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all disabled:opacity-50",
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

          <Field>
            <FieldLabel htmlFor="stack">Stack tecnológico (opcional)</FieldLabel>
            <Input
              id="stack"
              placeholder="Ej. React, TypeScript, Node.js"
              disabled={isSubmitting}
              {...register("stack")}
            />
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
              disabled={isSubmitting}
              {...register("extraContext")}
            />
            <FieldError errors={[errors.extraContext]} />
          </Field>

          {actionMode === "schedule" ? (
            <Field data-invalid={!!scheduleError}>
              <FieldLabel htmlFor="scheduledAt">Fecha y hora de la cita</FieldLabel>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                disabled={isSubmitting}
                aria-invalid={!!scheduleError}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
              {scheduleError ? <FieldError>{scheduleError}</FieldError> : null}
            </Field>
          ) : null}

          {errors.root && <FieldError>{errors.root.message}</FieldError>}

          {scheduleConfirmation ? (
            <p
              className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-sm text-primary"
              aria-live="polite"
            >
              {scheduleConfirmation}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            {submitLabel}
          </Button>
        </FieldGroup>
      </form>
    </InterviewSetupCard>
  );
}
