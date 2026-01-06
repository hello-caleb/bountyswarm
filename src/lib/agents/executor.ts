import type {
  AgentLog,
  ExecutorInput,
  ExecutorResponse,
  TransactionReceipt,
  PrizeMetadata,
  AgentApprovals,
} from "./types";

function logDecision(log: AgentLog): void {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] EXECUTOR | ${log.action} | ${log.status}`,
    log.context ? JSON.stringify(log.context) : ""
  );
}

// ===================
// Mock Blockchain Functions
// These would be replaced with real ethers.js calls in production
// ===================

// Simulated transaction counter for unique hashes
let mockTxCounter = 0;

// Mock flag to simulate blockchain failures
let mockShouldFailTransaction = false;

export function setMockTransactionFailure(shouldFail: boolean): void {
  mockShouldFailTransaction = shouldFail;
}

/**
 * Generate a mock transaction hash
 */
function generateMockTxHash(): string {
  mockTxCounter++;
  const timestamp = Date.now().toString(16);
  const counter = mockTxCounter.toString(16).padStart(8, "0");
  return `0x${timestamp}${counter}${"0".repeat(64 - timestamp.length - counter.length)}`;
}

/**
 * Generate a mock block hash
 */
function generateMockBlockHash(): string {
  return `0x${"b".repeat(64)}`;
}

/**
 * Hash a string using a simple mock hash (in production, use keccak256)
 */
function mockHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(64, "0");
  return `0x${hexHash.slice(0, 64)}`;
}

/**
 * Mock smart contract call to distribute prize
 * In production, this would use ethers.js to call BountySwarmVault.distributePrize()
 */
async function mockDistributePrize(
  winnerAddress: string,
  amount: string,
  metadata: PrizeMetadata
): Promise<TransactionReceipt> {
  // Simulate network delay (1-2 seconds for block confirmation)
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (mockShouldFailTransaction) {
    throw new Error("Transaction reverted: insufficient funds in vault");
  }

  // Validate address format
  if (!winnerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error("Invalid wallet address format");
  }

  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error("Invalid amount: must be positive number");
  }

  // Generate mock transaction receipt
  const receipt: TransactionReceipt = {
    transactionHash: generateMockTxHash(),
    blockNumber: 19000000 + mockTxCounter,
    blockHash: generateMockBlockHash(),
    gasUsed: "85000",
    status: "success",
  };

  return receipt;
}

// ===================
// Validation Functions
// ===================

/**
 * Verify all required agent approvals are present
 */
function validateApprovals(approvals: AgentApprovals): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!approvals.scout) missing.push("Scout");
  if (!approvals.analyst) missing.push("Analyst");
  if (!approvals.auditor) missing.push("Auditor");
  if (!approvals.compliance) missing.push("Compliance");

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate payment request fields
 */
function validatePaymentRequest(input: ExecutorInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { paymentRequest } = input;

  if (!paymentRequest.winnerId) {
    errors.push("Missing winner ID");
  }

  if (!paymentRequest.walletAddress) {
    errors.push("Missing wallet address");
  } else if (!paymentRequest.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push("Invalid wallet address format");
  }

  if (!paymentRequest.amount) {
    errors.push("Missing payment amount");
  } else {
    const amount = parseFloat(paymentRequest.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push("Invalid payment amount: must be positive");
    }
  }

  if (!paymentRequest.projectId) {
    errors.push("Missing project ID");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ===================
// Main Executor Agent
// ===================

/**
 * Executor Agent - Trigger smart contract to release MNEE prizes
 *
 * Requirements before execution:
 * 1. All 4 agent approvals (Scout, Analyst, Auditor, Compliance)
 * 2. Valid payment request with wallet address and amount
 * 3. Verification metadata (submission hash, score hash, timestamps)
 *
 * On success:
 * - Calls BountySwarmVault.distributePrize() with metadata
 * - Returns transaction hash and block confirmation
 * - Logs all execution details
 *
 * On failure:
 * - Returns ERROR status with detailed message
 * - Does NOT execute blockchain transaction
 */
export async function executorAgent(input: ExecutorInput): Promise<ExecutorResponse> {
  const timestamp = Date.now();

  // Validate input exists
  if (!input) {
    logDecision({
      agent: "Executor",
      action: "VALIDATION_FAILED",
      status: "ERROR",
      context: { reason: "No input provided" },
      timestamp,
    });

    return {
      status: "ERROR",
      message: "No execution input provided",
      timestamp,
    };
  }

  logDecision({
    agent: "Executor",
    action: "EXECUTION_STARTED",
    status: "WAITING",
    context: {
      winnerId: input.paymentRequest?.winnerId,
      amount: input.paymentRequest?.amount,
    },
    timestamp,
  });

  // Step 1: Validate all agent approvals
  const approvalCheck = validateApprovals(input.approvals);
  if (!approvalCheck.valid) {
    logDecision({
      agent: "Executor",
      action: "APPROVAL_CHECK_FAILED",
      status: "ERROR",
      context: { missingApprovals: approvalCheck.missing },
      timestamp,
    });

    return {
      status: "ERROR",
      message: `Missing required approvals: ${approvalCheck.missing.join(", ")}`,
      timestamp,
    };
  }

  logDecision({
    agent: "Executor",
    action: "APPROVALS_VERIFIED",
    status: "APPROVED",
    context: { allApproved: true },
    timestamp,
  });

  // Step 2: Validate payment request
  const paymentCheck = validatePaymentRequest(input);
  if (!paymentCheck.valid) {
    logDecision({
      agent: "Executor",
      action: "PAYMENT_VALIDATION_FAILED",
      status: "ERROR",
      context: { errors: paymentCheck.errors },
      timestamp,
    });

    return {
      status: "ERROR",
      message: `Invalid payment request: ${paymentCheck.errors.join("; ")}`,
      timestamp,
    };
  }

  logDecision({
    agent: "Executor",
    action: "PAYMENT_VALIDATED",
    status: "APPROVED",
    context: {
      walletAddress: input.paymentRequest.walletAddress,
      amount: input.paymentRequest.amount,
    },
    timestamp,
  });

  // Step 3: Prepare prize metadata for blockchain
  const prizeMetadata: PrizeMetadata = {
    submissionHash:
      input.metadata.submissionHash || mockHash(input.paymentRequest.projectUrl),
    scoreHash: input.metadata.scoreHash || mockHash(input.paymentRequest.winnerId),
    consensusTime: timestamp,
    formsVerified: true,
    eligibilityVerified: true,
  };

  logDecision({
    agent: "Executor",
    action: "METADATA_PREPARED",
    status: "APPROVED",
    context: {
      submissionHash: prizeMetadata.submissionHash.slice(0, 18) + "...",
      consensusTime: prizeMetadata.consensusTime,
    },
    timestamp,
  });

  // Step 4: Execute blockchain transaction
  try {
    logDecision({
      agent: "Executor",
      action: "TRANSACTION_SUBMITTING",
      status: "WAITING",
      context: {
        to: input.paymentRequest.walletAddress,
        amount: input.paymentRequest.amount,
      },
      timestamp,
    });

    const receipt = await mockDistributePrize(
      input.paymentRequest.walletAddress,
      input.paymentRequest.amount,
      prizeMetadata
    );

    logDecision({
      agent: "Executor",
      action: "PAYMENT_EXECUTED",
      status: "APPROVED",
      context: {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        winnerId: input.paymentRequest.winnerId,
        amount: input.paymentRequest.amount,
      },
      timestamp,
    });

    return {
      status: "COMPLETE",
      message: `Payment of ${input.paymentRequest.amount} MNEE successfully sent to ${input.paymentRequest.walletAddress}`,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      receipt,
      prizeMetadata,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logDecision({
      agent: "Executor",
      action: "TRANSACTION_FAILED",
      status: "ERROR",
      context: {
        error: errorMessage,
        winnerId: input.paymentRequest.winnerId,
      },
      timestamp,
    });

    return {
      status: "ERROR",
      message: `Transaction failed: ${errorMessage}`,
      timestamp,
    };
  }
}

// Export for testing
export const _testHelpers = {
  validateApprovals,
  validatePaymentRequest,
  mockDistributePrize,
  mockHash,
  generateMockTxHash,
  setMockTransactionFailure,
};
