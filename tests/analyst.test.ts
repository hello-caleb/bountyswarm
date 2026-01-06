import { describe, it, expect } from "vitest";
import { analystAgent } from "../src/lib/agents/analyst";
import type { ProjectSubmission, Criterion } from "../src/lib/agents/types";
import { CRITERIA } from "../src/lib/agents/types";

// Helper to create judge scores for all criteria
function createJudgeScores(
  scores: Record<Criterion, number[]>
): ProjectSubmission["criteriaScores"] {
  return CRITERIA.map((criterion) => ({
    criterion,
    judgeScores: scores[criterion].map((score, i) => ({
      judgeId: `judge-${i + 1}`,
      score,
    })),
  }));
}

// Mock data: 5 projects across 3 tracks, 5 judges, 5 criteria
const mockProjects: ProjectSubmission[] = [
  {
    id: "proj-1",
    name: "BountySwarm",
    track: "AI_AGENT_PAYMENTS",
    teamLead: "Caleb",
    walletAddress: "0x1111111111111111111111111111111111111111",
    projectUrl: "https://devpost.com/bountyswarm",
    submissionTimestamp: 1704067200000, // Jan 1, 2024 00:00
    criteriaScores: createJudgeScores({
      TECHNICAL_IMPLEMENTATION: [95, 90, 92, 88, 94], // avg: 91.8
      DESIGN_UX: [88, 92, 90, 85, 89], // avg: 88.8
      IMPACT_POTENTIAL: [92, 95, 90, 93, 91], // avg: 92.2
      ORIGINALITY_QUALITY: [90, 88, 92, 89, 91], // avg: 90.0
      COORDINATION_PROBLEMS: [94, 92, 90, 88, 91], // avg: 91.0
      // Final: 91.8*0.2 + 88.8*0.2 + 92.2*0.2 + 90.0*0.2 + 91.0*0.2 = 90.76
    }),
  },
  {
    id: "proj-2",
    name: "PayFlow",
    track: "COMMERCE_CREATOR",
    teamLead: "Alice",
    walletAddress: "0x2222222222222222222222222222222222222222",
    projectUrl: "https://devpost.com/payflow",
    submissionTimestamp: 1704070800000, // Jan 1, 2024 01:00
    criteriaScores: createJudgeScores({
      TECHNICAL_IMPLEMENTATION: [85, 82, 88, 84, 86], // avg: 85.0
      DESIGN_UX: [90, 92, 88, 91, 89], // avg: 90.0
      IMPACT_POTENTIAL: [80, 82, 78, 81, 79], // avg: 80.0
      ORIGINALITY_QUALITY: [75, 78, 76, 74, 77], // avg: 76.0
      COORDINATION_PROBLEMS: [82, 80, 84, 81, 83], // avg: 82.0
      // Final: 85*0.2 + 90*0.2 + 80*0.2 + 76*0.2 + 82*0.2 = 82.6
    }),
  },
  {
    id: "proj-3",
    name: "DeFiBot",
    track: "PROGRAMMABLE_FINANCE",
    teamLead: "Bob",
    walletAddress: "0x3333333333333333333333333333333333333333",
    projectUrl: "https://devpost.com/defibot",
    submissionTimestamp: 1704074400000, // Jan 1, 2024 02:00
    criteriaScores: createJudgeScores({
      TECHNICAL_IMPLEMENTATION: [92, 90, 94, 91, 93], // avg: 92.0
      DESIGN_UX: [78, 80, 76, 79, 77], // avg: 78.0
      IMPACT_POTENTIAL: [88, 90, 86, 89, 87], // avg: 88.0
      ORIGINALITY_QUALITY: [85, 87, 83, 86, 84], // avg: 85.0
      COORDINATION_PROBLEMS: [80, 82, 78, 81, 79], // avg: 80.0
      // Final: 92*0.2 + 78*0.2 + 88*0.2 + 85*0.2 + 80*0.2 = 84.6
    }),
  },
  {
    id: "proj-4",
    name: "AgentPay",
    track: "AI_AGENT_PAYMENTS",
    teamLead: "Carol",
    walletAddress: "0x4444444444444444444444444444444444444444",
    projectUrl: "https://devpost.com/agentpay",
    submissionTimestamp: 1704078000000, // Jan 1, 2024 03:00
    criteriaScores: createJudgeScores({
      TECHNICAL_IMPLEMENTATION: [88, 86, 90, 87, 89], // avg: 88.0
      DESIGN_UX: [85, 87, 83, 86, 84], // avg: 85.0
      IMPACT_POTENTIAL: [86, 88, 84, 87, 85], // avg: 86.0
      ORIGINALITY_QUALITY: [82, 84, 80, 83, 81], // avg: 82.0
      COORDINATION_PROBLEMS: [84, 86, 82, 85, 83], // avg: 84.0
      // Final: 88*0.2 + 85*0.2 + 86*0.2 + 82*0.2 + 84*0.2 = 85.0
    }),
  },
  {
    id: "proj-5",
    name: "ShopStream",
    track: "COMMERCE_CREATOR",
    teamLead: "Dave",
    walletAddress: "0x5555555555555555555555555555555555555555",
    projectUrl: "https://devpost.com/shopstream",
    submissionTimestamp: 1704081600000, // Jan 1, 2024 04:00
    criteriaScores: createJudgeScores({
      TECHNICAL_IMPLEMENTATION: [86, 88, 84, 87, 85], // avg: 86.0
      DESIGN_UX: [92, 94, 90, 93, 91], // avg: 92.0
      IMPACT_POTENTIAL: [84, 86, 82, 85, 83], // avg: 84.0
      ORIGINALITY_QUALITY: [88, 90, 86, 89, 87], // avg: 88.0
      COORDINATION_PROBLEMS: [86, 88, 84, 87, 85], // avg: 86.0
      // Final: 86*0.2 + 92*0.2 + 84*0.2 + 88*0.2 + 86*0.2 = 87.2
    }),
  },
];

