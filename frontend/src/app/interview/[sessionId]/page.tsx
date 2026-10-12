import { InterviewLiveClient } from "@/components/interview/interview-live-client";
import { requireAuth } from "@/lib/auth-server";

interface InterviewLivePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function InterviewLivePage({
  params,
}: InterviewLivePageProps) {
  const { sessionId } = await params;
  await requireAuth(`/interview/${sessionId}`);

  return <InterviewLiveClient sessionId={sessionId} />;
}
