import { getHabitProgress, getRewardRedeemSummary, type AppState, type Reward } from "../../domain/model.js";
import { formatWishCategoryLabel, formatWishRepeatModeLabel } from "./wish-config.js";

export interface PointsSummaryMetrics {
  weekEarned: number;
  monthEarned: number;
  spentTotal: number;
}

export interface DailyPointOpportunity {
  id: string;
  label: string;
  stars: number;
}

export interface RewardWishlistItem {
  reward: Reward;
  badge: string;
  icon: string;
  image: string | null;
  shortfall: number;
  canRedeem: boolean;
  modeLabel: string;
  remainingLabel: string;
}

export interface RewardWishlistGroup {
  id: string;
  title: string;
  count: number;
  rewards: RewardWishlistItem[];
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  rewardStars: number;
  icon: string;
  accent: string;
  unlockedAt: string;
}

export interface AchievementOverview {
  unlockedCount: number;
  totalCount: number;
  rewardStars: number;
  badges: AchievementBadge[];
}

export type PointsHistoryRangePreset = "all" | "7d" | "30d" | "90d" | "custom";
export type PointsHistoryRecordType = "all" | "gain" | "spend";

export interface PointsHistoryRange {
  startDateKey: string;
  endDateKey: string;
}

export interface PointsHistorySummary {
  earned: number;
  spent: number;
  net: number;
  recordCount: number;
}

export interface PointsHistoryRecord {
  id: string;
  title: string;
  category: string;
  statusLabel: string | null;
  amount: number;
  createdAt: string;
  kind: "gain" | "spend";
  timeLabel: string;
}

export interface PointsHistoryGroup {
  dateKey: string;
  title: string;
  totalAmount: number;
  records: PointsHistoryRecord[];
}

export interface PointsHistoryView {
  range: PointsHistoryRange;
  summary: PointsHistorySummary;
  groups: PointsHistoryGroup[];
}

function createDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function isSameMonth(leftDateKey: string, rightDateKey: string): boolean {
  const left = parseDateKey(leftDateKey);
  const right = parseDateKey(rightDateKey);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function getRewardBadge(title: string): string {
  if (title.includes("电影") || title.includes("游戏") || title.includes("玩")) {
    return "休闲";
  }

  if (title.includes("文具") || title.includes("书") || title.includes("阅读")) {
    return "学习";
  }

  return "愿望";
}

function getRewardIcon(title: string): string {
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

  return "🎁";
}

const legacyRewardHelpers = [getRewardBadge, getRewardIcon];
void legacyRewardHelpers;

function shiftDateKey(dateKey: string, offsetDays: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + offsetDays);
  return createDateKey(date);
}

function formatClockLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getPointsRecordTitle(reason: string): string {
  const separatorIndex = reason.indexOf("：");
  if (separatorIndex >= 0 && separatorIndex < reason.length - 1) {
    return reason.slice(separatorIndex + 1).trim();
  }

  return reason;
}

function getPointsRecordCategory(reason: string): string {
  if (reason.includes("计划")) {
    return "学习";
  }

  if (reason.includes("习惯")) {
    return "习惯";
  }

  if (reason.includes("奖励") || reason.includes("愿望")) {
    return "奖励";
  }

  if (reason.includes("宠物")) {
    return "宠物";
  }

  if (reason.includes("初始") || reason.includes("系统")) {
    return "系统";
  }

  return "积分";
}

function getPointsRecordStatus(reason: string, amount: number): string | null {
  if (amount < 0) {
    return "已消费";
  }

  if (reason.includes("审批") || reason.includes("审定")) {
    return "已审定";
  }

  return "已入账";
}

function toPointsHistoryRecord(transaction: AppState["starTransactions"][number]): PointsHistoryRecord {
  return {
    id: transaction.id,
    title: getPointsRecordTitle(transaction.reason),
    category: getPointsRecordCategory(transaction.reason),
    statusLabel: getPointsRecordStatus(transaction.reason, transaction.amount),
    amount: transaction.amount,
    createdAt: transaction.createdAt,
    kind: transaction.amount >= 0 ? "gain" : "spend",
    timeLabel: formatClockLabel(transaction.createdAt),
  };
}

function resolvePointsHistoryRange(records: PointsHistoryRecord[], referenceDateKey: string, rangePreset: PointsHistoryRangePreset): PointsHistoryRange {
  if (rangePreset === "all") {
    const oldestDateKey = records[records.length - 1] ? createDateKey(new Date(records[records.length - 1].createdAt)) : referenceDateKey;
    return {
      startDateKey: oldestDateKey,
      endDateKey: referenceDateKey,
    };
  }

  if (rangePreset === "7d") {
    return {
      startDateKey: shiftDateKey(referenceDateKey, -6),
      endDateKey: referenceDateKey,
    };
  }

  if (rangePreset === "90d") {
    return {
      startDateKey: shiftDateKey(referenceDateKey, -89),
      endDateKey: referenceDateKey,
    };
  }

  return {
    startDateKey: shiftDateKey(referenceDateKey, -29),
    endDateKey: referenceDateKey,
  };
}

