"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewLiveShell } from "@/components/interview/interview-live-shell";
import {
  getSessionMessages,
  getSessionSetup,
  interviewService,
} from "@/lib/interview";
import { getSession } from "@/lib/interview/session-storage";
import type {
  InterviewMessage,
  InterviewPhase,
  OrbState,
} from "@/lib/interview/types";

function phaseToOrb(phase: InterviewPhase): OrbState {
  switch (phase) {
    case "speaking":
      return "speaking";
    case "listening":
      return "listening";
    case "thinking":
      return "thinking";
    default:
      return "idle";
  }
}

function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Error al reproducir audio"));
    void audio.play().catch(reject);
  });
}

export function useInterviewSession(sessionId: string) {
  const router = useRouter();
  const [phase, setPhase] = useState<InterviewPhase>("connecting");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const initialized = useRef(false);
  const audioPlayed = useRef(false);

  const setup = getSessionSetup(sessionId);

  useEffect(() => {
    if (!setup) {
      router.replace("/interview/setup");
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const boot = async () => {
      setPhase("connecting");
      await new Promise((r) => setTimeout(r, 800));

      const stored = getSession(sessionId);
      const existingMessages = getSessionMessages(sessionId);

      if (existingMessages.length > 0) {
        const lastInterviewer = [...existingMessages]
          .reverse()
          .find((m) => m.role === "interviewer");
        setCurrentQuestion(lastInterviewer?.text ?? "");
        setMessages(existingMessages);
      } else {
        setPhase("speaking");
        const question = await interviewService.getOpeningQuestion(sessionId);
        setCurrentQuestion(question);
        setMessages(getSessionMessages(sessionId));
      }

      setPhase("speaking");

      if (stored?.audioUrl && !audioPlayed.current) {
        audioPlayed.current = true;
        try {
          await playAudioUrl(stored.audioUrl);
        } catch {
          // TTS opcional; la burbuja muestra el texto igual
        }
      }
    };

    void boot();
  }, [sessionId, setup, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshMessages = useCallback(() => {
    setMessages(getSessionMessages(sessionId));
  }, [sessionId]);

  const submitAnswer = useCallback(async () => {
    if (isBusy || phase === "connecting" || phase === "ended") return;

    setIsBusy(true);
    setPhase("listening");
    setIsMicActive(false);

    await new Promise((r) => setTimeout(r, 600));
    setPhase("thinking");

    try {
      const turn = await interviewService.sendMessage(sessionId, {
        text: answerText,
      });

      refreshMessages();
      setAnswerText("");

      if (turn.isComplete) {
        setPhase("ended");
        const report = await interviewService.end(sessionId);
        router.push(`/interview/${report.sessionId}/report`);
        return;
      }

      if (turn.interviewerMessage) {
        setCurrentQuestion(turn.interviewerMessage);
      }
      setPhase("speaking");
    } finally {
      setIsBusy(false);
    }
  }, [answerText, isBusy, phase, refreshMessages, router, sessionId]);

  const endInterview = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    setPhase("thinking");
    try {
      const report = await interviewService.end(sessionId);
      router.push(`/interview/${report.sessionId}/report`);
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, router, sessionId]);

  const toggleMic = useCallback(() => {
    if (phase !== "speaking" && phase !== "listening") return;
    setIsMicActive((v) => !v);
    if (!isMicActive) setPhase("listening");
  }, [isMicActive, phase]);

  return {
    setup,
    phase,
    orbState: phaseToOrb(phase),
    currentQuestion,
    messages,
    answerText,
    isMicActive,
    isBusy,
    elapsedSeconds,
    setAnswerText,
    toggleMic,
    submitAnswer,
    endInterview,
  };
}

interface InterviewLiveClientProps {
  sessionId: string;
}

export function InterviewLiveClient({ sessionId }: InterviewLiveClientProps) {
  const {
    setup,
    phase,
    orbState,
    currentQuestion,
    messages,
    answerText,
    isMicActive,
    isBusy,
    elapsedSeconds,
    setAnswerText,
    toggleMic,
    submitAnswer,
    endInterview,
  } = useInterviewSession(sessionId);

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
      answerText={answerText}
      isMicActive={isMicActive}
      isBusy={isBusy}
      onAnswerTextChange={setAnswerText}
      onToggleMic={toggleMic}
      onSubmitAnswer={() => void submitAnswer()}
      onEndInterview={() => void endInterview()}
    />
  );
}
