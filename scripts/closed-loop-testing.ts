import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addPlan,
  calculateStarBalance,
  checkInHabit,
  createHabit,
  createInitialState,
  currentDateKey,
  deserializeState,
  evaluateInvariants,
  redeemReward,
  serializeState,
  type AppState,
} from "../src/domain/model.js";

interface ScenarioResult {
  id: string;
  passed: boolean;
  details: string;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUTPUT_DIR = path.join(ROOT, "artifacts", "evidence", "latest");
const FIXED_NOW = "2026-03-20T09:00:00.000Z";
const FIXED_TODAY = currentDateKey(FIXED_NOW);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function writeJson(name: string, value: unknown): Promise<void> {
  await writeFile(path.join(OUTPUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function prepareOutputDir(): Promise<void> {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
}

function runDefaultStateScenario(): { result: ScenarioResult; state: AppState } {
  const state = createInitialState(FIXED_NOW);
  const violations = evaluateInvariants(state);

  assert(violations.length === 0, violations.join("; "));
  assert(state.plans.length >= 1, "Default state must include plans.");
  assert(state.rewards.length >= 1, "Default state must include rewards.");

  return {
    result: {
      id: "default-state-valid",
      passed: true,
      details: "Default state satisfies all domain invariants.",
    },
    state,
  };
}

function runAddPlanScenario(baseState: AppState): { result: ScenarioResult; state: AppState } {
  const mutation = addPlan(baseState, { title: "物理公式整理", subject: "物理", minutes: 35 }, FIXED_NOW);
  const roundTrip = deserializeState(serializeState(mutation.nextState));

  assert(mutation.ok, "Add plan should succeed.");
  assert(roundTrip.plans.some((plan) => plan.title === "物理公式整理"), "Added plan is missing after round trip.");

  return {
    result: {
      id: "add-plan-round-trip",
      passed: true,
      details: "Adding a plan survives JSON serialization and deserialization.",
    },
    state: roundTrip,
  };
}

function runHabitScenario(baseState: AppState): { result: ScenarioResult; state: AppState } {
  const createMutation = createHabit(
    baseState,
    {
      name: "早起打卡",
      description: "起床后先整理好书包。",
      frequency: "dailyOnce",
      points: 1,
      approvalRequired: false,
      icon: "☆",
      color: "#4f7cff",
    },
    FIXED_NOW,
  );
  const createdHabit = createMutation.nextState.habits[0];
  const beforeBalance = calculateStarBalance(createMutation.nextState);
  const checkInMutation = checkInHabit(createMutation.nextState, createdHabit.id, FIXED_TODAY, FIXED_NOW);
  const afterBalance = calculateStarBalance(checkInMutation.nextState);
  const updatedHabit = checkInMutation.nextState.habits.find((item) => item.id === createdHabit.id);

  assert(createMutation.ok, "Habit creation should succeed.");
  assert(checkInMutation.ok, "Habit check-in should succeed.");
  assert((updatedHabit?.completions[FIXED_TODAY] ?? 0) === 1, "Habit completion should increment by exactly one.");
  assert(afterBalance === beforeBalance + (updatedHabit?.points ?? 0), "Star balance did not increase by the habit reward.");

  return {
    result: {
      id: "habit-check-in",
      passed: true,
      details: "Habit check-in increments completions and star balance exactly once.",
    },
    state: checkInMutation.nextState,
  };
}

function runRedeemScenario(baseState: AppState): { result: ScenarioResult; state: AppState } {
  const beforeBalance = calculateStarBalance(baseState);
  const mutation = redeemReward(baseState, "reward_movie", FIXED_NOW);
  const afterBalance = calculateStarBalance(mutation.nextState);
  const reward = mutation.nextState.rewards.find((item) => item.id === "reward_movie");

  assert(mutation.ok, "Reward redemption should succeed.");
  assert(afterBalance === beforeBalance - (reward?.cost ?? 0), "Reward redemption did not deduct the expected stars.");
  assert((reward?.redeemedCount ?? 0) === 1, "Reward redeemed count should increment.");

  return {
    result: {
      id: "reward-redeem-success",
      passed: true,
      details: "Reward redemption deducts stars and increments the redemption count.",
    },
    state: mutation.nextState,
  };
}

function runInsufficientBalanceScenario(baseState: AppState): ScenarioResult {
  const mutation = redeemReward(baseState, "reward_stationery", FIXED_NOW);

  assert(!mutation.ok, "High-cost reward should fail with insufficient balance.");
  assert(mutation.message.includes("不足"), "Failure reason should explain insufficient balance.");

  return {
    id: "reward-redeem-blocked",
    passed: true,
    details: "Reward redemption fails cleanly when balance is insufficient.",
  };
}

async function main(): Promise<void> {
  await prepareOutputDir();

  const scenarioResults: ScenarioResult[] = [];

  try {
    const defaultScenario = runDefaultStateScenario();
    scenarioResults.push(defaultScenario.result);
    await writeJson("state-default.json", defaultScenario.state);

    const addPlanScenario = runAddPlanScenario(defaultScenario.state);
    scenarioResults.push(addPlanScenario.result);
    await writeJson("state-after-add-plan.json", addPlanScenario.state);

    const habitScenario = runHabitScenario(addPlanScenario.state);
    scenarioResults.push(habitScenario.result);
    await writeJson("state-after-habit.json", habitScenario.state);

    const redeemScenario = runRedeemScenario(habitScenario.state);
    scenarioResults.push(redeemScenario.result);
    await writeJson("state-after-redeem.json", redeemScenario.state);

    scenarioResults.push(runInsufficientBalanceScenario(redeemScenario.state));

    await writeJson("scenario-results.json", scenarioResults);
    await writeJson("verdict.json", {
      generatedAt: new Date().toISOString(),
      verdict: "pass",
      scenarios: scenarioResults.length,
      evidenceDir: "artifacts/evidence/latest",
    });
    await writeFile(
      path.join(OUTPUT_DIR, "summary.txt"),
      [
        "Closed-loop verification passed.",
        `Scenarios: ${scenarioResults.length}`,
        `Final balance: ${calculateStarBalance(redeemScenario.state)}`,
        `Evidence directory: ${OUTPUT_DIR}`,
      ].join("\n"),
      "utf8",
    );

    console.log(`Closed-loop verification passed with ${scenarioResults.length} scenarios.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failureResults = [...scenarioResults, { id: "failure", passed: false, details: message }];

    await writeJson("scenario-results.json", failureResults);
    await writeJson("verdict.json", {
      generatedAt: new Date().toISOString(),
      verdict: "fail",
      error: message,
    });
    await writeFile(path.join(OUTPUT_DIR, "summary.txt"), `Closed-loop verification failed.\n${message}\n`, "utf8");
    console.error(`Closed-loop verification failed: ${message}`);
    process.exit(1);
  }
}

void main();
