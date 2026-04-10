import {
  DEFAULT_HABIT_TEMPLATES,
  HABIT_FREQUENCY_OPTIONS,
  PET_CATALOG,
  PET_INTERACTION_ACTIONS,
  PET_RECYCLE_REFUND_STARS,
  PET_LEVEL_TIERS,
  STAR_RULES,
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
  PlanCompletionReviewDecision,
  PlanCompletionReviewStatus,
  PlanCompletionMode,
  PlanCompletionRecord,
  PlanRepeatType,
  Profile,
  Reward,
  RewardCategory,
  RewardRedeemSummary,
  RewardRepeatMode,
  RewardResetPeriod,
  SyncEntityType,
  SyncMergeResult,
  SyncPendingOperation,
  StarTransaction,
  StudyPlan,
  Summary,
  ReviewPlanCompletionInput,
} from "./types.js";

// Pure state transforms and queries stay here; src/domain/model.ts re-exports this file as the public entry.
function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState;
}

const SYNC_SCHEMA_VERSION = 1;
const LOCAL_DEVICE_PLACEHOLDER = "device-local";
const MAX_PENDING_SYNC_OPS = 500;

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

function isPlanCompletionReviewStatus(value: unknown): value is PlanCompletionReviewStatus {
  return value === "pending" || value === "approved" || value === "adjusted" || value === "rejected";
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

function getSystemDurationBonusStars(durationMinutes: number): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return 0;
  }

  for (const threshold of STAR_RULES.durationBonusThresholds) {
    if (durationMinutes >= threshold.minimumMinutes) {
      return threshold.bonusStars;
    }
  }

  return 0;
}

export function estimateSystemPlanStars(minutes: number): number {
  const safeMinutes = Math.max(1, Math.round(minutes));
  return STAR_RULES.planBaseStars + getSystemDurationBonusStars(safeMinutes);
}

function getPlanCompletionMultiplier(completedAt: string): number {
  const completedDate = new Date(completedAt);
  const completedHour = completedDate.getHours();
  const isMorning =
    completedHour >= STAR_RULES.morningBonus.startHour &&
    completedHour < STAR_RULES.morningBonus.endHour;
  const isWeekend = completedDate.getDay() === 0 || completedDate.getDay() === 6;

  let multiplier = 1;
  if (isMorning) {
    multiplier *= STAR_RULES.morningBonus.multiplier;
  }
  if (isWeekend) {
    multiplier *= STAR_RULES.weekendBonusMultiplier;
  }

  return multiplier;
}

function hasTransactionWithReasonOnDate(state: AppState, reasonPrefix: string, dateKey: string): boolean {
  return state.starTransactions.some((transaction) => transaction.reason.startsWith(reasonPrefix) && currentDateKey(transaction.createdAt) === dateKey);
}

function hasTransactionWithReasonPrefix(state: AppState, reasonPrefix: string): boolean {
  return state.starTransactions.some((transaction) => transaction.reason.startsWith(reasonPrefix));
}

function hasAnyTaskCompletionOnDate(state: AppState, dateKey: string): boolean {
  const hasCompletedPlan = state.plans.some((plan) => isPlanCompletedForDate(plan, dateKey));
  if (hasCompletedPlan) {
    return true;
  }

  return state.habits.some((habit) => habit.points > 0 && (habit.completions[dateKey] ?? 0) > 0);
}

