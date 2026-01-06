import { describe, it, expect } from "vitest";
import { auditorAgent } from "../src/lib/agents/auditor";
import type { WinnerProfile } from "../src/lib/agents/types";

// Helper to create a valid winner profile
function createWinnerProfile(overrides: Partial<WinnerProfile> = {}): WinnerProfile {
  return {
    id: "winner-1",
    name: "John Doe",
    email: "john@example.com",
    age: 25,
    country: "United States",
    employer: "Acme Corp",
    walletAddress: "0x1234567890123456789012345678901234567890",
    projectId: "proj-1",
    projectUrl: "https://devpost.com/project-1",
    submissionId: "submission-1",
    ...overrides,
  };
}

describe("Auditor Agent", () => {
  describe("valid winner - all checks pass", () => {
    it("returns APPROVED when all eligibility checks pass", async () => {
      const winner = createWinnerProfile();
      const result = await auditorAgent(winner);

      expect(result.status).toBe("APPROVED");
      expect(result.message).toBe("All eligibility checks passed");
      expect(result.violations).toHaveLength(0);
      expect(result.checks).toHaveLength(6);
      expect(result.timestamp).toBeTypeOf("number");
    });

    it("all individual checks return passed=true", async () => {
      const winner = createWinnerProfile();
      const result = await auditorAgent(winner);

      for (const check of result.checks) {
        expect(check.passed).toBe(true);
      }
    });
  });

  describe("age verification", () => {
    it("rejects underage winner (17 years old)", async () => {
      const winner = createWinnerProfile({ age: 17 });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations).toContain(
        "Age requirement not met: 17 years old (minimum: 18)"
      );

      const ageCheck = result.checks.find((c) => c.checkType === "AGE_VERIFICATION");
      expect(ageCheck?.passed).toBe(false);
    });

    it("approves exactly 18 year old winner", async () => {
      const winner = createWinnerProfile({ age: 18 });
      const result = await auditorAgent(winner);

      const ageCheck = result.checks.find((c) => c.checkType === "AGE_VERIFICATION");
      expect(ageCheck?.passed).toBe(true);
      expect(ageCheck?.details).toContain("Age verified: 18");
    });

    it("rejects 0 year old (edge case)", async () => {
      const winner = createWinnerProfile({ age: 0 });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      const ageCheck = result.checks.find((c) => c.checkType === "AGE_VERIFICATION");
      expect(ageCheck?.passed).toBe(false);
    });
  });

  describe("location verification", () => {
    it("rejects winner from North Korea", async () => {
      const winner = createWinnerProfile({ country: "North Korea" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations).toContain(
        "Location restricted: North Korea is not eligible for prizes"
      );

      const locationCheck = result.checks.find(
        (c) => c.checkType === "LOCATION_VERIFICATION"
      );
      expect(locationCheck?.passed).toBe(false);
    });

    it("rejects winner from Iran", async () => {
      const winner = createWinnerProfile({ country: "Iran" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      const locationCheck = result.checks.find(
        (c) => c.checkType === "LOCATION_VERIFICATION"
      );
      expect(locationCheck?.passed).toBe(false);
    });

    it("rejects winner from Russia", async () => {
      const winner = createWinnerProfile({ country: "Russia" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      const locationCheck = result.checks.find(
        (c) => c.checkType === "LOCATION_VERIFICATION"
      );
      expect(locationCheck?.passed).toBe(false);
    });

    it("approves winner from Canada", async () => {
      const winner = createWinnerProfile({ country: "Canada" });
      const result = await auditorAgent(winner);

      const locationCheck = result.checks.find(
        (c) => c.checkType === "LOCATION_VERIFICATION"
      );
      expect(locationCheck?.passed).toBe(true);
      expect(locationCheck?.details).toContain("Canada is eligible");
    });
  });

  describe("employer conflict", () => {
    it("rejects MNEE employee", async () => {
      const winner = createWinnerProfile({ employer: "MNEE" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations).toContain(
        "Employer conflict: MNEE is a hackathon sponsor"
      );

      const employerCheck = result.checks.find(
        (c) => c.checkType === "EMPLOYER_CONFLICT"
      );
      expect(employerCheck?.passed).toBe(false);
    });

    it("rejects Devpost employee", async () => {
      const winner = createWinnerProfile({ employer: "Devpost Inc" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      const employerCheck = result.checks.find(
        (c) => c.checkType === "EMPLOYER_CONFLICT"
      );
      expect(employerCheck?.passed).toBe(false);
    });

    it("rejects RockWallet employee (case insensitive)", async () => {
      const winner = createWinnerProfile({ employer: "rockwallet technologies" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      const employerCheck = result.checks.find(
        (c) => c.checkType === "EMPLOYER_CONFLICT"
      );
      expect(employerCheck?.passed).toBe(false);
    });

    it("approves winner with no employer listed", async () => {
      const winner = createWinnerProfile({ employer: undefined });
      const result = await auditorAgent(winner);

      const employerCheck = result.checks.find(
        (c) => c.checkType === "EMPLOYER_CONFLICT"
      );
      expect(employerCheck?.passed).toBe(true);
      expect(employerCheck?.details).toContain("No employer listed");
    });

    it("approves winner from non-sponsor company", async () => {
      const winner = createWinnerProfile({ employer: "Google" });
      const result = await auditorAgent(winner);

      const employerCheck = result.checks.find(
        (c) => c.checkType === "EMPLOYER_CONFLICT"
      );
      expect(employerCheck?.passed).toBe(true);
    });
  });

  describe("plagiarism check", () => {
    it("rejects submission flagged for plagiarism", async () => {
      const winner = createWinnerProfile({ submissionId: "plagiarized-project-1" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations.some((v) => v.includes("Plagiarism detected"))).toBe(
        true
      );

      const plagiarismCheck = result.checks.find(
        (c) => c.checkType === "PLAGIARISM_CHECK"
      );
      expect(plagiarismCheck?.passed).toBe(false);
    });

    it("approves submission with no plagiarism flags", async () => {
      const winner = createWinnerProfile({ submissionId: "original-work-123" });
      const result = await auditorAgent(winner);

      const plagiarismCheck = result.checks.find(
        (c) => c.checkType === "PLAGIARISM_CHECK"
      );
      expect(plagiarismCheck?.passed).toBe(true);
      expect(plagiarismCheck?.details).toBe("No plagiarism detected");
    });
  });

  describe("rule compliance", () => {
    it("rejects submission with rule violations", async () => {
      const winner = createWinnerProfile({ submissionId: "rule-violator-1" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(
        result.violations.some((v) => v.includes("prohibited content"))
      ).toBe(true);

      const ruleCheck = result.checks.find((c) => c.checkType === "RULE_COMPLIANCE");
      expect(ruleCheck?.passed).toBe(false);
    });

    it("rejects late submission", async () => {
      const winner = createWinnerProfile({ submissionId: "late-submission-abc" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations.some((v) => v.includes("after deadline"))).toBe(true);
    });

    it("approves compliant submission", async () => {
      const winner = createWinnerProfile({ submissionId: "compliant-submission" });
      const result = await auditorAgent(winner);

      const ruleCheck = result.checks.find((c) => c.checkType === "RULE_COMPLIANCE");
      expect(ruleCheck?.passed).toBe(true);
    });
  });

  describe("submission authenticity", () => {
    it("rejects fake submission", async () => {
      const winner = createWinnerProfile({ submissionId: "fake-submission-123" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations.some((v) => v.includes("Authenticity issue"))).toBe(
        true
      );

      const authCheck = result.checks.find(
        (c) => c.checkType === "SUBMISSION_AUTHENTICITY"
      );
      expect(authCheck?.passed).toBe(false);
    });

    it("approves authentic submission", async () => {
      const winner = createWinnerProfile({ submissionId: "real-project-xyz" });
      const result = await auditorAgent(winner);

      const authCheck = result.checks.find(
        (c) => c.checkType === "SUBMISSION_AUTHENTICITY"
      );
      expect(authCheck?.passed).toBe(true);
      expect(authCheck?.details).toBe("Submission authenticity verified");
    });
  });

  describe("multiple violations", () => {
    it("reports all violations when multiple checks fail", async () => {
      const winner = createWinnerProfile({
        age: 16, // Underage
        country: "Iran", // Restricted
        employer: "MNEE", // Sponsor
      });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations.length).toBeGreaterThanOrEqual(3);

      // All three violations should be present
      expect(result.violations.some((v) => v.includes("Age requirement"))).toBe(true);
      expect(result.violations.some((v) => v.includes("Location restricted"))).toBe(
        true
      );
      expect(result.violations.some((v) => v.includes("Employer conflict"))).toBe(
        true
      );
    });

    it("message indicates number of violations", async () => {
      const winner = createWinnerProfile({
        age: 16,
        country: "Cuba",
      });
      const result = await auditorAgent(winner);

      expect(result.message).toContain("2 violation(s) found");
    });
  });

  describe("invalid input handling", () => {
    it("rejects null winner", async () => {
      const result = await auditorAgent(null as unknown as WinnerProfile);

      expect(result.status).toBe("REJECTED");
      expect(result.violations).toContain("Invalid winner profile");
    });

    it("rejects winner without id", async () => {
      const winner = createWinnerProfile({ id: "" });
      const result = await auditorAgent(winner);

      expect(result.status).toBe("REJECTED");
      expect(result.violations).toContain("Invalid winner profile");
    });
  });
});
