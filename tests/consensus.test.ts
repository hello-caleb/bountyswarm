import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  consensusOrchestrator,
  applyOverride,
  retryWaitingAgent,
  getSessionStatus,
  _testHelpers,
  type ConsensusConfig,
} from "../src/lib/agents/consensus";
import type {
  ConsensusInput,
  ConsensusSession,
  AgentVote,
  AnalystWinner,
  WinnerProfile,
  WinnerComplianceData,
  ProjectSubmission,
  OverrideRequest,
} from "../src/lib/agents/types";
import { createMockStatusChecker } from "../src/lib/agents/scout";
import { createMockBlockchainService } from "../src/lib/agents/executor";

// ===================
// Test Fixtures
// ===================

function createMockWinner(): AnalystWinner {
  return {
    projectId: "test-project-1",
    projectName: "Test Project",
    track: "AI_AGENT_PAYMENTS",
    walletAddress: "0x1234567890123456789012345678901234567890",
    projectUrl: "https://devpost.com/test-project",
    finalScore: 85,
    category: "TRACK_WINNER",
    trackWon: "AI_AGENT_PAYMENTS",
  };
}

function createMockWinnerProfile(): WinnerProfile {
  return {
    id: "winner-1",
    name: "Test Winner",
    email: "test@example.com",
    age: 25,
    country: "United States",
    walletAddress: "0x1234567890123456789012345678901234567890",
    projectId: "test-project-1",
    projectUrl: "https://devpost.com/test-project",
    submissionId: "submission-1",
  };
}

function createMockComplianceData(): WinnerComplianceData {
  return {
    winnerId: "winner-1",
    walletAddress: "0x1234567890123456789012345678901234567890",
    taxForm: {
      formType: "W9",
      submitted: true,
      submittedAt: Date.now() - 86400000,
      verified: true,
      verifiedAt: Date.now() - 43200000,
    },
    bankingInfo: {
      hasAccountNumber: true,
      hasRoutingNumber: true,
      hasAccountHolderName: true,
      verified: true,
    },
    judgingEndedAt: Date.now() - 172800000 - 3600000, // 49 hours ago (past dispute window)
  };
}

function createMockProjectSubmission(): ProjectSubmission {
  return {
    id: "test-project-1",
    name: "Test Project",
    track: "AI_AGENT_PAYMENTS",
    teamLead: "Test Lead",
    walletAddress: "0x1234567890123456789012345678901234567890",
    projectUrl: "https://devpost.com/test-project",
    submissionTimestamp: Date.now() - 604800000, // 7 days ago
    criteriaScores: [
      {
        criterion: "TECHNICAL_IMPLEMENTATION",
        judgeScores: [
          { judgeId: "judge-1", score: 85 },
          { judgeId: "judge-2", score: 90 },
        ],
      },
      {
        criterion: "DESIGN_UX",
        judgeScores: [
          { judgeId: "judge-1", score: 80 },
          { judgeId: "judge-2", score: 85 },
        ],
      },
      {
        criterion: "IMPACT_POTENTIAL",
        judgeScores: [
          { judgeId: "judge-1", score: 88 },
          { judgeId: "judge-2", score: 82 },
        ],
      },
      {
        criterion: "ORIGINALITY_QUALITY",
        judgeScores: [
          { judgeId: "judge-1", score: 90 },
          { judgeId: "judge-2", score: 88 },
        ],
      },
      {
        criterion: "COORDINATION_PROBLEMS",
        judgeScores: [
          { judgeId: "judge-1", score: 85 },
          { judgeId: "judge-2", score: 87 },
        ],
      },
    ],
  };
}

function createMockConsensusInput(): ConsensusInput {
  return {
    winner: createMockWinner(),
    winnerProfile: createMockWinnerProfile(),
    complianceData: createMockComplianceData(),
    projectSubmission: createMockProjectSubmission(),
  };
}

function createApprovedConfig(): ConsensusConfig {
  return {
    scoutConfig: {
      checkHackathonStatus: createMockStatusChecker("JUDGING_COMPLETE"),
    },
    executorConfig: {
      distributePrize: createMockBlockchainService({ shouldFail: false }).distributePrize,
    },
    retryConfig: {
      maxRetries: 3,
      retryDelayMs: 10, // Short delay for tests
      waitingTimeoutMs: 1000,
      globalTimeoutMs: 60000, // 1 minute for tests
    },
  };
}

