import { prisma } from "@/lib/prisma";
import type { N8nGenerateInterviewResponse } from "./n8n";
import type { InterviewSetupInput } from "./types";

/**
 * Sincroniza la respuesta de N8N con Prisma (`interview_sessions` + `questions`).
 * El workflow N8N de la compañera usa tabla `sessions`; nuestra app usa `interview_sessions`.
 * Ver frontend/docs/N8N-TABLE-ALIGNMENT.md
 */
export async function syncN8nSessionToPrisma(
  n8n: N8nGenerateInterviewResponse,
  setup: InterviewSetupInput,
  userId: string,
) {
  await prisma.interviewSession.upsert({
    where: { id: n8n.sessionId },
    create: {
      id: n8n.sessionId,
      userId,
      interviewType: setup.interviewType,
      role: setup.role,
      level: setup.level,
      stack: setup.stack ?? null,
      extraContext: setup.extraContext,
      stressMode: setup.interviewType === "agresivo",
      status: "in_progress",
      startedAt: new Date(),
    },
    update: {
      status: "in_progress",
      startedAt: new Date(),
    },
  });

  await prisma.questions.deleteMany({
    where: { sessionId: n8n.sessionId },
  });

  if (n8n.questions.length > 0) {
    await prisma.questions.createMany({
      data: n8n.questions.map((q) => ({
        sessionId: n8n.sessionId,
        questionText: q.question_text,
        orderIndex: q.order_index,
        isFollowup: q.is_followup,
      })),
    });
  }
}
