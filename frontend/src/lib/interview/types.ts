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
  extraContext: string;
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
  questionIndex: number;
  startedAt: number;
  status: "active" | "ended";
}
