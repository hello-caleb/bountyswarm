import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  executorAgent,
  setMockTransactionFailure,
} from "../src/lib/agents/executor";
import type { ExecutorInput, AgentApprovals, PaymentRequest } from "../src/lib/agents/types";

// Helper to create valid approvals
function createApprovals(overrides: Partial<AgentApprovals> = {}): AgentApprovals {
  return {
    scout: true,
    analyst: true,
    auditor: true,
    compliance: true,
    ...overrides,
  };
}

// Helper to create valid payment request
function createPaymentRequest(
  overrides: Partial<PaymentRequest> = {}
): PaymentRequest {
  return {
    winnerId: "winner-1",
    walletAddress: "0x1234567890123456789012345678901234567890",
    amount: "2500",
    projectId: "proj-1",
    projectUrl: "https://devpost.com/bountyswarm",
    track: "AI_AGENT_PAYMENTS",
    category: "TRACK_WINNER",
    ...overrides,
  };
}

// Helper to create valid executor input
function createExecutorInput(
  overrides: Partial<ExecutorInput> = {}
): ExecutorInput {
  return {
    paymentRequest: createPaymentRequest(),
    approvals: createApprovals(),
    metadata: {
      submissionHash: "0x" + "a".repeat(64),
      scoreHash: "0x" + "b".repeat(64),
      analystTimestamp: Date.now() - 3600000,
      auditorTimestamp: Date.now() - 1800000,
      complianceTimestamp: Date.now() - 900000,
    },
    ...overrides,
  };
}

