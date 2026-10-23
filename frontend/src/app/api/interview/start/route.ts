import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  arrayBufferToDataUrlNode,
  synthesizeSpeech,
} from "@/lib/interview/elevenlabs";
import {
  callN8nGenerateInterview,
  toN8nGenerateInterviewPayload,
} from "@/lib/interview/n8n";
import { syncN8nSessionToPrisma } from "@/lib/interview/sync-session";
import type { InterviewSetupInput, StartInterviewResponse } from "@/lib/interview/types";
import { interviewSetupSchema } from "@/lib/validations/interview";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = interviewSetupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const setup: InterviewSetupInput = parsed.data;
    const n8nPayload = toN8nGenerateInterviewPayload(setup, session.user.id);
    const n8nResponse = await callN8nGenerateInterview(n8nPayload);

    await syncN8nSessionToPrisma(n8nResponse, setup, session.user.id);

    const sortedQuestions = [...n8nResponse.questions].sort(
      (a, b) => a.order_index - b.order_index,
    );
    const firstQuestion = sortedQuestions[0];

    if (!firstQuestion) {
      return NextResponse.json(
        { error: "N8N no devolvió preguntas" },
        { status: 502 },
      );
    }

    let audioUrl: string | null = null;

    if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
      try {
        const audioBuffer = await synthesizeSpeech(
          firstQuestion.question_text,
          setup.language,
        );
        audioUrl = arrayBufferToDataUrlNode(audioBuffer);
      } catch (ttsError) {
        console.error("ElevenLabs TTS error:", ttsError);
      }
    }

    const response: StartInterviewResponse = {
      sessionId: n8nResponse.sessionId,
      questions: sortedQuestions,
      question: {
        text: firstQuestion.question_text,
        order_index: firstQuestion.order_index,
        is_followup: firstQuestion.is_followup,
      },
      audioUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/interview/start error:", error);
    const message =
      error instanceof Error ? error.message : "Error al iniciar entrevista";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
