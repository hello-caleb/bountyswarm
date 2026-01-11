# BountySwarm Handoff: Claude → Antigravity

## Architecture & Constraints
- **Architect**: Caleb Hunter (you - final decisions)
- **Junior Status**: Making architectural decisions, learning fullstack patterns
- **Code Quality**: Smart, deliberate code > fast code (token efficiency matters)
- **Best Practices**: Feature branch → test → PR → code review → merge

## Current State Summary
[Copy key sections from STATE_ASSESSMENT.md]
- ✅ Agents: 5 complete, consensus in progress
- ❌ Blockchain: Smart contract missing (critical path)
- ❌ Frontend: All components missing
- ⏰ Deadline: 40 hours to complete

## Phase Breakdown (Antigravity's Tasks)

### Phase 1: Blockchain Foundation (8-10 hrs)
1. Complete `BountySwarmVault.sol` (smart contract)
2. Write `src/lib/blockchain/mnee.ts` (ERC-20 interaction)
3. Write `src/lib/blockchain/vault.ts` (vault integration)
4. Integrate with Executor Agent
5. Deploy to Sepolia testnet + test

### Phase 2: Frontend (6-8 hrs)
1. Implement Living Glass design system
2. Build core React components
3. Wire real-time updates (SSE)
4. Mobile responsive styling

### Phase 3: Integration & Testing (4-6 hrs)
1. Complete consensus protocol
2. Write integration tests
3. End-to-end smoke test
4. Create demo data

## Code Review Checkpoints
**These are where Claude reviews before you continue:**
1. After smart contract is written (before deploy)
2. After all components built (before integration)
3. After e2e tests pass (before demo recording)

## How to Submit Work
1. Create feature branch: `feature/blockchain`, `feature/frontend`, etc.
2. Commit with clear messages (including what was tested)
3. Open PR to `main`
4. **Pause and notify**: "PR #XX ready for code review"
5. Claude reviews, approves, you merge locally

## Token Efficiency Notes
- Reuse agent patterns (don't reinvent consensus logic)
- Smart contract: Use OpenZeppelin templates
- Frontend: Use Tailwind (already configured)
- Avoid: Unnecessary abstractions, premature optimization
