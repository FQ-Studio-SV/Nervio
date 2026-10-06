import type { InterviewService } from "./interview-service";
import {
  getSession,
  getSessionMessages,
  getSessionSetup,
  persistStartSession,
  saveSession,
} from "./session-storage";
import {
  getMockQuestions,
  MOCK_ANSWER_PLACEHOLDERS,
} from "./constants";
import { mockInterviewService } from "./mock-service";
import type {
  InterviewReport,
  InterviewSetupInput,
  InterviewTurn,
  StartInterviewResponse,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const apiInterviewService: InterviewService = {
  async start(input: InterviewSetupInput): Promise<StartInterviewResponse> {
    const response = await fetch("/api/interview/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(body.error ?? "No se pudo iniciar la entrevista");
    }

    const data = (await response.json()) as StartInterviewResponse;

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
    if (!session) throw new Error("Sesión no encontrada");
    return session.messages.find((m) => m.role === "interviewer")?.text ?? "";
  },

  async sendMessage(sessionId, payload) {
    await delay(600);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");
    if (session.status === "ended") {
      return { isComplete: true, phase: "ended" };
    }

    const answerText =
      payload.text?.trim() ||
      MOCK_ANSWER_PLACEHOLDERS[
        session.questionIndex % MOCK_ANSWER_PLACEHOLDERS.length
      ];

    session.messages.push({
      id: crypto.randomUUID(),
      role: "candidate",
      text: answerText,
      timestamp: Date.now(),
    });

    session.questionIndex += 1;

    const questions =
      session.questions.length > 0
        ? session.questions
        : getMockQuestions(session.setup.interviewType).map((text, i) => ({
            session_id: sessionId,
            question_text: text,
            order_index: i + 1,
            is_followup: false,
          }));

    if (session.questionIndex >= questions.length) {
      session.status = "ended";
      saveSession(session);
      return { isComplete: true, phase: "ended" };
    }

    const nextQuestion = questions[session.questionIndex];
    session.messages.push({
      id: crypto.randomUUID(),
      role: "interviewer",
      text: nextQuestion.question_text,
      timestamp: Date.now(),
    });
    saveSession(session);

    return {
      interviewerMessage: nextQuestion.question_text,
      isComplete: false,
      phase: "speaking",
    };
  },

  async end(sessionId: string): Promise<InterviewReport> {
    return mockInterviewService.end(sessionId);
  },

  async getReport(sessionId: string): Promise<InterviewReport> {
    return mockInterviewService.getReport(sessionId);
  },
};

export { getSessionMessages, getSessionSetup };
