import type {
  InterviewReport,
  InterviewSetupInput,
  InterviewTurn,
  StartInterviewResponse,
} from "./types";

export interface InterviewService {
  start(input: InterviewSetupInput): Promise<StartInterviewResponse>;
  sendMessage(
    sessionId: string,
    payload: { text?: string; audioBlob?: Blob },
  ): Promise<InterviewTurn>;
  end(sessionId: string): Promise<InterviewReport>;
  getReport(sessionId: string): Promise<InterviewReport>;
  getOpeningQuestion(sessionId: string): Promise<string>;
}
