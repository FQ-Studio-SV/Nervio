import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InterviewSetupCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function InterviewSetupCard({
  title,
  description,
  children,
  className,
}: InterviewSetupCardProps) {
  return (
    <div
      className={cn(
        "glass-panel glow-cyan flex w-full max-w-2xl flex-col gap-6 rounded-2xl p-8",
        className,
      )}
    >
      <div className="space-y-2 text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
