import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  fetchElevenLabsEvaluation,
  getRememberedElevenLabsConversationId,
  saveEvaluation,
} from "@/lib/interview/elevenlabs-analysis";
import { toInterviewReport } from "@/lib/interview/reporting";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { sessionId } = await params;
    let interview = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        evaluations: true,
        user: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    if (!interview.evaluations) {
      const conversationId =
        await getRememberedElevenLabsConversationId(sessionId);
      const evaluation = conversationId
        ? await fetchElevenLabsEvaluation(conversationId, 5)
        : null;

      if (evaluation) {
        await saveEvaluation(sessionId, evaluation);
        interview = await prisma.interviewSession.findFirst({
          where: { id: sessionId, userId: session.user.id },
          include: {
            evaluations: true,
            user: true,
          },
        });
      }
    }

    if (!interview?.evaluations) {
      return NextResponse.json(
        { error: "Reporte no generado para esta sesión" },
        { status: 404 },
      );
    }

    return NextResponse.json(toInterviewReport(interview));
  } catch (error) {
    console.error("GET /api/interview/[sessionId]/report error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el reporte" },
      { status: 500 },
    );
  }
}
