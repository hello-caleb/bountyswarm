import { keccak256, toUtf8Bytes } from "ethers";
import type {
  AgentName,
  AgentVote,
  ConsensusState,
  ConsensusSession,
  ConsensusLog,
  ConsensusInput,
  ConsensusResponse,
  RetryConfig,
  OverrideRequest,
  AnalystWinner,
  WinnerProfile,
  WinnerComplianceData,
  ProjectSubmission,
  PaymentRequest,
  AgentApprovals,
  ExecutorInput,
  AuditorResponse,
  ComplianceResponse,
  ExecutorResponse,
} from "./types";
import { DEFAULT_RETRY_CONFIG } from "./types";
import { scoutAgent, type ScoutConfig, type ScoutResponse } from "./scout";
import { analystAgent } from "./analyst";
import { auditorAgent } from "./auditor";
import { complianceAgent } from "./compliance";
import { executorAgent, type ExecutorConfig, hashString } from "./executor";

// Prize amounts in MNEE
const TRACK_WINNER_PRIZE = "2500";
const RUNNER_UP_PRIZE = "1250";

/**
 * Configuration for the Consensus Orchestrator
 * Uses dependency injection for all external services
 */
export interface ConsensusConfig {
  scoutConfig?: ScoutConfig;
  executorConfig?: ExecutorConfig;
  retryConfig?: RetryConfig;
  onVoteReceived?: (vote: AgentVote) => void;
  onStateChange?: (session: ConsensusSession) => void;
}

/**
 * Create initial votes for all agents
 */
function createInitialVotes(): Record<AgentName, AgentVote> {
  const timestamp = Date.now();
  const agents: AgentName[] = ["scout", "analyst", "auditor", "compliance", "executor"];

  return agents.reduce((votes, agent) => {
    votes[agent] = {
      agent,
      status: "PENDING",
      message: "Awaiting vote",
      timestamp,
      retryCount: 0,
    };
    return votes;
  }, {} as Record<AgentName, AgentVote>);
}

/**
 * Generate a unique session ID
 */
function generateSessionId(winnerId: string): string {
  const timestamp = Date.now();
  const hash = keccak256(toUtf8Bytes(`${winnerId}-${timestamp}`));
  return `consensus-${hash.slice(0, 18)}`;
}

/**
 * Add a log entry to the session
 */
function addLog(
  session: ConsensusSession,
  action: string,
  newState: ConsensusState,
  message: string,
  agent?: AgentName
): void {
  const log: ConsensusLog = {
    action,
    agent,
    previousState: session.state,
    newState,
    message,
    timestamp: Date.now(),
  };
  session.logs.push(log);

  console.log(
    `[${new Date(log.timestamp).toISOString()}] CONSENSUS | ${action} | ${newState}`,
    agent ? `[${agent}]` : "",
    message
  );
}

/**
 * Calculate the overall consensus state from individual votes
 */
function calculateConsensusState(votes: Record<AgentName, AgentVote>): ConsensusState {
  const voteValues = Object.values(votes);

  // Check for any errors
  if (voteValues.some((v) => v.status === "ERROR")) {
    return "ERROR";
  }

  // Check for any rejections (blocking)
  if (voteValues.some((v) => v.status === "REJECTED")) {
    return "REJECTED";
  }

  // Check for any waiting
  if (voteValues.some((v) => v.status === "WAITING")) {
    return "WAITING";
  }

  // Check if all pending (not started)
  if (voteValues.every((v) => v.status === "PENDING")) {
    return "PENDING";
  }

  // Check if any pending (in progress)
  if (voteValues.some((v) => v.status === "PENDING")) {
    return "IN_PROGRESS";
  }

  // All approved
  if (voteValues.every((v) => v.status === "APPROVED")) {
    return "APPROVED";
  }

  return "IN_PROGRESS";
}

/**
 * Get agents that are blocking consensus
 */
function getBlockingAgents(votes: Record<AgentName, AgentVote>): AgentName[] {
  return Object.values(votes)
    .filter((v) => v.status === "REJECTED" || v.status === "ERROR")
    .map((v) => v.agent);
}

/**
 * Get agents that are waiting
 */
function getWaitingAgents(votes: Record<AgentName, AgentVote>): AgentName[] {
  return Object.values(votes)
    .filter((v) => v.status === "WAITING")
    .map((v) => v.agent);
}

/**
 * Create a payment request from winner data
 */
