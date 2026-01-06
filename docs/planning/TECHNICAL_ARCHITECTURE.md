# BountySwarm: Technical Architecture

## 🏗️ System Overview

BountySwarm is a distributed system combining AI agent coordination, blockchain escrow, and real-time web interface to automate prize distribution with cryptographic verification.

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Transparency Dashboard (React + Next.js)                 │  │
│  │  - Real-time agent status                                 │  │
│  │  - Prize pool visualization                               │  │
│  │  - Transaction history                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                   AGENT ORCHESTRATION LAYER                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Agent Coordinator (Node.js)                           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │  Scout   │  │ Analyst  │  │ Auditor  │             │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │    │
│  │       │             │             │                     │    │
│  │  ┌────▼─────┐  ┌───▼──────┐                            │    │
│  │  │Compliance│  │ Executor │                            │    │
│  │  └────┬─────┘  └────┬─────┘                            │    │
│  │       │             │                                   │    │
│  │       └─────────────▼─────────────────┐                │    │
│  │            Consensus Protocol          │                │    │
│  │       (All agents must agree)          │                │    │
│  └────────────────────────────────────────┘                │    │
└─────────────────────────────────────────────────────────────────┘
                              ↕ 
┌─────────────────────────────────────────────────────────────────┐
│                     BLOCKCHAIN LAYER                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  BountySwarmVault (Solidity Smart Contract)           │    │
│  │  - Escrows MNEE prize pool                            │    │
│  │  - Verifies agent consensus                           │    │
│  │  - Executes transfers with metadata                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↕                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MNEE ERC-20 Contract                                  │    │
│  │  0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                                   │    │
│  │  - Agent deliberation logs                             │    │
│  │  - Verification records                                │    │
│  │  - Transaction metadata                                │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Agent System Design

### Agent Architecture Principles

**1. Single Responsibility**  
Each agent has ONE clear job. No overlap, no confusion.

**2. Consensus-Based**  
No single agent can trigger payment. All must agree.

**3. Transparent Logging**  
Every decision, every check, every step is recorded.

**4. Human Override**  
Edge cases can escalate to human review.

### Agent Specifications

#### 🔍 Scout Agent

**Responsibility:** Monitor hackathon status and trigger verification protocol

**Inputs:**
- Hackathon end timestamp
- Devpost API status (or manual trigger)

**Logic:**
```javascript
async function scoutAgent() {
  const hackathonStatus = await checkHackathonStatus();
  
  if (hackathonStatus === 'JUDGING_COMPLETE') {
    await logDecision({
      agent: 'Scout',
      action: 'TRIGGER_VERIFICATION',
      reason: 'Judging period has ended',
      timestamp: Date.now()
    });
    
    return {
      status: 'TRIGGER',
      message: 'Judging complete. Initiating prize distribution protocol...'
    };
  }
  
  return {
    status: 'WAITING',
    message: 'Judging still in progress...'
  };
}
```

**Outputs:**
- Trigger signal to other agents
- Status update to dashboard

---

#### 📊 Analyst Agent

**Responsibility:** Calculate winners from judge scores

**Inputs:**
- Judge scores (5 judges × 5 criteria × N projects)
- Criteria weights (20% each for this hackathon)

**Logic:**
```javascript
async function analystAgent(judgeScores) {
  // Validate scores
  if (!validateScores(judgeScores)) {
    return {
      status: 'ERROR',
      message: 'Invalid judge scores detected'
    };
  }
  
  // Calculate weighted averages
  const projects = judgeScores.map(project => ({
    id: project.id,
    avgScore: calculateWeightedAverage(project.criteria),
    breakdown: project.criteria
  }));
  
  // Rank projects
  const ranked = projects.sort((a, b) => b.avgScore - a.avgScore);
  
  // Identify winners per track
  const winners = {
    'AI_AGENT_PAYMENTS': ranked.filter(p => p.track === 'AI')[0],
    'COMMERCE_CREATOR': ranked.filter(p => p.track === 'COMMERCE')[0],
    'PROGRAMMABLE_FINANCE': ranked.filter(p => p.track === 'FINANCE')[0],
    'RUNNER_UP_1': ranked.filter(p => !isWinner(p))[0],
    'RUNNER_UP_2': ranked.filter(p => !isWinner(p))[1]
  };
  
  await logDecision({
    agent: 'Analyst',
    action: 'WINNERS_CALCULATED',
    winners: winners,
    timestamp: Date.now()
  });
  
  return {
    status: 'APPROVED',
    winners: winners
  };
}
```

