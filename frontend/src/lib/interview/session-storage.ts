import { SESSION_STORAGE_KEY } from "./constants";
import type { InterviewSetupInput, MockSessionState } from "./types";

export function readSessions(): Record<string, MockSessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MockSessionState>) : {};
  } catch {
    return {};
  }
}

export function writeSessions(sessions: Record<string, MockSessionState>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

export function getSession(sessionId: string): MockSessionState | null {
  return readSessions()[sessionId] ?? null;
}

export function saveSession(session: MockSessionState) {
  const sessions = readSessions();
  sessions[session.id] = session;
  writeSessions(sessions);
}

export function getSessionMessages(sessionId: string) {
  return getSession(sessionId)?.messages ?? [];
}

export function getSessionSetup(sessionId: string) {
  return getSession(sessionId)?.setup ?? null;
}

export function persistStartSession(
  setup: InterviewSetupInput,
  data: {
    sessionId: string;
    questions?: MockSessionState["questions"];
    firstQuestionText?: string;
    audioUrl?: string | null;
  },
) {
  const messages: MockSessionState["messages"] = data.firstQuestionText
    ? [
        {
          id: crypto.randomUUID(),
          role: "interviewer",
          text: data.firstQuestionText,
          timestamp: Date.now(),
        },
      ]
    : [];

  const session: MockSessionState = {
    id: data.sessionId,
    setup,
    messages,
    questions: data.questions ?? [],
    questionIndex: 0,
    startedAt: Date.now(),
    status: "active",
    audioUrl: data.audioUrl,
  };
  saveSession(session);
  return session;
}
