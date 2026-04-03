import {
  DEFAULT_HABIT_TEMPLATES,
  HABIT_FREQUENCY_OPTIONS,
  PET_CATALOG,
  PET_INTERACTION_ACTIONS,
  PET_LEVEL_TIERS,
  VERSION,
} from "./reference-data.js";
import type {
  ActivityEntry,
  AppState,
  CheckInHabitInput,
  CommandResult,
  CompletePlanInput,
  CreateHabitInput,
  CreateRewardInput,
  UpdatePlanInput,
  Habit,
  HabitFrequency,
  HabitFrequencyOption,
  HabitProgress,
  OwnedPet,
  PetDefinition,
  PetInteractionId,
  PetLevelTier,
  PlanCompletionAttachment,
  PlanCompletionMode,
  PlanCompletionRecord,
  PlanRepeatType,
  Profile,
  Reward,
  RewardCategory,
  RewardRedeemSummary,
  RewardRepeatMode,
  RewardResetPeriod,
  StarTransaction,
  StudyPlan,
  Summary,
} from "./types.js";

// Pure state transforms and queries stay here; src/domain/model.ts re-exports this file as the public entry.
function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHabitFrequency(value: unknown): value is HabitFrequency {
  return value === "dailyOnce" || value === "dailyMultiple" || value === "weeklyMultiple";
}

function isRewardCategory(value: unknown): value is RewardCategory {
  return value === "toy" || value === "food" || value === "activity" || value === "electronics" || value === "books" || value === "privilege" || value === "other";
}

function isRewardRepeatMode(value: unknown): value is RewardRepeatMode {
  return value === "single" || value === "multi" || value === "cycle" || value === "forever";
}

function isRewardResetPeriod(value: unknown): value is RewardResetPeriod {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function isPlanRepeatType(value: unknown): value is PlanRepeatType {
  return (
    value === "once" ||
    value === "daily" ||
    value === "weekly-custom" ||
    value === "biweekly-custom" ||
    value === "ebbinghaus" ||
    value === "current-week-cross-day-once" ||
    value === "current-biweekly-cross-day-once" ||
    value === "current-month-cross-day-once" ||
    value === "weekly-cross-day-once" ||
    value === "biweekly-cross-day-once" ||
    value === "monthly-cross-day-once"
  );
}

function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return new Date();
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function createDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekDateKeys(dateKey: string): string[] {
  const selected = parseDateKey(dateKey);
  const mondayOffset = (selected.getDay() + 6) % 7;
  const start = new Date(selected);
  start.setDate(selected.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return createDateKey(current);
  });
}

function getStartDateKey(plan: StudyPlan): string {
  return createDateKey(new Date(plan.createdAt));
}

function getDayDiff(fromDateKey: string, toDateKey: string): number {
  const from = parseDateKey(fromDateKey);
  const to = parseDateKey(toDateKey);
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function getWeekStartDateKey(dateKey: string): string {
  return getWeekDateKeys(dateKey)[0];
}

function getEndOfMonthDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return createDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return createDateKey(date);
}

