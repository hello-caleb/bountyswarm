import { keccak256, toUtf8Bytes, randomBytes } from "ethers";
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
// Blockchain Configuration
// ===================

/**
 * Configuration for the Executor agent
 * Using dependency injection to avoid mutable module-level state
 */
export interface ExecutorConfig {
  distributePrize: (
    winnerAddress: string,
    amount: string,
    metadata: PrizeMetadata
  ) => Promise<TransactionReceipt>;
}

/**
 * Hash a string using keccak256 (production-safe cryptographic hash)
 */
export function hashString(input: string): string {
  return keccak256(toUtf8Bytes(input));
}

/**
 * Generate a unique transaction hash using random bytes
 */
function generateTxHash(): string {
  return keccak256(randomBytes(32));
}

/**
 * Generate a unique block hash using random bytes
 */
function generateBlockHash(): string {
  return keccak256(randomBytes(32));
}

/**
 * Creates a mock blockchain service for testing
 * Avoids mutable module-level state by encapsulating state in closure
 */
export function createMockBlockchainService(options: {
  shouldFail?: boolean;
  initialBlockNumber?: number;
} = {}): {
  distributePrize: ExecutorConfig["distributePrize"];
  getTransactionCount: () => number;
} {
  let txCounter = 0;
  const baseBlockNumber = options.initialBlockNumber ?? 19000000;
  const shouldFail = options.shouldFail ?? false;

  return {
    distributePrize: async (
      winnerAddress: string,
      amount: string,
      _metadata: PrizeMetadata
    ): Promise<TransactionReceipt> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (shouldFail) {
        throw new Error("Transaction reverted: insufficient funds in vault");
      }

      // Validate address format
      if (!winnerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid wallet address format");
      }

      // Validate amount using string comparison to avoid floating-point issues
      if (!isValidAmount(amount)) {
        throw new Error("Invalid amount: must be positive number");
      }

      txCounter++;

      return {
        transactionHash: generateTxHash(),
        blockNumber: baseBlockNumber + txCounter,
        blockHash: generateBlockHash(),
        gasUsed: "85000",
        status: "success",
      };
    },
    getTransactionCount: () => txCounter,
  };
}

/**
 * Default mock service for backward compatibility
 */
const defaultMockService = createMockBlockchainService();

/**
 * Default executor configuration using mock blockchain
 */
export const defaultExecutorConfig: ExecutorConfig = {
  distributePrize: defaultMockService.distributePrize,
};

/**
 * Validates amount string without floating-point precision issues
 * Accepts positive integers and decimals
 */
function isValidAmount(amount: string): boolean {
  if (!amount || amount.trim() === "") return false;
  // Match positive numbers (integer or decimal)
  const validPattern = /^(?!0*$)\d+(\.\d+)?$/;
  if (!validPattern.test(amount)) return false;
  // Additional check: ensure it's not just zeros after decimal
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
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

// Maximum prize amount in MNEE (safety check)
const MAX_PRIZE_AMOUNT = 100000;

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
    } else if (amount > MAX_PRIZE_AMOUNT) {
      errors.push(`Payment amount exceeds maximum allowed: ${MAX_PRIZE_AMOUNT} MNEE`);
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

/**
 * Validate metadata hash formats
 */
function validateMetadata(input: ExecutorInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { metadata } = input;

  if (metadata.submissionHash && !metadata.submissionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    errors.push("Invalid submission hash format");
  }

  if (metadata.scoreHash && !metadata.scoreHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    errors.push("Invalid score hash format");
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
export async function executorAgent(
  input: ExecutorInput,
  config: ExecutorConfig = defaultExecutorConfig
): Promise<ExecutorResponse> {
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

  // Step 3: Validate metadata format (if provided)
  const metadataCheck = validateMetadata(input);
  if (!metadataCheck.valid) {
    logDecision({
      agent: "Executor",
      action: "METADATA_VALIDATION_FAILED",
      status: "ERROR",
      context: { errors: metadataCheck.errors },
      timestamp,
    });

    return {
      status: "ERROR",
      message: `Invalid metadata: ${metadataCheck.errors.join("; ")}`,
      timestamp,
    };
  }

  // Step 4: Prepare prize metadata for blockchain (use hashes from input or generate)
  const prizeMetadata: PrizeMetadata = {
    submissionHash:
      input.metadata.submissionHash || hashString(input.paymentRequest.projectUrl),
    scoreHash: input.metadata.scoreHash || hashString(input.paymentRequest.winnerId),
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

  // Step 5: Execute blockchain transaction
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

    const receipt = await config.distributePrize(
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
  validateMetadata,
  hashString,
  createMockBlockchainService,
  MAX_PRIZE_AMOUNT,
};