function getCurrentTaskStreakDays(state: AppState, endDateKey: string): number {
  if (!hasAnyTaskCompletionOnDate(state, endDateKey)) {
    return 0;
  }

  let streak = 0;
  let cursor = endDateKey;
  while (hasAnyTaskCompletionOnDate(state, cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getTotalCompletedPlanCount(state: AppState): number {
  return state.plans.reduce((total, plan) => total + plan.completionRecords.length, 0);
}

function getTotalRecordedStudyMinutes(state: AppState): number {
  return state.plans.reduce((total, plan) => {
    if (plan.completionRecords.length === 0) {
      return total;
    }

    const recordMinutes = plan.completionRecords.reduce((recordTotal, record) => {
      return recordTotal + Math.max(1, Math.round(record.durationSeconds / 60));
    }, 0);
    return total + recordMinutes;
  }, 0);
}

function getTotalHabitCheckIns(state: AppState): number {
  return state.habits.reduce((total, habit) => total + Object.values(habit.completions).reduce((sum, count) => sum + count, 0), 0);
}

function awardDailyFullAttendanceIfReached(state: AppState, dateKey: string, now: string): number {
  const scheduledPlans = state.plans.filter((plan) => isPlanScheduledForDate(plan, dateKey));
  if (scheduledPlans.length === 0) {
    return 0;
  }

  const allCompleted = scheduledPlans.every((plan) => isPlanCompletedForDate(plan, dateKey));
  if (!allCompleted) {
    return 0;
  }

  if (hasTransactionWithReasonOnDate(state, "每日全勤奖励", dateKey)) {
    return 0;
  }

  pushTransaction(state, STAR_RULES.dailyFullAttendanceBonusStars, `每日全勤奖励：${dateKey}`, now);
  return STAR_RULES.dailyFullAttendanceBonusStars;
}

function awardStreakBonusIfReached(state: AppState, dateKey: string, now: string): number {
  const streakDays = getCurrentTaskStreakDays(state, dateKey);
  if (streakDays <= 0) {
    return 0;
  }

  let awarded = 0;
  for (const tier of STAR_RULES.streakRewards) {
    if (streakDays >= tier.days && !hasTransactionWithReasonPrefix(state, `连续打卡奖励：${tier.days}天`)) {
      pushTransaction(state, tier.stars, `连续打卡奖励：${tier.days}天`, now);
      awarded += tier.stars;
    }
  }

  return awarded;
}

function awardAchievementBonusIfReached(state: AppState, dateKey: string, now: string): number {
  const completedPlanCount = getTotalCompletedPlanCount(state);
  const totalStudyMinutes = getTotalRecordedStudyMinutes(state);
  const totalHabitCheckIns = getTotalHabitCheckIns(state);
  const currentStreakDays = getCurrentTaskStreakDays(state, dateKey);
  const achievementRewards = [
    { id: "任务达人", stars: 2, reached: completedPlanCount >= 1 },
    { id: "学霸之路", stars: 4, reached: totalStudyMinutes >= 120 },
    { id: "进步之星", stars: 3, reached: totalHabitCheckIns >= 7 },
    { id: "坚持不懈", stars: 5, reached: currentStreakDays >= 3 },
  ];

  let awarded = 0;
  for (const achievement of achievementRewards) {
    const reason = `成就奖励：${achievement.id}`;
    if (!achievement.reached || hasTransactionWithReasonPrefix(state, reason)) {
      continue;
    }

    pushTransaction(state, achievement.stars, reason, now);
    pushActivity(state, "system", `解锁成就：${achievement.id}，奖励 ${achievement.stars} 星`, now);
    awarded += achievement.stars;
  }

  return awarded;
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

function nextEntityVersion(version: number): number {
  if (!Number.isFinite(version) || version < 1) {
    return 1;
  }
  return Math.round(version) + 1;
}

function touchPlanForMutation(plan: StudyPlan, now: string): void {
  plan.updatedAt = now;
  plan.version = nextEntityVersion(plan.version);
  plan.deletedAt = null;
}

function touchHabitForMutation(habit: Habit, now: string): void {
  habit.updatedAt = now;
  habit.version = nextEntityVersion(habit.version);
  habit.deletedAt = null;
}

function touchRewardForMutation(reward: Reward, now: string): void {
  reward.updatedAt = now;
  reward.version = nextEntityVersion(reward.version);
  reward.deletedAt = null;
}

function touchCompanionForMutation(companion: OwnedPet, now: string): void {
  companion.updatedAt = now;
  companion.version = nextEntityVersion(companion.version);
  companion.deletedAt = null;
}

function queuePendingSyncOperation(
  state: AppState,
  mutation: {
    entityType: SyncEntityType;
    entityId: string | null;
    action: string;
    payload?: unknown;
  },
  now: string,
): string {
  const sequence = state.sync.lastMutationSequence + 1;
  const operationId = `${state.sync.deviceId}:${sequence}`;
  state.sync.lastMutationSequence = sequence;
  state.sync.pendingOps.push({
    id: operationId,
    deviceId: state.sync.deviceId,
    sequence,
    entityType: mutation.entityType,
    entityId: mutation.entityId,
    action: mutation.action,
    payload: mutation.payload ?? null,
    createdAt: now,
  });
  if (state.sync.pendingOps.length > MAX_PENDING_SYNC_OPS) {
    state.sync.pendingOps = state.sync.pendingOps.slice(-MAX_PENDING_SYNC_OPS);
  }
  state.meta.lastUpdatedAt = now;
  return operationId;
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
  const reviewStatus: PlanCompletionReviewStatus = isPlanCompletionReviewStatus(value.reviewStatus)
    ? value.reviewStatus
    : "approved";
  const reviewReason = typeof value.reviewReason === "string" ? value.reviewReason : "";
  const reviewedAtRaw = value.reviewedAt;
  const reviewedAtCandidate = reviewedAtRaw === null || typeof reviewedAtRaw === "string" ? reviewedAtRaw : null;
  const reviewedAt = reviewStatus === "pending" ? null : reviewedAtCandidate ?? completedAt;
  const awardedStarsRaw = Number(value.awardedStars);
  const awardedStars = Number.isFinite(awardedStarsRaw) ? Math.round(awardedStarsRaw) : null;
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
    reviewStatus,
    reviewReason,
    reviewedAt,
    awardedStars,
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
  const legacyEstimatedStars = Math.max(1, Math.round(minutes / 10));
  const customStarsEnabled =
    typeof value.customStarsEnabled === "boolean" ? value.customStarsEnabled : Number.isFinite(stars) && Math.round(stars) !== legacyEstimatedStars;
  const approvalRequired = value.approvalRequired === true && customStarsEnabled;
  const status = value.status === "done" ? "done" : "pending";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : fallbackTime;
  const completedAt = typeof value.completedAt === "string" ? value.completedAt : null;
  const updatedAt = normalizeEntityUpdatedAt(value.updatedAt, completedAt ?? createdAt);
  const version = normalizeEntityVersion(value.version);
  const deletedAt = normalizeEntityDeletedAt(value.deletedAt);
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
            reviewStatus: "approved" as const,
            reviewReason: "历史记录自动迁移",
            reviewedAt: completedAt,
            awardedStars: null,
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
    customStarsEnabled,
    approvalRequired,
    status,
    createdAt,
    completedAt,
    updatedAt,
    version,
    deletedAt,
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
  const updatedAt = normalizeEntityUpdatedAt(value.updatedAt, createdAt);
  const version = normalizeEntityVersion(value.version);
  const deletedAt = normalizeEntityDeletedAt(value.deletedAt);
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
    updatedAt,
    version,
    deletedAt,
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

function normalizeReward(value: unknown, fallbackTime: string): Reward | null {
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
  const updatedAt = normalizeEntityUpdatedAt(value.updatedAt, fallbackTime);
  const version = normalizeEntityVersion(value.version);
  const deletedAt = normalizeEntityDeletedAt(value.deletedAt);
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
    updatedAt,
    version,
    deletedAt,
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
    updatedAt: normalizeEntityUpdatedAt(value.updatedAt, typeof value.adoptedAt === "string" ? value.adoptedAt : fallbackTime),
    version: normalizeEntityVersion(value.version),
    deletedAt: normalizeEntityDeletedAt(value.deletedAt),
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
    value.kind === "pet-interacted" ||
    value.kind === "pet-recycled"
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

function normalizeSyncPendingOperation(value: unknown, fallbackTime: string): SyncPendingOperation | null {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : "";
  const deviceId = typeof value.deviceId === "string" && value.deviceId ? value.deviceId : "";
  const sequence = Number(value.sequence);
  const entityType: SyncEntityType =
    value.entityType === "plan" || value.entityType === "habit" || value.entityType === "reward" || value.entityType === "pet" ? value.entityType : "state";
  const entityId = typeof value.entityId === "string" && value.entityId ? value.entityId : null;
  const action = typeof value.action === "string" && value.action ? value.action : "";
  const createdAt = typeof value.createdAt === "string" && value.createdAt ? value.createdAt : fallbackTime;

  if (!id || !deviceId || !Number.isFinite(sequence) || sequence <= 0 || !action) {
    return null;
  }

  return {
    id,
    deviceId,
    sequence: Math.round(sequence),
    entityType,
    entityId,
    action,
    payload: value.payload,
    createdAt,
  };
}

function normalizeSyncState(value: unknown, fallbackTime: string): AppState["sync"] {
  const syncValue = isObject(value) ? value : {};
  const schemaVersion = Number(syncValue.schemaVersion);
  const deviceId = typeof syncValue.deviceId === "string" && syncValue.deviceId ? syncValue.deviceId : LOCAL_DEVICE_PLACEHOLDER;
  const lastMutationSequence = Number(syncValue.lastMutationSequence);
  const pendingOps = Array.isArray(syncValue.pendingOps)
    ? syncValue.pendingOps
        .map((pendingOp) => normalizeSyncPendingOperation(pendingOp, fallbackTime))
        .filter((pendingOp): pendingOp is SyncPendingOperation => pendingOp !== null)
        .sort((left, right) => left.sequence - right.sequence)
        .slice(-MAX_PENDING_SYNC_OPS)
    : [];

  return {
    schemaVersion: Number.isFinite(schemaVersion) && schemaVersion >= 1 ? Math.round(schemaVersion) : SYNC_SCHEMA_VERSION,
    deviceId,
    lastMutationSequence: Number.isFinite(lastMutationSequence) && lastMutationSequence >= 0 ? Math.round(lastMutationSequence) : 0,
    lastSyncedAt: typeof syncValue.lastSyncedAt === "string" && syncValue.lastSyncedAt ? syncValue.lastSyncedAt : null,
    pendingOps,
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
    ? value.rewards.map((reward) => normalizeReward(reward, fallbackTime)).filter((reward): reward is Reward => reward !== null)
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
  const sync = normalizeSyncState(value.sync, fallbackTime);

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
    sync,
    meta: {
      nextId: Number.isFinite(candidateNextId) && candidateNextId > 0 ? Math.round(candidateNextId) : 1,
      lastUpdatedAt: typeof metaValue.lastUpdatedAt === "string" ? metaValue.lastUpdatedAt : fallbackTime,
    },
  };

  normalized.version = VERSION;
  normalized.meta.nextId = Math.max(normalized.meta.nextId, inferNextId(normalized));
  normalized.sync.lastMutationSequence = Math.max(
    normalized.sync.lastMutationSequence,
    normalized.sync.pendingOps.reduce((max, pendingOp) => Math.max(max, pendingOp.sequence), 0),
  );
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
    updatedAt: now,
    version: 1,
    deletedAt: null,
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
    updatedAt: now,
    version: 1,
    deletedAt: null,
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
        customStarsEnabled: false,
        approvalRequired: false,
        status: "pending",
        createdAt: now,
        completedAt: null,
        updatedAt: now,
        version: 1,
        deletedAt: null,
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
        customStarsEnabled: false,
        approvalRequired: false,
        status: "pending",
        createdAt: now,
        completedAt: null,
        updatedAt: now,
        version: 1,
        deletedAt: null,
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
        updatedAt: now,
        version: 1,
        deletedAt: null,
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
        updatedAt: now,
        version: 1,
        deletedAt: null,
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
    sync: {
      schemaVersion: SYNC_SCHEMA_VERSION,
      deviceId: LOCAL_DEVICE_PLACEHOLDER,
      lastMutationSequence: 0,
      lastSyncedAt: null,
      pendingOps: [],
    },
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
  input: {
    title: string;
    subject: string;
    repeatType?: PlanRepeatType;
    minutes: number;
    stars?: number;
    customStarsEnabled?: boolean;
    approvalRequired?: boolean;
  },
  now: string = new Date().toISOString(),
): CommandResult {
  const title = input.title.trim();
  const subject = input.subject.trim();
  const repeatType = input.repeatType ?? "once";
  const minutes = Math.max(5, Math.round(input.minutes));
  const customStarsEnabled = input.customStarsEnabled ?? input.stars !== undefined;
  const approvalRequired = input.approvalRequired === true && customStarsEnabled;
  const stars = input.stars === undefined ? estimateSystemPlanStars(minutes) : Math.round(Number(input.stars));

  if (!title || !subject || !isPlanRepeatType(repeatType) || !Number.isFinite(minutes) || !Number.isFinite(stars) || stars <= 0) {
    return {
      ok: false,
      nextState: state,
      message: "请填写完整且有效的计划信息。",
    };
  }

  const nextState = cloneState(state);
  const plan: StudyPlan = {
    id: nextEntityId(nextState, "plan"),
    title,
    subject,
    repeatType,
    minutes,
    stars,
    customStarsEnabled,
    approvalRequired,
    status: "pending",
    createdAt: now,
    completedAt: null,
    updatedAt: now,
    version: 1,
    deletedAt: null,
    excludedDateKeys: [],
    completionRecords: [],
  };
  nextState.plans.unshift(plan);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "plan",
      entityId: plan.id,
      action: "plan.create",
      payload: {
        title: plan.title,
        subject: plan.subject,
        repeatType: plan.repeatType,
        minutes: plan.minutes,
        stars: plan.stars,
        customStarsEnabled: plan.customStarsEnabled,
        approvalRequired: plan.approvalRequired,
      },
    },
    now,
  );
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
  const customStarsEnabled = input.customStarsEnabled ?? input.stars !== undefined;
  const approvalRequired = (input.approvalRequired ?? plan.approvalRequired) && customStarsEnabled;
  const stars = input.stars === undefined ? estimateSystemPlanStars(minutes) : Math.round(Number(input.stars));

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
  plan.customStarsEnabled = customStarsEnabled;
  plan.approvalRequired = approvalRequired;
  if (typeof input.createdAt === "string" && input.createdAt) {
    plan.createdAt = input.createdAt;
  }
  touchPlanForMutation(plan, now);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "plan",
      entityId: plan.id,
      action: "plan.update",
      payload: {
        title: plan.title,
        subject: plan.subject,
        repeatType: plan.repeatType,
        minutes: plan.minutes,
        stars: plan.stars,
        customStarsEnabled: plan.customStarsEnabled,
        approvalRequired: plan.approvalRequired,
      },
    },
    now,
  );
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
  const reward: Reward = {
    id: nextEntityId(nextState, "reward"),
    title,
    description,
    cost,
    category: input.category,
    icon,
    customImage: typeof input.customImage === "string" && input.customImage ? input.customImage : null,
    repeatMode: input.repeatMode,
    repeatConfig,
    updatedAt: now,
    version: 1,
    deletedAt: null,
    redeemedCount: 0,
    redemptionHistory: [],
  };
  nextState.rewards.unshift(reward);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "reward",
      entityId: reward.id,
      action: "reward.create",
      payload: {
        title: reward.title,
        cost: reward.cost,
        category: reward.category,
        repeatMode: reward.repeatMode,
      },
    },
    now,
  );
  pushActivity(nextState, "system", `新增愿望：${title}，需要 ${cost} 星`, now);

  return {
    ok: true,
    nextState,
    message: `已添加愿望：${title}`,
  };
}

