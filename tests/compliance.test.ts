import { describe, it, expect } from "vitest";
import { complianceAgent, _testHelpers } from "../src/lib/agents/compliance";
import type { WinnerComplianceData } from "../src/lib/agents/types";
import { DISPUTE_WINDOW_HOURS } from "../src/lib/agents/types";

const { MS_PER_HOUR } = _testHelpers;

// Helper to create valid compliance data
function createComplianceData(
  overrides: Partial<WinnerComplianceData> = {}
): WinnerComplianceData {
  const now = Date.now();
  // Default: judging ended 3 days ago (dispute window closed)
  const judgingEndedAt = now - 72 * MS_PER_HOUR;

  return {
    winnerId: "winner-1",
    walletAddress: "0x1234567890123456789012345678901234567890",
    taxForm: {
      formType: "W9",
      submitted: true,
      submittedAt: now - 24 * MS_PER_HOUR,
      verified: true,
      verifiedAt: now - 12 * MS_PER_HOUR,
    },
    bankingInfo: {
      hasAccountNumber: true,
      hasRoutingNumber: true,
      hasAccountHolderName: true,
      verified: true,
    },
    judgingEndedAt,
    ...overrides,
  };
}

describe("Compliance Agent", () => {
  describe("all requirements met", () => {
    it("returns APPROVED when all compliance checks pass", async () => {
      const data = createComplianceData();
      const result = await complianceAgent(data);

      expect(result.status).toBe("APPROVED");
      expect(result.message).toContain("ready for payment");
      expect(result.missingRequirements).toHaveLength(0);
      expect(result.checks).toHaveLength(3);
      expect(result.timestamp).toBeTypeOf("number");
    });

    it("all individual checks return passed=true", async () => {
      const data = createComplianceData();
      const result = await complianceAgent(data);

      for (const check of result.checks) {
        expect(check.passed).toBe(true);
      }
    });
  });

  describe("tax form verification", () => {
    it("returns WAITING when tax form not submitted", async () => {
      const data = createComplianceData({
        taxForm: {
          formType: null,
          submitted: false,
          verified: false,
        },
      });
      const result = await complianceAgent(data);

      expect(result.status).toBe("WAITING");
      expect(result.missingRequirements.some((r) => r.includes("Tax form not submitted"))).toBe(
        true
      );

      const taxCheck = result.checks.find((c) => c.checkType === "TAX_FORM");
      expect(taxCheck?.passed).toBe(false);
    });

    it("returns WAITING when tax form submitted but not verified", async () => {
      const data = createComplianceData({
        taxForm: {
          formType: "W9",
          submitted: true,
          submittedAt: Date.now() - 2 * MS_PER_HOUR,
          verified: false,
        },
      });
      const result = await complianceAgent(data);

      expect(result.status).toBe("WAITING");
      expect(
        result.missingRequirements.some((r) => r.includes("not yet verified"))
      ).toBe(true);
    });

    it("accepts W-8BEN for non-US persons", async () => {
      const data = createComplianceData({
        taxForm: {
          formType: "W8BEN",
          submitted: true,
          submittedAt: Date.now() - 24 * MS_PER_HOUR,
          verified: true,
          verifiedAt: Date.now() - 12 * MS_PER_HOUR,
        },
      });
      const result = await complianceAgent(data);

      const taxCheck = result.checks.find((c) => c.checkType === "TAX_FORM");
      expect(taxCheck?.passed).toBe(true);
      expect(taxCheck?.details).toContain("W8BEN");
    });

    it("accepts W-8BEN-E for foreign entities", async () => {
      const data = createComplianceData({
        taxForm: {
          formType: "W8BENE",
          submitted: true,
          submittedAt: Date.now() - 24 * MS_PER_HOUR,
          verified: true,
          verifiedAt: Date.now() - 12 * MS_PER_HOUR,
        },
      });
      const result = await complianceAgent(data);

      const taxCheck = result.checks.find((c) => c.checkType === "TAX_FORM");
      expect(taxCheck?.passed).toBe(true);
    });
  });

  describe("banking information", () => {
    it("returns WAITING when account number missing", async () => {
      const data = createComplianceData({
        bankingInfo: {
          hasAccountNumber: false,
          hasRoutingNumber: true,
          hasAccountHolderName: true,
          verified: true,
        },
      });
      const result = await complianceAgent(data);

      expect(result.status).toBe("WAITING");
      expect(
        result.missingRequirements.some((r) => r.includes("Bank account number"))
      ).toBe(true);

      const bankCheck = result.checks.find((c) => c.checkType === "BANKING_INFO");
      expect(bankCheck?.passed).toBe(false);
    });

    it("returns WAITING when routing number missing", async () => {
      const data = createComplianceData({
        bankingInfo: {
          hasAccountNumber: true,
          hasRoutingNumber: false,
          hasAccountHolderName: true,
          verified: true,
        },
      });
      const result = await complianceAgent(data);

      expect(result.status).toBe("WAITING");
      expect(
        result.missingRequirements.some((r) => r.includes("Bank routing number"))
      ).toBe(true);
    });

    it("returns WAITING when account holder name missing", async () => {
      const data = createComplianceData({
        bankingInfo: {
          hasAccountNumber: true,
          hasRoutingNumber: true,
          hasAccountHolderName: false,
          verified: true,
        },
      });
      const result = await complianceAgent(data);

      expect(result.status).toBe("WAITING");
      expect(
        result.missingRequirements.some((r) => r.includes("Account holder name"))
      ).toBe(true);
    });

    it("returns WAITING when banking info not verified", async () => {
      const data = createComplianceData({
        bankingInfo: {
          hasAccountNumber: true,
          hasRoutingNumber: true,
          hasAccountHolderName: true,
          verified: false,
        },
      });
      const result = await complianceAgent(data);

      expect(result.status).toBe("WAITING");
      expect(
        result.missingRequirements.some((r) => r.includes("verification pending"))
      ).toBe(true);
    });

    it("returns WAITING with multiple missing banking fields", async () => {
      const data = createComplianceData({
        bankingInfo: {
          hasAccountNumber: false,
          hasRoutingNumber: false,
          hasAccountHolderName: false,
          verified: false,
        },
      });
      const result = await complianceAgent(data);

      expect(result.status).toBe("WAITING");
      // Should have 4 missing banking requirements
      const bankingMissing = result.missingRequirements.filter(
        (r) =>
          r.includes("Bank account") ||
          r.includes("routing") ||
          r.includes("holder name") ||
          r.includes("verification pending")
      );
      expect(bankingMissing.length).toBe(4);
    });
  });

  describe("dispute window", () => {
    it("returns WAITING when dispute window still open", async () => {
      const now = Date.now();
      // Judging ended 12 hours ago (36 hours remaining in 48-hour window)
      const data = createComplianceData({
        judgingEndedAt: now - 12 * MS_PER_HOUR,
      });
      const result = await complianceAgent(data, now);

      expect(result.status).toBe("WAITING");
      expect(
        result.missingRequirements.some((r) => r.includes("dispute window"))
      ).toBe(true);

      const disputeCheck = result.checks.find((c) => c.checkType === "DISPUTE_WINDOW");
      expect(disputeCheck?.passed).toBe(false);
      expect(disputeCheck?.details).toContain("hours remaining");
    });

    it("returns APPROVED when dispute window just closed", async () => {
      const now = Date.now();
      // Judging ended exactly 48 hours ago
      const data = createComplianceData({
        judgingEndedAt: now - DISPUTE_WINDOW_HOURS * MS_PER_HOUR,
      });
      const result = await complianceAgent(data, now);

      const disputeCheck = result.checks.find((c) => c.checkType === "DISPUTE_WINDOW");
      expect(disputeCheck?.passed).toBe(true);
    });

    it("returns APPROVED when dispute window closed long ago", async () => {
      const now = Date.now();
      // Judging ended 7 days ago
      const data = createComplianceData({
        judgingEndedAt: now - 7 * 24 * MS_PER_HOUR,
      });
      const result = await complianceAgent(data, now);

      const disputeCheck = result.checks.find((c) => c.checkType === "DISPUTE_WINDOW");
      expect(disputeCheck?.passed).toBe(true);
      expect(disputeCheck?.details).toContain("closed at");
    });

    it("calculates correct hours remaining", async () => {
      const now = Date.now();
      // Judging ended 24 hours ago (24 hours remaining)
      const data = createComplianceData({
        judgingEndedAt: now - 24 * MS_PER_HOUR,
      });
      const result = await complianceAgent(data, now);

      const disputeCheck = result.checks.find((c) => c.checkType === "DISPUTE_WINDOW");
      expect(disputeCheck?.details).toContain("24 hours remaining");
    });

    it("includes disputeWindowEndsAt in response when waiting", async () => {
      const now = Date.now();
      const judgingEndedAt = now - 12 * MS_PER_HOUR;
      const data = createComplianceData({ judgingEndedAt });
      const result = await complianceAgent(data, now);

      expect(result.disputeWindowEndsAt).toBeDefined();
      expect(result.disputeWindowEndsAt).toBe(
        judgingEndedAt + DISPUTE_WINDOW_HOURS * MS_PER_HOUR
      );
    });
  });

  describe("multiple missing requirements", () => {
    it("collects all missing requirements when multiple checks fail", async () => {
      const now = Date.now();
      const data = createComplianceData({
        taxForm: {
          formType: null,
          submitted: false,
          verified: false,
        },
        bankingInfo: {
          hasAccountNumber: false,
          hasRoutingNumber: true,
          hasAccountHolderName: true,
          verified: false,
        },
        judgingEndedAt: now - 12 * MS_PER_HOUR, // Dispute window open
      });
      const result = await complianceAgent(data, now);

      expect(result.status).toBe("WAITING");
      // Should have: tax form, account number, verification pending, dispute window
      expect(result.missingRequirements.length).toBeGreaterThanOrEqual(4);
    });

    it("message indicates number of pending items", async () => {
      const now = Date.now();
      const data = createComplianceData({
        taxForm: {
          formType: null,
          submitted: false,
          verified: false,
        },
        judgingEndedAt: now - 12 * MS_PER_HOUR,
      });
      const result = await complianceAgent(data, now);

      expect(result.message).toMatch(/\d+ item\(s\) pending/);
    });
  });

  describe("input validation", () => {
    it("returns ERROR for null data", async () => {
      const result = await complianceAgent(null as unknown as WinnerComplianceData);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid compliance data");
    });

    it("returns ERROR for data without winnerId", async () => {
      const data = createComplianceData({ winnerId: "" });
      const result = await complianceAgent(data);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid compliance data");
    });
  });

  describe("edge cases", () => {
    it("handles dispute window ending at exact current time", async () => {
      const now = Date.now();
      // Judging ended exactly 48 hours ago
      const judgingEndedAt = now - DISPUTE_WINDOW_HOURS * MS_PER_HOUR;
      const data = createComplianceData({ judgingEndedAt });
      const result = await complianceAgent(data, now);

      const disputeCheck = result.checks.find((c) => c.checkType === "DISPUTE_WINDOW");
      expect(disputeCheck?.passed).toBe(true);
    });

    it("handles dispute window 1ms before closing", async () => {
      const now = Date.now();
      // Judging ended 47:59:59.999 hours ago
      const judgingEndedAt = now - DISPUTE_WINDOW_HOURS * MS_PER_HOUR + 1;
      const data = createComplianceData({ judgingEndedAt });
      const result = await complianceAgent(data, now);

      const disputeCheck = result.checks.find((c) => c.checkType === "DISPUTE_WINDOW");
      expect(disputeCheck?.passed).toBe(false);
    });
  });
});
