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

// Track types for the hackathon
export type Track = "AI_AGENT_PAYMENTS" | "COMMERCE_CREATOR" | "PROGRAMMABLE_FINANCE";

// 5 judging criteria (20% weight each)
export type Criterion =
  | "TECHNICAL_IMPLEMENTATION"
  | "DESIGN_UX"
  | "IMPACT_POTENTIAL"
  | "ORIGINALITY_QUALITY"
  | "COORDINATION_PROBLEMS";

export const CRITERIA: Criterion[] = [
  "TECHNICAL_IMPLEMENTATION",
  "DESIGN_UX",
  "IMPACT_POTENTIAL",
  "ORIGINALITY_QUALITY",
  "COORDINATION_PROBLEMS",
];

export const CRITERION_WEIGHT = 0.2; // 20% each

// Judge scores for a single criterion
export interface JudgeScore {
  judgeId: string;
  score: number; // 0-100
}

// Scores for all criteria from all judges
export interface CriteriaScores {
  criterion: Criterion;
  judgeScores: JudgeScore[];
}

// A project submission with all judge scores
export interface ProjectSubmission {
  id: string;
  name: string;
  track: Track;
  teamLead: string;
  walletAddress: string;
  projectUrl: string;
  submissionTimestamp: number; // Used for tiebreaker
  criteriaScores: CriteriaScores[];
}

// Score breakdown for transparency
export interface ScoreBreakdown {
  projectId: string;
  projectName: string;
  track: Track;
  criteriaAverages: { criterion: Criterion; average: number }[];
  finalScore: number;
  rank: number;
}

// Winner with category info
export interface AnalystWinner {
  projectId: string;
  projectName: string;
  track: Track;
  walletAddress: string;
  projectUrl: string;
  finalScore: number;
  category: "TRACK_WINNER" | "RUNNER_UP";
  trackWon?: Track; // Only for track winners
}

// Analyst agent response
export interface AnalystResponse {
  status: "APPROVED" | "ERROR";
  message: string;
  winners: AnalystWinner[];
  breakdown: ScoreBreakdown[];
  timestamp: number;
}