export function updateReward(state: AppState, rewardId: string, input: CreateRewardInput, now: string = new Date().toISOString()): CommandResult {
  const targetReward = state.rewards.find((reward) => reward.id === rewardId);
  if (!targetReward) {
    return {
      ok: false,
      nextState: state,
      message: "愿望不存在。",
    };
  }

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
  const reward = nextState.rewards.find((item) => item.id === rewardId);
  if (!reward) {
    return {
      ok: false,
      nextState: state,
      message: "愿望不存在。",
    };
  }

  reward.title = title;
  reward.description = description;
  reward.cost = cost;
  reward.category = input.category;
  reward.icon = icon;
  reward.customImage = typeof input.customImage === "string" && input.customImage ? input.customImage : null;
  reward.repeatMode = input.repeatMode;
  reward.repeatConfig = repeatConfig;
  touchRewardForMutation(reward, now);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "reward",
      entityId: reward.id,
      action: "reward.update",
      payload: {
        title: reward.title,
        cost: reward.cost,
        category: reward.category,
        repeatMode: reward.repeatMode,
      },
    },
    now,
  );
  pushActivity(nextState, "system", `编辑愿望：${title}`, now);

  return {
    ok: true,
    nextState,
    message: `已更新愿望：${title}`,
  };
}

export function deleteReward(state: AppState, rewardId: string, now: string = new Date().toISOString()): CommandResult {
  const targetReward = state.rewards.find((reward) => reward.id === rewardId);
  if (!targetReward) {
    return {
      ok: false,
      nextState: state,
      message: "愿望不存在。",
    };
  }

  const nextState = cloneState(state);
  nextState.rewards = nextState.rewards.filter((reward) => reward.id !== rewardId);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "reward",
      entityId: rewardId,
      action: "reward.delete",
      payload: { rewardId },
    },
    now,
  );
  pushActivity(nextState, "system", `删除愿望：${targetReward.title}`, now);

  return {
    ok: true,
    nextState,
    message: `已删除愿望：${targetReward.title}`,
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
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "plan",
      entityId: null,
      action: "plan.delete",
      payload: { planIds: deletablePlans.map((plan) => plan.id) },
    },
    now,
  );
  pushActivity(nextState, "system", `删除计划：${deletablePlans.map((plan) => plan.title).join("、")}`, now);

  return {
    ok: true,
    nextState,
    message: `已删除 ${deletablePlans.length} 个计划。`,
  };
}

