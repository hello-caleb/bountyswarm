# BountySwarm - Devpost Submission

## Inspiration
We've all been there: you win a hackathon, and then wait... and wait. Sometimes 90 days for a prize payout. We asked: *What if the money could move as fast as the code?*

We were inspired by the potential of **Agentic AI** to solve complex coordination problems. If AI can write code, why can't it judge code and pay the winners?

## What it does
BountySwarm is an autonomous "Hive Mind" for bounty orchestration.
1.  **Scout Agent** finds new pull requests or submissions.
2.  **Analyst Agent** reviews the code against rubric criteria.
3.  **Auditor Agent** performs KYC/AML checks (simulated) and verifies eligibility.
4.  **Compliance Agent** ensures tax forms are present.
5.  **Executor Agent** holds the keys to the **MNEE Smart Vault**. Once consensus is reached (4/5 agents agree), it cryptographically signs the transaction and releases the funds.

## How we built it
*   **Blockchain**: We used **Hardhat** to develop the `BountySwarmVault` smart contract in Solidity. It features a custom `onlySwarm` modifier that restricts payouts to the consensus engine.
*   **Frontend**: Built with **Next.js** and **TailwindCSS**, utilizing a custom "Living Glass" aesthetic to visualize the futuristic nature of the tech.
*   **Agent Logic**: We designed a typesafe agent protocol (`types.ts`) that standardizes how agents communicate state (IDLE, THINKING, VOTING) to the frontend via **Server-Sent Events (SSE)**.

## Challenges we ran into
*   **Hardhat vs System Permissions**: We faced significant EACCES issues with local node modules, forcing us to rebuild the environment multiple times. We compensated by building robust **Integration Tests** and a **Demo Mode** fallback to ensure we could still ship a working product.
*   **Real-time Visualization**: Synchronizing the state of 5 independent agents on a web dashboard was tricky. We solved this with a lightweight SSE stream that pushes state changes instantly to the React frontend.

## Accomplishments that we're proud of
*   **The "Living Glass" UI**: It looks genuinely sci-fi and responsive.
*   **Full End-to-End Flow**: From button click to "Blockchain Transaction Confirmed" in under 30 seconds.
*   **Robust Architecture**: The separation of concerns between the Blockchain Layer (Vault), the Logic Layer (Agents), and the Presentation Layer (Dashboard) makes this production-ready.

## What we learned
*   AI Agents are most powerful when they have distinct "Roles". By separating "Analyst" (Logic) from "Auditor" (Rules), we avoided hallucinations where an AI might approve a valid code submission from a sanctioned country.
*   Building on **MNEE** (Mocked for testnet) showed us the speed advantages of modern chains.

## What's next for BountySwarm
*   **Mainnet Deployment**: Moving from Sepolia to MNEE Mainnet.
*   **DAO Governance**: Allowing token holders to vote on the "Rubric" that the Analyst agent uses.
*   **Multi-Chain Support**: Paying out bounties in stablecoins across any EVM chain.