function isSameMonth(leftDateKey: string, rightDateKey: string): boolean {
  const left = parseDateKey(leftDateKey);
  const right = parseDateKey(rightDateKey);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function getBiweeklyCycleStartDateKey(startDateKey: string, dateKey: string): string {
  const dayDiff = Math.max(0, getDayDiff(startDateKey, dateKey));
  const cycleOffset = Math.floor(dayDiff / 14) * 14;
  return addDays(startDateKey, cycleOffset);
}

function getPlanPeriodRange(plan: StudyPlan, dateKey: string): { startDateKey: string; endDateKey: string } | null {
  const startDateKey = getStartDateKey(plan);

  switch (plan.repeatType) {
    case "current-week-cross-day-once": {
      const periodStart = getWeekStartDateKey(startDateKey);
      return {
        startDateKey: periodStart,
        endDateKey: addDays(periodStart, 6),
      };
    }
    case "current-biweekly-cross-day-once": {
      const periodStart = getBiweeklyCycleStartDateKey(startDateKey, dateKey);
      return {
        startDateKey: periodStart,
        endDateKey: addDays(periodStart, 13),
      };
    }
    case "current-month-cross-day-once":
      return {
        startDateKey,
        endDateKey: getEndOfMonthDateKey(startDateKey),
      };
    case "weekly-cross-day-once": {
      const periodStart = getWeekStartDateKey(dateKey);
      return {
        startDateKey: periodStart,
        endDateKey: addDays(periodStart, 6),
      };
    }
    case "biweekly-cross-day-once": {
      const periodStart = getBiweeklyCycleStartDateKey(startDateKey, dateKey);
      return {
        startDateKey: periodStart,
        endDateKey: addDays(periodStart, 13),
      };
    }
    case "monthly-cross-day-once": {
      const currentStart = parseDateKey(dateKey);
      const periodStart = createDateKey(new Date(currentStart.getFullYear(), currentStart.getMonth(), 1));
      return {
        startDateKey: periodStart,
        endDateKey: getEndOfMonthDateKey(dateKey),
      };
    }
    default:
      return null;
  }
}

function getEbbinghausOffsets(): number[] {
  return [0, 1, 2, 4, 7, 15, 30];
}

export function isPlanScheduledForDate(plan: StudyPlan, dateKey: string): boolean {
  const startDateKey = getStartDateKey(plan);
  if (dateKey < startDateKey || plan.excludedDateKeys.includes(dateKey)) {
    return false;
  }

  const dayDiff = getDayDiff(startDateKey, dateKey);
  if (dayDiff < 0) {
    return false;
  }

  switch (plan.repeatType) {
    case "once":
      return dateKey === startDateKey;
    case "daily":
      return true;
    case "weekly-custom":
      return dayDiff % 7 === 0;
    case "biweekly-custom":
      return dayDiff % 14 === 0;
    case "ebbinghaus":
      return getEbbinghausOffsets().includes(dayDiff);
    case "current-week-cross-day-once": {
      const range = getPlanPeriodRange(plan, dateKey);
      return range !== null && dateKey >= range.startDateKey && dateKey <= range.endDateKey;
    }
    case "current-biweekly-cross-day-once": {
      const range = getPlanPeriodRange(plan, dateKey);
      return range !== null && dateKey >= range.startDateKey && dateKey <= range.endDateKey;
    }
    case "current-month-cross-day-once": {
      const range = getPlanPeriodRange(plan, dateKey);
      return range !== null && dateKey >= range.startDateKey && dateKey <= range.endDateKey;
    }
    case "weekly-cross-day-once":
      return true;
    case "biweekly-cross-day-once":
      return true;
    case "monthly-cross-day-once":
      return isSameMonth(dateKey, startDateKey) || dateKey >= startDateKey;
    default:
      return false;
  }
}

export function isPlanCompletedForDate(plan: StudyPlan, dateKey: string): boolean {
  if (!isPlanScheduledForDate(plan, dateKey)) {
    return false;
  }

  if (plan.repeatType === "once") {
    return plan.status === "done" && plan.completedAt !== null && currentDateKey(plan.completedAt) === dateKey;
  }

  const range = getPlanPeriodRange(plan, dateKey);
  if (range) {
    return plan.completionRecords.some((record) => {
      const recordDateKey = currentDateKey(record.completedAt);
      return recordDateKey >= range.startDateKey && recordDateKey <= range.endDateKey;
    });
  }

  return plan.completionRecords.some((record) => currentDateKey(record.completedAt) === dateKey);
}

function nextEntityId(state: AppState, prefix: string): string {
  const id = `${prefix}_${state.meta.nextId}`;
  state.meta.nextId += 1;
  return id;
}

function pushActivity(state: AppState, kind: ActivityEntry["kind"], message: string, createdAt: string): void {
  state.activity.unshift({
    id: nextEntityId(state, "activity"),
    kind,
    message,
    createdAt,
  });
}

function pushTransaction(state: AppState, amount: number, reason: string, createdAt: string): void {
  state.starTransactions.push({
    id: nextEntityId(state, "stars"),
    amount,
    reason,
    createdAt,
  });
}

function getNumericSuffix(id: string): number {
  const match = id.match(/_(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function inferNextId(state: AppState): number {
  const entityIds = [
    ...state.plans.map((item) => item.id),
    ...state.habits.map((item) => item.id),
    ...state.rewards.map((item) => item.id),
    ...state.starTransactions.map((item) => item.id),
    ...state.activity.map((item) => item.id),
  ];

  const maxSuffix = entityIds.reduce((max, id) => Math.max(max, getNumericSuffix(id)), 0);
  return maxSuffix + 1;
}

function findPetDefinition(definitionId: string): PetDefinition | undefined {
  return PET_CATALOG.find((definition) => definition.id === definitionId);
}

function clampPetNeed(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizePlanCompletionAttachment(value: unknown): PlanCompletionAttachment | null {
  if (!isObject(value)) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const type = typeof value.type === "string" ? value.type : "";
  const size = Number(value.size);

  if (!name || !Number.isFinite(size) || size < 0) {
    return null;
  }

  return {
    name,
    type,
    size: Math.round(size),
  };
}

function normalizePlanCompletionRecord(value: unknown, fallbackCompletedAt: string, fallbackDurationSeconds: number): PlanCompletionRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : "";
  const mode: PlanCompletionMode = value.mode === "actual" ? "actual" : "duration";
  const rawDurationSeconds = Number(value.durationSeconds);
  const durationSeconds = Number.isFinite(rawDurationSeconds) ? rawDurationSeconds : fallbackDurationSeconds;
  const note = typeof value.note === "string" ? value.note : "";
  const completedAt = typeof value.completedAt === "string" ? value.completedAt : fallbackCompletedAt;
  const attachments = Array.isArray(value.attachments)
    ? value.attachments.map((item) => normalizePlanCompletionAttachment(item)).filter((item): item is PlanCompletionAttachment => item !== null).slice(0, 15)
    : [];

  if (!id || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return null;
  }

  return {
    id,
    mode,
    durationSeconds: Math.round(durationSeconds),
    note,
    attachments,
    completedAt,
  };
}

function normalizePlan(value: unknown, fallbackTime: string): StudyPlan | null {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const subject = typeof value.subject === "string" ? value.subject.trim() : "";
  const repeatType: PlanRepeatType = isPlanRepeatType(value.repeatType) ? value.repeatType : "once";
  const minutes = Number(value.minutes);
  const stars = Number(value.stars);
  const status = value.status === "done" ? "done" : "pending";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : fallbackTime;
  const completedAt = typeof value.completedAt === "string" ? value.completedAt : null;
  const fallbackDurationSeconds = Math.max(60, Math.round(minutes) * 60);
  const completionRecords = Array.isArray(value.completionRecords)
    ? value.completionRecords
        .map((record) => normalizePlanCompletionRecord(record, completedAt ?? fallbackTime, fallbackDurationSeconds))
        .filter((record): record is PlanCompletionRecord => record !== null)
    : completedAt
      ? [
          {
            id: `${id}_completion_legacy`,
            mode: "duration" as const,
            durationSeconds: fallbackDurationSeconds,
            note: "",
            attachments: [],
            completedAt,
          },
        ]
      : [];

  if (!id || !title || !subject || !Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(stars) || stars <= 0) {
    return null;
  }

  return {
    id,
    title,
    subject,
    repeatType,
    minutes: Math.round(minutes),
    stars: Math.round(stars),
    status,
    createdAt,
    completedAt,
    excludedDateKeys: Array.isArray(value.excludedDateKeys)
      ? value.excludedDateKeys.filter((dateKey): dateKey is string => typeof dateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateKey))
      : [],
    completionRecords,
  };
}

function normalizeHabit(value: unknown, profileId: string, fallbackTime: string): Habit | null {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : "";
  const nameCandidate = typeof value.name === "string" ? value.name : typeof value.title === "string" ? value.title : "";
  const name = nameCandidate.trim();
  const description = typeof value.description === "string" ? value.description : "";
  const frequency = isHabitFrequency(value.frequency)
    ? value.frequency
    : Number(value.targetPerDay) > 1
      ? "dailyMultiple"
      : "dailyOnce";
  const frequencyOption = getHabitFrequencyOption(frequency);
  const targetCandidate =
    typeof value.targetCount === "number"
      ? value.targetCount
      : typeof value.targetPerDay === "number"
        ? value.targetPerDay
        : frequencyOption.targetCount;
  const pointsCandidate =
    typeof value.points === "number"
      ? value.points
      : typeof value.stars === "number"
        ? value.stars
        : 1;
  const icon = typeof value.icon === "string" && value.icon ? value.icon : "☆";
  const color = typeof value.color === "string" && value.color ? value.color : "#4f7cff";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : fallbackTime;
  const status = value.status === "archived" ? "archived" : "active";
  const approvalRequired = value.approvalRequired === true;
  const completions = isObject(value.completions)
    ? Object.fromEntries(
        Object.entries(value.completions)
          .map(([key, count]) => [key, Math.max(0, Math.round(Number(count)))])
          .filter(([, count]) => Number.isFinite(count)),
      )
    : {};

  if (!id || !name || !Number.isFinite(targetCandidate) || targetCandidate <= 0 || !Number.isFinite(pointsCandidate)) {
    return null;
  }

  return {
    id,
    profileId: typeof value.profileId === "string" && value.profileId ? value.profileId : profileId,
    name,
    description,
    frequency,
    targetCount: Math.max(1, Math.round(targetCandidate)),
    points: Math.max(-100, Math.min(100, Math.round(pointsCandidate))),
    approvalRequired,
    icon,
    color,
    createdAt,
    status,
    completions,
  };
}

function inferRewardCategoryFromTitle(title: string): RewardCategory {
  if (title.includes("电影") || title.includes("游戏") || title.includes("娱乐")) {
    return "activity";
  }

  if (title.includes("文具") || title.includes("书") || title.includes("阅读") || title.includes("学习")) {
    return "books";
  }

  if (title.includes("零食") || title.includes("蛋糕") || title.includes("奶茶") || title.includes("美食")) {
    return "food";
  }

  if (title.includes("手机") || title.includes("电脑") || title.includes("耳机") || title.includes("相机")) {
    return "electronics";
  }

  if (title.includes("特权") || title.includes("奖励") || title.includes("免作业")) {
    return "privilege";
  }

  return "other";
}

function inferRewardIconFromTitle(title: string): string {
  if (title.includes("电影")) {
    return "🎬";
  }
  if (title.includes("文具")) {
    return "✏️";
  }
  if (title.includes("游戏")) {
    return "🎮";
  }
  if (title.includes("书") || title.includes("阅读")) {
    return "📚";
  }
  if (title.includes("零食") || title.includes("蛋糕") || title.includes("奶茶")) {
    return "🍰";
  }
  return "🎁";
}

function normalizeRewardRepeatConfig(value: unknown, repeatMode: RewardRepeatMode): Reward["repeatConfig"] {
  if (!isObject(value)) {
    return repeatMode === "multi" || repeatMode === "cycle"
      ? {
          maxRedemptions: repeatMode === "multi" ? 1 : null,
          resetPeriod: repeatMode === "cycle" ? "weekly" : null,
          redemptionsPerPeriod: repeatMode === "cycle" ? 1 : null,
        }
      : null;
  }

  const maxRedemptions = Number(value.maxRedemptions);
  const redemptionsPerPeriod = Number(value.redemptionsPerPeriod);
  const resetPeriod = isRewardResetPeriod(value.resetPeriod) ? value.resetPeriod : null;

  if (repeatMode === "multi") {
    return {
      maxRedemptions: Number.isFinite(maxRedemptions) && maxRedemptions > 0 ? Math.round(maxRedemptions) : 1,
      resetPeriod: null,
      redemptionsPerPeriod: null,
    };
  }

  if (repeatMode === "cycle") {
    return {
      maxRedemptions: null,
      resetPeriod: resetPeriod ?? "weekly",
      redemptionsPerPeriod: Number.isFinite(redemptionsPerPeriod) && redemptionsPerPeriod > 0 ? Math.round(redemptionsPerPeriod) : 1,
    };
  }

  return null;
}

function normalizeReward(value: unknown): Reward | null {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const description = typeof value.description === "string" ? value.description.slice(0, 200) : "";
  const cost = Number(value.cost);
  const category = isRewardCategory(value.category) ? value.category : inferRewardCategoryFromTitle(title);
  const icon = typeof value.icon === "string" && value.icon ? value.icon : inferRewardIconFromTitle(title);
  const customImage = typeof value.customImage === "string" && value.customImage ? value.customImage : null;
  const repeatMode: RewardRepeatMode = isRewardRepeatMode(value.repeatMode) ? value.repeatMode : "forever";
  const repeatConfig = normalizeRewardRepeatConfig(value.repeatConfig, repeatMode);
  const redeemedCount = Number(value.redeemedCount);
  const redemptionHistory = Array.isArray(value.redemptionHistory)
    ? value.redemptionHistory.filter((entry): entry is string => typeof entry === "string")
    : [];

  if (!id || !title || !Number.isFinite(cost) || cost <= 0 || !Number.isFinite(redeemedCount) || redeemedCount < 0) {
    return null;
  }

  return {
    id,
    title,
    description,
    cost: Math.round(cost),
    category,
    icon,
    customImage,
    repeatMode,
    repeatConfig,
    redeemedCount: Math.round(redeemedCount),
    redemptionHistory,
  };
}

function normalizeOwnedPet(value: unknown, profileId: string, fallbackTime: string): OwnedPet | null {
  if (!isObject(value)) {
    return null;
  }

  const definitionId = typeof value.definitionId === "string" ? value.definitionId : typeof value.id === "string" ? value.id : "";
  if (!definitionId || !findPetDefinition(definitionId)) {
    return null;
  }

  const intimacy = Number(value.intimacy);
  const satiety = Number(value.satiety);
  const cleanliness = Number(value.cleanliness);
  const mood = Number(value.mood);
  const lastInteractionId =
    value.lastInteractionId === "feed" || value.lastInteractionId === "bathe" || value.lastInteractionId === "park" || value.lastInteractionId === "sleep"
      ? value.lastInteractionId
      : null;

  return {
    definitionId,
    profileId: typeof value.profileId === "string" && value.profileId ? value.profileId : profileId,
    adoptedAt: typeof value.adoptedAt === "string" ? value.adoptedAt : fallbackTime,
    intimacy: Number.isFinite(intimacy) ? Math.max(0, Math.round(intimacy)) : 55,
    satiety: Number.isFinite(satiety) ? clampPetNeed(satiety) : 90,
    cleanliness: Number.isFinite(cleanliness) ? clampPetNeed(cleanliness) : 92,
    mood: Number.isFinite(mood) ? clampPetNeed(mood) : 94,
    lastInteractionId,
    lastInteractionAt: typeof value.lastInteractionAt === "string" ? value.lastInteractionAt : null,
  };
}

function normalizeTransaction(value: unknown, fallbackTime: string): StarTransaction | null {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : "";
  const amount = Number(value.amount);
  const reason = typeof value.reason === "string" ? value.reason : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : fallbackTime;

  if (!id || !reason || !Number.isFinite(amount)) {
    return null;
  }

  return {
    id,
    amount: Math.round(amount),
    reason,
    createdAt,
  };
}

function normalizeActivity(value: unknown, fallbackTime: string): ActivityEntry | null {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : "";
  const kind =
    value.kind === "plan-added" ||
    value.kind === "plan-completed" ||
    value.kind === "habit-created" ||
    value.kind === "habit-checked" ||
    value.kind === "reward-redeemed" ||
    value.kind === "pet-adopted" ||
    value.kind === "pet-switched" ||
    value.kind === "pet-interacted"
      ? value.kind
      : "system";
  const message = typeof value.message === "string" ? value.message : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : fallbackTime;

  if (!id || !message) {
    return null;
  }

  return {
    id,
    kind,
    message,
    createdAt,
  };
}

function normalizeState(value: unknown, fallbackTime: string = new Date().toISOString()): AppState {
  const defaults = createInitialState(fallbackTime);
  if (!isObject(value)) {
    return defaults;
  }

  const profileValue = isObject(value.profile) ? value.profile : {};
  const profile: Profile = {
    id: typeof profileValue.id === "string" && profileValue.id ? profileValue.id : defaults.profile.id,
    name: typeof profileValue.name === "string" && profileValue.name ? profileValue.name : defaults.profile.name,
    role: "student",
  };

  const plans = Array.isArray(value.plans)
    ? value.plans.map((plan) => normalizePlan(plan, fallbackTime)).filter((plan): plan is StudyPlan => plan !== null)
    : defaults.plans;

  const habits = Array.isArray(value.habits)
    ? value.habits.map((habit) => normalizeHabit(habit, profile.id, fallbackTime)).filter((habit): habit is Habit => habit !== null)
    : defaults.habits;

  const rewards = Array.isArray(value.rewards)
    ? value.rewards.map((reward) => normalizeReward(reward)).filter((reward): reward is Reward => reward !== null)
    : defaults.rewards;

  const petsValue = isObject(value.pets) ? value.pets : {};
  const companions = Array.isArray(petsValue.companions)
    ? petsValue.companions
        .map((companion) => normalizeOwnedPet(companion, profile.id, fallbackTime))
        .filter((companion): companion is OwnedPet => companion !== null)
    : defaults.pets.companions;
  const activePetDefinitionId =
    typeof petsValue.activePetDefinitionId === "string" &&
    companions.some((companion) => companion.definitionId === petsValue.activePetDefinitionId)
      ? petsValue.activePetDefinitionId
      : companions[0]?.definitionId ?? null;

  const starTransactions = Array.isArray(value.starTransactions)
    ? value.starTransactions
        .map((transaction) => normalizeTransaction(transaction, fallbackTime))
        .filter((transaction): transaction is StarTransaction => transaction !== null)
    : defaults.starTransactions;

  const activity = Array.isArray(value.activity)
    ? value.activity.map((entry) => normalizeActivity(entry, fallbackTime)).filter((entry): entry is ActivityEntry => entry !== null)
    : defaults.activity;

  const metaValue = isObject(value.meta) ? value.meta : {};
  const candidateNextId = Number(metaValue.nextId);
  const normalized: AppState = {
    version: typeof value.version === "string" && value.version ? value.version : VERSION,
    profile,
    plans,
    habits,
    rewards,
    pets: {
      activePetDefinitionId,
      companions,
    },
    starTransactions,
    activity,
    meta: {
      nextId: Number.isFinite(candidateNextId) && candidateNextId > 0 ? Math.round(candidateNextId) : 1,
      lastUpdatedAt: typeof metaValue.lastUpdatedAt === "string" ? metaValue.lastUpdatedAt : fallbackTime,
    },
  };

  normalized.version = VERSION;
  normalized.meta.nextId = Math.max(normalized.meta.nextId, inferNextId(normalized));
  return normalized;
}

function insertHabit(state: AppState, input: CreateHabitInput, now: string): Habit {
  const option = getHabitFrequencyOption(input.frequency);
  const habit: Habit = {
    id: nextEntityId(state, "habit"),
    profileId: state.profile.id,
    name: input.name.trim(),
    description: input.description.trim(),
    frequency: input.frequency,
    targetCount: option.targetCount,
    points: Math.round(input.points),
    approvalRequired: input.approvalRequired,
    icon: input.icon.trim(),
    color: input.color.trim(),
    createdAt: now,
    status: "active",
    completions: {},
  };

  state.habits.unshift(habit);
  return habit;
}

function createOwnedPet(definitionId: string, profileId: string, now: string): OwnedPet {
  return {
    definitionId,
    profileId,
    adoptedAt: now,
    intimacy: 55,
    satiety: 90,
    cleanliness: 92,
    mood: 94,
    lastInteractionId: null,
    lastInteractionAt: null,
  };
}

function formatPoints(points: number): string {
  if (points > 0) {
    return `+${points}`;
  }

  return `${points}`;
}

function isSameRewardResetPeriod(dateKey: string, referenceDateKey: string, period: RewardResetPeriod): boolean {
  if (period === "daily") {
    return dateKey === referenceDateKey;
  }

  if (period === "monthly") {
    return dateKey.slice(0, 7) === referenceDateKey.slice(0, 7);
  }

  return getWeekDateKeys(referenceDateKey).includes(dateKey);
}

function getRewardCycleRedeemCount(reward: Reward, now: string): number {
  const period = reward.repeatConfig?.resetPeriod;
  if (reward.repeatMode !== "cycle" || !period) {
    return 0;
  }

  const referenceDateKey = currentDateKey(now);
  return reward.redemptionHistory.reduce((total, redeemedAt) => {
    const dateKey = currentDateKey(redeemedAt);
    return isSameRewardResetPeriod(dateKey, referenceDateKey, period) ? total + 1 : total;
  }, 0);
}

export function getRewardRedeemSummary(reward: Reward, balance: number, now: string = new Date().toISOString()): RewardRedeemSummary {
  const shortfall = Math.max(0, reward.cost - balance);

  if (shortfall > 0) {
    return {
      canRedeem: false,
      shortfall,
      remainingLabel: "星星不足",
      blockedReason: `还差 ${shortfall} 星`,
    };
  }

  if (reward.repeatMode === "single") {
    const canRedeem = reward.redeemedCount === 0;
    return {
      canRedeem,
      shortfall: 0,
      remainingLabel: canRedeem ? "兑换后消失" : "已兑换完毕",
      blockedReason: canRedeem ? null : "单次愿望已兑换",
    };
  }

  if (reward.repeatMode === "multi") {
    const maxRedemptions = reward.repeatConfig?.maxRedemptions ?? 1;
    const remaining = Math.max(0, maxRedemptions - reward.redeemedCount);
    return {
      canRedeem: remaining > 0,
      shortfall: 0,
      remainingLabel: `还能兑换 ${remaining} 次`,
      blockedReason: remaining > 0 ? null : "多次兑换次数已用完",
    };
  }

  if (reward.repeatMode === "cycle") {
    const cycleLimit = reward.repeatConfig?.redemptionsPerPeriod ?? 1;
    const usedInPeriod = getRewardCycleRedeemCount(reward, now);
    const remaining = Math.max(0, cycleLimit - usedInPeriod);
    return {
      canRedeem: remaining > 0,
      shortfall: 0,
      remainingLabel: `本周期还可兑换 ${remaining} 次`,
      blockedReason: remaining > 0 ? null : "本周期兑换次数已用完",
    };
  }

  return {
    canRedeem: true,
    shortfall: 0,
    remainingLabel: "无限次兑换",
    blockedReason: null,
  };
}

export function getHabitFrequencyOption(frequency: HabitFrequency): HabitFrequencyOption {
  const match = HABIT_FREQUENCY_OPTIONS.find((option) => option.value === frequency);
  return match ?? HABIT_FREQUENCY_OPTIONS[0];
}

export function getHabitProgress(habit: Habit, dateKey: string): HabitProgress {
  const option = getHabitFrequencyOption(habit.frequency);
  if (option.period === "day") {
    const count = habit.completions[dateKey] ?? 0;
    return {
      count,
      limit: option.value === "dailyOnce" ? 1 : habit.targetCount,
      remaining: Math.max(0, (option.value === "dailyOnce" ? 1 : habit.targetCount) - count),
      period: "day",
    };
  }

  const weekKeys = getWeekDateKeys(dateKey);
  const count = weekKeys.reduce((total, key) => total + (habit.completions[key] ?? 0), 0);
  return {
    count,
    limit: habit.targetCount,
    remaining: Math.max(0, habit.targetCount - count),
    period: "week",
  };
}

export function getPetDefinition(definitionId: string): PetDefinition | null {
  return findPetDefinition(definitionId) ?? null;
}

export function getActivePetCompanion(state: AppState): OwnedPet | null {
  if (!state.pets.activePetDefinitionId) {
    return null;
  }

  return state.pets.companions.find((companion) => companion.definitionId === state.pets.activePetDefinitionId) ?? null;
}

export function getPetLevelTier(intimacy: number): PetLevelTier {
  return PET_LEVEL_TIERS.reduce((current, tier) => (intimacy >= tier.threshold ? tier : current), PET_LEVEL_TIERS[0]);
}

export function calculateStarBalance(state: AppState): number {
  return state.starTransactions.reduce((total, transaction) => total + transaction.amount, 0);
}

export function currentDateKey(now: string = new Date().toISOString()): string {
  const date = new Date(now);
  return createDateKey(date);
}

export function createInitialState(now: string = new Date().toISOString()): AppState {
  const baseState: AppState = {
    version: VERSION,
    profile: {
      id: "profile_primary",
      name: "真真",
      role: "student",
    },
    plans: [
      {
        id: "plan_math_review",
        repeatType: "once",
        title: "数学错题复盘",
        subject: "数学",
        minutes: 25,
        stars: 3,
        status: "pending",
        createdAt: now,
        completedAt: null,
        excludedDateKeys: [],
        completionRecords: [],
      },
      {
        id: "plan_english_reading",
        repeatType: "once",
        title: "英语晨读",
        subject: "英语",
        minutes: 20,
        stars: 2,
        status: "pending",
        createdAt: now,
        completedAt: null,
        excludedDateKeys: [],
        completionRecords: [],
      },
    ],
    habits: [],
    rewards: [
      {
        id: "reward_movie",
        description: "",
        title: "周末电影夜",
        cost: 10,
        category: "activity",
        icon: "🎬",
        customImage: null,
        repeatMode: "forever",
        repeatConfig: null,
        redeemedCount: 0,
        redemptionHistory: [],
      },
      {
        id: "reward_stationery",
        description: "",
        title: "新文具",
        cost: 18,
        category: "books",
        icon: "✏️",
        customImage: null,
        repeatMode: "forever",
        repeatConfig: null,
        redeemedCount: 0,
        redemptionHistory: [],
      },
    ],
    pets: {
      activePetDefinitionId: null,
      companions: [],
    },
    starTransactions: [
      {
        id: "stars_seed",
        amount: 12,
        reason: "初始星星余额",
        createdAt: now,
      },
    ],
    activity: [
      {
        id: "activity_seed",
        kind: "system",
        message: "系统已初始化本地数据。",
        createdAt: now,
      },
    ],
    meta: {
      nextId: 1,
      lastUpdatedAt: now,
    },
  };

  baseState.meta.nextId = inferNextId(baseState);
  return baseState;
}

export function addPlan(
  state: AppState,
  input: { title: string; subject: string; repeatType?: PlanRepeatType; minutes: number; stars?: number },
  now: string = new Date().toISOString(),
): CommandResult {
  const title = input.title.trim();
  const subject = input.subject.trim();
  const repeatType = input.repeatType ?? "once";
  const minutes = Math.max(5, Math.round(input.minutes));
  const stars = input.stars === undefined ? Math.max(1, Math.round(minutes / 10)) : Math.round(Number(input.stars));

  if (!title || !subject || !isPlanRepeatType(repeatType) || !Number.isFinite(minutes) || !Number.isFinite(stars) || stars <= 0) {
    return {
      ok: false,
      nextState: state,
      message: "请填写完整且有效的计划信息。",
    };
  }

  const nextState = cloneState(state);
  nextState.plans.unshift({
    id: nextEntityId(nextState, "plan"),
    title,
    subject,
    repeatType,
    minutes,
    stars,
    status: "pending",
    createdAt: now,
    completedAt: null,
    excludedDateKeys: [],
    completionRecords: [],
  });
  nextState.meta.lastUpdatedAt = now;
  pushActivity(nextState, "plan-added", `新增计划：${title}（${subject}）`, now);

  return {
    ok: true,
    nextState,
    message: `已添加计划：${title}`,
  };
}

export function updatePlan(state: AppState, planId: string, input: UpdatePlanInput, now: string = new Date().toISOString()): CommandResult {
  const nextState = cloneState(state);
  const plan = nextState.plans.find((item) => item.id === planId);

  if (!plan) {
    return {
      ok: false,
      nextState: state,
      message: "计划不存在。",
    };
  }

  const title = input.title.trim();
  const subject = input.subject.trim();
  const repeatType = input.repeatType;
  const minutes = Math.max(5, Math.round(input.minutes));
  const stars = input.stars === undefined ? Math.max(1, Math.round(minutes / 10)) : Math.round(Number(input.stars));

  if (!title || !subject || !isPlanRepeatType(repeatType) || !Number.isFinite(minutes) || !Number.isFinite(stars) || stars <= 0) {
    return {
      ok: false,
      nextState: state,
      message: "请填写完整且有效的计划信息。",
    };
  }

  plan.title = title;
  plan.subject = subject;
  plan.repeatType = repeatType;
  plan.minutes = minutes;
  plan.stars = stars;
  if (typeof input.createdAt === "string" && input.createdAt) {
    plan.createdAt = input.createdAt;
  }
  nextState.meta.lastUpdatedAt = now;
  pushActivity(nextState, "system", `编辑计划：${title}`, now);

  return {
    ok: true,
    nextState,
    message: `已更新计划：${title}`,
  };
}

export function createReward(state: AppState, input: CreateRewardInput, now: string = new Date().toISOString()): CommandResult {
  const title = input.title.trim();
  const description = typeof input.description === "string" ? input.description.trim().slice(0, 200) : "";
  const cost = Math.round(Number(input.cost));
  const icon = input.icon.trim();

  if (!title) {
    return {
      ok: false,
      nextState: state,
      message: "愿望名称不能为空。",
    };
  }

  if (!isRewardCategory(input.category)) {
    return {
      ok: false,
      nextState: state,
      message: "请选择有效的愿望分类。",
    };
  }

  if (!isRewardRepeatMode(input.repeatMode)) {
    return {
      ok: false,
      nextState: state,
      message: "请选择有效的兑换模式。",
    };
  }

  if (!Number.isFinite(cost) || cost <= 0) {
    return {
      ok: false,
      nextState: state,
      message: "需要多少星星必须是大于 0 的整数。",
    };
  }

  if (!icon) {
    return {
      ok: false,
      nextState: state,
      message: "请先选择一个愿望图标。",
    };
  }

  const repeatConfig = normalizeRewardRepeatConfig(input.repeatConfig ?? {}, input.repeatMode);
  if (input.repeatMode === "multi" && !repeatConfig?.maxRedemptions) {
    return {
      ok: false,
      nextState: state,
      message: "多次兑换需要设置有效的兑换次数。",
    };
  }

  if (input.repeatMode === "cycle" && (!repeatConfig?.resetPeriod || !repeatConfig.redemptionsPerPeriod)) {
    return {
      ok: false,
      nextState: state,
      message: "循环愿望需要设置重置周期和每周期兑换次数。",
    };
  }

  const nextState = cloneState(state);
  nextState.rewards.unshift({
    id: nextEntityId(nextState, "reward"),
    title,
    description,
    cost,
    category: input.category,
    icon,
    customImage: typeof input.customImage === "string" && input.customImage ? input.customImage : null,
    repeatMode: input.repeatMode,
    repeatConfig,
    redeemedCount: 0,
    redemptionHistory: [],
  });
  nextState.meta.lastUpdatedAt = now;
  pushActivity(nextState, "system", `新增愿望：${title}，需要 ${cost} 星`, now);

  return {
    ok: true,
    nextState,
    message: `已添加愿望：${title}`,
  };
}

export function deletePlans(state: AppState, planIds: string[], now: string = new Date().toISOString()): CommandResult {
  const targetIds = [...new Set(planIds.map((planId) => planId.trim()).filter(Boolean))];

  if (targetIds.length === 0) {
    return {
      ok: false,
      nextState: state,
      message: "请先选择要删除的计划。",
    };
  }

  const deletablePlans = state.plans.filter((plan) => targetIds.includes(plan.id));
  if (deletablePlans.length === 0) {
    return {
      ok: false,
      nextState: state,
      message: "没有找到可删除的计划。",
    };
  }

  const nextState = cloneState(state);
  nextState.plans = nextState.plans.filter((plan) => !targetIds.includes(plan.id));
  nextState.meta.lastUpdatedAt = now;
  pushActivity(nextState, "system", `删除计划：${deletablePlans.map((plan) => plan.title).join("、")}`, now);

  return {
    ok: true,
    nextState,
    message: `已删除 ${deletablePlans.length} 个计划。`,
  };
}

export function createHabit(
  state: AppState,
  input: CreateHabitInput,
  now: string = new Date().toISOString(),
): CommandResult {
  const name = input.name.trim();
  const description = input.description.trim();
  const points = Math.round(Number(input.points));
  const icon = input.icon.trim();
  const color = input.color.trim();

  if (!name) {
    return {
      ok: false,
      nextState: state,
      message: "习惯名称不能为空。",
    };
  }

  if (!isHabitFrequency(input.frequency)) {
    return {
      ok: false,
      nextState: state,
      message: "请选择有效的习惯类型。",
    };
  }

  if (!Number.isFinite(points) || points < -100 || points > 100) {
    return {
      ok: false,
      nextState: state,
      message: "积分需要是 -100 到 100 之间的整数。",
    };
  }

  if (!icon || !color) {
    return {
      ok: false,
      nextState: state,
      message: "请先选择图标和颜色。",
    };
  }

  if (state.habits.some((habit) => habit.status === "active" && habit.name === name)) {
    return {
      ok: false,
      nextState: state,
      message: "已经存在同名习惯。",
    };
  }

  const nextState = cloneState(state);
  const habit = insertHabit(
    nextState,
    {
      name,
      description,
      frequency: input.frequency,
      points,
      approvalRequired: input.approvalRequired,
      icon,
      color,
    },
    now,
  );
  nextState.meta.lastUpdatedAt = now;
  pushActivity(nextState, "habit-created", `新建习惯：${habit.name}`, now);

  return {
    ok: true,
    nextState,
    message: `已创建习惯：${habit.name}`,
  };
}

export function addDefaultHabits(state: AppState, now: string = new Date().toISOString()): CommandResult {
  const nextState = cloneState(state);
  let addedCount = 0;

  for (const template of DEFAULT_HABIT_TEMPLATES) {
    if (nextState.habits.some((habit) => habit.status === "active" && habit.name === template.name)) {
      continue;
    }

    const habit = insertHabit(nextState, template, now);
    pushActivity(nextState, "habit-created", `添加默认习惯：${habit.name}`, now);
    addedCount += 1;
  }

  if (addedCount === 0) {
    return {
      ok: false,
      nextState: state,
      message: "默认习惯已经全部存在了。",
    };
  }

  nextState.meta.lastUpdatedAt = now;
  return {
    ok: true,
    nextState,
    message: `已添加 ${addedCount} 个默认习惯。`,
  };
}

export function adoptPet(state: AppState, definitionId: string, now: string = new Date().toISOString()): CommandResult {
  const definition = findPetDefinition(definitionId);
  if (!definition) {
    return {
      ok: false,
      nextState: state,
      message: "未找到这只电子宠物。",
    };
  }

  const nextState = cloneState(state);
  const existingCompanion = nextState.pets.companions.find((companion) => companion.definitionId === definitionId);

  if (existingCompanion) {
    if (nextState.pets.activePetDefinitionId === definitionId) {
      return {
        ok: false,
        nextState: state,
        message: `${definition.name} 已经在陪伴你了。`,
      };
    }

    nextState.pets.activePetDefinitionId = definitionId;
    nextState.meta.lastUpdatedAt = now;
    pushActivity(nextState, "pet-switched", `切换电子宠物：${definition.name}`, now);
    return {
      ok: true,
      nextState,
      message: `已切换到 ${definition.name}。`,
    };
  }

  const balance = calculateStarBalance(nextState);
  if (balance < definition.cost) {
    return {
      ok: false,
      nextState: state,
      message: `星星不足，还差 ${definition.cost - balance} 颗才能领养 ${definition.name}。`,
    };
  }

  nextState.pets.companions.unshift(createOwnedPet(definitionId, nextState.profile.id, now));
  nextState.pets.activePetDefinitionId = definitionId;
  nextState.meta.lastUpdatedAt = now;
  pushTransaction(nextState, -definition.cost, `领养电子宠物：${definition.name}`, now);
  pushActivity(nextState, "pet-adopted", `领养电子宠物：${definition.name}，消耗 ${definition.cost} 星星`, now);

  return {
    ok: true,
    nextState,
    message: `已领养 ${definition.name}，消耗 ${definition.cost} 星星。`,
  };
}

export function switchActivePet(state: AppState, definitionId: string, now: string = new Date().toISOString()): CommandResult {
  const definition = findPetDefinition(definitionId);
  if (!definition) {
    return {
      ok: false,
      nextState: state,
      message: "未找到这只电子宠物。",
    };
  }

  if (state.pets.activePetDefinitionId === definitionId) {
    return {
      ok: false,
      nextState: state,
      message: `${definition.name} 已经是当前陪伴宠物。`,
    };
  }

  if (!state.pets.companions.some((companion) => companion.definitionId === definitionId)) {
    return {
      ok: false,
      nextState: state,
      message: `请先领养 ${definition.name}。`,
    };
  }

  const nextState = cloneState(state);
  nextState.pets.activePetDefinitionId = definitionId;
  nextState.meta.lastUpdatedAt = now;
  pushActivity(nextState, "pet-switched", `切换电子宠物：${definition.name}`, now);

  return {
    ok: true,
    nextState,
    message: `已切换到 ${definition.name}。`,
  };
}

export function interactWithPet(state: AppState, actionId: PetInteractionId, now: string = new Date().toISOString()): CommandResult {
  const action = PET_INTERACTION_ACTIONS.find((candidate) => candidate.id === actionId);
  if (!action) {
    return {
      ok: false,
      nextState: state,
      message: "未找到这次互动动作。",
    };
  }

  const activeCompanion = getActivePetCompanion(state);
  if (!activeCompanion) {
    return {
      ok: false,
      nextState: state,
      message: "请先领养一只电子宠物。",
    };
  }

  const definition = findPetDefinition(activeCompanion.definitionId);
  if (!definition) {
    return {
      ok: false,
      nextState: state,
      message: "当前电子宠物数据不可用。",
    };
  }

  const nextState = cloneState(state);
  const companion = nextState.pets.companions.find((item) => item.definitionId === activeCompanion.definitionId);
  if (!companion) {
    return {
      ok: false,
      nextState: state,
      message: "当前电子宠物数据不可用。",
    };
  }

  companion.satiety = clampPetNeed(companion.satiety + action.satietyDelta);
  companion.cleanliness = clampPetNeed(companion.cleanliness + action.cleanlinessDelta);
  companion.mood = clampPetNeed(companion.mood + action.moodDelta);
  companion.intimacy = Math.max(0, Math.round(companion.intimacy + action.intimacyDelta));
  companion.lastInteractionId = action.id;
  companion.lastInteractionAt = now;
  nextState.meta.lastUpdatedAt = now;

  pushActivity(nextState, "pet-interacted", `${definition.name}${action.activityMessage}`, now);

  return {
    ok: true,
    nextState,
    message: `${definition.name}${action.successMessage}`,
  };
}

export function archiveHabits(state: AppState, habitIds: string[], now: string = new Date().toISOString()): CommandResult {
  const targetIds = [...new Set(habitIds.map((habitId) => habitId.trim()).filter(Boolean))];
  if (targetIds.length === 0) {
    return {
      ok: false,
      nextState: state,
      message: "请先选择要删除的习惯。",
    };
  }

  const nextState = cloneState(state);
  const archivedHabits = nextState.habits.filter((habit) => targetIds.includes(habit.id) && habit.status === "active");

  if (archivedHabits.length === 0) {
    return {
      ok: false,
      nextState: state,
      message: "未找到可删除的习惯记录。",
    };
  }

  for (const habit of archivedHabits) {
    habit.status = "archived";
  }

  nextState.meta.lastUpdatedAt = now;
  pushActivity(nextState, "system", `删除习惯：${archivedHabits.map((habit) => habit.name).join("、")}`, now);

  return {
    ok: true,
    nextState,
    message: `已删除 ${archivedHabits.length} 个习惯。`,
  };
}

export function completePlan(
  state: AppState,
  planId: string,
  inputOrNow: CompletePlanInput | string = {},
  now: string = new Date().toISOString(),
): CommandResult {
  const input = typeof inputOrNow === "string" ? {} : inputOrNow;
  const effectiveNow = typeof inputOrNow === "string" ? inputOrNow : now;
  const nextState = cloneState(state);
  const plan = nextState.plans.find((item) => item.id === planId);

  if (!plan) {
    return {
      ok: false,
      nextState: state,
      message: "计划不存在。",
    };
  }

  if (plan.status === "done") {
    return {
      ok: false,
      nextState: state,
      message: "这个计划已经完成过了。",
    };
  }

  const mode: PlanCompletionMode = input.mode === "actual" ? "actual" : "duration";
  const rawDurationSeconds = input.durationSeconds;
  const durationSeconds = rawDurationSeconds === undefined ? Math.round(plan.minutes * 60) : Math.round(Number(rawDurationSeconds));
  const note = typeof input.note === "string" ? input.note.trim() : "";
  const attachments = Array.isArray(input.attachments) ? input.attachments.slice(0, 15) : [];
  const completionDateKey = currentDateKey(effectiveNow);

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return {
      ok: false,
      nextState: state,
      message: "请先填写有效的完成时长。",
    };
  }

  if (attachments.some((attachment) => !attachment.name || !Number.isFinite(attachment.size) || attachment.size < 0 || attachment.size > 50 * 1024 * 1024)) {
    return {
      ok: false,
      nextState: state,
      message: "附件信息无效，单个附件不能超过 50MB。",
    };
  }

  if (plan.repeatType !== "once" && isPlanCompletedForDate(plan, completionDateKey)) {
    return {
      ok: false,
      nextState: state,
      message: "当前日期的这次重复计划已经完成过了。",
    };
  }

  if (plan.repeatType === "once") {
    plan.status = "done";
  }
  plan.completedAt = effectiveNow;
  plan.completionRecords.unshift({
    id: nextEntityId(nextState, "plan_completion"),
    mode,
    durationSeconds,
    note,
    attachments: attachments.map((attachment) => ({
      name: attachment.name,
      type: attachment.type,
      size: Math.round(attachment.size),
    })),
    completedAt: effectiveNow,
  });
  nextState.meta.lastUpdatedAt = effectiveNow;
  pushTransaction(nextState, plan.stars, `完成计划：${plan.title}`, effectiveNow);
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const noteSuffix = note ? `，备注：${note}` : "";
  const attachmentSuffix = attachments.length > 0 ? `，附件 ${attachments.length} 个` : "";
  pushActivity(nextState, "plan-completed", `完成计划：${plan.title}，记录 ${durationMinutes} 分钟，获得 ${plan.stars} 星${noteSuffix}${attachmentSuffix}`, effectiveNow);

  return {
    ok: true,
    nextState,
    message: `计划已完成，记录 ${durationMinutes} 分钟，获得 ${plan.stars} 星。`,
  };
}

export function checkInHabit(
  state: AppState,
  habitId: string,
  dateKey: string,
  inputOrNow: CheckInHabitInput | string = {},
  now: string = new Date().toISOString(),
): CommandResult {
  const input = typeof inputOrNow === "string" ? {} : inputOrNow;
  const effectiveNow = typeof inputOrNow === "string" ? inputOrNow : now;
  const nextState = cloneState(state);
  const habit = nextState.habits.find((item) => item.id === habitId);

  if (!habit) {
    return {
      ok: false,
      nextState: state,
      message: "习惯不存在。",
    };
  }

  if (habit.status === "archived") {
    return {
      ok: false,
      nextState: state,
      message: "已归档的习惯不能再打卡。",
    };
  }

  const progress = getHabitProgress(habit, dateKey);
  if (progress.count >= progress.limit) {
    return {
      ok: false,
      nextState: state,
      message: progress.period === "day" ? "今天已经达到该习惯的打卡上限。" : "本周已经达到该习惯的打卡上限。",
    };
  }

  const note = typeof input.note === "string" ? input.note.trim() : "";
  const useCustomPoints = input.useCustomPoints === true;
  const customPoints = Number(input.customPoints);

  if (useCustomPoints && (!Number.isInteger(customPoints) || customPoints < -1000 || customPoints > 1000)) {
    return {
      ok: false,
      nextState: state,
      message: "本次积分调整必须是 -1000 到 1000 之间的整数。",
    };
  }

  const awardedPoints = useCustomPoints ? customPoints : habit.points;
  const noteSuffix = note ? `，备注：${note}` : "";

  habit.completions[dateKey] = (habit.completions[dateKey] ?? 0) + 1;
  nextState.meta.lastUpdatedAt = effectiveNow;

  if (habit.approvalRequired) {
    pushActivity(nextState, "habit-checked", `记录习惯打卡：${habit.name}，待家长审定积分 ${formatPoints(awardedPoints)}${noteSuffix}`, effectiveNow);
    return {
      ok: true,
      nextState,
      message: "已记录打卡，待家长审定后发放积分。",
    };
  }

  if (awardedPoints !== 0) {
    pushTransaction(nextState, awardedPoints, useCustomPoints ? `习惯打卡调整积分：${habit.name}` : `习惯打卡：${habit.name}`, effectiveNow);
  }
  pushActivity(nextState, "habit-checked", `习惯打卡：${habit.name}，积分 ${formatPoints(awardedPoints)}${noteSuffix}`, effectiveNow);

  if (awardedPoints > 0) {
    return {
      ok: true,
      nextState,
      message: `已记录习惯打卡，获得 ${awardedPoints} 星。`,
    };
  }

  if (awardedPoints < 0) {
    return {
      ok: true,
      nextState,
      message: `已记录习惯打卡，扣除 ${Math.abs(awardedPoints)} 星。`,
    };
  }

  return {
    ok: true,
    nextState,
    message: "已记录习惯打卡。",
  };
}

export function submitHabitCheckIn(
  state: AppState,
  habitId: string,
  dateKey: string,
  input: CheckInHabitInput = {},
  now: string = new Date().toISOString(),
): CommandResult {
  const nextState = cloneState(state);
  const habit = nextState.habits.find((item) => item.id === habitId);

  if (!habit) {
    return {
      ok: false,
      nextState: state,
      message: "习惯不存在。",
    };
  }

  if (habit.status === "archived") {
    return {
      ok: false,
      nextState: state,
      message: "已归档的习惯不能再打卡。",
    };
  }

  const progress = getHabitProgress(habit, dateKey);
  if (progress.count >= progress.limit) {
    return {
      ok: false,
      nextState: state,
      message: progress.period === "day" ? "今天已经达到该习惯的打卡上限。" : "本周已经达到该习惯的打卡上限。",
    };
  }

  const note = typeof input.note === "string" ? input.note.trim() : "";
  const useCustomPoints = input.useCustomPoints === true;
  const customPoints = Number(input.customPoints);

  if (useCustomPoints && (!Number.isInteger(customPoints) || customPoints < -1000 || customPoints > 1000)) {
    return {
      ok: false,
      nextState: state,
      message: "本次积分调整必须是 -1000 到 1000 之间的整数。",
    };
  }

  const awardedPoints = useCustomPoints ? customPoints : habit.points;
  const noteSuffix = note ? `，备注：${note}` : "";

  habit.completions[dateKey] = (habit.completions[dateKey] ?? 0) + 1;
  nextState.meta.lastUpdatedAt = now;

  if (habit.approvalRequired) {
    pushActivity(nextState, "habit-checked", `记录习惯打卡：${habit.name}，待家长审定积分 ${formatPoints(awardedPoints)}${noteSuffix}`, now);
    return {
      ok: true,
      nextState,
      message: "已记录打卡，待家长审定后发放积分。",
    };
  }

  if (awardedPoints !== 0) {
    pushTransaction(nextState, awardedPoints, useCustomPoints ? `习惯打卡调整积分：${habit.name}` : `习惯打卡：${habit.name}`, now);
  }

  pushActivity(nextState, "habit-checked", `习惯打卡：${habit.name}，积分 ${formatPoints(awardedPoints)}${noteSuffix}`, now);

  if (awardedPoints > 0) {
    return {
      ok: true,
      nextState,
      message: `已记录习惯打卡，获得 ${awardedPoints} 星。`,
    };
  }

  if (awardedPoints < 0) {
    return {
      ok: true,
      nextState,
      message: `已记录习惯打卡，扣除 ${Math.abs(awardedPoints)} 星。`,
    };
  }

  return {
    ok: true,
    nextState,
    message: "已记录习惯打卡。",
  };
}

export function redeemReward(state: AppState, rewardId: string, now: string = new Date().toISOString()): CommandResult {
  const nextState = cloneState(state);
  const reward = nextState.rewards.find((item) => item.id === rewardId);

  if (!reward) {
    return {
      ok: false,
      nextState: state,
      message: "奖励不存在。",
    };
  }

  const balance = calculateStarBalance(nextState);
  const redeemSummary = getRewardRedeemSummary(reward, balance, now);
  if (!redeemSummary.canRedeem) {
    return {
      ok: false,
      nextState: state,
      message: "星星余额不足，不能兑换。",
    };
  }

  reward.redeemedCount += 1;
  reward.redemptionHistory.push(now);
  nextState.meta.lastUpdatedAt = now;
  pushTransaction(nextState, -reward.cost, `兑换奖励：${reward.title}`, now);
  pushActivity(nextState, "reward-redeemed", `已兑换奖励：${reward.title}，消耗 ${reward.cost} 星`, now);

  return {
    ok: true,
    nextState,
    message: `兑换成功，消耗 ${reward.cost} 星。`,
  };
}

export function serializeState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function deserializeState(raw: string): AppState {
  return normalizeState(JSON.parse(raw));
}

export function summarizeState(state: AppState, dateKey: string): Summary {
  const todayHabitCheckins = state.habits.reduce((total, habit) => total + (habit.completions[dateKey] ?? 0), 0);
  const balance = calculateStarBalance(state);
  const visiblePendingPlans = state.plans.filter((plan) => isPlanScheduledForDate(plan, dateKey) && !isPlanCompletedForDate(plan, dateKey));
  const visibleCompletedPlans = state.plans.filter((plan) => isPlanCompletedForDate(plan, dateKey));

  return {
    starBalance: balance,
    pendingPlans: visiblePendingPlans.length,
    completedPlans: visibleCompletedPlans.length,
    todayHabitCheckins,
    redeemableRewards: state.rewards.filter((reward) => getRewardRedeemSummary(reward, balance).canRedeem).length,
  };
}

export function evaluateInvariants(state: AppState): string[] {
  const violations: string[] = [];

  if (!state.profile.id) {
    violations.push("Profile id is required.");
  }

  if (state.meta.nextId <= 0) {
    violations.push("meta.nextId must be positive.");
  }

  if (state.plans.some((plan) => plan.minutes <= 0 || plan.stars <= 0 || !plan.title || !plan.subject || !isPlanRepeatType(plan.repeatType))) {
    violations.push("Plans must have titles, subjects, positive minutes, and positive star rewards.");
  }

  if (state.plans.some((plan) => plan.status === "done" && !plan.completedAt)) {
    violations.push("Completed plans must record completedAt.");
  }

  if (
    state.plans.some((plan) =>
      plan.completionRecords.some(
        (record) =>
          record.durationSeconds < 0 ||
          !record.completedAt ||
          record.attachments.length > 15 ||
          record.attachments.some((attachment) => !attachment.name || attachment.size < 0),
      ),
    )
  ) {
    violations.push("Plan completion records must have valid durations, timestamps, and attachment metadata.");
  }

  if (
    state.habits.some(
      (habit) =>
        !habit.name ||
        !isHabitFrequency(habit.frequency) ||
        habit.targetCount <= 0 ||
        !Number.isInteger(habit.points) ||
        habit.points < -100 ||
        habit.points > 100 ||
        !habit.icon ||
        !habit.color,
    )
  ) {
    violations.push("Habits must have valid names, frequency, limits, points, icon, and color.");
  }

  if (
    state.rewards.some(
      (reward) =>
        reward.cost <= 0 ||
        reward.redeemedCount < 0 ||
        !reward.title ||
        !isRewardCategory(reward.category) ||
        !reward.icon ||
        !isRewardRepeatMode(reward.repeatMode) ||
        reward.redemptionHistory.some((entry) => !entry) ||
        (reward.repeatMode === "multi" && (reward.repeatConfig?.maxRedemptions ?? 0) <= 0) ||
        (reward.repeatMode === "cycle" &&
          (!isRewardResetPeriod(reward.repeatConfig?.resetPeriod) || (reward.repeatConfig?.redemptionsPerPeriod ?? 0) <= 0)),
    )
  ) {
    violations.push("Rewards must have valid titles, cost, category, mode, and redemption metadata.");
  }

  const petDefinitionIds = new Set(PET_CATALOG.map((pet) => pet.id));
  if (
    state.pets.companions.some(
      (companion) =>
        !petDefinitionIds.has(companion.definitionId) ||
        companion.intimacy < 0 ||
        companion.satiety < 0 ||
        companion.satiety > 100 ||
        companion.cleanliness < 0 ||
        companion.cleanliness > 100 ||
        companion.mood < 0 ||
        companion.mood > 100,
    )
  ) {
    violations.push("Pet companions must reference a valid catalog pet and keep all need values within range.");
  }

  const duplicatePetIds = new Set<string>();
  for (const companion of state.pets.companions) {
    if (duplicatePetIds.has(companion.definitionId)) {
      violations.push("Pet companions must not contain duplicate catalog pets.");
      break;
    }
    duplicatePetIds.add(companion.definitionId);
  }

  if (state.pets.activePetDefinitionId !== null && !state.pets.companions.some((companion) => companion.definitionId === state.pets.activePetDefinitionId)) {
    violations.push("Active pet must point to an owned companion.");
  }

  const completionCounts = state.habits.flatMap((habit) => Object.values(habit.completions));
  if (completionCounts.some((count) => count < 0)) {
    violations.push("Habit completions must be non-negative.");
  }

  const balance = calculateStarBalance(state);
  if (!Number.isFinite(balance)) {
    violations.push("Star balance must be finite.");
  }

  return violations;
}
