import type {
  CloseInterviewResponse,
  EndInterviewOptions,
  InterviewReport,
  InterviewSetupInput,
  InterviewTurn,
  PersistedInterviewSession,
  ScheduleInterviewInput,
  ScheduleInterviewResponse,
  StartInterviewResponse,
} from "./types";

export interface InterviewService {
  start(input: InterviewSetupInput): Promise<StartInterviewResponse>;
  sendMessage(
    sessionId: string,
    payload: { role?: "interviewer" | "candidate"; text?: string; audioBlob?: Blob },
  ): Promise<InterviewTurn>;
  end(
    sessionId: string,
    conversationId?: string | null,
    options?: EndInterviewOptions,
  ): Promise<CloseInterviewResponse>;
  getReport(sessionId: string): Promise<InterviewReport>;
  getOpeningQuestion(sessionId: string): Promise<string>;
  getSession(sessionId: string): Promise<PersistedInterviewSession>;
  schedule(input: ScheduleInterviewInput): Promise<ScheduleInterviewResponse>;
}