function isDateKeyWithinRange(dateKey: string, range: PointsHistoryRange): boolean {
  return dateKey >= range.startDateKey && dateKey <= range.endDateKey;
}

function getTotalRecordedStudyMinutes(state: AppState): number {
  return state.plans
    .filter((plan) => plan.status === "done" || plan.completionRecords.length > 0)
    .reduce((total, plan) => {
      if (plan.completionRecords.length === 0) {
        return total + plan.minutes;
      }

      const recordedMinutes = plan.completionRecords.reduce((recordTotal, record) => recordTotal + Math.max(1, Math.round(record.durationSeconds / 60)), 0);
      return total + recordedMinutes;
    }, 0);
}

function getTotalHabitCheckIns(state: AppState): number {
  return state.habits.reduce((total, habit) => total + Object.values(habit.completions).reduce((sum, count) => sum + count, 0), 0);
}

function getLongestAchievementStreak(state: AppState): { count: number; latestDateKey: string | null } {
  const dateKeys = new Set<string>();

  for (const plan of state.plans) {
    if (plan.completedAt) {
      dateKeys.add(createDateKey(new Date(plan.completedAt)));
    }
    for (const record of plan.completionRecords) {
      dateKeys.add(createDateKey(new Date(record.completedAt)));
    }
  }

  for (const habit of state.habits) {
    for (const [dateKey, count] of Object.entries(habit.completions)) {
      if (count > 0) {
        dateKeys.add(dateKey);
      }
    }
  }

  const ordered = [...dateKeys].sort((left, right) => parseDateKey(right).getTime() - parseDateKey(left).getTime());
  if (ordered.length === 0) {
    return { count: 0, latestDateKey: null };
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = parseDateKey(ordered[index - 1]);
    const currentDate = parseDateKey(ordered[index]);
    const deltaDays = Math.round((previous.getTime() - currentDate.getTime()) / 86400000);

    if (deltaDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return {
    count: longest,
    latestDateKey: ordered[0],
  };
}

export function summarizePointsMetrics(state: AppState, referenceDateKey: string): PointsSummaryMetrics {
  const weekKeys = new Set(getWeekDateKeys(referenceDateKey));
  let weekEarned = 0;
  let monthEarned = 0;
  let spentTotal = 0;

  for (const transaction of state.starTransactions) {
    const transactionDateKey = createDateKey(new Date(transaction.createdAt));

    if (transaction.amount > 0 && weekKeys.has(transactionDateKey)) {
      weekEarned += transaction.amount;
    }

    if (transaction.amount > 0 && isSameMonth(transactionDateKey, referenceDateKey)) {
      monthEarned += transaction.amount;
    }

    if (transaction.amount < 0) {
      spentTotal += Math.abs(transaction.amount);
    }
  }

  return {
    weekEarned,
    monthEarned,
    spentTotal,
  };
}

export function buildDailyPointOpportunities(state: AppState, referenceDateKey: string): DailyPointOpportunity[] {
  const opportunities: DailyPointOpportunity[] = [];
  const pendingPlans = state.plans.filter((plan) => plan.status === "pending");
  const pendingPlanStars = pendingPlans.reduce((total, plan) => total + plan.stars, 0);

  if (pendingPlans.length > 0 && pendingPlanStars > 0) {
    opportunities.push({
      id: "plans",
      label: `完成剩余 ${pendingPlans.length} 个任务`,
      stars: pendingPlanStars,
    });
  }

  const remainingHabitCheckIns = state.habits
    .filter((habit) => habit.status === "active" && habit.points > 0)
    .reduce(
      (total, habit) => {
        const progress = getHabitProgress(habit, referenceDateKey);
        return {
          count: total.count + progress.remaining,
          stars: total.stars + progress.remaining * habit.points,
        };
      },
      { count: 0, stars: 0 },
    );

  if (remainingHabitCheckIns.count > 0 && remainingHabitCheckIns.stars > 0) {
    opportunities.push({
      id: "habits",
      label: `完成剩余 ${remainingHabitCheckIns.count} 次习惯打卡`,
      stars: remainingHabitCheckIns.stars,
    });
  }

  return opportunities;
}

export function buildRewardWishlistGroups(rewards: Reward[], starBalance: number): RewardWishlistGroup[] {
  if (rewards.length === 0) {
    return [];
  }

  const items = [...rewards]
    .sort((left, right) => {
      const availabilityDelta = Number(getRewardRedeemSummary(right, starBalance).canRedeem) - Number(getRewardRedeemSummary(left, starBalance).canRedeem);
      if (availabilityDelta !== 0) {
        return availabilityDelta;
      }

      return left.cost - right.cost || left.title.localeCompare(right.title, "zh-CN");
    })
    .map((reward) => {
      const redeemSummary = getRewardRedeemSummary(reward, starBalance);
      return {
        reward,
        badge: formatWishCategoryLabel(reward.category),
        icon: reward.icon,
        image: reward.customImage,
        shortfall: redeemSummary.shortfall,
        canRedeem: redeemSummary.canRedeem,
        modeLabel: formatWishRepeatModeLabel(reward.repeatMode),
        remainingLabel: redeemSummary.remainingLabel,
      };
    });

  return [
    {
      id: "wishlist",
      title: "可兑换愿望",
      count: items.length,
      rewards: items,
    },
  ];
}

export function buildAchievementOverview(state: AppState): AchievementOverview {
  const completedPlans = state.plans.flatMap((plan) =>
    plan.completionRecords.length > 0 ? plan.completionRecords.map((record) => ({ plan, completedAt: record.completedAt })) : [],
  );
  const completedPlanCount = completedPlans.length;
  const totalStudyMinutes = getTotalRecordedStudyMinutes(state);
  const totalHabitCheckIns = getTotalHabitCheckIns(state);
  const streak = getLongestAchievementStreak(state);

  const definitions = [
    {
      id: "first-plan",
      title: "完成第一项任务",
      description: "解锁你的第一个学习任务成就。",
      rewardStars: 2,
      icon: "🏁",
      accent: "#2f6dff",
      unlockedAt: completedPlans[0]?.completedAt ?? null,
      unlocked: completedPlanCount >= 1,
    },
    {
      id: "focus-rookie",
      title: "专注两小时",
      description: "累计学习时长达到 120 分钟。",
      rewardStars: 4,
      icon: "⏳",
      accent: "#ff8a3d",
      unlockedAt: completedPlans[0]?.completedAt ?? null,
      unlocked: totalStudyMinutes >= 120,
    },
    {
      id: "habit-runner",
      title: "习惯打卡达人",
      description: "累计完成 7 次习惯打卡。",
      rewardStars: 3,
      icon: "✅",
      accent: "#15a170",
      unlockedAt: streak.latestDateKey ? `${streak.latestDateKey}T00:00:00.000Z` : null,
      unlocked: totalHabitCheckIns >= 7,
    },
    {
      id: "streak-keeper",
      title: "连续坚持三天",
      description: "连续三天都完成学习或习惯任务。",
      rewardStars: 5,
      icon: "🔥",
      accent: "#d946ef",
      unlockedAt: streak.latestDateKey ? `${streak.latestDateKey}T00:00:00.000Z` : null,
      unlocked: streak.count >= 3,
    },
  ];

  const badges = definitions
    .filter((definition) => definition.unlocked && definition.unlockedAt)
    .map((definition) => ({
      id: definition.id,
      title: definition.title,
      description: definition.description,
      rewardStars: definition.rewardStars,
      icon: definition.icon,
      accent: definition.accent,
      unlockedAt: definition.unlockedAt ?? new Date().toISOString(),
    }));

  return {
    unlockedCount: badges.length,
    totalCount: badges.length,
    rewardStars: badges.reduce((total, badge) => total + badge.rewardStars, 0),
    badges,
  };
}

export function formatPointsHistoryDateLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatPointsHistoryRangeLabel(range: PointsHistoryRange): string {
  return `${range.startDateKey} 至 ${range.endDateKey}`;
}

export function buildPointsHistoryView(
  state: AppState,
  referenceDateKey: string,
  rangePreset: Exclude<PointsHistoryRangePreset, "custom">,
  recordType: PointsHistoryRecordType,
): PointsHistoryView {
  const records = [...state.starTransactions]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 100)
    .map(toPointsHistoryRecord);
  const range = resolvePointsHistoryRange(records, referenceDateKey, rangePreset);
  const rangeFiltered = records.filter((record) => isDateKeyWithinRange(createDateKey(new Date(record.createdAt)), range));
  const visibleRecords =
    recordType === "all" ? rangeFiltered : rangeFiltered.filter((record) => (recordType === "gain" ? record.amount >= 0 : record.amount < 0));

  const summary = visibleRecords.reduce(
    (current, record) => ({
      earned: current.earned + (record.amount > 0 ? record.amount : 0),
      spent: current.spent + (record.amount < 0 ? Math.abs(record.amount) : 0),
      net: current.net + record.amount,
      recordCount: current.recordCount + 1,
    }),
    {
      earned: 0,
      spent: 0,
      net: 0,
      recordCount: 0,
    },
  );

  const groups = visibleRecords.reduce<PointsHistoryGroup[]>((current, record) => {
    const dateKey = createDateKey(new Date(record.createdAt));
    const existingGroup = current[current.length - 1];

    if (!existingGroup || existingGroup.dateKey !== dateKey) {
      current.push({
        dateKey,
        title: formatPointsHistoryDateLabel(dateKey),
        totalAmount: record.amount,
        records: [record],
      });
      return current;
    }

    existingGroup.totalAmount += record.amount;
    existingGroup.records.push(record);
    return current;
  }, []);

  return {
    range,
    summary,
    groups,
  };
}
