"use client";

import { useState } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  REMINDER_OFFSET_PRESETS,
  formatReminderOffset,
  isPresetOffset,
  minutesToCustomParts,
  unitToMinutes,
  type ReminderOffsetUnit,
} from "@/lib/interview/reminder";

export type ReminderOffsetMode = "preset" | "custom";

export function useReminderOffsetState(initialOffsetMinutes: number) {
  const startsAsPreset = isPresetOffset(initialOffsetMinutes);
  const parts = minutesToCustomParts(initialOffsetMinutes);

  const [mode, setMode] = useState<ReminderOffsetMode>(
    startsAsPreset ? "preset" : "custom",
  );
  const [presetMinutes, setPresetMinutes] = useState<number | null>(
    startsAsPreset ? initialOffsetMinutes : null,
  );
  const [customValue, setCustomValue] = useState(String(parts.value));
  const [customUnit, setCustomUnit] = useState<ReminderOffsetUnit>(parts.unit);

  const offsetMinutes =
    mode === "preset" && presetMinutes !== null
      ? presetMinutes
      : unitToMinutes(Number(customValue) || 0, customUnit);

  return {
    mode,
    setMode,
    presetMinutes,
    setPresetMinutes,
    customValue,
    setCustomValue,
    customUnit,
    setCustomUnit,
    offsetMinutes,
  };
}

type ReminderOffsetState = ReturnType<typeof useReminderOffsetState>;

interface ReminderOffsetFieldProps {
  state: ReminderOffsetState;
  disabled?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export function ReminderOffsetField({
  state,
  disabled,
  error,
  onClearError,
}: ReminderOffsetFieldProps) {
  const {
    mode,
    setMode,
    presetMinutes,
    setPresetMinutes,
    customValue,
    setCustomValue,
    customUnit,
    setCustomUnit,
    offsetMinutes,
  } = state;

  const presetsDisabled = disabled || mode === "custom";
  const customDisabled = disabled;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>Recordatorio por correo</FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {REMINDER_OFFSET_PRESETS.map((option) => (
          <button
            key={option.offsetMinutes}
            type="button"
            data-selected={
              mode === "preset" && presetMinutes === option.offsetMinutes
            }
            disabled={presetsDisabled}
            onClick={() => {
              setMode("preset");
              setPresetMinutes(option.offsetMinutes);
              const synced = minutesToCustomParts(option.offsetMinutes);
              setCustomValue(String(synced.value));
              setCustomUnit(synced.unit);
              onClearError?.();
            }}
            className="rounded-xl border border-white/15 bg-white/5 p-4 text-left text-sm transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 data-[selected=true]:border-primary data-[selected=true]:bg-primary/15"
          >
            <span className="font-medium">{option.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {option.description}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
        <Field>
          <FieldLabel htmlFor="customReminderValue">Personalizado</FieldLabel>
          <Input
            id="customReminderValue"
            type="number"
            min={1}
            value={customValue}
            disabled={customDisabled}
            onChange={(event) => {
              setMode("custom");
              setPresetMinutes(null);
              setCustomValue(event.target.value);
              onClearError?.();
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="customReminderUnit">Unidad</FieldLabel>
          <Select
            id="customReminderUnit"
            value={customUnit}
            disabled={customDisabled}
            onChange={(event) => {
              setMode("custom");
              setPresetMinutes(null);
              setCustomUnit(event.target.value as ReminderOffsetUnit);
              onClearError?.();
            }}
          >
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Días</option>
          </Select>
        </Field>
      </div>
      {mode === "custom" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Los atajos están desactivados mientras usas un margen personalizado.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Aviso programado: {formatReminderOffset(offsetMinutes)}.
      </p>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
