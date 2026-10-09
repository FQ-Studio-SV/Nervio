"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InterviewLiveShell } from "@/components/interview/interview-live-shell";
import { interviewService } from "@/lib/interview";
import { getSessionSetup } from "@/lib/interview/session-storage";
import { useInterviewConversation } from "@/lib/interview/use-interview-conversation";

function InterviewLiveInner({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const {
    setup,
    phase,
    orbState,
    currentQuestion,
    messages,
    isMuted,
    isBusy,
    error,
    connectionLabel,
    toggleMute,
    endInterview,
  } = useInterviewConversation(sessionId);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndInterview = useCallback(async () => {
    endInterview();
    const report = await interviewService.end(sessionId);
    router.push(`/interview/${report.sessionId}/report`);
  }, [endInterview, router, sessionId]);

  if (!setup) return null;

  return (
    <InterviewLiveShell
      sessionId={sessionId}
      interviewType={setup.interviewType}
      role={setup.role}
      elapsedSeconds={elapsedSeconds}
      phase={phase}
      orbState={orbState}
      currentQuestion={currentQuestion}
      messages={messages}
      isMuted={isMuted}
      isBusy={isBusy}
      connectionLabel={connectionLabel}
      error={error}
      onToggleMute={toggleMute}
      onEndInterview={() => void handleEndInterview()}
    />
  );
}

interface InterviewLiveClientProps {
  sessionId: string;
}

export function InterviewLiveClient({ sessionId }: InterviewLiveClientProps) {
  const router = useRouter();
  const setup = getSessionSetup(sessionId);

  useEffect(() => {
    if (!setup) {
      router.replace("/interview/setup");
    }
  }, [setup, router]);

  if (!setup) return null;

  return (
    <ConversationProvider>
      <InterviewLiveInner sessionId={sessionId} />
    </ConversationProvider>
  );
}