export function deletePlansForDate(
  state: AppState,
  planIds: string[],
  dateKey: string,
  now: string = new Date().toISOString(),
): CommandResult {
  const scopedDateKey = typeof dateKey === "string" ? dateKey.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scopedDateKey)) {
    return {
      ok: false,
      nextState: state,
      message: "请选择有效的管理日期。",
    };
  }

  const targetIds = [...new Set(planIds.map((planId) => planId.trim()).filter(Boolean))];
  if (targetIds.length === 0) {
    return {
      ok: false,
      nextState: state,
      message: "请先选择要删除的计划。",
    };
  }

  const targetPlans = state.plans.filter((plan) => targetIds.includes(plan.id));
  if (targetPlans.length === 0) {
    return {
      ok: false,
      nextState: state,
      message: "没有找到可删除的计划。",
    };
  }

  const nextState = cloneState(state);
  const removedPlanTitles: string[] = [];
  const excludedPlanTitles: string[] = [];
  const removedPlanIds: string[] = [];
  const excludedPlanIds: string[] = [];

  nextState.plans = nextState.plans.filter((plan) => {
    if (!targetIds.includes(plan.id)) {
      return true;
    }

    if (plan.repeatType === "once") {
      removedPlanTitles.push(plan.title);
      removedPlanIds.push(plan.id);
      return false;
    }

    if (!plan.excludedDateKeys.includes(scopedDateKey)) {
      plan.excludedDateKeys.push(scopedDateKey);
    }
    touchPlanForMutation(plan, now);
    excludedPlanTitles.push(plan.title);
    excludedPlanIds.push(plan.id);
    return true;
  });

  if (removedPlanTitles.length === 0 && excludedPlanTitles.length === 0) {
    return {
      ok: false,
      nextState: state,
      message: "没有找到可删除的计划。",
    };
  }

  queuePendingSyncOperation(
    nextState,
    {
      entityType: "plan",
      entityId: null,
      action: "plan.delete-for-date",
      payload: {
        dateKey: scopedDateKey,
        removedPlanIds,
        excludedPlanIds,
      },
    },
    now,
  );
  const activityParts: string[] = [];
  if (excludedPlanTitles.length > 0) {
    activityParts.push(`仅删除 ${scopedDateKey} 的计划：${excludedPlanTitles.join("、")}`);
  }
  if (removedPlanTitles.length > 0) {
    activityParts.push(`删除计划：${removedPlanTitles.join("、")}`);
  }
  pushActivity(nextState, "system", activityParts.join("；"), now);

  if (excludedPlanTitles.length > 0 && removedPlanTitles.length > 0) {
    return {
      ok: true,
      nextState,
      message: `已在 ${scopedDateKey} 删除 ${excludedPlanTitles.length} 个重复计划，并删除 ${removedPlanTitles.length} 个仅当天计划。`,
    };
  }

  if (excludedPlanTitles.length > 0) {
    return {
      ok: true,
      nextState,
      message: `已在 ${scopedDateKey} 删除 ${excludedPlanTitles.length} 个重复计划。`,
    };
  }

  return {
    ok: true,
    nextState,
    message: `已删除 ${removedPlanTitles.length} 个计划。`,
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
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "habit",
      entityId: habit.id,
      action: "habit.create",
      payload: {
        name: habit.name,
        frequency: habit.frequency,
        points: habit.points,
      },
    },
    now,
  );
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
  const addedHabitIds: string[] = [];

  for (const template of DEFAULT_HABIT_TEMPLATES) {
    if (nextState.habits.some((habit) => habit.status === "active" && habit.name === template.name)) {
      continue;
    }

    const habit = insertHabit(nextState, template, now);
    addedHabitIds.push(habit.id);
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

  queuePendingSyncOperation(
    nextState,
    {
      entityType: "habit",
      entityId: null,
      action: "habit.create-defaults",
      payload: { habitIds: addedHabitIds },
    },
    now,
  );
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
    queuePendingSyncOperation(
      nextState,
      {
        entityType: "pet",
        entityId: definitionId,
        action: "pet.switch-active",
      },
      now,
    );
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

  const adoptedCompanion = createOwnedPet(definitionId, nextState.profile.id, now);
  nextState.pets.companions.unshift(adoptedCompanion);
  nextState.pets.activePetDefinitionId = definitionId;
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "pet",
      entityId: definitionId,
      action: "pet.adopt",
      payload: { cost: definition.cost },
    },
    now,
  );
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
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "pet",
      entityId: definitionId,
      action: "pet.switch-active",
    },
    now,
  );
  pushActivity(nextState, "pet-switched", `切换电子宠物：${definition.name}`, now);

  return {
    ok: true,
    nextState,
    message: `已切换到 ${definition.name}。`,
  };
}

