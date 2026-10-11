import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { InterviewReportSummary } from "@/lib/interview/types";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const interviews = await prisma.interviewSession.findMany({
      where: {
        userId: session.user.id,
        status: "ended",
      },
      include: { evaluations: true },
      orderBy: { endedAt: "desc" },
    });

    const summaries: InterviewReportSummary[] = interviews.map((interview) => ({
      sessionId: interview.id,
      role: interview.role,
      interviewType: interview.interviewType as InterviewReportSummary["interviewType"],
      scoreGlobal: interview.evaluations?.scoreGlobal
        ? Number(interview.evaluations.scoreGlobal)
        : null,
      status: interview.status,
      endedAt: interview.endedAt?.toISOString() ?? null,
      createdAt: interview.createdAt.toISOString(),
    }));

    return NextResponse.json({ reports: summaries });
  } catch (error) {
    console.error("GET /api/interview/reports error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los reportes" },
      { status: 500 },
    );
  }
}
