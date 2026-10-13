import {
  buildElevenLabsEvaluation,
  type ElevenLabsConversationAnalysis,
  type LocalEvaluation,
} from "@/lib/interview/reporting";
import { prisma } from "@/lib/prisma";

const FLOW_NAME = "elevenlabs-conversation";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rememberElevenLabsConversation(
  sessionId: string,
  conversationId: string,
) {
  const existing = await prisma.webhook_logs.findFirst({
    where: {
      sessionId,
      flowName: FLOW_NAME,
      status: "conversation_id",
    },
    select: { id: true },
  });

  const payload = { conversationId };

  if (existing) {
    await prisma.webhook_logs.update({
      where: { id: existing.id },
      data: { requestPayload: payload },
    });
    return;
  }

  await prisma.webhook_logs.create({
    data: {
      sessionId,
      flowName: FLOW_NAME,
      endpoint: "elevenlabs-conversation-id",
      requestPayload: payload,
      status: "conversation_id",
    },
  });
}

export async function getRememberedElevenLabsConversationId(sessionId: string) {
  const log = await prisma.webhook_logs.findFirst({
    where: {
      sessionId,
      flowName: FLOW_NAME,
      status: "conversation_id",
    },
    orderBy: { createdAt: "desc" },
    select: { requestPayload: true },
  });

  const payload = log?.requestPayload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const conversationId = (payload as Record<string, unknown>).conversationId;
  return typeof conversationId === "string" ? conversationId : null;
}

export async function fetchElevenLabsEvaluation(
  conversationId: string,
  attempts = 8,
): Promise<LocalEvaluation | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await delay(1500);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(
        conversationId,
      )}`,
      {
        headers: { "xi-api-key": apiKey },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("ElevenLabs conversation error:", response.status, detail);
      return null;
    }

    const conversation =
      (await response.json()) as ElevenLabsConversationAnalysis & {
        status?: string;
      };
    const evaluation = buildElevenLabsEvaluation(conversation);
    if (evaluation) return evaluation;
    if (conversation.status === "done") return null;
  }

  return null;
}

export async function saveEvaluation(sessionId: string, evaluation: LocalEvaluation) {
  await prisma.evaluations.upsert({
    where: { sessionId },
    create: {
      sessionId,
      scoreGlobal: evaluation.scoreGlobal,
      scoreClarity: evaluation.scoreClarity,
      scoreKnowledge: evaluation.scoreKnowledge,
      scoreConfidence: evaluation.scoreConfidence,
      scoreStructure: evaluation.scoreStructure,
      strengths: JSON.stringify(evaluation.strengths),
      weaknesses: JSON.stringify(evaluation.weaknesses),
      recommendation: evaluation.recommendation,
    },
    update: {
      scoreGlobal: evaluation.scoreGlobal,
      scoreClarity: evaluation.scoreClarity,
      scoreKnowledge: evaluation.scoreKnowledge,
      scoreConfidence: evaluation.scoreConfidence,
      scoreStructure: evaluation.scoreStructure,
      strengths: JSON.stringify(evaluation.strengths),
      weaknesses: JSON.stringify(evaluation.weaknesses),
      recommendation: evaluation.recommendation,
    },
  });
}
