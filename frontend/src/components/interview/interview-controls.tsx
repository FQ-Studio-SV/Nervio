"use client";

import { IconMicrophone, IconMicrophoneOff, IconPhoneOff } from "@tabler/icons-react";
import type { InterviewPhase } from "@/lib/interview/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface InterviewControlsProps {
  phase: InterviewPhase;
  isMuted: boolean;
  isBusy: boolean;
  needsMicActivation: boolean;
  connectionLabel: string;
  error?: string | null;
  onActivateMicrophone: () => void;
  onToggleMute: () => void;
  onEndInterview: () => void;
  className?: string;
}

export function InterviewControls({
  phase,
  isMuted,
  isBusy,
  needsMicActivation,
  connectionLabel,
  error,
  onActivateMicrophone,
  onToggleMute,
  onEndInterview,
  className,
}: InterviewControlsProps) {
  const isLive =
    !needsMicActivation &&
    phase !== "connecting" &&
    phase !== "ended" &&
    phase !== "awaiting_mic" &&
    !error;
  const micDisabled = !isLive || isBusy;
  const micLabel = isMuted ? "Activar micrófono" : "Silenciar micrófono";
  const activateLabel = error ? "Reintentar micrófono" : "Activar micrófono";

  return (
    <div
      className={cn(
        "glass-panel flex w-full max-w-lg flex-col gap-3 rounded-2xl bg-background/45 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            isLive ? "animate-pulse bg-emerald-500" : "bg-muted-foreground",
          )}
        />
        <p className="text-sm text-muted-foreground">{connectionLabel}</p>
      </div>

      {error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        {needsMicActivation ? (
          <Button
            type="button"
            variant="default"
            size="lg"
            className="min-h-12 w-full sm:min-w-[240px] sm:w-auto"
            onClick={onActivateMicrophone}
            disabled={isBusy}
          >
            <IconMicrophone className="size-5" data-icon="inline-start" />
            {activateLabel}
          </Button>
        ) : (
          <Button
            type="button"
            variant={isMuted ? "default" : "secondary"}
            size="default"
            className="min-h-11 w-full sm:min-w-[220px] sm:w-auto"
            onClick={onToggleMute}
            disabled={micDisabled}
            aria-label={micLabel}
          >
            {isMuted ? (
              <IconMicrophoneOff className="size-4" data-icon="inline-start" />
            ) : (
              <IconMicrophone className="size-4" data-icon="inline-start" />
            )}
            {micLabel}
          </Button>
        )}

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="min-h-11 w-full sm:w-auto"
          onClick={onEndInterview}
          disabled={isBusy && phase === "connecting"}
        >
          <IconPhoneOff className="size-4" data-icon="inline-start" />
          Finalizar
        </Button>

        {isBusy ? (
          <div className="flex justify-center sm:justify-start">
            <Spinner className="size-5" />
          </div>
        ) : null}
      </div>

      {needsMicActivation ? (
        <p className="text-center text-xs text-muted-foreground">
          Necesitamos acceso al micrófono para la entrevista por voz.
        </p>
      ) : null}

      {!needsMicActivation ? (
        <p className="text-center text-xs text-muted-foreground/80">
          Conversación por voz con el agente ElevenLabs — habla cuando el orbe esté en modo escucha
        </p>
      ) : null}
    </div>
  );
}
