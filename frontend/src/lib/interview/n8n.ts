import type { InterviewSetupInput } from "./types";

export interface N8nGenerateInterviewBody {
  user_id: string;
  interview_type: InterviewSetupInput["interviewType"];
  role: string;
  level: InterviewSetupInput["level"];
  stack: string | null;
  extra_context: string;
  stress_mode: boolean;
}

export interface N8nQuestion {
  session_id: string;
  question_text: string;
  order_index: number;
  is_followup: boolean;
  id?: string;
}

export interface N8nGenerateInterviewResponse {
  sessionId: string;
  questions: N8nQuestion[];
}

export function buildExtraContext(form: InterviewSetupInput): string {
  return [`Candidato: ${form.candidateName}`, form.extraContext]
    .filter(Boolean)
    .join("\n\n");
}

export function toN8nGenerateInterviewPayload(
  form: InterviewSetupInput,
  userId: string,
): N8nGenerateInterviewBody {
  return {
    user_id: userId,
    interview_type: form.interviewType,
    role: form.role,
    level: form.level,
    stack: form.stack?.trim() || null,
    extra_context: buildExtraContext(form),
    stress_mode: form.interviewType === "agresivo",
  };
}

export async function callN8nGenerateInterview(
  payload: N8nGenerateInterviewBody,
): Promise<N8nGenerateInterviewResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_GENERATE_INTERVIEW_URL;
  if (!webhookUrl) {
    throw new Error("N8N_WEBHOOK_GENERATE_INTERVIEW_URL no configurada");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `N8N generate-interview falló (${response.status}): ${detail.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as N8nGenerateInterviewResponse;

  if (!data.sessionId || !Array.isArray(data.questions)) {
    throw new Error("Respuesta inválida de N8N generate-interview");
  }

  return data;
}