export function recyclePet(state: AppState, definitionId: string, now: string = new Date().toISOString()): CommandResult {
  const definition = findPetDefinition(definitionId);
  if (!definition) {
    return {
      ok: false,
      nextState: state,
      message: "未找到这只电子宠物。",
    };
  }

  const existingCompanion = state.pets.companions.find((companion) => companion.definitionId === definitionId);
  if (!existingCompanion) {
    return {
      ok: false,
      nextState: state,
      message: `请先领养 ${definition.name}。`,
    };
  }

  const nextState = cloneState(state);
  nextState.pets.companions = nextState.pets.companions.filter((companion) => companion.definitionId !== definitionId);

  let switchedToName: string | null = null;
  if (nextState.pets.activePetDefinitionId === definitionId) {
    const nextActiveCompanion = nextState.pets.companions[0] ?? null;
    nextState.pets.activePetDefinitionId = nextActiveCompanion ? nextActiveCompanion.definitionId : null;
    switchedToName = nextActiveCompanion ? findPetDefinition(nextActiveCompanion.definitionId)?.name ?? null : null;
  }

  queuePendingSyncOperation(
    nextState,
    {
      entityType: "pet",
      entityId: definitionId,
      action: "pet.recycle",
      payload: { refundStars: PET_RECYCLE_REFUND_STARS },
    },
    now,
  );
  pushTransaction(nextState, PET_RECYCLE_REFUND_STARS, `回收电子宠物：${definition.name}`, now);
  pushActivity(nextState, "pet-recycled", `回收电子宠物：${definition.name}，返还 ${PET_RECYCLE_REFUND_STARS} 星星`, now);

  const switchedSuffix = switchedToName ? `，当前陪伴已切换到 ${switchedToName}` : nextState.pets.activePetDefinitionId === null ? "，当前暂无陪伴宠物" : "";
  return {
    ok: true,
    nextState,
    message: `已回收 ${definition.name}，返还 ${PET_RECYCLE_REFUND_STARS} 星星${switchedSuffix}。`,
  };
}

export function interactWithPet(state: AppState, actionId: PetInteractionId, now: string = new Date().toISOString()): CommandResult {
  const interactionCost = 1;
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
  const balance = calculateStarBalance(nextState);
  if (balance < interactionCost) {
    return {
      ok: false,
      nextState: state,
      message: `星星不足，还差 ${interactionCost - balance} 颗才能和${definition.name}互动。`,
    };
  }
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
  touchCompanionForMutation(companion, now);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "pet",
      entityId: companion.definitionId,
      action: "pet.interact",
      payload: { actionId: action.id, interactionCost },
    },
    now,
  );

  pushTransaction(nextState, -interactionCost, `宠物互动：${definition.name} · ${action.title}`, now);
  pushActivity(nextState, "pet-interacted", `${definition.name}${action.activityMessage}（消耗 ${interactionCost} 星星）`, now);

  return {
    ok: true,
    nextState,
    message: `${definition.name}${action.successMessage}（消耗 ${interactionCost} 星星）`,
  };
}

function normalizeEntityVersion(value: unknown): number {
  const version = Number(value);
  if (!Number.isFinite(version) || version < 1) {
    return 1;
  }
  return Math.round(version);
}

function normalizeEntityDeletedAt(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function normalizeEntityUpdatedAt(value: unknown, fallback: string): string {
  return typeof value === "string" && value ? value : fallback;
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
    touchHabitForMutation(habit, now);
  }

  queuePendingSyncOperation(
    nextState,
    {
      entityType: "habit",
      entityId: null,
      action: "habit.archive",
      payload: { habitIds: archivedHabits.map((habit) => habit.id) },
    },
    now,
  );
  pushActivity(nextState, "system", `删除习惯：${archivedHabits.map((habit) => habit.name).join("、")}`, now);

  return {
    ok: true,
    nextState,
    message: `已删除 ${archivedHabits.length} 个习惯。`,
  };
}

function resolvePlanBaseStars(
  plan: StudyPlan,
  durationMinutes: number,
  completedAt: string,
): { basePlanStars: number; planRewardReason: string } {
  const durationBonusStars = getSystemDurationBonusStars(durationMinutes);
  const completionMultiplier = getPlanCompletionMultiplier(completedAt);
  const systemSubtotalStars = STAR_RULES.planBaseStars + durationBonusStars;
  const basePlanStars = plan.customStarsEnabled ? plan.stars : Math.max(1, Math.round(systemSubtotalStars * completionMultiplier));
  const multiplierLabel = completionMultiplier > 1 ? `x${completionMultiplier.toFixed(2).replace(/\.?0+$/, "")}` : null;
  const planRewardReason = plan.customStarsEnabled
    ? `完成计划：${plan.title}（自定义奖励）`
    : `完成计划：${plan.title}（基础${STAR_RULES.planBaseStars}+时长${durationBonusStars}${multiplierLabel ? `，加成 ${multiplierLabel}` : ""}）`;
  return {
    basePlanStars,
    planRewardReason,
  };
}

function awardTaskCompletionBonuses(
  state: AppState,
  completionDateKey: string,
  now: string,
): { fullAttendanceBonus: number; streakBonus: number; achievementBonus: number } {
  const fullAttendanceBonus = awardDailyFullAttendanceIfReached(state, completionDateKey, now);
  const streakBonus = awardStreakBonusIfReached(state, completionDateKey, now);
  const achievementBonus = awardAchievementBonusIfReached(state, completionDateKey, now);
  return {
    fullAttendanceBonus,
    streakBonus,
    achievementBonus,
  };
}

