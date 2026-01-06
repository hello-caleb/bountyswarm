import type { AgentLog } from "./types";

export type HackathonStatus = "JUDGING_COMPLETE" | "IN_PROGRESS" | "NOT_STARTED";

export interface ScoutResponse {
  status: "TRIGGER" | "WAITING";
  message: string;
  timestamp: number;
}

// Mock hackathon state - toggle this to test different scenarios
let mockHackathonState: HackathonStatus = "IN_PROGRESS";

export function setMockHackathonStatus(status: HackathonStatus): void {
  mockHackathonState = status;
}

export async function checkHackathonStatus(): Promise<HackathonStatus> {
  // TODO: Replace with real Devpost API integration
  // For now, return mock state with simulated network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockHackathonState;
}

function logDecision(log: AgentLog): void {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] SCOUT | ${log.action} | ${log.status}`,
    log.context ? JSON.stringify(log.context) : ""
  );
}

export async function scoutAgent(): Promise<ScoutResponse> {
  const hackathonStatus = await checkHackathonStatus();
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
