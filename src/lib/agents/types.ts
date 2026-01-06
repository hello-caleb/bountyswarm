export type AgentStatus = "APPROVED" | "REJECTED" | "WAITING" | "ERROR";

export interface AgentResponse {
  status: AgentStatus;
  message: string;
  data?: Record<string, unknown>;
}

export interface AgentLog {
  agent: string;
  action: string;
  status: AgentStatus;
  context?: Record<string, unknown>;
  timestamp: number;
}

export interface Winner {
  id: string;
  address: string;
  projectUrl: string;
  track: string;
  scores: number[];
  prizeAmount: bigint;
}

export interface PrizeMetadata {
  submissionHash: string;
  scoreHash: string;
  consensusTime: number;
  formsVerified: boolean;
  eligibilityVerified: boolean;
}
