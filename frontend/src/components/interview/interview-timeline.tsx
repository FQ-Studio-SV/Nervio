import type { InterviewMessage } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

interface InterviewTimelineProps {
  messages: InterviewMessage[];
  className?: string;
}

export function InterviewTimeline({ messages, className }: InterviewTimelineProps) {
  if (messages.length === 0) return null;

  return (
    <div
      className={cn(
        "glass-panel max-h-40 w-full max-w-lg overflow-y-auto rounded-2xl p-4",
        className,
      )}
    >
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Historial
      </p>
      <ul className="space-y-3">
        {messages.slice(-6).map((msg) => (
          <li key={msg.id} className="text-sm">
            <span
              className={cn(
                "font-medium",
                msg.role === "interviewer" ? "text-primary" : "text-secondary",
              )}
            >
              {msg.role === "interviewer" ? "IA" : "Tú"}:
            </span>{" "}
            <span className="text-muted-foreground">{msg.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