**Outputs:**
- Ranked list of winners with scores
- Score breakdown by criteria
- Approval to proceed

---

#### 🛡️ Auditor Agent

**Responsibility:** Verify eligibility and rule compliance

**Inputs:**
- Winner profiles (age, location, employer)
- Submission details (originality, compliance)

**Logic:**
```javascript
async function auditorAgent(winner) {
  const checks = {
    age: await verifyAge(winner.id),
    location: await verifyLocation(winner.id),
    employerConflict: await checkEmployer(winner.id),
    plagiarism: await checkPlagiarism(winner.submission),
    ruleCompliance: await checkRules(winner.submission)
  };
  
  const violations = Object.entries(checks)
    .filter(([key, passed]) => !passed)
    .map(([key]) => key);
  
  if (violations.length > 0) {
    await logDecision({
      agent: 'Auditor',
      action: 'ELIGIBILITY_FAILED',
      winner: winner.id,
      violations: violations,
      timestamp: Date.now()
    });
    
    return {
      status: 'REJECTED',
      reason: `Eligibility violations: ${violations.join(', ')}`
    };
  }
  
  await logDecision({
    agent: 'Auditor',
    action: 'ELIGIBILITY_VERIFIED',
    winner: winner.id,
    timestamp: Date.now()
  });
  
  return {
    status: 'APPROVED',
    message: 'All eligibility checks passed'
  };
}
```

**Outputs:**
- Eligibility clearance or rejection
- Violation details if applicable
- Approval to proceed

---

#### 📋 Compliance Agent

**Responsibility:** Verify required documentation submitted

**Inputs:**
- Winner tax forms (W-9 or W-8BEN)
- Banking information
- Dispute window status (48 hours)

**Logic:**
```javascript
async function complianceAgent(winner) {
  const checks = {
    taxForm: await checkTaxForm(winner.id),
    bankingInfo: await checkBankingInfo(winner.id),
    disputeWindow: await checkDisputeWindow()
  };
  
  // Tax form required
  if (!checks.taxForm) {
    return {
      status: 'WAITING',
      message: 'Tax form not submitted',
      required: 'W-9 or W-8BEN'
    };
  }
  
  // Banking info required
  if (!checks.bankingInfo) {
    return {
      status: 'WAITING',
      message: 'Banking information incomplete'
    };
  }
  
  // Dispute window must be closed
  if (!checks.disputeWindow) {
    return {
      status: 'WAITING',
      message: '48-hour dispute window still open'
    };
  }
  
  await logDecision({
    agent: 'Compliance',
    action: 'DOCUMENTATION_VERIFIED',
    winner: winner.id,
    timestamp: Date.now()
  });
  
  return {
    status: 'APPROVED',
    message: 'All compliance requirements met'
  };
}
```

**Outputs:**
- Compliance clearance or waiting status
- Required documents list if incomplete
- Approval to proceed

---

#### 💰 Executor Agent

**Responsibility:** Trigger smart contract to release MNEE

**Inputs:**
- Winner address
- Prize amount
- Verification metadata from all agents