describe("Executor Agent", () => {
  beforeEach(() => {
    setMockTransactionFailure(false);
  });

  afterEach(() => {
    setMockTransactionFailure(false);
  });

  describe("successful execution", () => {
    it("returns COMPLETE when all requirements are met", async () => {
      const input = createExecutorInput();
      const result = await executorAgent(input);

      expect(result.status).toBe("COMPLETE");
      expect(result.message).toContain("successfully sent");
      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-f0-9]+$/);
      expect(result.blockNumber).toBeDefined();
      expect(result.timestamp).toBeTypeOf("number");
    });

    it("includes transaction receipt in response", async () => {
      const input = createExecutorInput();
      const result = await executorAgent(input);

      expect(result.receipt).toBeDefined();
      expect(result.receipt?.status).toBe("success");
      expect(result.receipt?.gasUsed).toBeDefined();
      expect(result.receipt?.blockHash).toBeDefined();
    });

    it("includes prize metadata in response", async () => {
      const input = createExecutorInput();
      const result = await executorAgent(input);

      expect(result.prizeMetadata).toBeDefined();
      expect(result.prizeMetadata?.formsVerified).toBe(true);
      expect(result.prizeMetadata?.eligibilityVerified).toBe(true);
      expect(result.prizeMetadata?.consensusTime).toBeTypeOf("number");
      expect(result.prizeMetadata?.submissionHash).toBeDefined();
      expect(result.prizeMetadata?.scoreHash).toBeDefined();
    });

    it("message includes amount and wallet address", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({
          amount: "5000",
          walletAddress: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
        }),
      });
      const result = await executorAgent(input);

      expect(result.message).toContain("5000 MNEE");
      expect(result.message).toContain("0xABCDEF1234567890ABCDEF1234567890ABCDEF12");
    });
  });

  describe("approval validation", () => {
    it("returns ERROR when scout approval missing", async () => {
      const input = createExecutorInput({
        approvals: createApprovals({ scout: false }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Missing required approvals");
      expect(result.message).toContain("Scout");
    });

    it("returns ERROR when analyst approval missing", async () => {
      const input = createExecutorInput({
        approvals: createApprovals({ analyst: false }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Analyst");
    });

    it("returns ERROR when auditor approval missing", async () => {
      const input = createExecutorInput({
        approvals: createApprovals({ auditor: false }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Auditor");
    });

    it("returns ERROR when compliance approval missing", async () => {
      const input = createExecutorInput({
        approvals: createApprovals({ compliance: false }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Compliance");
    });

    it("lists all missing approvals", async () => {
      const input = createExecutorInput({
        approvals: {
          scout: false,
          analyst: false,
          auditor: true,
          compliance: false,
        },
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Scout");
      expect(result.message).toContain("Analyst");
      expect(result.message).toContain("Compliance");
      expect(result.message).not.toContain("Auditor");
    });
  });

  describe("payment validation", () => {
    it("returns ERROR for missing wallet address", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ walletAddress: "" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Missing wallet address");
    });

    it("returns ERROR for invalid wallet address format", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ walletAddress: "invalid-address" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid wallet address");
    });

    it("returns ERROR for wallet address without 0x prefix", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({
          walletAddress: "1234567890123456789012345678901234567890",
        }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid wallet address");
    });

    it("returns ERROR for missing amount", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ amount: "" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Missing payment amount");
    });

    it("returns ERROR for zero amount", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ amount: "0" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("must be positive");
    });

    it("returns ERROR for negative amount", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ amount: "-100" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("must be positive");
    });

    it("returns ERROR for missing winner ID", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ winnerId: "" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Missing winner ID");
    });

    it("returns ERROR for missing project ID", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ projectId: "" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Missing project ID");
    });

    it("lists all validation errors", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({
          winnerId: "",
          walletAddress: "",
          amount: "",
        }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("winner ID");
      expect(result.message).toContain("wallet address");
      expect(result.message).toContain("payment amount");
    });
  });

  describe("transaction failures", () => {
    it("returns ERROR when blockchain transaction fails", async () => {
      setMockTransactionFailure(true);
      const input = createExecutorInput();
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Transaction failed");
      expect(result.message).toContain("insufficient funds");
    });

    it("does not include receipt on transaction failure", async () => {
      setMockTransactionFailure(true);
      const input = createExecutorInput();
      const result = await executorAgent(input);

      expect(result.receipt).toBeUndefined();
      expect(result.transactionHash).toBeUndefined();
    });
  });

  describe("input validation", () => {
    it("returns ERROR for null input", async () => {
      const result = await executorAgent(null as unknown as ExecutorInput);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("No execution input");
    });

    it("returns ERROR for undefined input", async () => {
      const result = await executorAgent(undefined as unknown as ExecutorInput);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("No execution input");
    });
  });

  describe("different prize amounts", () => {
    it("handles track winner amount (2500 MNEE)", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({
          amount: "2500",
          category: "TRACK_WINNER",
        }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("COMPLETE");
      expect(result.message).toContain("2500 MNEE");
    });

    it("handles runner-up amount (1250 MNEE)", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({
          amount: "1250",
          category: "RUNNER_UP",
        }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("COMPLETE");
      expect(result.message).toContain("1250 MNEE");
    });

    it("handles decimal amounts", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ amount: "1234.56" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("COMPLETE");
      expect(result.message).toContain("1234.56 MNEE");
    });
  });

  describe("transaction uniqueness", () => {
    it("generates unique transaction hashes for multiple executions", async () => {
      const input1 = createExecutorInput();
      const input2 = createExecutorInput({
        paymentRequest: createPaymentRequest({ winnerId: "winner-2" }),
      });

      const result1 = await executorAgent(input1);
      const result2 = await executorAgent(input2);

      expect(result1.transactionHash).not.toBe(result2.transactionHash);
    });

    it("increments block number for subsequent transactions", async () => {
      const input1 = createExecutorInput();
      const input2 = createExecutorInput();

      const result1 = await executorAgent(input1);
      const result2 = await executorAgent(input2);

      expect(result2.blockNumber).toBeGreaterThan(result1.blockNumber!);
    });
  });

  describe("max amount validation", () => {
    it("returns ERROR when amount exceeds maximum", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ amount: "200000" }), // Exceeds 100000 limit
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("exceeds maximum");
    });

    it("allows amounts at maximum limit", async () => {
      const input = createExecutorInput({
        paymentRequest: createPaymentRequest({ amount: "100000" }),
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("COMPLETE");
    });
  });

  describe("metadata validation", () => {
    it("returns ERROR for invalid submission hash format", async () => {
      const input = createExecutorInput({
        metadata: {
          submissionHash: "invalid-hash",
          scoreHash: "0x" + "b".repeat(64),
          analystTimestamp: Date.now() - 3600000,
          auditorTimestamp: Date.now() - 1800000,
          complianceTimestamp: Date.now() - 900000,
        },
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid submission hash");
    });

    it("returns ERROR for invalid score hash format", async () => {
      const input = createExecutorInput({
        metadata: {
          submissionHash: "0x" + "a".repeat(64),
          scoreHash: "not-a-valid-hash",
          analystTimestamp: Date.now() - 3600000,
          auditorTimestamp: Date.now() - 1800000,
          complianceTimestamp: Date.now() - 900000,
        },
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid score hash");
    });

    it("allows empty hashes (will be auto-generated)", async () => {
      const input = createExecutorInput({
        metadata: {
          submissionHash: "",
          scoreHash: "",
          analystTimestamp: Date.now() - 3600000,
          auditorTimestamp: Date.now() - 1800000,
          complianceTimestamp: Date.now() - 900000,
        },
      });
      const result = await executorAgent(input);

      expect(result.status).toBe("COMPLETE");
      expect(result.prizeMetadata?.submissionHash).toMatch(/^0x[a-f0-9]+$/);
    });
  });
});