// ===================
// Test Helpers Tests
// ===================

describe("Consensus Test Helpers", () => {
  describe("createInitialVotes", () => {
    it("creates votes for all 5 agents", () => {
      const votes = _testHelpers.createInitialVotes();
      expect(Object.keys(votes)).toHaveLength(5);
      expect(votes.scout).toBeDefined();
      expect(votes.analyst).toBeDefined();
      expect(votes.auditor).toBeDefined();
      expect(votes.compliance).toBeDefined();
      expect(votes.executor).toBeDefined();
    });

    it("initializes all votes as PENDING", () => {
      const votes = _testHelpers.createInitialVotes();
      for (const vote of Object.values(votes)) {
        expect(vote.status).toBe("PENDING");
        expect(vote.retryCount).toBe(0);
      }
    });
  });

  describe("generateSessionId", () => {
    it("generates unique session IDs for different winners", () => {
      const id1 = _testHelpers.generateSessionId("winner-1");
      const id2 = _testHelpers.generateSessionId("winner-2");
      expect(id1).not.toBe(id2);
    });

    it("generates session IDs with correct prefix", () => {
      const id = _testHelpers.generateSessionId("winner-1");
      expect(id.startsWith("consensus-")).toBe(true);
    });

    it("generates session IDs with expected format", () => {
      const id = _testHelpers.generateSessionId("winner-1");
      // Format: consensus-0x<16 hex chars>
      expect(id).toMatch(/^consensus-0x[a-f0-9]{16}$/);
    });
  });

  describe("calculateConsensusState", () => {
    it("returns PENDING when all votes are pending", () => {
      const votes = _testHelpers.createInitialVotes();
      expect(_testHelpers.calculateConsensusState(votes)).toBe("PENDING");
    });

    it("returns IN_PROGRESS when some votes are pending", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "APPROVED";
      expect(_testHelpers.calculateConsensusState(votes)).toBe("IN_PROGRESS");
    });

    it("returns APPROVED when all votes are approved", () => {
      const votes = _testHelpers.createInitialVotes();
      for (const vote of Object.values(votes)) {
        vote.status = "APPROVED";
      }
      expect(_testHelpers.calculateConsensusState(votes)).toBe("APPROVED");
    });

    it("returns REJECTED when any vote is rejected", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "APPROVED";
      votes.analyst.status = "APPROVED";
      votes.auditor.status = "REJECTED";
      expect(_testHelpers.calculateConsensusState(votes)).toBe("REJECTED");
    });

    it("returns WAITING when any vote is waiting (no rejections)", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "APPROVED";
      votes.analyst.status = "APPROVED";
      votes.auditor.status = "APPROVED";
      votes.compliance.status = "WAITING";
      votes.executor.status = "PENDING";
      expect(_testHelpers.calculateConsensusState(votes)).toBe("WAITING");
    });

    it("returns ERROR when any vote has error", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "ERROR";
      expect(_testHelpers.calculateConsensusState(votes)).toBe("ERROR");
    });

    it("REJECTED takes precedence over WAITING", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "APPROVED";
      votes.analyst.status = "WAITING";
      votes.auditor.status = "REJECTED";
      expect(_testHelpers.calculateConsensusState(votes)).toBe("REJECTED");
    });

    it("ERROR takes precedence over REJECTED", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "ERROR";
      votes.analyst.status = "REJECTED";
      expect(_testHelpers.calculateConsensusState(votes)).toBe("ERROR");
    });
  });

  describe("getBlockingAgents", () => {
    it("returns agents with REJECTED status", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.auditor.status = "REJECTED";
      const blocking = _testHelpers.getBlockingAgents(votes);
      expect(blocking).toContain("auditor");
      expect(blocking).toHaveLength(1);
    });

    it("returns agents with ERROR status", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "ERROR";
      const blocking = _testHelpers.getBlockingAgents(votes);
      expect(blocking).toContain("scout");
    });

    it("returns empty array when no blocking agents", () => {
      const votes = _testHelpers.createInitialVotes();
      const blocking = _testHelpers.getBlockingAgents(votes);
      expect(blocking).toHaveLength(0);
    });
  });

  describe("getWaitingAgents", () => {
    it("returns agents with WAITING status", () => {
      const votes = _testHelpers.createInitialVotes();
      votes.scout.status = "APPROVED";
      votes.compliance.status = "WAITING";
      const waiting = _testHelpers.getWaitingAgents(votes);
      expect(waiting).toContain("compliance");
      expect(waiting).toHaveLength(1);
    });
  });

  describe("createPaymentRequest", () => {
    it("creates payment request with TRACK_WINNER prize", () => {
      const winner = createMockWinner();
      winner.category = "TRACK_WINNER";
      const request = _testHelpers.createPaymentRequest(winner);
      expect(request.amount).toBe(_testHelpers.TRACK_WINNER_PRIZE);
    });

    it("creates payment request with RUNNER_UP prize", () => {
      const winner = createMockWinner();
      winner.category = "RUNNER_UP";
      const request = _testHelpers.createPaymentRequest(winner);
      expect(request.amount).toBe(_testHelpers.RUNNER_UP_PRIZE);
    });
  });
});

