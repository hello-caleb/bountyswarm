# BountySwarm Project Handoff

## Project Overview
**BountySwarm** is an autonomous bounty distribution platform built for the MNEE 2026 Hackathon. It uses a swarm of AI agents to verify submissions and executes payments via smart contracts on the Sepolia testnet.

## Current State
- **Status**: Development Complete (Ready for Demo/Submission)
- **Repo**: `https://github.com/hello-caleb/bountyswarm`
- **Branch**: `feature/blockchain` (or current working branch)
- **Deployment**:
    - **Live App**: `http://localhost:3000`
    - **Smart Network**: Sepolia Testnet
    - **Vault**: `0xd031160F9c8f3A695878b016e2A2208bfFB5da94` (Holds 12,500 mMNEE)

## Recent Features (Organizer Flow)
We successfully implemented the **Organizer Flow** to allow judges/users to interact with the system during the demo.
1.  **`/create`**: Organizer sets Bounty Name and Prize Amount.
    *   *Update*: Strict currency formatting (e.g., "12,500.00 MNEE").
2.  **`/submit`**: Organizer submits Winner Details.
    *   *Update*: Added "Verification Criteria" field for context.
3.  **`/verify`**: Real-time visualization of the AI Swarm (Scout -> Executor).
    *   *Tech*: Uses Server-Sent Events (SSE) at `/api/agents/status`.
4.  **`/complete`**: Conclusion screen with transaction hash and Etherscan link.

## Key Files
- **Context**: `src/context/OrganizerContext.tsx` (State management)
- **Pages**: `src/app/{create,submit,verify,complete}/page.tsx`
- **Demo Logic**: `src/lib/demo/demoManager.ts` (Hybrid simulation + Real Tx)

## Technical Notes
- **Server**: Run with `npm run dev` (Port 3000).
- **Env**: Requires `NEXT_PUBLIC_WALLET_PRIVATE_KEY` (or server-side `PRIVATE_KEY`) for the Executor agent to sign real transactions during the demo.
    *   *Current Status*: Configured for "Hybrid" mode (Simulated thinking + Real Execution).

## Pending Actions
- **Git**: There are uncommitted changes related to the Organizer Flow.
    *   *Action Request*: Run `git add . && git commit -m "feat: complete organizer flow"`
- **Submission**: `DEVPOST.md` is ready for the write-up.
- **Video**: `walkthrough.md` contains the script/flow for recording.