**Logic:**
```javascript
async function executorAgent(winner, amount, metadata) {
  // Final safety check
  if (!metadata.analystApproval || 
      !metadata.auditorApproval || 
      !metadata.complianceApproval) {
    return {
      status: 'ERROR',
      message: 'Missing required approvals'
    };
  }
  
  // Prepare metadata for blockchain
  const prizeMetadata = {
    submissionHash: hashSubmission(winner.projectUrl),
    scoreHash: hashScores(winner.scores),
    consensusTime: Date.now(),
    formsVerified: true,
    eligibilityVerified: true
  };
  
  // Call smart contract
  const tx = await bountySwarmVault.distributePrize(
    winner.address,
    amount,
    prizeMetadata
  );
  
  await tx.wait(); // Wait for confirmation
  
  await logDecision({
    agent: 'Executor',
    action: 'PAYMENT_EXECUTED',
    winner: winner.id,
    amount: amount,
    txHash: tx.hash,
    timestamp: Date.now()
  });
  
  return {
    status: 'COMPLETE',
    txHash: tx.hash,
    amount: amount,
    recipient: winner.address
  };
}
```

**Outputs:**
- Blockchain transaction hash
- Payment confirmation
- Updated dashboard

---

### Consensus Protocol

**How Agents Reach Agreement:**

```javascript
async function consensusProtocol(winner) {
  const votes = {
    scout: { status: 'APPROVED', agent: 'Scout' },
    analyst: await analystAgent(winner.scores),
    auditor: await auditorAgent(winner),
    compliance: await complianceAgent(winner)
  };
  
  // Check if all approved
  const allApproved = Object.values(votes)
    .every(vote => vote.status === 'APPROVED');
  
  if (!allApproved) {
    const blocking = Object.entries(votes)
      .filter(([agent, vote]) => vote.status !== 'APPROVED')
      .map(([agent, vote]) => ({ agent, reason: vote.message }));
    
    await logConsensus({
      decision: 'BLOCKED',
      blocking: blocking,
      timestamp: Date.now()
    });
    
    return {
      consensus: false,
      blockingAgents: blocking
    };
  }
  
  // All agents agree - proceed to execution
  await logConsensus({
    decision: 'CONSENSUS_REACHED',
    agents: Object.keys(votes),
    timestamp: Date.now()
  });
  
  return {
    consensus: true,
    executor: await executorAgent(winner, winner.prizeAmount, votes)
  };
}
```

**Consensus Rules:**
- ✅ ALL agents must return `status: 'APPROVED'`
- ❌ ANY agent can block with `status: 'REJECTED'` or `status: 'WAITING'`
- 🔄 Waiting states trigger retry after condition met
- 🚨 Rejected states halt process and alert human admin

---

## 📜 Smart Contract Architecture

### BountySwarmVault Contract