function formatPlanRewardBreakdown(basePlanStars: number, fullAttendanceBonus: number, streakBonus: number, achievementBonus: number): string {
  return [
    `任务奖励 ${basePlanStars} 星`,
    fullAttendanceBonus > 0 ? `全勤奖励 ${fullAttendanceBonus} 星` : null,
    streakBonus > 0 ? `连续打卡奖励 ${streakBonus} 星` : null,
    achievementBonus > 0 ? `成就奖励 ${achievementBonus} 星` : null,
  ]
    .filter(Boolean)
    .join(" + ");
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
  const completionRecord: PlanCompletionRecord = {
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
    reviewStatus: plan.approvalRequired ? "pending" : "approved",
    reviewReason: plan.approvalRequired ? "" : "系统自动发放",
    reviewedAt: plan.approvalRequired ? null : effectiveNow,
    awardedStars: null,
  };
  plan.completionRecords.unshift(completionRecord);
  touchPlanForMutation(plan, effectiveNow);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "plan",
      entityId: plan.id,
      action: "plan.complete",
      payload: {
        mode,
        durationSeconds,
        completedAt: effectiveNow,
        reviewStatus: completionRecord.reviewStatus,
      },
    },
    effectiveNow,
  );
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const noteSuffix = note ? `，备注：${note}` : "";
  const attachmentSuffix = attachments.length > 0 ? `，附件 ${attachments.length} 个` : "";

  if (plan.approvalRequired) {
    pushActivity(nextState, "plan-completed", `完成计划：${plan.title}，记录 ${durationMinutes} 分钟，积分待审定${noteSuffix}${attachmentSuffix}`, effectiveNow);
    return {
      ok: true,
      nextState,
      message: "计划已完成，等待积分审定后发放奖励。",
    };
  }

  const { basePlanStars, planRewardReason } = resolvePlanBaseStars(plan, durationMinutes, effectiveNow);
  pushTransaction(nextState, basePlanStars, planRewardReason, effectiveNow);
  const { fullAttendanceBonus, streakBonus, achievementBonus } = awardTaskCompletionBonuses(nextState, completionDateKey, effectiveNow);
  const totalAwardedStars = basePlanStars + fullAttendanceBonus + streakBonus + achievementBonus;
  completionRecord.awardedStars = totalAwardedStars;

  const rewardBreakdown = formatPlanRewardBreakdown(basePlanStars, fullAttendanceBonus, streakBonus, achievementBonus);
  pushActivity(
    nextState,
    "plan-completed",
    `完成计划：${plan.title}，记录 ${durationMinutes} 分钟，获得 ${totalAwardedStars} 星（${rewardBreakdown}）${noteSuffix}${attachmentSuffix}`,
    effectiveNow,
  );

  return {
    ok: true,
    nextState,
    message: `计划已完成，记录 ${durationMinutes} 分钟，获得 ${totalAwardedStars} 星。`,
  };
}

export function reviewPlanCompletion(
  state: AppState,
  planId: string,
  completionRecordId: string,
  input: ReviewPlanCompletionInput,
  now: string = new Date().toISOString(),
): CommandResult {
  const nextState = cloneState(state);
  const plan = nextState.plans.find((item) => item.id === planId);
  if (!plan) {
    return {
      ok: false,
      nextState: state,
      message: "计划不存在。",
    };
  }

  const completionRecord = plan.completionRecords.find((record) => record.id === completionRecordId);
  if (!completionRecord) {
    return {
      ok: false,
      nextState: state,
      message: "待审定记录不存在。",
    };
  }

  if (completionRecord.reviewStatus !== "pending") {
    return {
      ok: false,
      nextState: state,
      message: "该记录已经审定完成。",
    };
  }

  const decision: PlanCompletionReviewDecision = input.decision;
  if (decision !== "approve" && decision !== "adjust" && decision !== "reject") {
    return {
      ok: false,
      nextState: state,
      message: "审定操作无效。",
    };
  }

  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  const durationMinutes = Math.max(1, Math.round(completionRecord.durationSeconds / 60));
  const completionDateKey = currentDateKey(completionRecord.completedAt);

  let basePlanStars = 0;
  let planRewardReason = "";
  if (decision === "approve") {
    const resolved = resolvePlanBaseStars(plan, durationMinutes, completionRecord.completedAt);
    basePlanStars = resolved.basePlanStars;
    planRewardReason = `积分审定通过：${plan.title}`;
  } else if (decision === "adjust") {
    const adjustedStars = Math.round(Number(input.adjustedStars));
    if (!Number.isInteger(adjustedStars) || adjustedStars < -1000 || adjustedStars > 1000) {
      return {
        ok: false,
        nextState: state,
        message: "调整积分必须是 -1000 到 1000 的整数。",
      };
    }
    if (!reason) {
      return {
        ok: false,
        nextState: state,
        message: "请填写审定说明后再确认调整。",
      };
    }
    basePlanStars = adjustedStars;
    planRewardReason = `积分审定调整：${plan.title}`;
  } else {
    basePlanStars = 0;
    planRewardReason = `积分审定拒绝：${plan.title}`;
  }

  if (basePlanStars !== 0) {
    pushTransaction(nextState, basePlanStars, planRewardReason, now);
  }

  let fullAttendanceBonus = 0;
  let streakBonus = 0;
  let achievementBonus = 0;
  if (basePlanStars > 0) {
    const bonuses = awardTaskCompletionBonuses(nextState, completionDateKey, now);
    fullAttendanceBonus = bonuses.fullAttendanceBonus;
    streakBonus = bonuses.streakBonus;
    achievementBonus = bonuses.achievementBonus;
  }

  const totalAwardedStars = basePlanStars + fullAttendanceBonus + streakBonus + achievementBonus;
  completionRecord.reviewStatus = decision === "approve" ? "approved" : decision === "adjust" ? "adjusted" : "rejected";
  completionRecord.reviewReason = reason;
  completionRecord.reviewedAt = now;
  completionRecord.awardedStars = totalAwardedStars;
  touchPlanForMutation(plan, now);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "plan",
      entityId: plan.id,
      action: "plan.review",
      payload: {
        completionRecordId: completionRecord.id,
        decision,
        basePlanStars,
        fullAttendanceBonus,
        streakBonus,
        achievementBonus,
        totalAwardedStars,
      },
    },
    now,
  );

  const reasonSuffix = reason ? `，说明：${reason}` : "";
  if (decision === "reject") {
    pushActivity(nextState, "system", `积分审定拒绝：${plan.title}，本次不发放积分${reasonSuffix}`, now);
    return {
      ok: true,
      nextState,
      message: "已拒绝该任务积分，未发放奖励。",
    };
  }

  const rewardBreakdown = formatPlanRewardBreakdown(basePlanStars, fullAttendanceBonus, streakBonus, achievementBonus);
  const actionLabel = decision === "approve" ? "通过" : "调整";
  pushActivity(nextState, "system", `积分审定${actionLabel}：${plan.title}，发放 ${totalAwardedStars} 星（${rewardBreakdown}）${reasonSuffix}`, now);
  return {
    ok: true,
    nextState,
    message: `审定已${actionLabel}，共发放 ${totalAwardedStars} 星。`,
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
  touchHabitForMutation(habit, effectiveNow);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "habit",
      entityId: habit.id,
      action: "habit.check-in",
      payload: {
        dateKey,
        awardedPoints,
        useCustomPoints,
      },
    },
    effectiveNow,
  );

  if (habit.approvalRequired) {
    pushActivity(nextState, "habit-checked", `记录习惯打卡：${habit.name}，待家长审定积分 ${formatPoints(awardedPoints)}${noteSuffix}`, effectiveNow);
    return {
      ok: true,
      nextState,
      message: "已记录打卡，待家长审定后发放积分。",
    };
  }

  let streakBonus = 0;
  let achievementBonus = 0;
  if (awardedPoints !== 0) {
    pushTransaction(nextState, awardedPoints, useCustomPoints ? `习惯打卡调整积分：${habit.name}` : `习惯打卡：${habit.name}`, effectiveNow);
  }
  streakBonus = awardStreakBonusIfReached(nextState, dateKey, effectiveNow);
  achievementBonus = awardAchievementBonusIfReached(nextState, dateKey, effectiveNow);
  const streakSuffix = streakBonus > 0 ? `，连续打卡奖励 +${streakBonus}` : "";
  const achievementSuffix = achievementBonus > 0 ? `，成就奖励 +${achievementBonus}` : "";
  pushActivity(
    nextState,
    "habit-checked",
    `习惯打卡：${habit.name}，积分 ${formatPoints(awardedPoints)}${streakSuffix}${achievementSuffix}${noteSuffix}`,
    effectiveNow,
  );

  if (awardedPoints > 0) {
    return {
      ok: true,
      nextState,
      message: `已记录习惯打卡，获得 ${awardedPoints + streakBonus + achievementBonus} 星。`,
    };
  }

  if (awardedPoints < 0) {
    const bonusMessage = [streakBonus > 0 ? `连续打卡奖励 ${streakBonus} 星` : null, achievementBonus > 0 ? `成就奖励 ${achievementBonus} 星` : null]
      .filter(Boolean)
      .join("，");
    return {
      ok: true,
      nextState,
      message: bonusMessage
        ? `已记录习惯打卡，扣除 ${Math.abs(awardedPoints)} 星，并触发${bonusMessage}。`
        : `已记录习惯打卡，扣除 ${Math.abs(awardedPoints)} 星。`,
    };
  }

  return {
    ok: true,
    nextState,
    message:
      streakBonus > 0 || achievementBonus > 0
        ? `已记录习惯打卡，并触发${[
            streakBonus > 0 ? `连续打卡奖励 ${streakBonus} 星` : null,
            achievementBonus > 0 ? `成就奖励 ${achievementBonus} 星` : null,
          ]
            .filter(Boolean)
            .join("，")}。`
        : "已记录习惯打卡。",
  };
}