// ===================
// Consensus Orchestrator Tests
// ===================

describe("Consensus Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful consensus", () => {
    it("reaches APPROVED state when all agents approve", async () => {
      const input = createMockConsensusInput();
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(response.state).toBe("APPROVED");
      expect(response.canProceedToPayment).toBe(true);
      expect(response.blockingAgents).toHaveLength(0);
      expect(response.waitingAgents).toHaveLength(0);
    });

    it("includes transaction details in executor vote data", async () => {
      const input = createMockConsensusInput();
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(response.votes.executor.status).toBe("APPROVED");
      expect(response.votes.executor.data?.transactionHash).toBeDefined();
      expect(response.votes.executor.data?.blockNumber).toBeDefined();
    });

    it("tracks all 5 agent votes", async () => {
      const input = createMockConsensusInput();
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(Object.keys(response.votes)).toHaveLength(5);
      expect(response.votes.scout.status).toBe("APPROVED");
      expect(response.votes.analyst.status).toBe("APPROVED");
      expect(response.votes.auditor.status).toBe("APPROVED");
      expect(response.votes.compliance.status).toBe("APPROVED");
      expect(response.votes.executor.status).toBe("APPROVED");
    });
  });

  describe("scout blocking", () => {
    it("returns WAITING when hackathon not complete", async () => {
      const input = createMockConsensusInput();
      const config: ConsensusConfig = {
        ...createApprovedConfig(),
        scoutConfig: {
          checkHackathonStatus: createMockStatusChecker("IN_PROGRESS"),
        },
      };

      const response = await consensusOrchestrator(input, config);

      expect(response.state).toBe("WAITING");
      expect(response.votes.scout.status).toBe("WAITING");
      expect(response.waitingAgents).toContain("scout");
      expect(response.canProceedToPayment).toBe(false);
    });
  });

  describe("auditor blocking", () => {
    it("returns REJECTED when auditor rejects (underage winner)", async () => {
      const input = createMockConsensusInput();
      input.winnerProfile.age = 16; // Underage
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(response.state).toBe("REJECTED");
      expect(response.votes.auditor.status).toBe("REJECTED");
      expect(response.blockingAgents).toContain("auditor");
      expect(response.canProceedToPayment).toBe(false);
    });

    it("returns REJECTED for restricted country", async () => {
      const input = createMockConsensusInput();
      input.winnerProfile.country = "North Korea";
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(response.state).toBe("REJECTED");
      expect(response.votes.auditor.status).toBe("REJECTED");
    });

    it("returns REJECTED for sponsor employee", async () => {
      const input = createMockConsensusInput();
      input.winnerProfile.employer = "MNEE";
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(response.state).toBe("REJECTED");
      expect(response.votes.auditor.status).toBe("REJECTED");
    });
  });

  describe("compliance blocking", () => {
    it("returns WAITING when tax form not submitted", async () => {
      const input = createMockConsensusInput();
      input.complianceData.taxForm.submitted = false;
      input.complianceData.taxForm.verified = false;
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(response.state).toBe("WAITING");
      expect(response.votes.compliance.status).toBe("WAITING");
      expect(response.waitingAgents).toContain("compliance");
    });

    it("returns WAITING when dispute window not closed", async () => {
      const input = createMockConsensusInput();
      input.complianceData.judgingEndedAt = Date.now() - 3600000; // 1 hour ago
      const config = createApprovedConfig();

      const response = await consensusOrchestrator(input, config);

      expect(response.state).toBe("WAITING");
      expect(response.votes.compliance.status).toBe("WAITING");
    });
  });

  describe("executor failures", () => {
    it("returns ERROR when blockchain transaction fails", async () => {
      const input = createMockConsensusInput();
      const config: ConsensusConfig = {
        ...createApprovedConfig(),
        executorConfig: {
          distributePrize: createMockBlockchainService({ shouldFail: true }).distributePrize,
        },
      };

      const response = await consensusOrchestrator(input, config);

      expect(response.votes.executor.status).toBe("ERROR");
      expect(response.blockingAgents).toContain("executor");
    });
  });

  describe("callbacks", () => {
    it("calls onVoteReceived for each vote", async () => {
      const input = createMockConsensusInput();
      const onVoteReceived = vi.fn();
      const config: ConsensusConfig = {
        ...createApprovedConfig(),
        onVoteReceived,
      };

      await consensusOrchestrator(input, config);

      expect(onVoteReceived).toHaveBeenCalled();
      // Should be called at least 5 times (once per agent)
      expect(onVoteReceived.mock.calls.length).toBeGreaterThanOrEqual(5);
    });

    it("calls onStateChange when state changes", async () => {
      const input = createMockConsensusInput();
      const onStateChange = vi.fn();
      const config: ConsensusConfig = {
        ...createApprovedConfig(),
        onStateChange,
      };

      await consensusOrchestrator(input, config);

      expect(onStateChange).toHaveBeenCalled();
    });
  });
});

