import type {
  AgentLog,
  ProjectSubmission,
  ScoreBreakdown,
  AnalystWinner,
  AnalystResponse,
  Track,
  Criterion,
} from "./types";
import { CRITERIA, CRITERION_WEIGHT } from "./types";

const TRACKS: Track[] = ["AI_AGENT_PAYMENTS", "COMMERCE_CREATOR", "PROGRAMMABLE_FINANCE"];

function logDecision(log: AgentLog): void {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] ANALYST | ${log.action} | ${log.status}`,
    log.context ? JSON.stringify(log.context) : ""
  );
}

/**
 * Validates that all scores are within 0-100 range
 */
function validateScores(projects: ProjectSubmission[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const project of projects) {
    for (const criteria of project.criteriaScores) {
      for (const judgeScore of criteria.judgeScores) {
        if (judgeScore.score < 0 || judgeScore.score > 100) {
          errors.push(
            `Invalid score ${judgeScore.score} for project ${project.id}, criterion ${criteria.criterion}, judge ${judgeScore.judgeId}`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate the average score for a single criterion across all judges
 */
function calculateCriterionAverage(scores: { score: number }[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return sum / scores.length;
}

/**
 * Calculate the final weighted score for a project
 * All 5 criteria have equal weight (20% each)
 */
function calculateFinalScore(project: ProjectSubmission): {
  finalScore: number;
  criteriaAverages: { criterion: Criterion; average: number }[];
} {
  const criteriaAverages: { criterion: Criterion; average: number }[] = [];

  for (const criterion of CRITERIA) {
    const criteriaScore = project.criteriaScores.find((cs) => cs.criterion === criterion);
    const average = criteriaScore ? calculateCriterionAverage(criteriaScore.judgeScores) : 0;
    criteriaAverages.push({ criterion, average });
  }

  // Weighted average (all equal at 20%)
  const finalScore = criteriaAverages.reduce(
    (acc, ca) => acc + ca.average * CRITERION_WEIGHT,
    0
  );

  return { finalScore, criteriaAverages };
}

/**
 * Sort projects by score (descending), using submission timestamp as tiebreaker
 */
function sortByScoreWithTiebreaker(
  a: { finalScore: number; submissionTimestamp: number },
  b: { finalScore: number; submissionTimestamp: number }
): number {
  if (b.finalScore !== a.finalScore) {
    return b.finalScore - a.finalScore; // Higher score first
  }
  // Tiebreaker: earlier submission wins
  return a.submissionTimestamp - b.submissionTimestamp;
}

/**
 * Calculate score breakdowns for all projects and rank them
 */
function calculateBreakdowns(projects: ProjectSubmission[]): ScoreBreakdown[] {
  const breakdowns = projects.map((project) => {
    const { finalScore, criteriaAverages } = calculateFinalScore(project);
    return {
      projectId: project.id,
      projectName: project.name,
      track: project.track,
      criteriaAverages,
      finalScore,
      submissionTimestamp: project.submissionTimestamp,
      rank: 0, // Will be set after sorting
    };
  });

  // Sort by score with tiebreaker
  breakdowns.sort(sortByScoreWithTiebreaker);

  // Assign ranks
  breakdowns.forEach((b, index) => {
    b.rank = index + 1;
  });

  // Remove submissionTimestamp from final output
  return breakdowns.map(({ submissionTimestamp, ...rest }) => rest);
}

/**
 * Identify winners: top project per track + top 2 overall runners-up
 */
function identifyWinners(
  projects: ProjectSubmission[],
  breakdowns: ScoreBreakdown[]
): AnalystWinner[] {
  const winners: AnalystWinner[] = [];
  const trackWinnerIds = new Set<string>();

  // Find top project for each track
  for (const track of TRACKS) {
    const trackProjects = breakdowns.filter((b) => b.track === track);
    if (trackProjects.length > 0) {
      const topProject = trackProjects[0]; // Already sorted by score
      const project = projects.find((p) => p.id === topProject.projectId)!;

      winners.push({
        projectId: topProject.projectId,
        projectName: topProject.projectName,
        track: topProject.track,
        walletAddress: project.walletAddress,
        projectUrl: project.projectUrl,
        finalScore: topProject.finalScore,
        category: "TRACK_WINNER",
        trackWon: track,
      });

      trackWinnerIds.add(topProject.projectId);
    }
  }

  // Find top 2 runners-up (not already track winners)
  const nonWinners = breakdowns.filter((b) => !trackWinnerIds.has(b.projectId));
  const runnersUp = nonWinners.slice(0, 2);

  for (const runnerUp of runnersUp) {
    const project = projects.find((p) => p.id === runnerUp.projectId)!;

    winners.push({
      projectId: runnerUp.projectId,
      projectName: runnerUp.projectName,
      track: runnerUp.track,
      walletAddress: project.walletAddress,
      projectUrl: project.projectUrl,
      finalScore: runnerUp.finalScore,
      category: "RUNNER_UP",
    });
  }

  return winners;
}

/**
 * Analyst Agent - Calculate winners from judge scores
 *
 * Takes an array of projects with judge scores and:
 * 1. Validates all scores are 0-100
 * 2. Calculates weighted averages (5 criteria × 20% each)
 * 3. Ranks projects by final score
 * 4. Identifies winners (1 per track + 2 runners-up)
 */
export async function analystAgent(
  projects: ProjectSubmission[]
): Promise<AnalystResponse> {
  const timestamp = Date.now();

  // Validate inputs
  if (!projects || projects.length === 0) {
    logDecision({
      agent: "Analyst",
      action: "VALIDATION_FAILED",
      status: "ERROR",
      context: { reason: "No projects provided" },
      timestamp,
    });

    return {
      status: "ERROR",
      message: "No projects provided for analysis",
      winners: [],
      breakdown: [],
      timestamp,
    };
  }

  // Validate score ranges
  const validation = validateScores(projects);
  if (!validation.valid) {
    logDecision({
      agent: "Analyst",
      action: "VALIDATION_FAILED",
      status: "ERROR",
      context: { errors: validation.errors },
      timestamp,
    });

    return {
      status: "ERROR",
      message: `Invalid scores detected: ${validation.errors.join("; ")}`,
      winners: [],
      breakdown: [],
      timestamp,
    };
  }

  // Calculate breakdowns and rankings
  const breakdown = calculateBreakdowns(projects);

  logDecision({
    agent: "Analyst",
    action: "SCORES_CALCULATED",
    status: "APPROVED",
    context: {
      projectCount: projects.length,
      topScore: breakdown[0]?.finalScore,
    },
    timestamp,
  });

  // Identify winners
  const winners = identifyWinners(projects, breakdown);

  logDecision({
    agent: "Analyst",
    action: "WINNERS_IDENTIFIED",
    status: "APPROVED",
    context: {
      trackWinners: winners.filter((w) => w.category === "TRACK_WINNER").length,
      runnersUp: winners.filter((w) => w.category === "RUNNER_UP").length,
    },
    timestamp,
  });

  return {
    status: "APPROVED",
    message: `Successfully calculated winners: ${winners.length} total (${winners.filter((w) => w.category === "TRACK_WINNER").length} track winners, ${winners.filter((w) => w.category === "RUNNER_UP").length} runners-up)`,
    winners,
    breakdown,
    timestamp,
  };
}
