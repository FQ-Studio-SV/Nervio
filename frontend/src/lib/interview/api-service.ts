import type { InterviewService } from "./interview-service";
import {
  getSession,
  getSessionMessages,
  getSessionSetup,
  persistStartSession,
  saveSession,
} from "./session-storage";
import type {
  CloseInterviewResponse,
  InterviewReport,
  InterviewSetupInput,
  InterviewTurn,
  PersistedInterviewSession,
  ScheduleInterviewInput,
  ScheduleInterviewResponse,
  StartInterviewResponse,
} from "./types";

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Error HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export const apiInterviewService: InterviewService = {
  async start(input: InterviewSetupInput): Promise<StartInterviewResponse> {
    const data = await apiJson<StartInterviewResponse>("/api/interview/start", {
      method: "POST",
      body: JSON.stringify(input),
    });

    persistStartSession(input, {
      sessionId: data.sessionId,
      questions: data.questions,
      firstQuestionText: data.question.text,
      audioUrl: data.audioUrl,
    });

    return data;
  },

  async getOpeningQuestion(sessionId: string) {
    const session = getSession(sessionId);
    const cached = session?.messages.find((m) => m.role === "interviewer")?.text;
    if (cached) return cached;

    const persisted = await this.getSession(sessionId);
    return persisted.messages.find((m) => m.role === "interviewer")?.text ?? "";
  },

  async sendMessage(sessionId, payload): Promise<InterviewTurn> {
    return apiJson<InterviewTurn>(`/api/interview/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ role: payload.role, text: payload.text }),
    });
  },

  async end(
    sessionId: string,
    conversationId?: string | null,
    options = {},
  ): Promise<CloseInterviewResponse> {
    const session = getSession(sessionId);
    if (session) {
      saveSession({ ...session, status: "ended" });
    }
    return apiJson<CloseInterviewResponse>(`/api/interview/${sessionId}/end`, {
      method: "POST",
      body: JSON.stringify({ conversationId, ...options }),
    });
  },

  async getReport(sessionId: string): Promise<InterviewReport> {
    return apiJson<InterviewReport>(`/api/interview/${sessionId}/report`);
  },

  async getSession(sessionId: string): Promise<PersistedInterviewSession> {
    const data = await apiJson<PersistedInterviewSession>(
      `/api/interview/${sessionId}`,
    );

    if (!getSession(sessionId)) {
      persistStartSession(data.setup, {
        sessionId: data.id,
        questions: data.questions,
        firstQuestionText:
          data.messages.find((m) => m.role === "interviewer")?.text ??
          data.questions[0]?.question_text,
      });
      const cached = getSession(sessionId);
      if (cached) {
        saveSession({
          ...cached,
          messages: data.messages,
          status: data.status === "ended" ? "ended" : "active",
        });
      }
    }

    return data;
  },

  async schedule(
    input: ScheduleInterviewInput,
  ): Promise<ScheduleInterviewResponse> {
    return apiJson<ScheduleInterviewResponse>("/api/interview/schedule", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export { getSessionMessages, getSessionSetup };
