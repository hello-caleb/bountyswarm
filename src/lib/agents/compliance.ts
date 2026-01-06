import type {
  AgentLog,
  WinnerComplianceData,
  ComplianceCheck,
  ComplianceResponse,
} from "./types";
import { DISPUTE_WINDOW_HOURS } from "./types";

const MS_PER_HOUR = 60 * 60 * 1000;

function logDecision(log: AgentLog): void {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] COMPLIANCE | ${log.action} | ${log.status}`,
    log.context ? JSON.stringify(log.context) : ""
  );
}

// ===================
// Compliance Check Functions
// ===================

/**
 * Check if required tax form has been submitted and verified
 * US persons need W-9, non-US need W-8BEN or W-8BEN-E
 */
async function checkTaxForm(data: WinnerComplianceData): Promise<ComplianceCheck> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const missing: string[] = [];

  if (!data.taxForm.submitted) {
    missing.push("Tax form not submitted (W-9 for US persons, W-8BEN for non-US)");
  } else if (!data.taxForm.formType) {
    missing.push("Tax form type not specified");
  } else if (!data.taxForm.verified) {
    missing.push(`Tax form (${data.taxForm.formType}) submitted but not yet verified`);
  }

  const passed = data.taxForm.submitted && data.taxForm.verified && !!data.taxForm.formType;

  return {
    checkType: "TAX_FORM",
    passed,
    details: passed
      ? `Tax form verified: ${data.taxForm.formType} submitted on ${new Date(data.taxForm.submittedAt!).toISOString()}`
      : `Tax form incomplete: ${missing.join("; ")}`,
    required: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Check if banking information is complete
 */
async function checkBankingInfo(data: WinnerComplianceData): Promise<ComplianceCheck> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const missing: string[] = [];
  const { bankingInfo } = data;

  if (!bankingInfo.hasAccountNumber) {
    missing.push("Bank account number");
  }
  if (!bankingInfo.hasRoutingNumber) {
    missing.push("Bank routing number");
  }
  if (!bankingInfo.hasAccountHolderName) {
    missing.push("Account holder name");
  }
  if (!bankingInfo.verified) {
    missing.push("Banking information verification pending");
  }

  const passed =
    bankingInfo.hasAccountNumber &&
    bankingInfo.hasRoutingNumber &&
    bankingInfo.hasAccountHolderName &&
    bankingInfo.verified;

  return {
    checkType: "BANKING_INFO",
    passed,
    details: passed
      ? "Banking information complete and verified"
      : `Banking information incomplete: missing ${missing.join(", ")}`,
    required: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Check if the 48-hour dispute window has closed
 */
async function checkDisputeWindow(
  data: WinnerComplianceData,
  currentTime: number
): Promise<ComplianceCheck & { windowEndsAt: number }> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const windowEndsAt = data.judgingEndedAt + DISPUTE_WINDOW_HOURS * MS_PER_HOUR;
  const windowClosed = currentTime >= windowEndsAt;
  const hoursRemaining = Math.max(0, Math.ceil((windowEndsAt - currentTime) / MS_PER_HOUR));

  return {
    checkType: "DISPUTE_WINDOW",
    passed: windowClosed,
    details: windowClosed
      ? `Dispute window closed at ${new Date(windowEndsAt).toISOString()}`
      : `Dispute window still open: ${hoursRemaining} hours remaining (closes ${new Date(windowEndsAt).toISOString()})`,
    required: windowClosed ? undefined : [`Wait ${hoursRemaining} hours for dispute window to close`],
    windowEndsAt,
  };
}

// ===================
// Main Compliance Agent
// ===================

/**
 * Compliance Agent - Verify required documentation before payment release
 *
 * Performs 3 checks:
 * 1. Tax form verification (W-9 or W-8BEN submitted and verified)
 * 2. Banking information complete (account number, routing number, holder name)
 * 3. 48-hour dispute window closed
 *
 * Returns WAITING if any requirement is incomplete
 * Returns APPROVED only when all documentation is complete and dispute window closed
 */
export async function complianceAgent(
  data: WinnerComplianceData,
  currentTime: number = Date.now()
): Promise<ComplianceResponse> {
  const timestamp = Date.now();

  // Validate input - return ERROR for invalid data (distinct from WAITING)
  // ERROR means the input is fundamentally broken and shouldn't proceed
  // WAITING means requirements are pending but input is valid
  if (!data || !data.winnerId) {
    logDecision({
      agent: "Compliance",
      action: "VALIDATION_FAILED",
      status: "ERROR",
      context: { reason: "Invalid compliance data" },
      timestamp,
    });

    return {
      status: "ERROR",
      message: "Invalid compliance data provided",
      checks: [],
      missingRequirements: ["Valid winner compliance data required"],
      timestamp,
    };
  }

  logDecision({
    agent: "Compliance",
    action: "VERIFICATION_STARTED",
    status: "WAITING",
    context: { winnerId: data.winnerId },
    timestamp,
  });

  // Run all checks
  const taxFormCheck = await checkTaxForm(data);
  const bankingCheck = await checkBankingInfo(data);
  const disputeCheck = await checkDisputeWindow(data, currentTime);

  const checks: ComplianceCheck[] = [
    taxFormCheck,
    bankingCheck,
    { ...disputeCheck, windowEndsAt: undefined } as ComplianceCheck,
  ];

  // Collect missing requirements
  const missingRequirements: string[] = [];
  for (const check of [taxFormCheck, bankingCheck, disputeCheck]) {
    if (check.required) {
      missingRequirements.push(...check.required);
    }
  }

  // Log each check result
  for (const check of checks) {
    logDecision({
      agent: "Compliance",
      action: check.checkType,
      status: check.passed ? "APPROVED" : "WAITING",
      context: { winnerId: data.winnerId, details: check.details },
      timestamp,
    });
  }

  // Determine final status
  const allPassed = checks.every((check) => check.passed);

  if (allPassed) {
    logDecision({
      agent: "Compliance",
      action: "DOCUMENTATION_VERIFIED",
      status: "APPROVED",
      context: { winnerId: data.winnerId, checksCompleted: checks.length },
      timestamp,
    });

    return {
      status: "APPROVED",
      message: "All compliance requirements met - ready for payment",
      checks,
      missingRequirements: [],
      timestamp,
    };
  }

  logDecision({
    agent: "Compliance",
    action: "DOCUMENTATION_INCOMPLETE",
    status: "WAITING",
    context: {
      winnerId: data.winnerId,
      missingCount: missingRequirements.length,
      missingRequirements,
    },
    timestamp,
  });

  return {
    status: "WAITING",
    message: `Compliance requirements incomplete: ${missingRequirements.length} item(s) pending`,
    checks,
    missingRequirements,
    disputeWindowEndsAt: disputeCheck.windowEndsAt,
    timestamp,
  };
}

// Export for testing
export const _testHelpers = {
  checkTaxForm,
  checkBankingInfo,
  checkDisputeWindow,
  MS_PER_HOUR,
};