// ===================
// Human Override Tests
// ===================

describe("Human Override", () => {
  it("applies override to session state", () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "REJECTED",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    // Set all prerequisites to APPROVED so override validation passes
    session.votes.scout.status = "APPROVED";
    session.votes.analyst.status = "APPROVED";
    session.votes.auditor.status = "REJECTED";
    session.votes.compliance.status = "APPROVED";
    session.votes.auditor.message = "Age verification failed";

    const override: OverrideRequest = {
      adminId: "admin-1",
      reason: "Manual verification confirmed winner is 18+",
      timestamp: Date.now(),
      agentOverrides: {
        auditor: "APPROVED",
      },
    };

    const result = applyOverride(session, override);

    expect(result.success).toBe(true);
    expect(result.session.state).toBe("OVERRIDE");
    expect(result.session.override).toBe(override);
    expect(result.session.votes.auditor.status).toBe("APPROVED");
    expect(result.session.votes.auditor.message).toContain("Override by admin");
  });

  it("rejects override that would create invalid state", () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "IN_PROGRESS",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    // Prerequisites are still PENDING

    const override: OverrideRequest = {
      adminId: "admin-1",
      reason: "Try to force executor approval",
      timestamp: Date.now(),
      agentOverrides: {
        executor: "APPROVED", // Can't approve executor without prerequisites
      },
    };

    const result = applyOverride(session, override);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes("prerequisite"))).toBe(true);
  });

  it("includes override in session status", () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "OVERRIDE",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
      override: {
        adminId: "admin-1",
        reason: "Manual verification",
        timestamp: Date.now(),
        agentOverrides: {},
      },
    };

    const status = getSessionStatus(session);

    expect(status.state).toBe("OVERRIDE");
    expect(status.canProceedToPayment).toBe(true);
    expect(status.override).toBeDefined();
  });
});

// ===================
// Retry Logic Tests
// ===================

describe("Retry Logic", () => {
  it("increments retry count on retry", async () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "WAITING",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    session.votes.compliance.status = "WAITING";
    session.votes.compliance.retryCount = 0;

    const input = createMockConsensusInput();
    const config: ConsensusConfig = {
      retryConfig: {
        maxRetries: 3,
        retryDelayMs: 10,
        waitingTimeoutMs: 1000,
        globalTimeoutMs: 60000,
      },
    };

    await retryWaitingAgent(session, "compliance", input, config);

    expect(session.votes.compliance.retryCount).toBe(1);
  });

  it("returns false when agent is not waiting", async () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "IN_PROGRESS",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    session.votes.compliance.status = "APPROVED";

    const input = createMockConsensusInput();
    const result = await retryWaitingAgent(session, "compliance", input);

    expect(result).toBe(false);
  });

  it("returns false when max retries exceeded", async () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "WAITING",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    session.votes.compliance.status = "WAITING";
    session.votes.compliance.retryCount = 3;

    const input = createMockConsensusInput();
    const config: ConsensusConfig = {
      retryConfig: {
        maxRetries: 3,
        retryDelayMs: 10,
        waitingTimeoutMs: 1000,
        globalTimeoutMs: 60000,
      },
    };

    const result = await retryWaitingAgent(session, "compliance", input, config);

    expect(result).toBe(false);
  });
});

