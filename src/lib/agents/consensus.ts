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
  ConsensusErrorType,
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

// Prerequisite agents that must approve before executor can run
const EXECUTOR_PREREQUISITES: AgentName[] = ["scout", "analyst", "auditor", "compliance"];

/**
 * Wraps a promise with a timeout
 * Throws TimeoutError if the promise doesn't resolve within the specified time
 */
class TimeoutError extends Error {
  constructor(message: string, public timeoutMs: number) {
    super(message);
    this.name = "TimeoutError";
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Validates consensus input
 */
function validateConsensusInput(input: ConsensusInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input) {
    errors.push("Consensus input is required");
    return { valid: false, errors };
  }

  if (!input.winner) {
    errors.push("Winner data is required");
  } else {
    if (!input.winner.projectId) errors.push("Winner projectId is required");
    if (!input.winner.walletAddress) errors.push("Winner walletAddress is required");
  }

  if (!input.winnerProfile) {
    errors.push("Winner profile is required");
  } else {
    if (!input.winnerProfile.id) errors.push("Winner profile id is required");
  }

  if (!input.complianceData) {
    errors.push("Compliance data is required");
  } else {
    if (!input.complianceData.winnerId) errors.push("Compliance winnerId is required");
  }

  if (!input.projectSubmission) {
    errors.push("Project submission is required");
  } else {
    if (!input.projectSubmission.id) errors.push("Project submission id is required");
  }

  return { valid: errors.length === 0, errors };
}

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
 * Get agents that are blocking consensus (REJECTED or ERROR)
 */
function getBlockingAgents(votes: Record<AgentName, AgentVote>): AgentName[] {
  return Object.values(votes)
    .filter((v) => v.status === "REJECTED" || v.status === "ERROR")
    .map((v) => v.agent);
}

/**
 * Get agents that have errors (for retry support)
 */
function getErrorAgents(votes: Record<AgentName, AgentVote>): AgentName[] {
  return Object.values(votes)
    .filter((v) => v.status === "ERROR")
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
 * Validates an override request to ensure it doesn't create invalid state
 */
function validateOverride(
  session: ConsensusSession,
  override: OverrideRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!override.adminId) {
    errors.push("Admin ID is required for override");
  }

  if (!override.reason) {
    errors.push("Reason is required for override");
  }

  // Check if trying to approve executor without prerequisites
  if (override.agentOverrides.executor === "APPROVED") {
    const willBeApproved = (agent: AgentName): boolean => {
      // Check if override sets it to approved OR it's already approved in session
      return (
        override.agentOverrides[agent] === "APPROVED" ||
        session.votes[agent].status === "APPROVED"
      );
    };

    const missingPrereqs = EXECUTOR_PREREQUISITES.filter(
      (agent) => !willBeApproved(agent)
    );

    if (missingPrereqs.length > 0) {
      errors.push(
        `Cannot override executor to APPROVED without prerequisite approvals: ${missingPrereqs.join(", ")}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Apply a human override to the consensus session
 * Validates that the override doesn't create an invalid state
 */
export function applyOverride(
  session: ConsensusSession,
  override: OverrideRequest,
  config?: ConsensusConfig
): { success: boolean; session: ConsensusSession; errors?: string[] } {
  // Validate the override request
  const validation = validateOverride(session, override);
  if (!validation.valid) {
    addLog(
      session,
      "OVERRIDE_REJECTED",
      session.state,
      `Override rejected: ${validation.errors.join("; ")}`
    );
    return { success: false, session, errors: validation.errors };
  }

  addLog(
    session,
    "OVERRIDE_APPLIED",
    "OVERRIDE",
    `Admin ${override.adminId} applied override: ${override.reason}`
  );

  session.override = override;
  session.state = "OVERRIDE";

  // Apply individual agent overrides using safe iteration
  const agentNames: AgentName[] = ["scout", "analyst", "auditor", "compliance", "executor"];
  for (const agent of agentNames) {
    const status = override.agentOverrides[agent];
    if (status && session.votes[agent]) {
      session.votes[agent].status = status;
      session.votes[agent].message = `Override by admin: ${override.reason}`;
      session.votes[agent].timestamp = override.timestamp;
    }
  }

  config?.onStateChange?.(session);
  return { success: true, session };
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
 * Retry an agent that errored (for transient network failures)
 * Unlike retryWaitingAgent, this resets the error and retries
 */
export async function retryErrorAgent(
  session: ConsensusSession,
  agent: AgentName,
  input: ConsensusInput,
  config?: ConsensusConfig
): Promise<boolean> {
  const vote = session.votes[agent];
  const retryConfig = config?.retryConfig ?? DEFAULT_RETRY_CONFIG;

  if (vote.status !== "ERROR") {
    addLog(
      session,
      "RETRY_SKIPPED",
      session.state,
      `Cannot retry ${agent}: status is ${vote.status}, not ERROR`,
      agent
    );
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

  // Reset to PENDING before retry
  vote.status = "PENDING";
  vote.retryCount++;
  addLog(
    session,
    "ERROR_RETRY_ATTEMPT",
    session.state,
    `Error retry attempt ${vote.retryCount}/${retryConfig.maxRetries}`,
    agent
  );

  // Wait before retry (exponential backoff)
  const backoffMs = retryConfig.retryDelayMs * Math.pow(2, vote.retryCount - 1);
  await new Promise((resolve) => setTimeout(resolve, backoffMs));

  // Re-run the appropriate agent
  switch (agent) {
    case "scout":
      return runScoutPhase(session, config);
    case "analyst":
      // Analyst needs project submission
      const result = await runAnalystPhase(session, input.projectSubmission, config);
      return result !== null;
    case "auditor":
      return runAuditorPhase(session, input.winnerProfile, config);
    case "compliance":
      return runCompliancePhase(session, input.complianceData, config);
    case "executor":
      const execResult = await runExecutorPhase(session, input.winner, config);
      return execResult !== null;
    default:
      return false;
  }
}

/**
 * Resume consensus after an override has been applied
 * Runs remaining agents (executor) if all prerequisites are now approved
 */
export async function resumeAfterOverride(
  session: ConsensusSession,
  input: ConsensusInput,
  config?: ConsensusConfig
): Promise<ConsensusResponse> {
  const timestamp = Date.now();

  if (session.state !== "OVERRIDE") {
    addLog(
      session,
      "RESUME_SKIPPED",
      session.state,
      "Cannot resume: session is not in OVERRIDE state"
    );
    return createResponse(session, timestamp);
  }

  // Check if all prerequisites are now approved
  const allPrereqsApproved = EXECUTOR_PREREQUISITES.every(
    (agent) => session.votes[agent].status === "APPROVED"
  );

  if (!allPrereqsApproved) {
    const missing = EXECUTOR_PREREQUISITES.filter(
      (agent) => session.votes[agent].status !== "APPROVED"
    );
    addLog(
      session,
      "RESUME_BLOCKED",
      session.state,
      `Cannot execute: missing approvals from ${missing.join(", ")}`
    );
    return createResponse(session, timestamp);
  }

  // If executor hasn't run yet, run it now
  if (session.votes.executor.status !== "APPROVED") {
    addLog(
      session,
      "RESUME_EXECUTOR",
      "IN_PROGRESS",
      "Running executor after override"
    );

    const executorResponse = await runExecutorPhase(session, input.winner, config);
    if (executorResponse) {
      session.completedAt = Date.now();
      session.state = "APPROVED";
      addLog(session, "CONSENSUS_COMPLETE", "APPROVED", "All agents approved after override, payment executed");
    }
  }

  return createResponse(session, timestamp);
}

/**
 * Check if session has timed out based on waitingTimeoutMs
 */
export function isSessionTimedOut(
  session: ConsensusSession,
  config?: ConsensusConfig
): boolean {
  const retryConfig = config?.retryConfig ?? DEFAULT_RETRY_CONFIG;
  const elapsed = Date.now() - session.startedAt;
  return elapsed > retryConfig.waitingTimeoutMs;
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
  const timestamp = Date.now();
  const retryConfig = config?.retryConfig ?? DEFAULT_RETRY_CONFIG;

  // Validate input before starting
  const validation = validateConsensusInput(input);
  if (!validation.valid) {
    // Create error session for invalid input
    const errorSession: ConsensusSession = {
      sessionId: `error-${timestamp}`,
      winnerId: input?.winner?.projectId ?? "unknown",
      projectId: input?.winner?.projectId ?? "unknown",
      state: "ERROR",
      votes: createInitialVotes(),
      startedAt: timestamp,
      logs: [],
    };
    addLog(
      errorSession,
      "VALIDATION_FAILED",
      "ERROR",
      `Invalid input: ${validation.errors.join("; ")}`
    );
    return createResponse(errorSession, timestamp, "VALIDATION_ERROR");
  }

  const sessionId = generateSessionId(input.winner.projectId);

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

  // Wrap the entire orchestration with a global timeout
  try {
    return await withTimeout(
      runConsensusPhases(session, input, config),
      retryConfig.globalTimeoutMs,
      `Consensus orchestration timed out after ${retryConfig.globalTimeoutMs}ms`
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      session.state = "ERROR";
      addLog(session, "GLOBAL_TIMEOUT", "ERROR", error.message);
      return createResponse(session, timestamp, "TIMEOUT");
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Internal function that runs all consensus phases
 * Separated to allow wrapping with timeout
 */
async function runConsensusPhases(
  session: ConsensusSession,
  input: ConsensusInput,
  config?: ConsensusConfig
): Promise<ConsensusResponse> {
  const timestamp = session.startedAt;

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
  const allPrereqsApproved = EXECUTOR_PREREQUISITES.every(
    (agent) => session.votes[agent].status === "APPROVED"
  );

  if (allPrereqsApproved) {
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
function createResponse(
  session: ConsensusSession,
  timestamp: number,
  errorType?: ConsensusErrorType,
  includeSession = false
): ConsensusResponse {
  const blockingAgents = getBlockingAgents(session.votes);
  const waitingAgents = getWaitingAgents(session.votes);
  const errorAgents = getErrorAgents(session.votes);

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
      message = `Consensus error: ${errorAgents.join(", ")} reported errors`;
      break;
    case "OVERRIDE":
      message = `Consensus overridden by admin: ${session.override?.reason}`;
      break;
    default:
      message = "Consensus in progress";
  }

  const response: ConsensusResponse = {
    sessionId: session.sessionId,
    winnerId: session.winnerId,
    state: session.state,
    message,
    votes: session.votes,
    canProceedToPayment: session.state === "APPROVED" || session.state === "OVERRIDE",
    blockingAgents,
    waitingAgents,
    errorAgents,
    override: session.override,
    timestamp,
  };

  if (errorType) {
    response.errorType = errorType;
  }

  // Include session for retry/resume support when state is WAITING or ERROR
  if (includeSession || session.state === "WAITING" || session.state === "ERROR") {
    response.session = session;
  }

  return response;
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
  getErrorAgents,
  createPaymentRequest,
  validateConsensusInput,
  validateOverride,
  withTimeout,
  TimeoutError,
  TRACK_WINNER_PRIZE,
  RUNNER_UP_PRIZE,
  EXECUTOR_PREREQUISITES,
};
