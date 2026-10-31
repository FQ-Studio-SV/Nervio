"use client";

import Link from "next/link";
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
import {
  ReminderOffsetField,
  useReminderOffsetState,
} from "@/components/interview/reminder-offset-field";
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
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import {
  EXPERIENCE_LEVEL_OPTIONS,
  INTERVIEW_LANGUAGE_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  interviewService,
} from "@/lib/interview";
import {
  REMINDER_OFFSET_MAX_MINUTES,
  REMINDER_OFFSET_MIN,
} from "@/lib/interview/reminder";
import type {
  ExperienceLevel,
  InterviewType,
} from "@/lib/interview/types";
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

export interface ScheduleEditInitial {
  scheduleId: string;
  scheduledAt: Date;
  reminderOffsetMinutes: number;
  role: string;
  candidateName: string;
  level: ExperienceLevel;
  interviewType: InterviewType;
  extraContext: string;
  stack: string;
}

interface ScheduleEditFormProps {
  initial: ScheduleEditInitial;
}

export function ScheduleEditForm({ initial }: ScheduleEditFormProps) {
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState(() =>
    toDatetimeLocalValue(initial.scheduledAt),
  );
  const reminderState = useReminderOffsetState(initial.reminderOffsetMinutes);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);

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
      role: initial.role,
      candidateName: initial.candidateName,
      level: initial.level,
      language: "es",
      interviewType: initial.interviewType,
      extraContext: initial.extraContext,
      stack: initial.stack,
    },
  });

  const onSubmit = async (values: InterviewSetupFormValues) => {
    setScheduleError(null);
    setReminderError(null);
    clearErrors("root");

    const date = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setScheduleError("Selecciona una fecha futura para la cita.");
      return;
    }

    const reminderOffsetMinutes = reminderState.offsetMinutes;
    const customNumber = Number(reminderState.customValue);

    if (
      reminderState.mode === "custom" &&
      (!Number.isFinite(customNumber) || customNumber <= 0)
    ) {
      setReminderError("Indica un recordatorio válido.");
      return;
    }

    if (
      reminderOffsetMinutes < REMINDER_OFFSET_MIN ||
      reminderOffsetMinutes > REMINDER_OFFSET_MAX_MINUTES
    ) {
      setReminderError("Indica un recordatorio válido.");
      return;
    }

    const reminderAt = date.getTime() - reminderOffsetMinutes * 60 * 1000;
    if (reminderAt <= Date.now()) {
      setReminderError(
        "Ese aviso quedaría en el pasado. Elige una cita más lejana o un margen más corto.",
      );
      return;
    }

    try {
      await interviewService.updateSchedule(initial.scheduleId, {
        ...values,
        scheduledAt,
        reminderOffsetMinutes,
      });
      router.push("/interview/schedules");
      router.refresh();
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar los cambios. Intenta de nuevo.",
      });
    }
  };

  return (
    <InterviewSetupCard
      title="Editar cita"
      description="Actualiza fecha, recordatorio y detalles de la entrevista"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
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

          <ReminderOffsetField
            state={reminderState}
            disabled={isSubmitting}
            error={reminderError}
            onClearError={() => setReminderError(null)}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <Field data-invalid={!!errors.role}>
              <FieldLabel htmlFor="role">Puesto al que aplicas</FieldLabel>
              <Input
                id="role"
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
            <Input id="stack" disabled={isSubmitting} {...register("stack")} />
          </Field>

          <Field data-invalid={!!errors.extraContext}>
            <FieldLabel htmlFor="extraContext">Perfil y contexto adicional</FieldLabel>
            <Textarea
              id="extraContext"
              rows={4}
              aria-invalid={!!errors.extraContext}
              disabled={isSubmitting}
              {...register("extraContext")}
            />
            <FieldError errors={[errors.extraContext]} />
          </Field>

          {errors.root && <FieldError>{errors.root.message}</FieldError>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              Guardar cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
              render={<Link href="/interview/schedules" />}
            >
              Cancelar
            </Button>
          </div>
        </FieldGroup>
      </form>
    </InterviewSetupCard>
  );
}
