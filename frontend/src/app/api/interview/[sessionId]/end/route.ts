import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  fetchElevenLabsEvaluation,
  rememberElevenLabsConversation,
  saveEvaluation,
} from "@/lib/interview/elevenlabs-analysis";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

const endSchema = z.object({
  conversationId: z.string().min(1).optional().nullable(),
  reason: z.enum(["manual", "agent", "poor_connection"]).optional(),
  skipEvaluation: z.boolean().optional(),
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { sessionId } = await params;
    const parsed = endSchema.safeParse(await request.json().catch(() => ({})));
    const payload = parsed.success ? parsed.data : {};
    const conversationId = payload.conversationId ?? null;
    const interview = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      select: { id: true },
    });

    if (!interview) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "ended",
        endedAt: new Date(),
      },
    });

    if (conversationId) {
      await rememberElevenLabsConversation(sessionId, conversationId);
    }

    const evaluation = conversationId && !payload.skipEvaluation
      ? await fetchElevenLabsEvaluation(conversationId)
      : null;

    if (evaluation) {
      await saveEvaluation(sessionId, evaluation);
    }

    return NextResponse.json({
      sessionId,
      status: "ended",
      reportReady: Boolean(evaluation),
    });
  } catch (error) {
    console.error("POST /api/interview/[sessionId]/end error:", error);
    return NextResponse.json(
      { error: "No se pudo finalizar la entrevista" },
      { status: 500 },
    );
  }
}
