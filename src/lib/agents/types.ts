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

// ===================
// Auditor Agent Types
// ===================

// Winner profile for auditor verification
export interface WinnerProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  country: string;
  employer?: string;
  walletAddress: string;
  projectId: string;
  projectUrl: string;
  submissionId: string;
}

// Types of checks the auditor performs
export type AuditorCheckType =
  | "AGE_VERIFICATION"
  | "LOCATION_VERIFICATION"
  | "EMPLOYER_CONFLICT"
  | "PLAGIARISM_CHECK"
  | "RULE_COMPLIANCE"
  | "SUBMISSION_AUTHENTICITY";

// Result of a single auditor check
export interface AuditorCheck {
  checkType: AuditorCheckType;
  passed: boolean;
  details: string;
}

// Auditor agent response
export interface AuditorResponse {
  status: "APPROVED" | "REJECTED" | "WAITING";
  message: string;
  checks: AuditorCheck[];
  violations: string[];
  timestamp: number;
}

// Restricted countries list (OFAC sanctions, etc.)
export const RESTRICTED_COUNTRIES = [
  "North Korea",
  "Iran",
  "Syria",
  "Cuba",
  "Crimea",
  "Russia",
] as const;

// Hackathon sponsor companies (employees not eligible)
export const SPONSOR_COMPANIES = [
  "MNEE",
  "Devpost",
  "RockWallet",
  "Blockchain North",
] as const;

// ======================
// Compliance Agent Types
// ======================

// Tax form types
export type TaxFormType = "W9" | "W8BEN" | "W8BENE";

// Tax form submission status
export interface TaxFormStatus {
  formType: TaxFormType | null;
  submitted: boolean;
  submittedAt?: number;
  verified: boolean;
  verifiedAt?: number;
}

// Banking information status
export interface BankingInfoStatus {
  hasAccountNumber: boolean;
  hasRoutingNumber: boolean;
  hasAccountHolderName: boolean;
  verified: boolean;
}

// Dispute window configuration
export const DISPUTE_WINDOW_HOURS = 48;

// Winner compliance documentation
export interface WinnerComplianceData {
  winnerId: string;
  walletAddress: string;
  taxForm: TaxFormStatus;
  bankingInfo: BankingInfoStatus;
  judgingEndedAt: number; // Timestamp when judging ended (for dispute window)
}

// Types of compliance checks
export type ComplianceCheckType =
  | "TAX_FORM"
  | "BANKING_INFO"
  | "DISPUTE_WINDOW";

// Result of a single compliance check
export interface ComplianceCheck {
  checkType: ComplianceCheckType;
  passed: boolean;
  details: string;
  required?: string[]; // List of missing requirements
}

// Compliance agent response
// ERROR: Invalid input data (should not proceed)
// WAITING: Missing requirements but can proceed when requirements are met
// APPROVED: All requirements met
export interface ComplianceResponse {
  status: "APPROVED" | "WAITING" | "ERROR";
  message: string;
  checks: ComplianceCheck[];
  missingRequirements: string[];
  disputeWindowEndsAt?: number;
  timestamp: number;
}

// =====================
// Executor Agent Types
// =====================

// Agent approvals required for execution
export interface AgentApprovals {
  scout: boolean;
  analyst: boolean;
  auditor: boolean;
  compliance: boolean;
}

// Payment request for executor
export interface PaymentRequest {
  winnerId: string;
  walletAddress: string;
  amount: string; // Amount in MNEE (as string to avoid BigInt serialization issues)
  projectId: string;
  projectUrl: string;
  track: Track;
  category: "TRACK_WINNER" | "RUNNER_UP";
}

// Transaction receipt from blockchain
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: string;
  status: "success" | "failed";
}

// Executor agent input
export interface ExecutorInput {
  paymentRequest: PaymentRequest;
  approvals: AgentApprovals;
  metadata: {
    submissionHash: string;
    scoreHash: string;
    analystTimestamp: number;
    auditorTimestamp: number;
    complianceTimestamp: number;
  };
}

// Executor agent response
export interface ExecutorResponse {
  status: "COMPLETE" | "ERROR";
  message: string;
  transactionHash?: string;
  blockNumber?: number;
  receipt?: TransactionReceipt;
  prizeMetadata?: PrizeMetadata;
  timestamp: number;
}
