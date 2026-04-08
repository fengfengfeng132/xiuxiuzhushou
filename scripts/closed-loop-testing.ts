import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addPlan,
  adoptPet,
  calculateStarBalance,
  checkInHabit,
  createHabit,
  createReward,
  createInitialState,
  currentDateKey,
  deleteReward,
  deletePlansForDate,
  deserializeState,
  evaluateInvariants,
  isPlanScheduledForDate,
  recyclePet,
  redeemReward,
  serializeState,
  updateReward,
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
const FIXED_TOMORROW = currentDateKey("2026-03-21T09:00:00.000Z");

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

function runScopedDeleteScenario(baseState: AppState): { result: ScenarioResult; state: AppState } {
  const addRecurringMutation = addPlan(
    baseState,
    { title: "英语听力循环", subject: "英语", repeatType: "daily", minutes: 20 },
    FIXED_NOW,
  );
  const recurringPlan = addRecurringMutation.nextState.plans.find((plan) => plan.title === "英语听力循环");

  assert(addRecurringMutation.ok, "Recurring plan setup should succeed.");
  assert(Boolean(recurringPlan), "Recurring plan should exist before scoped delete.");

  const scopedDeleteMutation = deletePlansForDate(addRecurringMutation.nextState, [recurringPlan!.id], FIXED_TODAY, FIXED_NOW);
  const scopedPlan = scopedDeleteMutation.nextState.plans.find((plan) => plan.id === recurringPlan!.id);

  assert(scopedDeleteMutation.ok, "Scoped delete should succeed.");
  assert(Boolean(scopedPlan), "Scoped delete must keep recurring plan entity.");
  assert(scopedPlan!.excludedDateKeys.includes(FIXED_TODAY), "Scoped date should be added to excludedDateKeys.");
  assert(!isPlanScheduledForDate(scopedPlan!, FIXED_TODAY), "Recurring plan should be hidden on the scoped date.");
  assert(isPlanScheduledForDate(scopedPlan!, FIXED_TOMORROW), "Recurring plan should remain scheduled on future dates.");

  return {
    result: {
      id: "plan-scoped-delete",
      passed: true,
      details: "Scoped delete excludes only the chosen date and keeps recurring plans for other dates.",
    },
    state: scopedDeleteMutation.nextState,
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

function runPetRecycleScenario(baseState: AppState): { result: ScenarioResult; state: AppState } {
  const fundedState = deserializeState(serializeState(baseState));
  fundedState.starTransactions.push({
    id: "stars_pet_test_fund",
    amount: 80,
    reason: "宠物回收测试补充星星",
    createdAt: FIXED_NOW,
  });

  const beforeAdoptBalance = calculateStarBalance(fundedState);
  const adoptMutation = adoptPet(fundedState, "pet_teddy", FIXED_NOW);
  const afterAdoptBalance = calculateStarBalance(adoptMutation.nextState);
  const recycleMutation = recyclePet(adoptMutation.nextState, "pet_teddy", FIXED_NOW);
  const afterRecycleBalance = calculateStarBalance(recycleMutation.nextState);

  assert(adoptMutation.ok, "Pet adoption should succeed with enough balance.");
  assert(recycleMutation.ok, "Owned pet recycling should succeed.");
  assert(afterAdoptBalance === beforeAdoptBalance - 50, "Pet adoption should deduct 50 stars.");
  assert(afterRecycleBalance === afterAdoptBalance + 25, "Pet recycling should refund 25 stars.");
  assert(recycleMutation.nextState.pets.companions.length === 0, "Recycled pet should be removed from owned companions.");
  assert(recycleMutation.nextState.pets.activePetDefinitionId === null, "Active pet should clear after recycling the only companion.");

  return {
    result: {
      id: "pet-recycle-refund",
      passed: true,
      details: "Pet recycle removes the owned pet and refunds the configured stars.",
    },
    state: recycleMutation.nextState,
  };
}

function runRewardManageScenario(baseState: AppState): { result: ScenarioResult; state: AppState } {
  const createMutation = createReward(
    baseState,
    {
      title: "测试愿望",
      description: "用于验证编辑和删除流程。",
      cost: 11,
      category: "activity",
      icon: "🎯",
      repeatMode: "multi",
      repeatConfig: { maxRedemptions: 3 },
    },
    FIXED_NOW,
  );
  const createdReward = createMutation.nextState.rewards.find((item) => item.title === "测试愿望");

  assert(createMutation.ok, "Wish creation should succeed in reward management scenario.");
  assert(Boolean(createdReward), "Created wish should exist.");

  const updateMutation = updateReward(
    createMutation.nextState,
    createdReward!.id,
    {
      title: "测试愿望-已编辑",
      description: "编辑后描述",
      cost: 13,
      category: "books",
      icon: "📚",
      repeatMode: "cycle",
      repeatConfig: { resetPeriod: "weekly", redemptionsPerPeriod: 2 },
    },
    FIXED_NOW,
  );
  const updatedReward = updateMutation.nextState.rewards.find((item) => item.id === createdReward!.id);

  assert(updateMutation.ok, "Wish update should succeed.");
  assert(Boolean(updatedReward), "Updated wish should exist.");
  assert(updatedReward!.title === "测试愿望-已编辑", "Wish title should be updated.");
  assert(updatedReward!.cost === 13, "Wish cost should be updated.");
  assert(updatedReward!.repeatMode === "cycle", "Wish repeat mode should be updated.");
  assert(updatedReward!.repeatConfig?.redemptionsPerPeriod === 2, "Wish cycle limit should be updated.");

  const deleteMutation = deleteReward(updateMutation.nextState, createdReward!.id, FIXED_NOW);
  assert(deleteMutation.ok, "Wish delete should succeed.");
  assert(!deleteMutation.nextState.rewards.some((item) => item.id === createdReward!.id), "Deleted wish should be removed.");

  return {
    result: {
      id: "reward-manage-edit-delete",
      passed: true,
      details: "Wish edit keeps the same identity and delete removes the wish from list.",
    },
    state: deleteMutation.nextState,
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

    const scopedDeleteScenario = runScopedDeleteScenario(addPlanScenario.state);
    scenarioResults.push(scopedDeleteScenario.result);
    await writeJson("state-after-scoped-delete.json", scopedDeleteScenario.state);

    const habitScenario = runHabitScenario(scopedDeleteScenario.state);
    scenarioResults.push(habitScenario.result);
    await writeJson("state-after-habit.json", habitScenario.state);

    const petRecycleScenario = runPetRecycleScenario(habitScenario.state);
    scenarioResults.push(petRecycleScenario.result);
    await writeJson("state-after-pet-recycle.json", petRecycleScenario.state);

    const rewardManageScenario = runRewardManageScenario(petRecycleScenario.state);
    scenarioResults.push(rewardManageScenario.result);
    await writeJson("state-after-reward-manage.json", rewardManageScenario.state);

    const redeemScenario = runRedeemScenario(rewardManageScenario.state);
    scenarioResults.push(redeemScenario.result);
    await writeJson("state-after-redeem.json", redeemScenario.state);

    scenarioResults.push(runInsufficientBalanceScenario(defaultScenario.state));

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
