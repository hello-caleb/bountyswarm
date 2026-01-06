# BountySwarm

![CI Status](https://github.com/hello-caleb/bountyswarm/actions/workflows/ci.yml/badge.svg)

AI agent swarm for automated hackathon prize distribution using MNEE stablecoin.

## Overview

BountySwarm uses a multi-agent consensus system to verify hackathon winners and trigger instant prize payments on the blockchain. The system ensures fairness, compliance, and transparency through a 5-agent verification pipeline.

## Agent Pipeline

| Agent | Role | Status Values |
|-------|------|---------------|
| **Scout** | Monitors hackathon status, triggers pipeline when judging completes | `TRIGGER` / `WAITING` |
| **Analyst** | Calculates winners from judge scores using weighted averages | `APPROVED` / `ERROR` |
| **Auditor** | Verifies eligibility (age, location, employer conflicts, plagiarism) | `APPROVED` / `REJECTED` |
| **Compliance** | Checks documentation (tax forms, banking info, dispute window) | `APPROVED` / `WAITING` |
| **Executor** | Triggers smart contract to release MNEE prizes | `COMPLETE` / `ERROR` |

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Blockchain**: ethers.js, wagmi
- **AI**: Anthropic Claude SDK
- **Testing**: Vitest

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

## Project Structure

```
src/
  lib/
    agents/
      scout.ts      # Hackathon status monitoring
      analyst.ts    # Score calculation & winner identification
      auditor.ts    # Eligibility verification (6 checks)
      compliance.ts # Documentation verification (3 checks)
      executor.ts   # Blockchain transaction execution
      types.ts      # Shared TypeScript interfaces
tests/
  scout.test.ts
  analyst.test.ts
  auditor.test.ts
  compliance.test.ts
  executor.test.ts
```

## Prize Distribution

- **Track Winners**: 2,500 MNEE per track (3 tracks)
- **Runners-Up**: 1,250 MNEE (2 positions)

## Verification Checks

### Auditor (Eligibility)
- Age verification (18+)
- Location verification (OFAC compliance)
- Employer conflict check (sponsor employees excluded)
- Plagiarism detection
- Rule compliance
- Submission authenticity

### Compliance (Documentation)
- Tax form submission (W-9 / W-8BEN)
- Banking information
- 48-hour dispute window

## License

MIT
