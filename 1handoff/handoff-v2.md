# BountySwarm Handoff: Claude → Next Session

## Architecture & Constraints
- **Architect**: Caleb Hunter (you - final decisions)
- **Learning Mode**: Explanations needed for fullstack patterns and "why" behind decisions
- **Code Quality**: Smart, deliberate code > fast code (token efficiency matters)
- **Best Practices**: Feature branch → test → PR → code review → merge

---

## Current State (as of Jan 11, 2026 @ ~2:00 AM)

### ✅ COMPLETE
| Component | Location | Status |
|-----------|----------|--------|
| Scout Agent | `src/lib/agents/scout.ts` | ✅ Complete + tested |
| Analyst Agent | `src/lib/agents/analyst.ts` | ✅ Complete + tested |
| Auditor Agent | `src/lib/agents/auditor.ts` | ✅ Complete + tested |
| Compliance Agent | `src/lib/agents/compliance.ts` | ✅ Complete + tested |
| Executor Agent | `src/lib/agents/executor.ts` | ✅ Complete + tested |
| Consensus Protocol | `src/lib/agents/consensus.ts` | ✅ Just merged to main |
| Type Definitions | `src/lib/agents/types.ts` | ✅ Complete |
| CI/CD Pipeline | GitHub Actions | ✅ Working |

### ❌ MISSING (Critical Path)
| Component | Location | Priority |
|-----------|----------|----------|
| Smart Contract | `contracts/BountySwarmVault.sol` | 🔴 P1 - Showstopper |
| Mock MNEE Token | `contracts/MockMNEE.sol` | 🔴 P1 - Needed for testing |
| MNEE Integration | `src/lib/blockchain/mnee.ts` | 🔴 P1 |
| Vault Integration | `src/lib/blockchain/vault.ts` | 🔴 P1 |
| Frontend Components | `src/components/*` | 🟡 P2 |
| Living Glass CSS | `src/styles/living-glass.css` | 🟡 P2 |
| Demo Video | N/A | 🟡 P2 |

### ⏰ Timeline
- **Deadline**: January 12, 2026 @ 5:00 PM EST
- **Hours Remaining**: ~40 hours
- **Buffer**: 6-16 hours (if everything goes smoothly)

---

## Phase 1: Blockchain Foundation (8-10 hours)

### Step 1.1: Set Up Hardhat Environment
```bash
# Create feature branch
git checkout -b feature/blockchain

# Install Hardhat and dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts

# Initialize Hardhat
npx hardhat init
# Choose: Create a TypeScript project
```

**Why Hardhat?** It gives us a local blockchain for testing. We can run hundreds of test transactions in seconds without waiting for real network confirmations or spending gas.

### Step 1.2: Create Mock MNEE Token (for testing)
**File**: `contracts/MockMNEE.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMNEE is ERC20 {
    constructor() ERC20("Mock MNEE", "mMNEE") {
        // Mint 1 million tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }
    
    // Allow anyone to mint for testing purposes
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

**Why a mock token?** Sepolia testnet doesn't have real MNEE tokens. This mock behaves identically to real MNEE but we control it completely for testing.

### Step 1.3: Write BountySwarmVault Contract
**File**: `contracts/BountySwarmVault.sol`

Key requirements:
- Escrow MNEE tokens (deposit from organizer)
- Only agent swarm address can trigger distributions
- Embed metadata in transaction events (submission hash, score hash, etc.)
- Use OpenZeppelin for security (Ownable, ReentrancyGuard)

**Code review checkpoint**: After this file is written, STOP and request review before proceeding.

### Step 1.4: Write Contract Tests
**File**: `test/BountySwarmVault.test.ts`

Test cases needed:
- [ ] Can deposit MNEE into vault
- [ ] Only owner can set agent swarm address
- [ ] Only agent swarm can call distributePrize
- [ ] Unauthorized addresses are rejected
- [ ] Correct events are emitted with metadata
- [ ] Cannot distribute more than vault balance
- [ ] ReentrancyGuard prevents attack

**Run tests locally**:
```bash
npx hardhat test
```

### Step 1.5: Write TypeScript Integration
**File**: `src/lib/blockchain/mnee.ts`
- Check MNEE balance of any address
- Approve vault to spend MNEE
- Get token decimals and symbol

**File**: `src/lib/blockchain/vault.ts`
- Deposit prize pool into vault
- Distribute prize to winner
- Query vault balance
- Listen for PrizeDistributed events

### Step 1.6: Integrate with Executor Agent
Update `src/lib/agents/executor.ts` to call `vault.distributePrize()` instead of mock logic.

### Step 1.7: Deploy to Sepolia Testnet
```bash
# Get Sepolia ETH from faucet: https://sepoliafaucet.com/

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## Phase 2: Frontend UI (6-8 hours)

