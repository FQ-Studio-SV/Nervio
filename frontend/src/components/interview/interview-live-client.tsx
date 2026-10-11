"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthBackground } from "@/components/layout/auth-background";
import { InterviewLiveShell } from "@/components/interview/interview-live-shell";
import { interviewService } from "@/lib/interview";
import { getSessionSetup } from "@/lib/interview/session-storage";
import { useInterviewConversation } from "@/lib/interview/use-interview-conversation";
import type { InterviewSetupInput } from "@/lib/interview/types";

function InterviewLiveLoading() {
  return (
    <>
      <AuthBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">Preparando entrevista...</p>
      </div>
    </>
  );
}

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
  const [setup, setSetup] = useState<InterviewSetupInput | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = getSessionSetup(sessionId);
    setSetup(stored);
    setIsReady(true);
    if (!stored) {
      router.replace("/interview/setup");
    }
  }, [sessionId, router]);

  if (!isReady || !setup) {
    return <InterviewLiveLoading />;
  }

  return (
    <ConversationProvider>
      <InterviewLiveInner sessionId={sessionId} />
    </ConversationProvider>
  );
}
