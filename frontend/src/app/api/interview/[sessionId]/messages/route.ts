import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { InterviewTurn } from "@/lib/interview/types";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

const messageSchema = z.object({
  role: z.enum(["interviewer", "candidate"]).default("candidate"),
  text: z.string().min(1),
});

async function nextQuestionOrder(sessionId: string) {
  const aggregate = await prisma.questions.aggregate({
    where: { sessionId },
    _max: { orderIndex: true },
  });
  return (aggregate._max.orderIndex ?? 0) + 1;
}

export async function POST(request: Request, { params }: RouteContext) {
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
      select: { id: true, status: true },
    });

    if (!interview) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    if (interview.status === "ended") {
      return NextResponse.json({ isComplete: true, phase: "ended" });
    }

    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Mensaje inválido", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const text = parsed.data.text.trim();

    if (parsed.data.role === "interviewer") {
      const existing = await prisma.questions.findFirst({
        where: { sessionId, questionText: text },
        select: { id: true },
      });

      if (!existing) {
        await prisma.questions.create({
          data: {
            sessionId,
            questionText: text,
            orderIndex: await nextQuestionOrder(sessionId),
            isFollowup: true,
          },
        });
      }
    } else {
      let question = await prisma.questions.findFirst({
        where: { sessionId },
        orderBy: { orderIndex: "desc" },
        select: { id: true },
      });

      if (!question) {
        question = await prisma.questions.create({
          data: {
            sessionId,
            questionText: "Pregunta registrada durante la entrevista",
            orderIndex: 1,
          },
          select: { id: true },
        });
      }

      await prisma.responses.create({
        data: {
          sessionId,
          questionId: question.id,
          responseText: text,
        },
      });
    }

    const turn: InterviewTurn = { isComplete: false, phase: "listening" };
    return NextResponse.json(turn);
  } catch (error) {
    console.error("POST /api/interview/[sessionId]/messages error:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el mensaje" },
      { status: 500 },
    );
  }
}
