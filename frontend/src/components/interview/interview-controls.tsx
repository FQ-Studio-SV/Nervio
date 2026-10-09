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
  connectionLabel: string;
  error?: string | null;
  onToggleMute: () => void;
  onEndInterview: () => void;
  className?: string;
}

export function InterviewControls({
  phase,
  isMuted,
  isBusy,
  connectionLabel,
  error,
  onToggleMute,
  onEndInterview,
  className,
}: InterviewControlsProps) {
  const isLive = phase !== "connecting" && phase !== "ended" && !error;

  return (
    <div
      className={cn(
        "glass-panel flex w-full max-w-lg flex-col gap-4 rounded-2xl p-4",
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

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onEndInterview}
          disabled={isBusy || phase === "connecting"}
        >
          <IconPhoneOff className="size-4" data-icon="inline-start" />
          Finalizar
        </Button>

        <Button
          type="button"
          variant={isMuted ? "outline" : "default"}
          size="icon"
          onClick={onToggleMute}
          disabled={!isLive || isBusy}
          aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
        >
          {isMuted ? (
            <IconMicrophoneOff className="size-4" />
          ) : (
            <IconMicrophone className="size-4" />
          )}
        </Button>

        {isBusy ? <Spinner className="size-5" /> : null}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Conversación por voz con el agente ElevenLabs — habla cuando el orbe esté en modo escucha
      </p>
    </div>
  );
}