function createPaymentRequest(winner: AnalystWinner): PaymentRequest {
  return {
    winnerId: winner.projectId,
    walletAddress: winner.walletAddress,
    amount: winner.category === "TRACK_WINNER" ? TRACK_WINNER_PRIZE : RUNNER_UP_PRIZE,
    projectId: winner.projectId,
    projectUrl: winner.projectUrl,
    track: winner.track,
    category: winner.category,
  };
}

/**
 * Update a vote in the session
 */
function updateVote(
  session: ConsensusSession,
  agent: AgentName,
  status: AgentVote["status"],
  message: string,
  data?: Record<string, unknown>,
  config?: ConsensusConfig
): void {
  const vote = session.votes[agent];
  vote.status = status;
  vote.message = message;
  vote.timestamp = Date.now();
  if (data) {
    vote.data = data;
  }

  // Recalculate overall state
  const previousState = session.state;
  session.state = calculateConsensusState(session.votes);

  addLog(session, `VOTE_${status}`, session.state, message, agent);

  // Notify callbacks
  config?.onVoteReceived?.(vote);
  if (previousState !== session.state) {
    config?.onStateChange?.(session);
  }
}

/**
 * Run the Scout agent phase
 */
async function runScoutPhase(
  session: ConsensusSession,
  config?: ConsensusConfig
): Promise<boolean> {
  addLog(session, "SCOUT_START", "IN_PROGRESS", "Starting Scout agent", "scout");

  try {
    const response: ScoutResponse = await scoutAgent(config?.scoutConfig);

    if (response.status === "TRIGGER") {
      updateVote(session, "scout", "APPROVED", response.message, undefined, config);
      return true;
    } else {
      updateVote(session, "scout", "WAITING", response.message, undefined, config);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    updateVote(session, "scout", "ERROR", `Scout failed: ${errorMessage}`, undefined, config);
    return false;
  }
}

/**
 * Run the Analyst agent phase
 */
async function runAnalystPhase(
  session: ConsensusSession,
  submission: ProjectSubmission,
  config?: ConsensusConfig
): Promise<AnalystWinner | null> {
  addLog(session, "ANALYST_START", "IN_PROGRESS", "Starting Analyst agent", "analyst");

  try {
    const response = await analystAgent([submission]);

    if (response.status === "APPROVED" && response.winners.length > 0) {
      const winner = response.winners.find((w) => w.projectId === submission.id);
      if (winner) {
        updateVote(
          session,
          "analyst",
          "APPROVED",
          response.message,
          { breakdown: response.breakdown },
          config
        );
        return winner;
      }
    }

    updateVote(session, "analyst", "ERROR", response.message, undefined, config);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    updateVote(session, "analyst", "ERROR", `Analyst failed: ${errorMessage}`, undefined, config);
    return null;
  }
}

/**
 * Run the Auditor agent phase
 */
async function runAuditorPhase(
  session: ConsensusSession,
  profile: WinnerProfile,
  config?: ConsensusConfig
): Promise<boolean> {
  addLog(session, "AUDITOR_START", "IN_PROGRESS", "Starting Auditor agent", "auditor");

  try {
    const response: AuditorResponse = await auditorAgent(profile);

    if (response.status === "APPROVED") {
      updateVote(
        session,
        "auditor",
        "APPROVED",
        response.message,
        { checks: response.checks },
        config
      );
      return true;
    } else if (response.status === "REJECTED") {
      updateVote(
        session,
        "auditor",
        "REJECTED",
        response.message,
        { violations: response.violations },
        config
      );
      return false;
    } else {
      updateVote(session, "auditor", "WAITING", response.message, undefined, config);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    updateVote(session, "auditor", "ERROR", `Auditor failed: ${errorMessage}`, undefined, config);
    return false;
  }
}

/**
 * Run the Compliance agent phase
 */
async function runCompliancePhase(
  session: ConsensusSession,
  complianceData: WinnerComplianceData,
  config?: ConsensusConfig
): Promise<boolean> {
  addLog(session, "COMPLIANCE_START", "IN_PROGRESS", "Starting Compliance agent", "compliance");

  try {
    const response: ComplianceResponse = await complianceAgent(complianceData);

    if (response.status === "APPROVED") {
      updateVote(
        session,
        "compliance",
        "APPROVED",
        response.message,
        { checks: response.checks },
        config
      );
      return true;
    } else if (response.status === "WAITING") {
      updateVote(
        session,
        "compliance",
        "WAITING",
        response.message,
        { missingRequirements: response.missingRequirements },
        config
      );
      return false;
    } else {
      updateVote(session, "compliance", "ERROR", response.message, undefined, config);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    updateVote(
      session,
      "compliance",
      "ERROR",
      `Compliance failed: ${errorMessage}`,
      undefined,
      config
    );
    return false;
  }
}

/**
 * Run the Executor agent phase (only if all other agents approved)
 */
async function runExecutorPhase(
  session: ConsensusSession,
  winner: AnalystWinner,
  config?: ConsensusConfig
): Promise<ExecutorResponse | null> {
  addLog(session, "EXECUTOR_START", "IN_PROGRESS", "Starting Executor agent", "executor");

  // Verify all prerequisites are met
  const prerequisites: AgentName[] = ["scout", "analyst", "auditor", "compliance"];
  const allApproved = prerequisites.every(
    (agent) => session.votes[agent].status === "APPROVED"
  );

  if (!allApproved) {
    updateVote(
      session,
      "executor",
      "ERROR",
      "Cannot execute: not all prerequisite agents approved",
      undefined,
      config
    );
    return null;
  }

  try {
    const paymentRequest = createPaymentRequest(winner);
    const approvals: AgentApprovals = {
      scout: true,
      analyst: true,
      auditor: true,
      compliance: true,
    };

    const executorInput: ExecutorInput = {
      paymentRequest,
      approvals,
      metadata: {
        submissionHash: hashString(winner.projectUrl),
        scoreHash: hashString(`${winner.projectId}-${winner.finalScore}`),
        analystTimestamp: session.votes.analyst.timestamp,
        auditorTimestamp: session.votes.auditor.timestamp,
        complianceTimestamp: session.votes.compliance.timestamp,
      },
    };

    const response: ExecutorResponse = await executorAgent(executorInput, config?.executorConfig);

    if (response.status === "COMPLETE") {
      updateVote(
        session,
        "executor",
        "APPROVED",
        response.message,
        {
          transactionHash: response.transactionHash,
          blockNumber: response.blockNumber,
        },
        config
      );
      return response;
    } else {
      updateVote(session, "executor", "ERROR", response.message, undefined, config);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    updateVote(
      session,
      "executor",
      "ERROR",
      `Executor failed: ${errorMessage}`,
      undefined,
      config
    );
    return null;
  }
}

/**
 * Apply a human override to the consensus session
 */
export function applyOverride(
  session: ConsensusSession,
  override: OverrideRequest,
  config?: ConsensusConfig
): ConsensusSession {
  addLog(
    session,
    "OVERRIDE_APPLIED",
    "OVERRIDE",
    `Admin ${override.adminId} applied override: ${override.reason}`
  );

  session.override = override;
  session.state = "OVERRIDE";

  // Apply individual agent overrides
  for (const [agentStr, status] of Object.entries(override.agentOverrides)) {
    const agent = agentStr as AgentName;
    if (status && session.votes[agent]) {
      session.votes[agent].status = status;
      session.votes[agent].message = `Override by admin: ${override.reason}`;
      session.votes[agent].timestamp = override.timestamp;
    }
  }

  config?.onStateChange?.(session);
  return session;
}

/**
 * Retry a waiting agent
 */
export async function retryWaitingAgent(
  session: ConsensusSession,
  agent: AgentName,
  input: ConsensusInput,
  config?: ConsensusConfig
): Promise<boolean> {
  const vote = session.votes[agent];
  const retryConfig = config?.retryConfig ?? DEFAULT_RETRY_CONFIG;

  if (vote.status !== "WAITING") {
    return false;
  }

  if (vote.retryCount >= retryConfig.maxRetries) {
    addLog(
      session,
      "RETRY_EXHAUSTED",
      session.state,
      `Max retries (${retryConfig.maxRetries}) reached for ${agent}`,
      agent
    );
    return false;
  }

  vote.retryCount++;
  addLog(
    session,
    "RETRY_ATTEMPT",
    session.state,
    `Retry attempt ${vote.retryCount}/${retryConfig.maxRetries}`,
    agent
  );

  // Wait before retry
  await new Promise((resolve) => setTimeout(resolve, retryConfig.retryDelayMs));

  // Re-run the appropriate agent
  switch (agent) {
    case "scout":
      return runScoutPhase(session, config);
    case "auditor":
      return runAuditorPhase(session, input.winnerProfile, config);
    case "compliance":
      return runCompliancePhase(session, input.complianceData, config);
    default:
      return false;
  }
}

/**
 * Main Consensus Orchestrator
 *
 * Coordinates all 5 agents to reach consensus on a prize payment:
 * 1. Scout - Verifies hackathon judging is complete
 * 2. Analyst - Calculates and verifies winner scores
 * 3. Auditor - Checks eligibility (age, location, employer)
 * 4. Compliance - Verifies tax forms and banking info
 * 5. Executor - Executes blockchain payment
 *
 * Rules:
 * - ALL agents must return APPROVED for payment to proceed
 * - ANY agent can block with REJECTED or ERROR
 * - WAITING triggers potential retry after conditions met
 * - Human override available for exceptional cases
 */
export async function consensusOrchestrator(
  input: ConsensusInput,
  config?: ConsensusConfig
): Promise<ConsensusResponse> {
  const sessionId = generateSessionId(input.winner.projectId);
  const timestamp = Date.now();

  // Initialize session
  const session: ConsensusSession = {
    sessionId,
    winnerId: input.winner.projectId,
    projectId: input.winner.projectId,
    state: "PENDING",
    votes: createInitialVotes(),
    startedAt: timestamp,
    logs: [],
  };

  addLog(session, "SESSION_START", "IN_PROGRESS", `Starting consensus for winner ${input.winner.projectId}`);
  session.state = "IN_PROGRESS";
  config?.onStateChange?.(session);

  // Phase 1: Scout
  const scoutApproved = await runScoutPhase(session, config);
  if (!scoutApproved && session.votes.scout.status !== "WAITING") {
    return createResponse(session, timestamp);
  }

  // Phase 2: Analyst
  const analystWinner = await runAnalystPhase(session, input.projectSubmission, config);
  if (!analystWinner) {
    return createResponse(session, timestamp);
  }

  // Phase 3: Auditor
  const auditorApproved = await runAuditorPhase(session, input.winnerProfile, config);
  if (!auditorApproved && session.votes.auditor.status === "REJECTED") {
    return createResponse(session, timestamp);
  }

  // Phase 4: Compliance
  const complianceApproved = await runCompliancePhase(session, input.complianceData, config);
  if (!complianceApproved && session.votes.compliance.status === "ERROR") {
    return createResponse(session, timestamp);
  }

  // Check if we need to wait (recalculate state from votes)
  const currentState = calculateConsensusState(session.votes);
  if (currentState === "WAITING") {
    session.state = "WAITING";
    addLog(
      session,
      "CONSENSUS_WAITING",
      "WAITING",
      `Consensus waiting: ${getWaitingAgents(session.votes).join(", ")}`
    );
    return createResponse(session, timestamp);
  }

  // Phase 5: Executor (only if all previous phases approved)
  if (
    session.votes.scout.status === "APPROVED" &&
    session.votes.analyst.status === "APPROVED" &&
    session.votes.auditor.status === "APPROVED" &&
    session.votes.compliance.status === "APPROVED"
  ) {
    const executorResponse = await runExecutorPhase(session, input.winner, config);
    if (executorResponse) {
      session.completedAt = Date.now();
      addLog(session, "CONSENSUS_COMPLETE", "APPROVED", "All agents approved, payment executed");
    }
  }

  return createResponse(session, timestamp);
}

/**
 * Create the final response from a session
 */
function createResponse(session: ConsensusSession, timestamp: number): ConsensusResponse {
  const blockingAgents = getBlockingAgents(session.votes);
  const waitingAgents = getWaitingAgents(session.votes);

  let message: string;
  switch (session.state) {
    case "APPROVED":
      message = "Consensus reached: all agents approved. Payment executed successfully.";
      break;
    case "REJECTED":
      message = `Consensus blocked by: ${blockingAgents.join(", ")}`;
      break;
    case "WAITING":
      message = `Consensus waiting on: ${waitingAgents.join(", ")}`;
      break;
    case "ERROR":
      message = `Consensus error: ${blockingAgents.join(", ")} reported errors`;
      break;
    case "OVERRIDE":
      message = `Consensus overridden by admin: ${session.override?.reason}`;
      break;
    default:
      message = "Consensus in progress";
  }

  return {
    sessionId: session.sessionId,
    winnerId: session.winnerId,
    state: session.state,
    message,
    votes: session.votes,
    canProceedToPayment: session.state === "APPROVED" || session.state === "OVERRIDE",
    blockingAgents,
    waitingAgents,
    override: session.override,
    timestamp,
  };
}

/**
 * Get session status without running agents (for polling)
 */
export function getSessionStatus(session: ConsensusSession): ConsensusResponse {
  return createResponse(session, Date.now());
}

// Export for testing
export const _testHelpers = {
  createInitialVotes,
  generateSessionId,
  calculateConsensusState,
  getBlockingAgents,
  getWaitingAgents,
  createPaymentRequest,
  TRACK_WINNER_PRIZE,
  RUNNER_UP_PRIZE,
};
