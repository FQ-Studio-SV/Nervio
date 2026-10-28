import {
  getMockQuestions,
  MOCK_ANSWER_PLACEHOLDERS,
} from "./constants";
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGreeting(setup: InterviewSetupInput): string {
  const typeLabels = {
    hr: "recursos humanos",
    tecnico: "técnica",
    no_tecnico: "general",
    agresivo: "bajo presión",
  };

  return `Hola ${setup.candidateName}, soy tu entrevistador virtual. Hoy tendremos una entrevista ${typeLabels[setup.interviewType]} para el puesto de ${setup.role}. Cuando estés listo, responde la primera pregunta.`;
}

function generateMockReport(session: ReturnType<typeof getSession>) {
  if (!session) throw new Error("Sesión no encontrada");

  const base = 65 + Math.floor(Math.random() * 25);
  const variance = () =>
    Math.max(50, Math.min(98, base + Math.floor(Math.random() * 16) - 8));

  const typeModifiers: Record<
    InterviewSetupInput["interviewType"],
    { strengths: string[]; weaknesses: string[]; recommendation: string }
  > = {
    hr: {
      strengths: [
        "Buena comunicación y claridad al expresar motivaciones",
        "Demuestra trabajo en equipo y empatía",
      ],
      weaknesses: [
        "Podrías profundizar más en ejemplos concretos",
        "Falta mencionar logros medibles",
      ],
      recommendation:
        "Perfil prometedor para siguiente fase. Refuerza historias con métricas.",
    },
    tecnico: {
      strengths: [
        "Base sólida en conceptos técnicos",
        "Capacidad de razonar sobre trade-offs",
      ],
      weaknesses: [
        "Algunas respuestas podrían ser más estructuradas",
        "Profundiza en casos de escalabilidad real",
      ],
      recommendation:
        "Nivel adecuado con margen de mejora. Practica system design y casos reales.",
    },
    no_tecnico: {
      strengths: [
        "Comunicación clara y profesional",
        "Buen manejo de situaciones interpersonales",
      ],
      weaknesses: [
        "Algunas respuestas fueron genéricas",
        "Conecta más tu experiencia con el rol específico",
      ],
      recommendation:
        "Buen candidato para roles de coordinación. Personaliza más tus ejemplos.",
    },
    agresivo: {
      strengths: [
        "Mantuviste la calma bajo presión",
        "Respondiste con determinación en momentos clave",
      ],
      weaknesses: [
        "Algunas respuestas se volvieron defensivas",
        "Practica respuestas más concisas bajo interrupción",
      ],
      recommendation:
        "Buen desempeño en stress mode. Sigue entrenando respuestas directas y seguras.",
    },
  };

  const mod = typeModifiers[session.setup.interviewType];

  const report: InterviewReport = {
    sessionId: session.id,
    scoreGlobal: base,
    scoreClarity: variance(),
    scoreKnowledge: variance(),
    scoreConfidence: variance(),
    scoreStructure: variance(),
    strengths: mod.strengths,
    weaknesses: mod.weaknesses,
    recommendation: mod.recommendation,
    interviewType: session.setup.interviewType,
    role: session.setup.role,
    candidateName: session.setup.candidateName,
  };

  return report;
}

export const mockInterviewService: InterviewService = {
  async start(input): Promise<StartInterviewResponse> {
    await delay(400);
    const sessionId = crypto.randomUUID();
    const questions = getMockQuestions(input.interviewType).map((text, i) => ({
      session_id: sessionId,
      question_text: text,
      order_index: i + 1,
      is_followup: false,
    }));
    const firstQuestion = questions[0]?.question_text ?? "Cuéntame sobre ti.";

    persistStartSession(input, {
      sessionId,
      questions,
      firstQuestionText: firstQuestion,
      audioUrl: null,
    });

    return {
      sessionId,
      questions,
      question: {
        text: firstQuestion,
        order_index: 1,
        is_followup: false,
      },
      audioUrl: null,
    };
  },

  async getOpeningQuestion(sessionId) {
    await delay(300);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");

    const greeting = buildGreeting(session.setup);
    const firstQuestion =
      session.questions[0]?.question_text ??
      getMockQuestions(session.setup.interviewType)[0] ??
      "Cuéntame sobre ti.";

    if (session.messages.length === 0) {
      session.messages.push(
        {
          id: crypto.randomUUID(),
          role: "interviewer",
          text: greeting,
          timestamp: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          role: "interviewer",
          text: firstQuestion,
          timestamp: Date.now() + 1,
        },
      );
      saveSession(session);
    }

    return firstQuestion;
  },

  async sendMessage(sessionId, payload): Promise<InterviewTurn> {
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

  async end(sessionId): Promise<CloseInterviewResponse> {
    await delay(500);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");
    session.status = "ended";
    saveSession(session);
    return { sessionId, status: "ended", reportReady: false };
  },

  async getReport(sessionId) {
    await delay(200);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");
    return generateMockReport(session);
  },

  async getSession(sessionId): Promise<PersistedInterviewSession> {
    await delay(100);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");
    return {
      id: session.id,
      setup: session.setup,
      messages: session.messages,
      questions: session.questions,
      status: session.status,
      startedAt: session.startedAt,
      scheduledAt: null,
    };
  },

  async schedule(
    input: ScheduleInterviewInput,
  ): Promise<ScheduleInterviewResponse> {
    await delay(300);
    const sessionId = crypto.randomUUID();
    return {
      sessionId,
      scheduleId: crypto.randomUUID(),
      scheduledAt: input.scheduledAt,
    };
  },
};

export { getSessionMessages as getMockSessionMessages, getSessionSetup as getMockSessionSetup };