export function submitHabitCheckIn(
  state: AppState,
  habitId: string,
  dateKey: string,
  input: CheckInHabitInput = {},
  now: string = new Date().toISOString(),
): CommandResult {
  return checkInHabit(state, habitId, dateKey, input, now);
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
  touchRewardForMutation(reward, now);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "reward",
      entityId: reward.id,
      action: "reward.redeem",
      payload: { cost: reward.cost },
    },
    now,
  );
  pushTransaction(nextState, -reward.cost, `兑换奖励：${reward.title}`, now);
  pushActivity(nextState, "reward-redeemed", `已兑换奖励：${reward.title}，消耗 ${reward.cost} 星`, now);

  return {
    ok: true,
    nextState,
    message: `兑换成功，消耗 ${reward.cost} 星。`,
  };
}

function compareEntityRecency(left: { updatedAt: string; version: number }, right: { updatedAt: string; version: number }): number {
  const leftTime = Date.parse(left.updatedAt);
  const rightTime = Date.parse(right.updatedAt);
  const normalizedLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
  const normalizedRightTime = Number.isFinite(rightTime) ? rightTime : 0;
  if (normalizedLeftTime !== normalizedRightTime) {
    return normalizedLeftTime - normalizedRightTime;
  }

  const leftVersion = Number.isFinite(left.version) ? left.version : 0;
  const rightVersion = Number.isFinite(right.version) ? right.version : 0;
  return leftVersion - rightVersion;
}

function mergeEntitiesById<T extends { updatedAt: string; version: number }>(
  localItems: T[],
  remoteItems: T[],
  getId: (item: T) => string,
): { merged: T[]; remoteWins: number; localWins: number; conflicts: string[] } {
  const merged = [...localItems];
  const localIndexById = new Map<string, number>();
  for (let index = 0; index < merged.length; index += 1) {
    localIndexById.set(getId(merged[index]), index);
  }

  let remoteWins = 0;
  let localWins = 0;
  const conflicts: string[] = [];
  for (const remoteItem of remoteItems) {
    const id = getId(remoteItem);
    const localIndex = localIndexById.get(id);
    if (localIndex === undefined) {
      merged.push(remoteItem);
      localIndexById.set(id, merged.length - 1);
      remoteWins += 1;
      continue;
    }

    const localItem = merged[localIndex];
    const comparison = compareEntityRecency(localItem, remoteItem);
    if (comparison < 0) {
      merged[localIndex] = remoteItem;
      remoteWins += 1;
      if (comparison === 0) {
        conflicts.push(id);
      }
      continue;
    }

    localWins += 1;
    if (comparison === 0) {
      conflicts.push(id);
    }
  }

  return { merged, remoteWins, localWins, conflicts };
}

export function assignSyncDeviceId(state: AppState, deviceId: string): AppState {
  const normalizedDeviceId = typeof deviceId === "string" ? deviceId.trim() : "";
  if (!normalizedDeviceId || normalizedDeviceId === state.sync.deviceId) {
    return state;
  }

  const nextState = cloneState(state);
  nextState.sync.deviceId = normalizedDeviceId;
  nextState.sync.pendingOps = nextState.sync.pendingOps.map((pendingOp) => {
    if (pendingOp.deviceId !== LOCAL_DEVICE_PLACEHOLDER) {
      return pendingOp;
    }

    return {
      ...pendingOp,
      id: `${normalizedDeviceId}:${pendingOp.sequence}`,
      deviceId: normalizedDeviceId,
    };
  });
  return nextState;
}

export function acknowledgeSyncedOperations(
  state: AppState,
  syncedOperationIds: string[],
  syncedAt: string = new Date().toISOString(),
): AppState {
  const targetIds = new Set(syncedOperationIds.map((operationId) => operationId.trim()).filter(Boolean));
  if (targetIds.size === 0) {
    return state;
  }

  const nextState = cloneState(state);
  const previousCount = nextState.sync.pendingOps.length;
  nextState.sync.pendingOps = nextState.sync.pendingOps.filter((pendingOp) => !targetIds.has(pendingOp.id));
  if (nextState.sync.pendingOps.length === previousCount) {
    return state;
  }

  nextState.sync.lastSyncedAt = syncedAt;
  return nextState;
}