describe("Analyst Agent", () => {
  describe("analystAgent()", () => {
    it("returns APPROVED with winners and breakdown for valid projects", async () => {
      const result = await analystAgent(mockProjects);

      expect(result.status).toBe("APPROVED");
      expect(result.winners).toHaveLength(5); // 3 track winners + 2 runners-up
      expect(result.breakdown).toHaveLength(5);
      expect(result.timestamp).toBeTypeOf("number");
    });

    it("calculates correct final scores", async () => {
      const result = await analystAgent(mockProjects);

      // BountySwarm should have highest score (~90.76)
      const bountySwarm = result.breakdown.find((b) => b.projectId === "proj-1");
      expect(bountySwarm?.finalScore).toBeCloseTo(90.76, 1);

      // DeFiBot should be ~84.6
      const defiBot = result.breakdown.find((b) => b.projectId === "proj-3");
      expect(defiBot?.finalScore).toBeCloseTo(84.6, 1);
    });

    it("ranks projects correctly by score", async () => {
      const result = await analystAgent(mockProjects);

      // Verify ranking order (highest to lowest)
      expect(result.breakdown[0].projectId).toBe("proj-1"); // BountySwarm: 90.76
      expect(result.breakdown[1].projectId).toBe("proj-5"); // ShopStream: 87.2
      expect(result.breakdown[2].projectId).toBe("proj-4"); // AgentPay: 85.0
      expect(result.breakdown[3].projectId).toBe("proj-3"); // DeFiBot: 84.6
      expect(result.breakdown[4].projectId).toBe("proj-2"); // PayFlow: 82.6
    });

    it("identifies correct track winners", async () => {
      const result = await analystAgent(mockProjects);

      const trackWinners = result.winners.filter((w) => w.category === "TRACK_WINNER");
      expect(trackWinners).toHaveLength(3);

      // AI_AGENT_PAYMENTS winner should be BountySwarm
      const aiWinner = trackWinners.find((w) => w.trackWon === "AI_AGENT_PAYMENTS");
      expect(aiWinner?.projectId).toBe("proj-1");

      // COMMERCE_CREATOR winner should be ShopStream (87.2 > PayFlow 82.6)
      const commerceWinner = trackWinners.find((w) => w.trackWon === "COMMERCE_CREATOR");
      expect(commerceWinner?.projectId).toBe("proj-5");

      // PROGRAMMABLE_FINANCE winner should be DeFiBot (only one in track)
      const financeWinner = trackWinners.find((w) => w.trackWon === "PROGRAMMABLE_FINANCE");
      expect(financeWinner?.projectId).toBe("proj-3");
    });

    it("identifies correct runners-up (non-track winners)", async () => {
      const result = await analystAgent(mockProjects);

      const runnersUp = result.winners.filter((w) => w.category === "RUNNER_UP");
      expect(runnersUp).toHaveLength(2);

      // Runners-up should be AgentPay (85.0) and PayFlow (82.6)
      // (not track winners since BountySwarm won AI, ShopStream won Commerce, DeFiBot won Finance)
      const runnerUpIds = runnersUp.map((r) => r.projectId);
      expect(runnerUpIds).toContain("proj-4"); // AgentPay
      expect(runnerUpIds).toContain("proj-2"); // PayFlow
    });

    it("includes criteria averages in breakdown", async () => {
      const result = await analystAgent(mockProjects);

      const bountySwarm = result.breakdown.find((b) => b.projectId === "proj-1");
      expect(bountySwarm?.criteriaAverages).toHaveLength(5);

      const techAvg = bountySwarm?.criteriaAverages.find(
        (ca) => ca.criterion === "TECHNICAL_IMPLEMENTATION"
      );
      expect(techAvg?.average).toBeCloseTo(91.8, 1);
    });
  });

  describe("validation", () => {
    it("returns ERROR for empty projects array", async () => {
      const result = await analystAgent([]);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("No projects provided");
      expect(result.winners).toHaveLength(0);
    });

    it("returns ERROR for scores outside 0-100 range", async () => {
      const invalidProject: ProjectSubmission = {
        ...mockProjects[0],
        id: "invalid",
        criteriaScores: createJudgeScores({
          TECHNICAL_IMPLEMENTATION: [105, 90, 92, 88, 94], // 105 is invalid
          DESIGN_UX: [88, 92, 90, 85, 89],
          IMPACT_POTENTIAL: [92, 95, 90, 93, 91],
          ORIGINALITY_QUALITY: [90, 88, 92, 89, 91],
          COORDINATION_PROBLEMS: [94, 92, 90, 88, 91],
        }),
      };

      const result = await analystAgent([invalidProject]);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid scores");
    });

    it("returns ERROR for negative scores", async () => {
      const invalidProject: ProjectSubmission = {
        ...mockProjects[0],
        id: "invalid",
        criteriaScores: createJudgeScores({
          TECHNICAL_IMPLEMENTATION: [-5, 90, 92, 88, 94], // -5 is invalid
          DESIGN_UX: [88, 92, 90, 85, 89],
          IMPACT_POTENTIAL: [92, 95, 90, 93, 91],
          ORIGINALITY_QUALITY: [90, 88, 92, 89, 91],
          COORDINATION_PROBLEMS: [94, 92, 90, 88, 91],
        }),
      };

      const result = await analystAgent([invalidProject]);

      expect(result.status).toBe("ERROR");
      expect(result.message).toContain("Invalid scores");
    });
  });

  describe("tiebreaker", () => {
    it("uses earlier submission timestamp as tiebreaker for equal scores", async () => {
      // Create two projects with identical scores but different timestamps
      const tiedProjects: ProjectSubmission[] = [
        {
          id: "tied-1",
          name: "Project A",
          track: "AI_AGENT_PAYMENTS",
          teamLead: "Team A",
          walletAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          projectUrl: "https://devpost.com/a",
          submissionTimestamp: 1704081600000, // Later
          criteriaScores: createJudgeScores({
            TECHNICAL_IMPLEMENTATION: [80, 80, 80, 80, 80],
            DESIGN_UX: [80, 80, 80, 80, 80],
            IMPACT_POTENTIAL: [80, 80, 80, 80, 80],
            ORIGINALITY_QUALITY: [80, 80, 80, 80, 80],
            COORDINATION_PROBLEMS: [80, 80, 80, 80, 80],
          }),
        },
        {
          id: "tied-2",
          name: "Project B",
          track: "AI_AGENT_PAYMENTS",
          teamLead: "Team B",
          walletAddress: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          projectUrl: "https://devpost.com/b",
          submissionTimestamp: 1704067200000, // Earlier - should win tiebreaker
          criteriaScores: createJudgeScores({
            TECHNICAL_IMPLEMENTATION: [80, 80, 80, 80, 80],
            DESIGN_UX: [80, 80, 80, 80, 80],
            IMPACT_POTENTIAL: [80, 80, 80, 80, 80],
            ORIGINALITY_QUALITY: [80, 80, 80, 80, 80],
            COORDINATION_PROBLEMS: [80, 80, 80, 80, 80],
          }),
        },
      ];

      const result = await analystAgent(tiedProjects);

      // Project B (earlier submission) should rank first
      expect(result.breakdown[0].projectId).toBe("tied-2");
      expect(result.breakdown[1].projectId).toBe("tied-1");
    });
  });
});