### Step 2.1: Implement Living Glass Design System
**File**: `src/styles/living-glass.css`

Copy CSS variables and base styles from `DESIGN_SYSTEM.md` in project docs.

### Step 2.2: Build Core Components

| Component | File | Purpose |
|-----------|------|---------|
| AgentCard | `src/components/AgentCard.tsx` | Individual agent status display |
| AgentSwarm | `src/components/AgentSwarm.tsx` | All 5 agents in grid layout |
| PrizePoolStatus | `src/components/PrizePoolStatus.tsx` | Escrow balance + status |
| ConsensusAnimation | `src/components/ConsensusAnimation.tsx` | Visual when agents agree |
| TransactionHistory | `src/components/TransactionHistory.tsx` | Recent distributions |
| TransparencyDashboard | `src/components/TransparencyDashboard.tsx` | Main page layout |

### Step 2.3: Wire Real-Time Updates
**File**: `src/app/api/agents/status/route.ts` - SSE endpoint
**Client**: Use EventSource to receive live agent status updates

### Step 2.4: Responsive Styling
Test on mobile viewport. Living Glass should work at all sizes.

**Code review checkpoint**: After all components built, STOP and request review.

---

## Phase 3: Integration & Testing (4-6 hours)

### Step 3.1: End-to-End Integration Test
Create `tests/e2e/full-flow.test.ts`:
1. Scout triggers verification
2. Analyst calculates winners
3. Auditor checks eligibility
4. Compliance verifies docs
5. Consensus reached
6. Executor calls smart contract
7. Verify blockchain transaction

### Step 3.2: Create Demo Data
**File**: `src/lib/demo/mockData.ts`
- 3 mock winners with addresses
- Sample judge scores (5 judges × 5 criteria)
- Pre-filled compliance data

### Step 3.3: Smoke Test
Manual walkthrough of entire flow from dashboard trigger to blockchain confirmation.

**Code review checkpoint**: After e2e tests pass, STOP and request review before recording demo.

---

## Phase 4: Demo & Documentation (4-6 hours)

### Demo Video Script (3 minutes max)
1. **Hook** (15s): "Winners wait 60-90 days for prizes. BountySwarm does it in 60 seconds."
2. **Agent Swarm** (90s): Show all 5 agents deliberating, reaching consensus
3. **Blockchain Proof** (30s): Show transaction on Etherscan with metadata
4. **Meta Moment** (20s): "We're competing for $12,500. If we win, pay us through BountySwarm."
5. **Market** (15s): Hackathons, bounties, grants, tournaments - all need this.

### Devpost Submission
- Project description
- Tech stack
- What you learned
- Challenges overcome
- What's next

---

## Error Handling Strategy

### Agent Rejection
```typescript
if (agentResult.status === 'REJECTED') {
  await logToDatabase({
    event: 'AGENT_REJECTION',
    agent: agentResult.agent,
    reason: agentResult.reason,
    timestamp: Date.now()
  });
  
  // Halt pipeline, update dashboard
  await updateDashboard({ status: 'BLOCKED', blocking: agentResult });
  
  // Do NOT proceed to executor
  return { consensus: false, blockingAgent: agentResult };
}
```

