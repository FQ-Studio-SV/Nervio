"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSession,
  getSessionSetup,
  saveSession,
} from "./session-storage";
import type {
  InterviewMessage,
  InterviewPhase,
  InterviewSetupInput,
  OrbState,
} from "./types";

function buildContext(setup: InterviewSetupInput): string {
  const parts = [
    `Entrevista simulada en español.`,
    `Candidato: ${setup.candidateName}`,
    `Puesto: ${setup.role}`,
    `Nivel: ${setup.level}`,
    `Tipo de entrevista: ${setup.interviewType}`,
  ];
  if (setup.stack?.trim()) parts.push(`Stack: ${setup.stack.trim()}`);
  if (setup.extraContext?.trim()) parts.push(`Contexto: ${setup.extraContext.trim()}`);
  return parts.join("\n");
}

function phaseToOrb(phase: InterviewPhase, isSpeaking: boolean): OrbState {
  if (phase === "connecting") return "idle";
  if (phase === "ended") return "idle";
  if (phase === "thinking") return "thinking";
  if (isSpeaking || phase === "speaking") return "speaking";
  if (phase === "listening") return "listening";
  return "idle";
}

function extractMessagePayload(raw: unknown): {
  role: "interviewer" | "candidate";
  text: string;
} | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    return text ? { role: "interviewer", text } : null;
  }

  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const text =
    typeof record.message === "string"
      ? record.message
      : typeof record.text === "string"
        ? record.text
        : "";

  if (!text.trim()) return null;

  const source = String(record.source ?? record.role ?? record.type ?? "").toLowerCase();
  const role =
    source.includes("user") || source.includes("human")
      ? "candidate"
      : "interviewer";

  return { role, text: text.trim() };
}

export function useInterviewConversation(sessionId: string) {
  const setup = getSessionSetup(sessionId);
  const [messages, setMessages] = useState<InterviewMessage[]>(
    () => getSession(sessionId)?.messages ?? [],
  );
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [phase, setPhase] = useState<InterviewPhase>("connecting");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const contextSentRef = useRef(false);

  const appendMessage = useCallback(
    (role: "interviewer" | "candidate", text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const msg: InterviewMessage = {
        id: crypto.randomUUID(),
        role,
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === role && last.text === trimmed) return prev;

        const next = [...prev, msg];
        const session = getSession(sessionId);
        if (session) {
          saveSession({ ...session, messages: next });
        }
        return next;
      });

      if (role === "interviewer") {
        setCurrentQuestion(trimmed);
      }
    },
    [sessionId],
  );

  const conversation = useConversation({
    onConnect: () => {
      setPhase("listening");
      setError(null);
    },
    onDisconnect: () => {
      setPhase((current) => (current === "ended" ? current : "ended"));
    },
    onMessage: (message) => {
      const parsed = extractMessagePayload(message);
      if (parsed) appendMessage(parsed.role, parsed.text);
    },
    onModeChange: ({ mode }) => {
      setPhase(mode === "speaking" ? "speaking" : "listening");
    },
    onError: (err) => {
      const message =
        typeof err === "string" ? err : "Error de conexión con el agente";
      setError(message);
    },
  });

  const {
    status,
    isSpeaking,
    isMuted,
    setMuted,
    startSession,
    endSession,
    sendContextualUpdate,
    message,
  } = conversation;

  useEffect(() => {
    if (message?.trim()) {
      setCurrentQuestion(message.trim());
    }
  }, [message]);

  useEffect(() => {
    if (status !== "connected" || !setup || contextSentRef.current) return;
    contextSentRef.current = true;
    sendContextualUpdate(buildContext(setup));
  }, [status, setup, sendContextualUpdate]);

  useEffect(() => {
    if (!setup || startedRef.current) return;
    startedRef.current = true;

    const connect = async () => {
      try {
        setPhase("connecting");
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const response = await fetch("/api/elevenlabs/token");
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "No se pudo conectar con ElevenLabs");
        }

        const { token } = (await response.json()) as { token: string };
        startSession({ conversationToken: token });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al iniciar la conversación",
        );
        setPhase("ended");
      }
    };

    void connect();

    return () => {
      endSession();
    };
  }, [setup, startSession, endSession]);

  const toggleMute = useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  const endInterview = useCallback(() => {
    setPhase("ended");
    endSession();
    const session = getSession(sessionId);
    if (session) {
      saveSession({ ...session, status: "ended" });
    }
  }, [endSession, sessionId]);

  const connectionLabel =
    status === "connected"
      ? "En vivo"
      : status === "connecting"
        ? "Conectando..."
        : error
          ? "Error"
          : "Desconectado";

  return {
    setup,
    phase,
    orbState: phaseToOrb(phase, isSpeaking),
    currentQuestion,
    messages,
    isMuted,
    isBusy: status === "connecting",
    error,
    connectionLabel,
    toggleMute,
    endInterview,
  };
}