export function mergeStateForSync(localState: AppState, remoteState: AppState): SyncMergeResult {
  const normalizedLocal = normalizeState(localState);
  const normalizedRemote = normalizeState(remoteState);
  const mergedState = cloneState(normalizedLocal);

  let remoteWins = 0;
  let localWins = 0;
  const conflicts: string[] = [];

  const planMerge = mergeEntitiesById(mergedState.plans, normalizedRemote.plans, (plan) => plan.id);
  mergedState.plans = planMerge.merged;
  remoteWins += planMerge.remoteWins;
  localWins += planMerge.localWins;
  conflicts.push(...planMerge.conflicts.map((id) => `plan:${id}`));

  const habitMerge = mergeEntitiesById(mergedState.habits, normalizedRemote.habits, (habit) => habit.id);
  mergedState.habits = habitMerge.merged;
  remoteWins += habitMerge.remoteWins;
  localWins += habitMerge.localWins;
  conflicts.push(...habitMerge.conflicts.map((id) => `habit:${id}`));

  const rewardMerge = mergeEntitiesById(mergedState.rewards, normalizedRemote.rewards, (reward) => reward.id);
  mergedState.rewards = rewardMerge.merged;
  remoteWins += rewardMerge.remoteWins;
  localWins += rewardMerge.localWins;
  conflicts.push(...rewardMerge.conflicts.map((id) => `reward:${id}`));

  const companionMerge = mergeEntitiesById(mergedState.pets.companions, normalizedRemote.pets.companions, (companion) => companion.definitionId);
  mergedState.pets.companions = companionMerge.merged;
  remoteWins += companionMerge.remoteWins;
  localWins += companionMerge.localWins;
  conflicts.push(...companionMerge.conflicts.map((id) => `pet:${id}`));

  if (normalizedRemote.pets.activePetDefinitionId && mergedState.pets.companions.some((pet) => pet.definitionId === normalizedRemote.pets.activePetDefinitionId)) {
    const localActive = mergedState.pets.activePetDefinitionId
      ? mergedState.pets.companions.find((pet) => pet.definitionId === mergedState.pets.activePetDefinitionId)
      : null;
    const remoteActive = mergedState.pets.companions.find((pet) => pet.definitionId === normalizedRemote.pets.activePetDefinitionId) ?? null;
    if (!localActive || (remoteActive && compareEntityRecency(localActive, remoteActive) < 0)) {
      mergedState.pets.activePetDefinitionId = normalizedRemote.pets.activePetDefinitionId;
      remoteWins += 1;
    } else {
      localWins += 1;
    }
  }

  const transactionIds = new Set(mergedState.starTransactions.map((item) => item.id));
  for (const transaction of normalizedRemote.starTransactions) {
    if (transactionIds.has(transaction.id)) {
      continue;
    }
    mergedState.starTransactions.push(transaction);
    transactionIds.add(transaction.id);
    remoteWins += 1;
  }

  const activityIds = new Set(mergedState.activity.map((entry) => entry.id));
  for (const entry of normalizedRemote.activity) {
    if (activityIds.has(entry.id)) {
      continue;
    }
    mergedState.activity.push(entry);
    activityIds.add(entry.id);
    remoteWins += 1;
  }

  mergedState.version = VERSION;
  mergedState.meta.nextId = inferNextId(mergedState);
  mergedState.meta.lastUpdatedAt =
    compareEntityRecency(
      { updatedAt: mergedState.meta.lastUpdatedAt, version: 1 },
      { updatedAt: normalizedRemote.meta.lastUpdatedAt, version: 1 },
    ) < 0
      ? normalizedRemote.meta.lastUpdatedAt
      : mergedState.meta.lastUpdatedAt;

  mergedState.sync.schemaVersion = Math.max(mergedState.sync.schemaVersion, normalizedRemote.sync.schemaVersion);
  mergedState.sync.lastMutationSequence = Math.max(
    mergedState.sync.lastMutationSequence,
    mergedState.sync.pendingOps.reduce((max, pendingOp) => Math.max(max, pendingOp.sequence), 0),
  );
  mergedState.sync.lastSyncedAt = normalizedRemote.sync.lastSyncedAt ?? mergedState.sync.lastSyncedAt;

  return {
    mergedState: normalizeState(mergedState),
    remoteWins,
    localWins,
    conflicts: Array.from(new Set(conflicts)),
  };
}

export function markStateMutation(
  state: AppState,
  action: string,
  payload: unknown = null,
  now: string = new Date().toISOString(),
): AppState {
  const normalizedAction = action.trim();
  if (!normalizedAction) {
    return state;
  }

  const nextState = cloneState(state);
  queuePendingSyncOperation(
    nextState,
    {
      entityType: "state",
      entityId: null,
      action: normalizedAction,
      payload,
    },
    now,
  );
  return nextState;
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

  if (!state.sync.deviceId) {
    violations.push("sync.deviceId is required.");
  }

  if (state.sync.schemaVersion < 1) {
    violations.push("sync.schemaVersion must be positive.");
  }

  if (state.sync.lastMutationSequence < 0) {
    violations.push("sync.lastMutationSequence must be non-negative.");
  }

  if (
    state.sync.pendingOps.some(
      (pendingOp) =>
        !pendingOp.id ||
        !pendingOp.deviceId ||
        pendingOp.sequence <= 0 ||
        !pendingOp.action ||
        !pendingOp.createdAt,
    )
  ) {
    violations.push("sync.pendingOps must have valid id, device, sequence, action, and createdAt.");
  }

  if (
    state.plans.some(
      (plan) =>
        plan.minutes <= 0 ||
        plan.stars <= 0 ||
        !plan.title ||
        !plan.subject ||
        !isPlanRepeatType(plan.repeatType) ||
        (plan.approvalRequired && !plan.customStarsEnabled) ||
        !plan.updatedAt ||
        plan.version < 1,
    )
  ) {
    violations.push("Plans must have valid metadata, positive rewards, and approval settings.");
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
          !isPlanCompletionReviewStatus(record.reviewStatus) ||
          (record.reviewStatus === "pending" && record.reviewedAt !== null) ||
          (record.reviewStatus !== "pending" && !record.reviewedAt) ||
          record.attachments.length > 15 ||
          record.attachments.some((attachment) => !attachment.name || attachment.size < 0),
      ),
    )
  ) {
    violations.push("Plan completion records must have valid review state, durations, timestamps, and attachment metadata.");
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
        !habit.color ||
        !habit.updatedAt ||
        habit.version < 1,
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
        !reward.updatedAt ||
        reward.version < 1 ||
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
        companion.mood > 100 ||
        !companion.updatedAt ||
        companion.version < 1,
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
