import type {
  InterviewReport,
  InterviewSetupInput,
  InterviewTurn,
} from "./types";

export interface InterviewService {
  start(input: InterviewSetupInput): Promise<{ sessionId: string }>;
  sendMessage(
    sessionId: string,
    payload: { text?: string; audioBlob?: Blob },
  ): Promise<InterviewTurn>;
  end(sessionId: string): Promise<InterviewReport>;
  getReport(sessionId: string): Promise<InterviewReport>;
  getOpeningQuestion(sessionId: string): Promise<string>;
}
