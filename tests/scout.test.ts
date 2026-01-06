import { describe, it, expect, beforeEach } from "vitest";
import {
  scoutAgent,
  setMockHackathonStatus,
  checkHackathonStatus,
} from "../src/lib/agents/scout";

describe("Scout Agent", () => {
  beforeEach(() => {
    setMockHackathonStatus("IN_PROGRESS");
  });

  it("returns WAITING when judging is in progress", async () => {
    setMockHackathonStatus("IN_PROGRESS");
    const result = await scoutAgent();

    expect(result.status).toBe("WAITING");
    expect(result.message).toContain("in progress");
    expect(result.timestamp).toBeTypeOf("number");
  });

  it("returns TRIGGER when judging is complete", async () => {
    setMockHackathonStatus("JUDGING_COMPLETE");
    const result = await scoutAgent();

    expect(result.status).toBe("TRIGGER");
    expect(result.message).toContain("Initiating prize distribution");
    expect(result.timestamp).toBeTypeOf("number");
  });

  it("returns WAITING when hackathon not started", async () => {
    setMockHackathonStatus("NOT_STARTED");
    const result = await scoutAgent();

    expect(result.status).toBe("WAITING");
    expect(result.message).toContain("not started");
  });

  it("checkHackathonStatus returns current mock state", async () => {
    setMockHackathonStatus("JUDGING_COMPLETE");
    const status = await checkHackathonStatus();
    expect(status).toBe("JUDGING_COMPLETE");
  });
});
