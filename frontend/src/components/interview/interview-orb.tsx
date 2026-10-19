import type { OrbState } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

interface InterviewOrbProps {
  state: OrbState;
  className?: string;
}

const stateClassMap: Record<OrbState, string> = {
  idle: "orb-state-idle",
  speaking: "orb-state-speaking",
  listening: "orb-state-listening",
  thinking: "orb-state-thinking",
};

export function InterviewOrb({ state, className }: InterviewOrbProps) {
  return (
    <div
      className={cn(
        "relative flex size-56 items-center justify-center sm:size-72",
        stateClassMap[state],
        className,
      )}
      aria-hidden
    >
      {state === "speaking" && (
        <>
          <div className="orb-ripple-ring absolute inset-0 rounded-full border border-primary/30" />
          <div className="orb-ripple-ring-delayed absolute inset-2 rounded-full border border-primary/20" />
        </>
      )}

      <div className="interview-orb-halo absolute inset-0 scale-125 rounded-full" />
      <div className="interview-orb-core relative size-40 rounded-full sm:size-48" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
    </div>
  );
}
