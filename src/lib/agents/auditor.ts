import type {
  AgentLog,
  WinnerProfile,
  AuditorCheck,
  AuditorCheckType,
  AuditorResponse,
} from "./types";
import { RESTRICTED_COUNTRIES, SPONSOR_COMPANIES } from "./types";

const MIN_AGE = 18;

function logDecision(log: AgentLog): void {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] AUDITOR | ${log.action} | ${
      log.status
    }`,
    log.context ? JSON.stringify(log.context) : ""
  );
}

// ===================
// Mock verification functions
// These would be replaced with real API calls in production
// ===================

/**
 * Mock plagiarism database - projects flagged for plagiarism
 */
const PLAGIARISM_FLAGS = new Set<string>([
  "plagiarized-project-1",
  "copied-submission-xyz",
]);

/**
 * Mock rule violations database
 */
const RULE_VIOLATIONS = new Map<string, string>([
  ["rule-violator-1", "Submission contains prohibited content"],
  ["late-submission-abc", "Submitted after deadline"],
]);

/**
 * Mock submission authenticity issues
 */
const AUTHENTICITY_ISSUES = new Set<string>([
  "fake-submission-123",
  "bot-generated-xyz",
]);

// ===================
// Eligibility Check Functions
// ===================

/**
 * Verify participant is 18 or older
 */
async function verifyAge(winner: WinnerProfile): Promise<AuditorCheck> {
  // Simulate async verification
  await new Promise((resolve) => setTimeout(resolve, 10));

  const passed = winner.age >= MIN_AGE;

  return {
    checkType: "AGE_VERIFICATION",
    passed,
    details: passed
      ? `Age verified: ${winner.age} years old (minimum: ${MIN_AGE})`
      : `Age requirement not met: ${winner.age} years old (minimum: ${MIN_AGE})`,
  };
}

/**
 * Verify participant is not from a restricted country
 */
async function verifyLocation(winner: WinnerProfile): Promise<AuditorCheck> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const isRestricted = RESTRICTED_COUNTRIES.includes(
    winner.country as (typeof RESTRICTED_COUNTRIES)[number]
  );

  return {
    checkType: "LOCATION_VERIFICATION",
    passed: !isRestricted,
    details: isRestricted
      ? `Location restricted: ${winner.country} is not eligible for prizes`
      : `Location verified: ${winner.country} is eligible`,
  };
}

/**
 * Check if participant works for a hackathon sponsor
 */
async function checkEmployerConflict(
  winner: WinnerProfile
): Promise<AuditorCheck> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  if (!winner.employer) {
    return {
      checkType: "EMPLOYER_CONFLICT",
      passed: true,
      details: "No employer listed - no conflict of interest",
    };
  }

  const hasConflict = SPONSOR_COMPANIES.some((sponsor) =>
    winner.employer?.toLowerCase().includes(sponsor.toLowerCase())
  );

  return {
    checkType: "EMPLOYER_CONFLICT",
    passed: !hasConflict,
    details: hasConflict
      ? `Employer conflict: ${winner.employer} is a hackathon sponsor`
      : `No employer conflict: ${winner.employer} is not a sponsor`,
  };
}

// ===================
// Submission Compliance Check Functions
// ===================

/**
 * Check if submission has been flagged for plagiarism
 */
async function checkPlagiarism(winner: WinnerProfile): Promise<AuditorCheck> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const isFlagged = PLAGIARISM_FLAGS.has(winner.submissionId);

  return {
    checkType: "PLAGIARISM_CHECK",
    passed: !isFlagged,
    details: isFlagged
      ? `Plagiarism detected: Submission ${winner.submissionId} flagged for review`
      : "No plagiarism detected",
  };
}

/**
 * Check for rule violations
 */
async function checkRuleCompliance(
  winner: WinnerProfile
): Promise<AuditorCheck> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const violation = RULE_VIOLATIONS.get(winner.submissionId);

  return {
    checkType: "RULE_COMPLIANCE",
    passed: !violation,
    details: violation
      ? `Rule violation: ${violation}`
      : "No rule violations found",
  };
}

/**
 * Verify submission authenticity
 */
async function checkSubmissionAuthenticity(
  winner: WinnerProfile
): Promise<AuditorCheck> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const hasIssue = AUTHENTICITY_ISSUES.has(winner.submissionId);

  return {
    checkType: "SUBMISSION_AUTHENTICITY",
    passed: !hasIssue,
    details: hasIssue
      ? `Authenticity issue: Submission ${winner.submissionId} failed verification`
      : "Submission authenticity verified",
  };
}

// ===================
// Main Auditor Agent
// ===================

/**
 * Auditor Agent - Verify winner eligibility and rule compliance
 *
 * Performs 6 checks:
 * 1. Age verification (18+)
 * 2. Location verification (not restricted country)
 * 3. Employer conflict check (not sponsor employee)
 * 4. Plagiarism check
 * 5. Rule compliance check
 * 6. Submission authenticity check
 *
 * If ANY check fails, status = REJECTED with list of violations
 */
export async function auditorAgent(
  winner: WinnerProfile
): Promise<AuditorResponse> {
  const timestamp = Date.now();

  // Validate input
  if (!winner || !winner.id) {
    logDecision({
      agent: "Auditor",
      action: "VALIDATION_FAILED",
      status: "ERROR",
      context: { reason: "Invalid winner profile" },
      timestamp,
    });

    return {
      status: "REJECTED",
      message: "Invalid winner profile provided",
      checks: [],
      violations: ["Invalid winner profile"],
      timestamp,
    };
  }

  logDecision({
    agent: "Auditor",
    action: "VERIFICATION_STARTED",
    status: "WAITING",
    context: { winnerId: winner.id, projectId: winner.projectId },
    timestamp,
  });

  // Run all checks in parallel
  const checks = await Promise.all([
    verifyAge(winner),
    verifyLocation(winner),
    checkEmployerConflict(winner),
    checkPlagiarism(winner),
    checkRuleCompliance(winner),
    checkSubmissionAuthenticity(winner),
  ]);

  // Collect violations (failed checks)
  const violations = checks
    .filter((check) => !check.passed)
    .map((check) => check.details);

  // Log each check result
  for (const check of checks) {
    logDecision({
      agent: "Auditor",
      action: check.checkType,
      status: check.passed ? "APPROVED" : "REJECTED",
      context: { winnerId: winner.id, details: check.details },
      timestamp,
    });
  }

  // Determine final status
  const allPassed = violations.length === 0;

  if (allPassed) {
    logDecision({
      agent: "Auditor",
      action: "ELIGIBILITY_VERIFIED",
      status: "APPROVED",
      context: { winnerId: winner.id, checksCompleted: checks.length },
      timestamp,
    });

    return {
      status: "APPROVED",
      message: "All eligibility checks passed",
      checks,
      violations: [],
      timestamp,
    };
  }

  logDecision({
    agent: "Auditor",
    action: "ELIGIBILITY_FAILED",
    status: "REJECTED",
    context: {
      winnerId: winner.id,
      violationCount: violations.length,
      violations,
    },
    timestamp,
  });

  return {
    status: "REJECTED",
    message: `Eligibility check failed: ${violations.length} violation(s) found`,
    checks,
    violations,
    timestamp,
  };
}

// Export check functions for testing
export const _testHelpers = {
  verifyAge,
  verifyLocation,
  checkEmployerConflict,
  checkPlagiarism,
  checkRuleCompliance,
  checkSubmissionAuthenticity,
  PLAGIARISM_FLAGS,
  RULE_VIOLATIONS,
  AUTHENTICITY_ISSUES,
};