**Core Functions:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BountySwarmVault is Ownable, ReentrancyGuard {
    
    IERC20 public mneeToken;
    address public agentSwarmAddress;
    
    struct PrizeMetadata {
        bytes32 submissionHash;
        bytes32 scoreHash;
        uint256 consensusTime;
        bool formsVerified;
        bool eligibilityVerified;
    }
    
    event PrizeDeposited(uint256 amount, uint256 timestamp);
    event PrizeDistributed(
        address indexed winner,
        uint256 amount,
        bytes32 submissionHash,
        bytes32 scoreHash,
        uint256 consensusTime
    );
    
    constructor(address _mneeToken) {
        mneeToken = IERC20(_mneeToken);
    }
    
    function setAgentSwarmAddress(address _agentSwarm) external onlyOwner {
        agentSwarmAddress = _agentSwarm;
    }
    
    function depositPrizePool(uint256 amount) external onlyOwner {
        require(
            mneeToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        emit PrizeDeposited(amount, block.timestamp);
    }
    
    function distributePrize(
        address winner,
        uint256 amount,
        PrizeMetadata calldata metadata
    ) external nonReentrant {
        require(msg.sender == agentSwarmAddress, "Unauthorized");
        require(metadata.formsVerified, "Forms not verified");
        require(metadata.eligibilityVerified, "Eligibility not verified");
        require(mneeToken.balanceOf(address(this)) >= amount, "Insufficient funds");
        
        require(
            mneeToken.transfer(winner, amount),
            "Transfer failed"
        );
        
        emit PrizeDistributed(
            winner,
            amount,
            metadata.submissionHash,
            metadata.scoreHash,
            metadata.consensusTime
        );
    }
    
    function getBalance() external view returns (uint256) {
        return mneeToken.balanceOf(address(this));
    }
}
```

**Key Features:**
- ✅ Uses OpenZeppelin for security (Ownable, ReentrancyGuard)
- ✅ Only agent swarm can trigger distributions
- ✅ Metadata embedded in events for transparency
- ✅ Simple, auditable logic (no complex state machine)

---

## 🎨 Frontend Architecture

### Tech Stack

**Framework:** Next.js 14 (React 18)  
**Styling:** Tailwind CSS (Living Glass components)  
**Blockchain:** wagmi + ethers.js  
**Real-time:** WebSocket for live updates  
**State:** React Context + useReducer  
**Animation:** Framer Motion

### Component Structure

```
src/
├── app/
│   ├── page.tsx                 # Main dashboard
│   ├── layout.tsx               # Root layout
│   └── api/
│       └── agents/
│           └── status/route.ts  # Agent status endpoint
├── components/
│   ├── AgentCard.tsx            # Individual agent display
│   ├── AgentSwarm.tsx           # Full swarm visualization
│   ├── TransparencyDashboard.tsx
│   ├── PrizePoolStatus.tsx
│   ├── ConsensusAnimation.tsx
│   └── TransactionHistory.tsx
├── lib/
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── auditor.ts
│   │   ├── compliance.ts
│   │   └── executor.ts
│   ├── blockchain/
│   │   ├── vault.ts             # Smart contract interaction
│   │   └── mnee.ts              # MNEE token interaction
│   └── utils/
│       ├── consensus.ts
│       └── logger.ts
└── styles/
    └── living-glass.css         # Design system
```

### Key Pages/Views

**1. Main Dashboard**
- Prize pool visualization
- Agent swarm status (all 5 agents)
- Recent transactions
- Current verification progress

**2. Transaction Detail View**
- Agent deliberation log
- Consensus timeline
- Blockchain proof
- Metadata explorer

**3. Admin Panel** (Optional)
- Trigger verification manually
- Override consensus (emergency)
- View detailed logs

---

## 🔗 Integration Points

### 1. LLM API Integration (Agent Intelligence)

**Option A: OpenAI GPT-4**
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function callAgent(agentRole, context) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: getAgentSystemPrompt(agentRole)
      },
      {
        role: 'user',
        content: JSON.stringify(context)
      }
    ],
    temperature: 0.2, // Low temperature for consistency
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

**Option B: Anthropic Claude**
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function callAgent(agentRole, context) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${getAgentSystemPrompt(agentRole)}\n\n${JSON.stringify(context)}`
      }
    ]
  });
  
  return JSON.parse(response.content[0].text);
}
```

### 2. Blockchain Integration

**Connect to MNEE Contract:**
```javascript
import { ethers } from 'ethers';

const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF';

const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL
);

const mneeContract = new ethers.Contract(
  MNEE_ADDRESS,
  MNEE_ABI,
  provider
);

// Check balance
const balance = await mneeContract.balanceOf(vaultAddress);

// Transfer (when executing prize)
const tx = await mneeContract.transfer(winnerAddress, amount);
await tx.wait();
```

### 3. Real-Time Updates

**WebSocket Server:**
```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  // Send agent status updates
  agentEvents.on('status-change', (data) => {
    ws.send(JSON.stringify({
      type: 'AGENT_STATUS',
      data: data
    }));
  });
  
  // Send consensus updates
  consensusEvents.on('update', (data) => {
    ws.send(JSON.stringify({
      type: 'CONSENSUS_UPDATE',
      data: data
    }));
  });
});
```

---

## 🗄️ Data Models

### Database Schema (PostgreSQL)

```sql
-- Agent Logs
CREATE TABLE agent_logs (
  id SERIAL PRIMARY KEY,
  agent VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  context JSONB,
  timestamp BIGINT NOT NULL
);

