"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSession,
  getSessionSetup,
  saveSession,
} from "./session-storage";
import { interviewService } from "./service-factory";
import type {
  InterviewMessage,
  InterviewPhase,
  InterviewSetupInput,
  OrbState,
} from "./types";

const POOR_CONNECTION_MESSAGE =
  "Entrevista finalizada: la conexión no tuvo calidad suficiente para evaluar al candidato.";

type BrowserNetworkInformation = EventTarget & {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
};

type NavigatorWithConnection = Navigator & {
  connection?: BrowserNetworkInformation;
  mozConnection?: BrowserNetworkInformation;
  webkitConnection?: BrowserNetworkInformation;
};

function getNetworkConnection(): BrowserNetworkInformation | null {
  const nav = navigator as NavigatorWithConnection;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function hasPoorConnection(): boolean {
  if (!navigator.onLine) return true;

  const connection = getNetworkConnection();
  if (!connection) return false;

  return (
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g" ||
    (typeof connection.downlink === "number" && connection.downlink < 0.5) ||
    (typeof connection.rtt === "number" && connection.rtt > 1200)
  );
}

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

function isSuccessEndEvent(raw: unknown): boolean {
  if (typeof raw === "string") {
    try {
      return isSuccessEndEvent(JSON.parse(raw) as unknown);
    } catch {
      return false;
    }
  }

  if (!raw || typeof raw !== "object") return false;

  const record = raw as Record<string, unknown>;
  const successEnd = record.success_end;

  if (successEnd && typeof successEnd === "object") {
    const endRecord = successEnd as Record<string, unknown>;
    return endRecord.type === "end";
  }

  return record.type === "end" && record.label === "Finalizar llamada";
}

function extractConversationId(raw: unknown): string | null {
  if (typeof raw === "string") {
    try {
      return extractConversationId(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }

  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const direct =
    typeof record.conversation_id === "string"
      ? record.conversation_id
      : typeof record.conversationId === "string"
        ? record.conversationId
        : null;

  if (direct) return direct;

  for (const value of Object.values(record)) {
    const nested = extractConversationId(value);
    if (nested) return nested;
  }

  return null;
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
  const [endEventReceived, setEndEventReceived] = useState(false);
  const [agentEnded, setAgentEnded] = useState(false);
  const [agentReportReady, setAgentReportReady] = useState(false);
  const [endedByPoorConnection, setEndedByPoorConnection] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const startedRef = useRef(false);
  const contextSentRef = useRef(false);
  const endPersistedRef = useRef(false);
  const expectedDisconnectRef = useRef(false);
  const poorConnectionHandledRef = useRef(false);

  const markPoorConnection = useCallback(() => {
    if (poorConnectionHandledRef.current) return;

    poorConnectionHandledRef.current = true;
    setEndedByPoorConnection(true);
    setError(POOR_CONNECTION_MESSAGE);
    setPhase("ended");

    const session = getSession(sessionId);
    if (session) {
      saveSession({ ...session, status: "ended" });
    }
  }, [sessionId]);

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

      void interviewService
        .sendMessage(sessionId, { role, text: trimmed })
        .catch((err) => {
          console.error("No se pudo persistir mensaje de entrevista:", err);
        });
    },
    [sessionId],
  );

  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      setConversationId(conversationId);
      setPhase("listening");
      setError(null);
    },
    onDisconnect: () => {
      if (expectedDisconnectRef.current) {
        setPhase((current) => (current === "ended" ? current : "ended"));
        return;
      }

      markPoorConnection();
    },
    onMessage: (message) => {
      const messageConversationId = extractConversationId(message);
      if (messageConversationId) setConversationId(messageConversationId);

      if (isSuccessEndEvent(message)) {
        setEndEventReceived(true);
        return;
      }

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

  const closeForPoorConnection = useCallback(() => {
    expectedDisconnectRef.current = true;
    markPoorConnection();
    endSession();
  }, [endSession, markPoorConnection]);

  useEffect(() => {
    if (message?.trim()) {
      setCurrentQuestion(message.trim());
    }
  }, [message]);

  useEffect(() => {
    const handleConnectionChange = () => {
      if (hasPoorConnection()) {
        closeForPoorConnection();
      }
    };

    window.addEventListener("offline", handleConnectionChange);
    const connection = getNetworkConnection();
    connection?.addEventListener("change", handleConnectionChange);
    handleConnectionChange();

    return () => {
      window.removeEventListener("offline", handleConnectionChange);
      connection?.removeEventListener("change", handleConnectionChange);
    };
  }, [closeForPoorConnection]);

  useEffect(() => {
    if (!endEventReceived || endPersistedRef.current) return;
    endPersistedRef.current = true;

    const closeCall = async () => {
      setPhase("ended");
      expectedDisconnectRef.current = true;
      endSession();
      const session = getSession(sessionId);
      if (session) {
        saveSession({ ...session, status: "ended" });
      }

      try {
        const result = await interviewService.end(sessionId, conversationId, {
          reason: "agent",
        });
        setAgentReportReady(Boolean(result.reportReady));
      } catch (err) {
        console.error("No se pudo cerrar la entrevista sin score:", err);
      } finally {
        setAgentEnded(true);
      }
    };

    void closeCall();
  }, [conversationId, endEventReceived, endSession, sessionId]);

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
        if (hasPoorConnection()) {
          closeForPoorConnection();
          return;
        }

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
      expectedDisconnectRef.current = true;
      endSession();
    };
  }, [setup, startSession, endSession, closeForPoorConnection]);

  const toggleMute = useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  const endInterview = useCallback(() => {
    setPhase("ended");
    expectedDisconnectRef.current = true;
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
    agentEnded,
    agentReportReady,
    endedByPoorConnection,
    conversationId,
    toggleMute,
    endInterview,
  };
}
