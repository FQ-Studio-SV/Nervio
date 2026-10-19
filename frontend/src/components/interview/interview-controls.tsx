"use client";

import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconSend,
} from "@tabler/icons-react";
import type { InterviewPhase } from "@/lib/interview/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface InterviewControlsProps {
  phase: InterviewPhase;
  isMicActive: boolean;
  answerText: string;
  onAnswerTextChange: (value: string) => void;
  onToggleMic: () => void;
  onSubmitAnswer: () => void;
  onEndInterview: () => void;
  isBusy: boolean;
  className?: string;
}

export function InterviewControls({
  phase,
  isMicActive,
  answerText,
  onAnswerTextChange,
  onToggleMic,
  onSubmitAnswer,
  onEndInterview,
  isBusy,
  className,
}: InterviewControlsProps) {
  const canRespond =
    !isBusy && (phase === "speaking" || phase === "listening");

  return (
    <div
      className={cn(
        "glass-panel flex w-full max-w-lg flex-col gap-4 rounded-2xl p-4",
        className,
      )}
    >
      <div className="flex gap-2">
        <Input
          value={answerText}
          onChange={(e) => onAnswerTextChange(e.target.value)}
          placeholder="Escribe tu respuesta (opcional en demo)..."
          disabled={!canRespond}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canRespond) onSubmitAnswer();
          }}
        />
        <Button
          type="button"
          size="icon"
          variant={isMicActive ? "default" : "outline"}
          onClick={onToggleMic}
          disabled={!canRespond}
          aria-label={isMicActive ? "Desactivar micrófono" : "Activar micrófono"}
        >
          {isMicActive ? (
            <IconMicrophone className="size-4" />
          ) : (
            <IconMicrophoneOff className="size-4" />
          )}
        </Button>
      </div>

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
          onClick={onSubmitAnswer}
          disabled={!canRespond}
        >
          {isBusy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconSend className="size-4" data-icon="inline-start" />
          )}
          Enviar respuesta
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {/* TODO: integrar MediaRecorder + playback ElevenLabs */}
        Demo simulada — el micrófono es visual por ahora
      </p>
    </div>
  );
}