// ===================
// Session Status Tests
// ===================

describe("Session Status", () => {
  it("returns correct status for approved session", () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "APPROVED",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      completedAt: Date.now(),
      logs: [],
    };
    for (const vote of Object.values(session.votes)) {
      vote.status = "APPROVED";
    }

    const status = getSessionStatus(session);

    expect(status.state).toBe("APPROVED");
    expect(status.canProceedToPayment).toBe(true);
    expect(status.message).toContain("all agents approved");
  });

  it("returns correct status for rejected session", () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "REJECTED",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    session.votes.scout.status = "APPROVED";
    session.votes.auditor.status = "REJECTED";

    const status = getSessionStatus(session);

    expect(status.state).toBe("REJECTED");
    expect(status.canProceedToPayment).toBe(false);
    expect(status.blockingAgents).toContain("auditor");
    expect(status.message).toContain("blocked by");
  });

  it("returns correct status for waiting session", () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "WAITING",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    session.votes.scout.status = "APPROVED";
    session.votes.compliance.status = "WAITING";

    const status = getSessionStatus(session);

    expect(status.state).toBe("WAITING");
    expect(status.canProceedToPayment).toBe(false);
    expect(status.waitingAgents).toContain("compliance");
    expect(status.message).toContain("waiting on");
  });
});

// ===================
// Prize Amount Tests
// ===================

describe("Prize Amounts", () => {
  it("track winner prize is 2500 MNEE", () => {
    expect(_testHelpers.TRACK_WINNER_PRIZE).toBe("2500");
  });

  it("runner up prize is 1250 MNEE", () => {
    expect(_testHelpers.RUNNER_UP_PRIZE).toBe("1250");
  });
});

// ===================
// New Feature Tests
// ===================

describe("Input Validation", () => {
  it("returns ERROR for null input", async () => {
    const response = await consensusOrchestrator(null as unknown as ConsensusInput);

    expect(response.state).toBe("ERROR");
    expect(response.errorType).toBe("VALIDATION_ERROR");
  });

  it("returns ERROR for missing winner data", async () => {
    const input = createMockConsensusInput();
    (input as Record<string, unknown>).winner = null;

    const response = await consensusOrchestrator(input);

    expect(response.state).toBe("ERROR");
    expect(response.errorType).toBe("VALIDATION_ERROR");
  });

  it("returns ERROR for missing winnerProfile", async () => {
    const input = createMockConsensusInput();
    (input as Record<string, unknown>).winnerProfile = null;

    const response = await consensusOrchestrator(input);

    expect(response.state).toBe("ERROR");
    expect(response.errorType).toBe("VALIDATION_ERROR");
  });
});

describe("Error Agents", () => {
  it("includes errorAgents in response", async () => {
    const session: ConsensusSession = {
      sessionId: "test-session",
      winnerId: "winner-1",
      projectId: "project-1",
      state: "ERROR",
      votes: _testHelpers.createInitialVotes(),
      startedAt: Date.now(),
      logs: [],
    };
    session.votes.scout.status = "ERROR";

    const status = getSessionStatus(session);

    expect(status.errorAgents).toContain("scout");
    expect(status.errorAgents).toHaveLength(1);
  });
});

describe("Session in Response", () => {
  it("includes session in response when state is WAITING", async () => {
    const input = createMockConsensusInput();
    const config: ConsensusConfig = {
      ...createApprovedConfig(),
      scoutConfig: {
        checkHackathonStatus: createMockStatusChecker("IN_PROGRESS"),
      },
    };

    const response = await consensusOrchestrator(input, config);

    expect(response.state).toBe("WAITING");
    expect(response.session).toBeDefined();
    expect(response.session?.sessionId).toBeDefined();
  });

  it("includes session in response when state is ERROR", async () => {
    const input = createMockConsensusInput();
    (input as Record<string, unknown>).winner = null;

    const response = await consensusOrchestrator(input);

    expect(response.state).toBe("ERROR");
    expect(response.session).toBeDefined();
  });
});
