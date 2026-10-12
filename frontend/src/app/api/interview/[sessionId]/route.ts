import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PersistedInterviewSession } from "@/lib/interview/types";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

function mapStatus(status: string): PersistedInterviewSession["status"] {
  if (status === "ended") return "ended";
  if (status === "scheduled") return "scheduled";
  return "active";
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
    const interview = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        responses: { orderBy: { createdAt: "asc" } },
        schedules: { orderBy: { scheduledAt: "asc" }, take: 1 },
        user: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    const interviewerMessages = interview.questions.map((question) => ({
      id: question.id,
      role: "interviewer" as const,
      text: question.questionText,
      timestamp: question.createdAt.getTime(),
    }));
    const candidateMessages = interview.responses
      .filter((response) => response.responseText)
      .map((response) => ({
        id: response.id,
        role: "candidate" as const,
        text: response.responseText ?? "",
        timestamp: response.createdAt.getTime(),
      }));

    const payload: PersistedInterviewSession = {
      id: interview.id,
      setup: {
        role: interview.role,
        candidateName: interview.user?.name ?? "Candidato",
        level: interview.level as PersistedInterviewSession["setup"]["level"],
        language: "es",
        interviewType:
          interview.interviewType as PersistedInterviewSession["setup"]["interviewType"],
        stack: interview.stack ?? "",
        extraContext: interview.extraContext ?? "",
      },
      messages: [...interviewerMessages, ...candidateMessages].sort(
        (a, b) => a.timestamp - b.timestamp,
      ),
      questions: interview.questions.map((question) => ({
        id: question.id,
        session_id: interview.id,
        question_text: question.questionText,
        order_index: question.orderIndex,
        is_followup: question.isFollowup,
      })),
      status: mapStatus(interview.status),
      startedAt: interview.startedAt?.getTime() ?? null,
      scheduledAt: interview.schedules[0]?.scheduledAt.toISOString() ?? null,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/interview/[sessionId] error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar la sesión" },
      { status: 500 },
    );
  }
}
