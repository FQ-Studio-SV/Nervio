import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildLocalEvaluation, toInterviewReport } from "@/lib/interview/reporting";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { sessionId } = await params;
    const interview = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        responses: { orderBy: { createdAt: "asc" } },
        user: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    const localEvaluation = buildLocalEvaluation(
      interview.responses
        .map((response) => response.responseText?.trim())
        .filter((text): text is string => Boolean(text)),
    );

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "ended",
        endedAt: new Date(),
      },
    });

    const evaluation = await prisma.evaluations.upsert({
      where: { sessionId },
      create: {
        sessionId,
        scoreGlobal: localEvaluation.scoreGlobal,
        scoreClarity: localEvaluation.scoreClarity,
        scoreKnowledge: localEvaluation.scoreKnowledge,
        scoreConfidence: localEvaluation.scoreConfidence,
        scoreStructure: localEvaluation.scoreStructure,
        strengths: JSON.stringify(localEvaluation.strengths),
        weaknesses: JSON.stringify(localEvaluation.weaknesses),
        recommendation: localEvaluation.recommendation,
      },
      update: {
        scoreGlobal: localEvaluation.scoreGlobal,
        scoreClarity: localEvaluation.scoreClarity,
        scoreKnowledge: localEvaluation.scoreKnowledge,
        scoreConfidence: localEvaluation.scoreConfidence,
        scoreStructure: localEvaluation.scoreStructure,
        strengths: JSON.stringify(localEvaluation.strengths),
        weaknesses: JSON.stringify(localEvaluation.weaknesses),
        recommendation: localEvaluation.recommendation,
      },
    });

    return NextResponse.json(
      toInterviewReport({
        ...interview,
        evaluations: evaluation,
      }),
    );
  } catch (error) {
    console.error("POST /api/interview/[sessionId]/end error:", error);
    return NextResponse.json(
      { error: "No se pudo finalizar la entrevista" },
      { status: 500 },
    );
  }
}
