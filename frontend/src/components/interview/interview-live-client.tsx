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
    agentEnded,
    agentReportReady,
    endedByPoorConnection,
    conversationId,
    toggleMute,
    endInterview,
  } = useInterviewConversation(sessionId);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndInterview = useCallback(async (skipEvaluation = false) => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      endInterview();
      const result = await interviewService.end(
        sessionId,
        skipEvaluation ? null : conversationId,
        {
          reason: skipEvaluation ? "poor_connection" : "manual",
          skipEvaluation,
        },
      );
      if (skipEvaluation) {
        router.push(`/interview/${sessionId}/ended?reason=poor-connection`);
        return;
      }

      router.push(
        result.reportReady
          ? `/interview/${sessionId}/report`
          : `/interview/${sessionId}/ended`,
      );
    } catch (error) {
      console.error("No se pudo finalizar la entrevista:", error);
      if (skipEvaluation) {
        router.push(`/interview/${sessionId}/ended?reason=poor-connection`);
        return;
      }

      setIsEnding(false);
    }
  }, [conversationId, endInterview, isEnding, router, sessionId]);

  useEffect(() => {
    if (!endedByPoorConnection) return;
    void handleEndInterview(true);
  }, [endedByPoorConnection, handleEndInterview]);

  useEffect(() => {
    if (agentEnded) {
      router.push(
        agentReportReady
          ? `/interview/${sessionId}/report`
          : `/interview/${sessionId}/ended`,
      );
    }
  }, [agentEnded, agentReportReady, router, sessionId]);

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
      isBusy={isBusy || isEnding}
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
    let cancelled = false;

    const loadSession = async () => {
      const stored = getSessionSetup(sessionId);
      if (stored) {
        setSetup(stored);
        setIsReady(true);
        return;
      }

      try {
        const persisted = await interviewService.getSession(sessionId);
        if (cancelled) return;
        setSetup(persisted.setup);
      } catch {
        if (!cancelled) router.replace("/interview/setup");
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
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
