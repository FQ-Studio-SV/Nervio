import type { InterviewService } from "./interview-service";
import {
  getSession,
  getSessionMessages,
  getSessionSetup,
  persistStartSession,
  saveSession,
} from "./session-storage";
import { mockInterviewService } from "./mock-service";
import type {
  InterviewReport,
  InterviewSetupInput,
  InterviewTurn,
  StartInterviewResponse,
} from "./types";

export const apiInterviewService: InterviewService = {
  async start(input: InterviewSetupInput): Promise<StartInterviewResponse> {
    const sessionId = crypto.randomUUID();

    persistStartSession(input, { sessionId });

    return {
      sessionId,
      questions: [],
      question: {
        text: "",
        order_index: 0,
        is_followup: false,
      },
      audioUrl: null,
    };
  },

  async getOpeningQuestion(sessionId: string) {
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");
    return session.messages.find((m) => m.role === "interviewer")?.text ?? "";
  },

  async sendMessage(_sessionId, _payload): Promise<InterviewTurn> {
    throw new Error(
      "sendMessage no aplica: la conversación en vivo la maneja el agente ElevenLabs",
    );
  },

  async end(sessionId: string): Promise<InterviewReport> {
    const session = getSession(sessionId);
    if (session) {
      saveSession({ ...session, status: "ended" });
    }
    return mockInterviewService.end(sessionId);
  },

  async getReport(sessionId: string): Promise<InterviewReport> {
    return mockInterviewService.getReport(sessionId);
  },
};

export { getSessionMessages, getSessionSetup };
