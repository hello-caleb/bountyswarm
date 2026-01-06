import { describe, it, expect } from "vitest";
import {
  scoutAgent,
  createMockStatusChecker,
  defaultCheckHackathonStatus,
  type ScoutConfig,
} from "../src/lib/agents/scout";

describe("Scout Agent", () => {
  it("returns WAITING when judging is in progress", async () => {
    const config: ScoutConfig = {
      checkHackathonStatus: createMockStatusChecker("IN_PROGRESS"),
    };
    const result = await scoutAgent(config);

    expect(result.status).toBe("WAITING");
    expect(result.message).toContain("in progress");
    expect(result.timestamp).toBeTypeOf("number");
  });

  it("returns TRIGGER when judging is complete", async () => {
    const config: ScoutConfig = {
      checkHackathonStatus: createMockStatusChecker("JUDGING_COMPLETE"),
    };
    const result = await scoutAgent(config);

    expect(result.status).toBe("TRIGGER");
    expect(result.message).toContain("Initiating prize distribution");
    expect(result.timestamp).toBeTypeOf("number");
  });

  it("returns WAITING when hackathon not started", async () => {
    const config: ScoutConfig = {
      checkHackathonStatus: createMockStatusChecker("NOT_STARTED"),
    };
    const result = await scoutAgent(config);

    expect(result.status).toBe("WAITING");
    expect(result.message).toContain("not started");
  });

  it("createMockStatusChecker returns configured status", async () => {
    const checker = createMockStatusChecker("JUDGING_COMPLETE");
    const status = await checker();
    expect(status).toBe("JUDGING_COMPLETE");
  });

  it("uses default config when none provided", async () => {
    // Default config uses defaultCheckHackathonStatus which returns IN_PROGRESS
    const result = await scoutAgent();

    expect(result.status).toBe("WAITING");
    expect(result.message).toContain("in progress");
  });

  it("defaultCheckHackathonStatus returns IN_PROGRESS", async () => {
    const status = await defaultCheckHackathonStatus();
    expect(status).toBe("IN_PROGRESS");
  });
});
