import type { AgentLog } from "./types";

export type HackathonStatus = "JUDGING_COMPLETE" | "IN_PROGRESS" | "NOT_STARTED";

export interface ScoutResponse {
  status: "TRIGGER" | "WAITING";
  message: string;
  timestamp: number;
}

/**
 * Configuration for the Scout agent
 * Using dependency injection to avoid mutable module-level state
 */
export interface ScoutConfig {
  checkHackathonStatus: () => Promise<HackathonStatus>;
}

/**
 * Default implementation that would integrate with Devpost API
 * In production, replace with real API call
 */
export async function defaultCheckHackathonStatus(): Promise<HackathonStatus> {
  // TODO: Replace with real Devpost API integration
  // For now, return IN_PROGRESS with simulated network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return "IN_PROGRESS";
}

/**
 * Creates a mock status checker for testing
 * This avoids mutable module-level state
 */
export function createMockStatusChecker(status: HackathonStatus): () => Promise<HackathonStatus> {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return status;
  };
}

function logDecision(log: AgentLog): void {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] SCOUT | ${log.action} | ${log.status}`,
    log.context ? JSON.stringify(log.context) : ""
  );
}

export async function scoutAgent(
  config: ScoutConfig = { checkHackathonStatus: defaultCheckHackathonStatus }
): Promise<ScoutResponse> {
  const hackathonStatus = await config.checkHackathonStatus();
  const timestamp = Date.now();

  if (hackathonStatus === "JUDGING_COMPLETE") {
    logDecision({
      agent: "Scout",
      action: "TRIGGER_VERIFICATION",
      status: "APPROVED",
      context: { hackathonStatus },
      timestamp,
    });

    return {
      status: "TRIGGER",
      message: "Judging complete. Initiating prize distribution protocol...",
      timestamp,
    };
  }

  logDecision({
    agent: "Scout",
    action: "STATUS_CHECK",
    status: "WAITING",
    context: { hackathonStatus },
    timestamp,
  });

  return {
    status: "WAITING",
    message:
      hackathonStatus === "NOT_STARTED"
        ? "Hackathon has not started yet."
        : "Judging still in progress...",
    timestamp,
  };
}