### Consensus Timeout
```typescript
const CONSENSUS_TIMEOUT = 30_000; // 30 seconds

const consensusPromise = runConsensusProtocol(winner);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('CONSENSUS_TIMEOUT')), CONSENSUS_TIMEOUT)
);

try {
  const result = await Promise.race([consensusPromise, timeoutPromise]);
} catch (error) {
  if (error.message === 'CONSENSUS_TIMEOUT') {
    // Retry once
    const retryResult = await runConsensusProtocol(winner);
    if (!retryResult.consensus) {
      // Escalate to manual review
      await flagForManualReview(winner);
    }
  }
}
```

### Blockchain Transaction Failure
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000]; // Exponential backoff

async function executeWithRetry(fn: () => Promise<any>) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
}
```

---

## Environment Variables

Create `.env.local` (do NOT commit this file):

```bash
# Blockchain - Development
NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_deployer_private_key  # Never commit!

# Blockchain - Contracts (fill after deployment)
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_MNEE_ADDRESS=0x...  # Use mock on testnet

# API Keys
OPENAI_API_KEY=sk-...  # Or ANTHROPIC_API_KEY for Claude

# Database (if using)
DATABASE_URL=postgresql://...
```

**Security Note**: The `.env.example` file should exist with placeholder values. Never commit real keys.

---

## Code Review Checkpoints

### Checkpoint 1: Smart Contract Review
**When**: After `BountySwarmVault.sol` is written, BEFORE deployment
**What to check**:
- [ ] Uses OpenZeppelin correctly
- [ ] Access control is secure (only agent swarm)
- [ ] Events emit correct metadata
- [ ] No reentrancy vulnerabilities
- [ ] All tests pass locally

### Checkpoint 2: Components Review
**When**: After all React components built, BEFORE integration
**What to check**:
- [ ] Living Glass design applied consistently
- [ ] Components are responsive
- [ ] Proper TypeScript types
- [ ] No console errors
- [ ] Accessible (keyboard navigation, ARIA)

### Checkpoint 3: E2E Review
**When**: After integration tests pass, BEFORE demo recording
**What to check**:
- [ ] Full flow works end-to-end
- [ ] Error handling works as expected
- [ ] Dashboard updates in real-time
- [ ] Blockchain transactions confirmed
- [ ] Demo path is bug-free

---

## How to Submit Work for Review

1. **Create feature branch**: `git checkout -b feature/blockchain`
2. **Commit with clear messages**:
   ```
   feat(blockchain): Add BountySwarmVault contract
   
   - Escrow functionality for MNEE tokens
   - Agent-only distribution with metadata
   - Full test coverage (12 test cases)
   
   Tested: npx hardhat test (all passing)
   ```
3. **Push branch**: `git push origin feature/blockchain`
4. **Open PR** to `main` on GitHub
5. **Notify Claude**: "PR #XX ready for code review - [checkpoint name]"
6. **Wait for review** before merging

---

## Token Efficiency Notes

To maximize productivity and minimize wasted effort:

- **Reuse patterns**: Agent implementations follow same structure - copy and adapt
- **OpenZeppelin templates**: Don't write crypto primitives from scratch
- **Tailwind utilities**: Already configured, use existing classes
- **Type definitions exist**: `src/lib/agents/types.ts` has interfaces ready
- **Avoid premature optimization**: Get it working first, optimize if time permits
- **Copy from docs**: `DESIGN_SYSTEM.md` and `TECHNICAL_ARCHITECTURE.md` have code snippets ready to use

---

## Quick Reference: File Locations

```
bountyswarm/
├── contracts/                    # Solidity smart contracts
│   ├── BountySwarmVault.sol     # Main escrow contract
│   └── MockMNEE.sol             # Test token
├── src/
│   ├── app/                     # Next.js pages
│   │   ├── api/agents/status/   # SSE endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # React components (TO BUILD)
│   ├── lib/
│   │   ├── agents/              # ✅ COMPLETE
│   │   └── blockchain/          # TO BUILD
│   └── styles/
│       └── living-glass.css     # TO BUILD
├── tests/                       # Test files
├── docs/planning/               # Project documentation
└── hardhat.config.ts            # Hardhat configuration
```

---

## Contact Points

- **Repo**: https://github.com/hello-caleb/bountyswarm
- **Deadline**: Jan 12, 2026 @ 5:00 PM EST
- **Prize**: $12,500 MNEE

---

**Let's ship this. 🚀**
