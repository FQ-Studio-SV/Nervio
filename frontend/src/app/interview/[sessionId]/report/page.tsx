import { InterviewReportClient } from "@/components/interview/interview-report-client";
import { requireAuth } from "@/lib/auth-server";

interface InterviewReportPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function InterviewReportPage({
  params,
}: InterviewReportPageProps) {
  const { sessionId } = await params;
  await requireAuth(`/interview/${sessionId}/report`);

  return <InterviewReportClient sessionId={sessionId} />;
}
