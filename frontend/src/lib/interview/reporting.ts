import type { InterviewReport, InterviewType } from "./types";

interface ReportSource {
  id: string;
  interviewType: string;
  role: string;
  user?: { name: string } | null;
  evaluations?: {
    scoreGlobal: unknown;
    scoreClarity: unknown;
    scoreKnowledge: unknown;
    scoreConfidence: unknown;
    scoreStructure: unknown;
    strengths: string | null;
    weaknesses: string | null;
    recommendation: string | null;
  } | null;
}

export interface LocalEvaluation {
  scoreGlobal: number;
  scoreClarity: number;
  scoreKnowledge: number;
  scoreConfidence: number;
  scoreStructure: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

interface ElevenLabsResult {
  value?: unknown;
  rationale?: string;
}

export interface ElevenLabsConversationAnalysis {
  analysis?: {
    data_collection_results?: Record<string, ElevenLabsResult>;
  };
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    const decimal = value as { toNumber: () => number };
    return decimal.toNumber();
  }
  return fallback;
}

function resultNumber(
  results: Record<string, ElevenLabsResult>,
  key: string,
  fallback = 0,
) {
  return Math.round(toNumber(results[key]?.value, fallback));
}

function resultStringList(
  results: Record<string, ElevenLabsResult>,
  key: string,
) {
  const value = results[key]?.value;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export function parseStoredList(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function buildLocalEvaluation(responseTexts: string[]): LocalEvaluation {
  const totalWords = responseTexts.join(" ").split(/\s+/).filter(Boolean).length;
  const responseCount = responseTexts.length;
  const averageWords = responseCount > 0 ? totalWords / responseCount : 0;
  const scoreKnowledge = Math.min(95, Math.max(55, Math.round(averageWords * 4)));
  const scoreStructure = Math.min(95, Math.max(50, 62 + responseCount * 6));
  const scoreClarity = Math.min(95, Math.max(55, 58 + Math.round(averageWords * 2)));
  const scoreConfidence = Math.min(95, Math.max(50, responseCount > 1 ? 72 : 60));
  const scoreGlobal = Math.round(
    (scoreClarity + scoreKnowledge + scoreConfidence + scoreStructure) / 4,
  );

  const strengths = [
    responseCount > 1
      ? "Completaste varias respuestas durante la simulación"
      : "Iniciaste la práctica y mantuviste la interacción",
    averageWords >= 12
      ? "Tus respuestas tienen suficiente contexto para evaluar"
      : "Puedes usar este reporte como punto de partida para practicar",
  ];

  const weaknesses = [
    averageWords < 18
      ? "Agrega más ejemplos concretos y resultados medibles"
      : "Refuerza estructura: situación, acción y resultado",
    "Profundiza en decisiones técnicas y trade-offs del rol",
  ];

  return {
    scoreGlobal,
    scoreClarity,
    scoreKnowledge,
    scoreConfidence,
    scoreStructure,
    strengths,
    weaknesses,
    recommendation:
      scoreGlobal >= 75
        ? "Buen desempeño general. Sigue practicando respuestas con ejemplos específicos."
        : "Conviene repetir la simulación enfocándote en respuestas más completas y estructuradas.",
  };
}

export function buildElevenLabsEvaluation(
  conversation: ElevenLabsConversationAnalysis,
): LocalEvaluation | null {
  const results = conversation.analysis?.data_collection_results;
  if (!results) return null;

  const scoreClarity = resultNumber(results, "scoreClarity");
  const scoreKnowledge = resultNumber(results, "scoreKnowledge");
  const scoreConfidence = resultNumber(results, "scoreConfidence");
  const scoreStructure = resultNumber(results, "scoreStructure", scoreClarity);
  const scoreGlobal =
    resultNumber(results, "scoreGlobal") ||
    Math.round(
      (scoreClarity + scoreKnowledge + scoreConfidence + scoreStructure) / 4,
    );
  const strengths = resultStringList(results, "fortalezas");
  const weaknesses = resultStringList(results, "areas_de_mejora");

  if (!scoreGlobal) return null;

  return {
    scoreGlobal,
    scoreClarity,
    scoreKnowledge,
    scoreConfidence,
    scoreStructure,
    strengths,
    weaknesses,
    recommendation:
      typeof results.recommendation?.value === "string"
        ? results.recommendation.value
        : results.scoreGlobal?.rationale ??
          "Reporte generado desde el análisis post-llamada de ElevenLabs.",
  };
}

export function toInterviewReport(session: ReportSource): InterviewReport {
  const evaluation = session.evaluations;

  if (!evaluation) {
    throw new Error("Reporte no generado para esta sesión");
  }

  return {
    sessionId: session.id,
    scoreGlobal: Math.round(toNumber(evaluation.scoreGlobal)),
    scoreClarity: Math.round(toNumber(evaluation.scoreClarity)),
    scoreKnowledge: Math.round(toNumber(evaluation.scoreKnowledge)),
    scoreConfidence: Math.round(toNumber(evaluation.scoreConfidence)),
    scoreStructure: Math.round(toNumber(evaluation.scoreStructure)),
    strengths: parseStoredList(evaluation.strengths),
    weaknesses: parseStoredList(evaluation.weaknesses),
    recommendation: evaluation.recommendation ?? "Sigue practicando para mejorar.",
    interviewType: session.interviewType as InterviewType,
    role: session.role,
    candidateName: session.user?.name ?? "Candidato",
  };
}
