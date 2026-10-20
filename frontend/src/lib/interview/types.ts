export type InterviewType = "hr" | "tecnico" | "no_tecnico" | "agresivo";

export type ExperienceLevel = "junior" | "mid" | "senior";

export type InterviewPhase =
  | "connecting"
  | "speaking"
  | "listening"
  | "thinking"
  | "ended";

export type OrbState = "idle" | "speaking" | "listening" | "thinking";

export interface InterviewSetupInput {
  role: string;
  candidateName: string;
  level: ExperienceLevel;
  interviewType: InterviewType;
  stack?: string;
  extraContext: string;
}

export interface InterviewQuestion {
  session_id: string;
  question_text: string;
  order_index: number;
  is_followup: boolean;
  id?: string;
}

export interface StartInterviewResponse {
  sessionId: string;
  questions: InterviewQuestion[];
  question: {
    text: string;
    order_index: number;
    is_followup: boolean;
  };
  audioUrl: string | null;
}

export interface InterviewMessage {
  id: string;
  role: "interviewer" | "candidate";
  text: string;
  timestamp: number;
}

export interface InterviewTurn {
  interviewerMessage?: string;
  isComplete: boolean;
  phase: InterviewPhase;
}

export interface InterviewReport {
  sessionId: string;
  scoreGlobal: number;
  scoreClarity: number;
  scoreKnowledge: number;
  scoreConfidence: number;
  scoreStructure: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  interviewType: InterviewType;
  role: string;
  candidateName: string;
}

export interface MockSessionState {
  id: string;
  setup: InterviewSetupInput;
  messages: InterviewMessage[];
  questions: InterviewQuestion[];
  questionIndex: number;
  startedAt: number;
  status: "active" | "ended";
  audioUrl?: string | null;
}
