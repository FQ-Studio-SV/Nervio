import type { InterviewPhase } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

interface InterviewBubbleProps {
  text: string;
  phase: InterviewPhase;
  className?: string;
}

const phaseLabels: Partial<Record<InterviewPhase, string>> = {
  connecting: "Conectando...",
  speaking: "Entrevistador",
  listening: "Tu turno",
  thinking: "Analizando respuesta...",
};

export function InterviewBubble({ text, phase, className }: InterviewBubbleProps) {
  return (
    <div
      className={cn(
        "glass-panel glow-cyan w-full max-w-lg rounded-3xl px-6 py-5",
        className,
      )}
    >
      <p className="mb-2 text-xs font-medium tracking-wide text-primary uppercase">
        {phaseLabels[phase] ?? "Entrevista"}
      </p>
      <p className="text-base leading-relaxed text-foreground sm:text-lg">
        {text || "Preparando la sesión..."}
      </p>
    </div>
  );
}
