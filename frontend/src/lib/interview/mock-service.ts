import {
  getMockQuestions,
  MOCK_ANSWER_PLACEHOLDERS,
  SESSION_STORAGE_KEY,
} from "./constants";
import type { InterviewService } from "./interview-service";
import type {
  InterviewReport,
  InterviewSetupInput,
  InterviewTurn,
  MockSessionState,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readSessions(): Record<string, MockSessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MockSessionState>) : {};
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, MockSessionState>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

function getSession(sessionId: string): MockSessionState | null {
  return readSessions()[sessionId] ?? null;
}

function saveSession(session: MockSessionState) {
  const sessions = readSessions();
  sessions[session.id] = session;
  writeSessions(sessions);
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

function generateMockReport(session: MockSessionState): InterviewReport {
  const base = 65 + Math.floor(Math.random() * 25);
  const variance = () => Math.max(50, Math.min(98, base + Math.floor(Math.random() * 16) - 8));

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

  return {
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
}

export const mockInterviewService: InterviewService = {
  async start(input) {
    await delay(400);
    const sessionId = crypto.randomUUID();
    const session: MockSessionState = {
      id: sessionId,
      setup: input,
      messages: [],
      questionIndex: 0,
      startedAt: Date.now(),
      status: "active",
    };
    saveSession(session);
    return { sessionId };
  },

  async getOpeningQuestion(sessionId) {
    await delay(300);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");

    const greeting = buildGreeting(session.setup);
    const questions = getMockQuestions(session.setup.interviewType);
    const firstQuestion = questions[0] ?? "Cuéntame sobre ti.";

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
    return firstQuestion;
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
    const questions = getMockQuestions(session.setup.interviewType);

    if (session.questionIndex >= questions.length) {
      session.status = "ended";
      saveSession(session);
      return { isComplete: true, phase: "ended" };
    }

    const nextQuestion = questions[session.questionIndex];
    session.messages.push({
      id: crypto.randomUUID(),
      role: "interviewer",
      text: nextQuestion,
      timestamp: Date.now(),
    });
    saveSession(session);

    return {
      interviewerMessage: nextQuestion,
      isComplete: false,
      phase: "speaking",
    };
  },

  async end(sessionId) {
    await delay(500);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");
    session.status = "ended";
    saveSession(session);
    return generateMockReport(session);
  },

  async getReport(sessionId) {
    await delay(200);
    const session = getSession(sessionId);
    if (!session) throw new Error("Sesión no encontrada");
    return generateMockReport(session);
  },
};

export function getMockSessionMessages(sessionId: string) {
  return getSession(sessionId)?.messages ?? [];
}

export function getMockSessionSetup(sessionId: string) {
  return getSession(sessionId)?.setup ?? null;
}