-- Consensus Records
CREATE TABLE consensus_records (
  id SERIAL PRIMARY KEY,
  hackathon_id VARCHAR(100),
  decision VARCHAR(50) NOT NULL,
  agents JSONB NOT NULL,
  blocking_agents JSONB,
  timestamp BIGINT NOT NULL
);

-- Prize Distributions
CREATE TABLE prize_distributions (
  id SERIAL PRIMARY KEY,
  winner_address VARCHAR(42) NOT NULL,
  amount DECIMAL(20, 0) NOT NULL,
  submission_hash VARCHAR(66),
  score_hash VARCHAR(66),
  tx_hash VARCHAR(66) NOT NULL,
  block_number BIGINT,
  timestamp BIGINT NOT NULL
);

-- Verification Records
CREATE TABLE verification_records (
  id SERIAL PRIMARY KEY,
  winner_id VARCHAR(100) NOT NULL,
  check_type VARCHAR(50) NOT NULL,
  passed BOOLEAN NOT NULL,
  details JSONB,
  timestamp BIGINT NOT NULL
);
```

---

## 🧪 Testing Strategy

### Unit Tests

**Agent Logic:**
- Test each agent's decision-making independently
- Mock all external dependencies (APIs, blockchain)
- Verify output format and status codes

**Smart Contract:**
- Test prize deposit
- Test distribution with valid metadata
- Test unauthorized access prevention
- Test insufficient funds handling

### Integration Tests

**Agent Coordination:**
- Test full consensus protocol
- Test blocking scenarios (one agent rejects)
- Test retry logic for waiting states

**Blockchain Integration:**
- Test MNEE contract interaction on testnet
- Test transaction confirmation
- Test event emission and parsing

### End-to-End Tests

**Complete Flow:**
1. Scout triggers verification
2. Analyst calculates winners
3. Auditor verifies eligibility
4. Compliance checks documentation
5. Consensus reached
6. Executor releases payment
7. Dashboard updates

**Demo Scenario:**
- Mock hackathon with 3 winners
- All agents approve
- Payments execute successfully
- Verify blockchain transactions

---

## 🚀 Deployment Architecture

### Frontend (Vercel)
- Next.js app deployed to Vercel
- Environment variables for API keys
- Automatic deployments from main branch

### Backend (Node.js)
- Agent orchestration server
- WebSocket server for real-time updates
- Database connections

### Smart Contract (Ethereum)
- Deploy to testnet for demo (Sepolia or Goerli)
- OR deploy to mainnet if budget allows
- Verify contract on Etherscan

### Database (PostgreSQL)
- Hosted on Vercel Postgres or Supabase
- Connection pooling for performance
- Automatic backups

---

## 📊 Performance Considerations

**Agent Response Time:**
- Target: < 2 seconds per agent
- Use low temperature for LLM consistency
- Cache common responses

**Consensus Speed:**
- Target: < 10 seconds total for 5 agents
- Parallel execution where possible
- Timeout mechanisms for stuck agents

**Blockchain Confirmation:**
- Typical: 12-20 seconds for Ethereum block
- Show pending state immediately
- Confirm after 1-2 blocks

**Total Time Target:** 30-60 seconds from trigger to payment

---

## 🛡️ Security Considerations

**Agent Authorization:**
- Only authorized backend can trigger agents
- API keys secured in environment variables
- Rate limiting on agent endpoints

**Smart Contract Security:**
- Use OpenZeppelin libraries (battle-tested)
- Only agent swarm address can trigger distributions
- ReentrancyGuard prevents re-entry attacks
- Owner-only functions for administration

**Data Validation:**
- Validate all inputs before agent processing
- Sanitize data before blockchain submission
- Hash sensitive data (scores, forms)

**Access Control:**
- Dashboard read-only by default
- Admin functions require authentication
- Blockchain transactions signed by secure wallet

---

This architecture balances **sophistication** (multi-agent system) with **simplicity** (straightforward blockchain interactions) to maximize impact while staying buildable in 10 days.

**Next:** Design system and component specifications.
