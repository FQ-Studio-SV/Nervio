import type { InterviewMessage } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

interface InterviewTimelineProps {
  messages: InterviewMessage[];
  className?: string;
}

export function InterviewTimeline({ messages, className }: InterviewTimelineProps) {
  if (messages.length === 0) return null;

  const latestMessage = messages[messages.length - 1];

  return (
    <details
      className={cn(
        "group w-full max-w-2xl rounded-2xl border border-white/10 bg-background/35 backdrop-blur-md transition-colors open:bg-background/60",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm marker:hidden">
        <span className="font-medium text-muted-foreground">
          Historial de conversación ({messages.length})
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-muted-foreground/70">
          {latestMessage
            ? `${latestMessage.role === "interviewer" ? "IA" : "Tú"}: ${
                latestMessage.text
              }`
            : "Sin mensajes"}
        </span>
      </summary>
      <div className="border-t border-white/10 px-4 py-3">
        <ul className="max-h-36 space-y-2 overflow-y-auto pr-2">
          {messages.slice(-8).map((msg) => (
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
    </details>
  );
}
