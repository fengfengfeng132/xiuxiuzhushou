import {
  PET_INTERACTION_ACTIONS,
  currentDateKey,
  getActivePetCompanion,
  getHabitProgress,
  isPlanCompletedForDate,
  isPlanScheduledForDate,
  getPetDefinition,
  summarizeState,
  type ActivityEntry,
  type AppState,
  type Habit,
  type OwnedPet,
  type PetDefinition,
  type StudyPlan,
} from "../domain/model.js";
import type {
  HabitBoardFilter,
  HabitStatsRange,
  HabitStatsSummary,
  MetricCard,
  MoreFeatureCard,
  PetNeedCard,
  SubjectStyle,
} from "./app-types.js";

// Shared date, formatting, and derived-view helpers are kept outside the stateful shell on purpose.
export function createDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDateKey(dateKey: string, offset: number): string {
  const source = parseDateKey(dateKey);
  source.setDate(source.getDate() + offset);
  return createDateKey(source);
}

export function getWeekDates(selectedDateKey: string): string[] {
  const selected = parseDateKey(selectedDateKey);
  const mondayOffset = (selected.getDay() + 6) % 7;
  const start = new Date(selected);
  start.setDate(selected.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return createDateKey(current);
  });
}

export function getWeekNumber(date: Date): number {
  const target = new Date(date);
  const dayNumber = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
}

export function formatWeekLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}年${date.getMonth() + 1}月 第${getWeekNumber(date)}周`;
}

export function formatDateLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatClock(isoDate: string | null): string {
  if (!isoDate) {
    return "--:--";
  }
  const date = new Date(isoDate);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function getSubjectStyle(subject: string): SubjectStyle {
  const palette: Record<string, SubjectStyle> = {
    语文: { accent: "#ff8a3d", tint: "rgba(255, 138, 61, 0.16)", glow: "rgba(255, 138, 61, 0.22)" },
    数学: { accent: "#2f6dff", tint: "rgba(47, 109, 255, 0.16)", glow: "rgba(47, 109, 255, 0.26)" },
    英语: { accent: "#15a39a", tint: "rgba(21, 163, 154, 0.16)", glow: "rgba(21, 163, 154, 0.24)" },
    物理: { accent: "#7b61ff", tint: "rgba(123, 97, 255, 0.16)", glow: "rgba(123, 97, 255, 0.24)" },
    化学: { accent: "#24b47e", tint: "rgba(36, 180, 126, 0.16)", glow: "rgba(36, 180, 126, 0.22)" },
    生物: { accent: "#58b84f", tint: "rgba(88, 184, 79, 0.16)", glow: "rgba(88, 184, 79, 0.22)" },
    历史: { accent: "#b97945", tint: "rgba(185, 121, 69, 0.16)", glow: "rgba(185, 121, 69, 0.22)" },
    地理: { accent: "#2b8f97", tint: "rgba(43, 143, 151, 0.16)", glow: "rgba(43, 143, 151, 0.22)" },
    政治: { accent: "#d14d72", tint: "rgba(209, 77, 114, 0.16)", glow: "rgba(209, 77, 114, 0.22)" },
    道德与法治: { accent: "#8f55d1", tint: "rgba(143, 85, 209, 0.16)", glow: "rgba(143, 85, 209, 0.22)" },
    信息技术: { accent: "#3f7cf6", tint: "rgba(63, 124, 246, 0.16)", glow: "rgba(63, 124, 246, 0.22)" },
    运动: { accent: "#ff6b3d", tint: "rgba(255, 107, 61, 0.16)", glow: "rgba(255, 107, 61, 0.22)" },
    娱乐: { accent: "#ef5b7c", tint: "rgba(239, 91, 124, 0.16)", glow: "rgba(239, 91, 124, 0.22)" },
    技能: { accent: "#8d5cf6", tint: "rgba(141, 92, 246, 0.16)", glow: "rgba(141, 92, 246, 0.24)" },
  };
  return palette[subject] ?? { accent: "#3c5b7f", tint: "rgba(60, 91, 127, 0.16)", glow: "rgba(60, 91, 127, 0.22)" };
}

export function getCompletedPlansForDate(plans: StudyPlan[], dateKey: string): StudyPlan[] {
  return plans.filter((plan) => isPlanCompletedForDate(plan, dateKey));
}

export function getPendingPlansForDate(plans: StudyPlan[], dateKey: string): StudyPlan[] {
  return plans.filter((plan) => isPlanScheduledForDate(plan, dateKey) && !isPlanCompletedForDate(plan, dateKey));
}

export function buildHeroSummary(state: AppState, today: string): string {
  const summary = summarizeState(state, today);
  return `${state.profile.name} 今天还有 ${summary.pendingPlans} 个学习计划待完成，已经记录 ${summary.todayHabitCheckins} 次习惯打卡，当前累计 ${summary.starBalance} 颗星星。`;
}

export function createMetricCards(state: AppState, today: string): MetricCard[] {
  const summary = summarizeState(state, today);
  const activeHabits = state.habits.filter((habit) => habit.status === "active");
  const completedToday = getCompletedPlansForDate(state.plans, today);
  const totalPlans = state.plans.length;
  const completionRate = totalPlans === 0 ? 0 : Math.round((state.plans.filter((plan) => plan.status === "done").length / totalPlans) * 100);
  const activePetCompanion = getActivePetCompanion(state);
  const activePetDefinition = activePetCompanion ? getPetDefinition(activePetCompanion.definitionId) : null;
  const petSummaryValue = activePetDefinition ? activePetDefinition.name : state.pets.companions.length > 0 ? `${state.pets.companions.length}只` : "待领养";
  const petSummaryHint = activePetDefinition
    ? `和${activePetDefinition.name}互动，继续提升亲密度`
    : state.pets.companions.length > 0
      ? "打开电子宠物中心，继续切换和陪伴"
      : "打开电子宠物中心，领养第一只伙伴";
  return [
    { id: "study-minutes", title: "今日学习时间", value: `${completedToday.reduce((sum, plan) => sum + getRecordedPlanMinutes(plan), 0)}分钟`, hint: completedToday.length ? `已完成 ${completedToday.length} 项计划` : "今天还没有完成记录", tone: "blue" },
    { id: "pending-plans", title: "今日任务量", value: `${summary.pendingPlans}/${Math.max(totalPlans, summary.pendingPlans)}`, hint: "点击回到首页计划面板", tone: "cyan" },
    { id: "completion-rate", title: "今日完成率", value: `${completionRate}%`, hint: "按已保存学习计划计算", tone: "orange" },
    { id: "stars", title: "积分成就", value: `${summary.starBalance}星`, hint: `${summary.redeemableRewards} 个愿望可兑换`, tone: "violet" },
    { id: "habits", title: "行为习惯", value: `${activeHabits.length}个`, hint: activeHabits.length ? "进入习惯管理页" : "创建第一个习惯", tone: "green" },
    { id: "more", title: "其他", value: "更多功能", hint: "打开完整功能导航", tone: "slate" },
    { id: "pet", title: "电子宠物", value: petSummaryValue, hint: petSummaryHint, tone: "pet" },
    { id: "help", title: "使用帮助", value: "功能手册", hint: "打开完整操作说明", tone: "help" },
  ];
}

export function formatActivityKind(kind: ActivityEntry["kind"]): string {
  switch (kind) {
    case "plan-added":
      return "新增计划";
    case "plan-completed":
      return "完成计划";
    case "habit-created":
      return "创建习惯";
    case "habit-checked":
      return "习惯打卡";
    case "reward-redeemed":
      return "兑换奖励";
    case "pet-adopted":
      return "领养宠物";
    case "pet-switched":
      return "切换宠物";
    case "pet-interacted":
      return "宠物互动";
    case "pet-recycled":
      return "回收宠物";
    default:
      return "系统";
  }
}

export function matchesMoreFeatureCard(card: MoreFeatureCard, keyword: string): boolean {
  if (keyword.length === 0) {
    return true;
  }

  const normalizedKeyword = keyword.toLowerCase();
  return (
    card.title.toLowerCase().includes(normalizedKeyword) ||
    card.description.toLowerCase().includes(normalizedKeyword) ||
    card.keywords.some((item) => item.toLowerCase().includes(normalizedKeyword))
  );
}

export function getLatestPlanCompletionRecord(plan: StudyPlan): StudyPlan["completionRecords"][number] | null {
  return plan.completionRecords[0] ?? null;
}

export function getRecordedPlanSeconds(plan: StudyPlan): number {
  return getLatestPlanCompletionRecord(plan)?.durationSeconds ?? plan.minutes * 60;
}

export function getRecordedPlanMinutes(plan: StudyPlan): number {
  return Math.max(1, Math.round(getRecordedPlanSeconds(plan) / 60));
}

export function formatDurationSummary(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "0分钟";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}分钟`);
  }
  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds}秒`);
  }

  return parts.join(" ") || "0分钟";
}

export function formatAttachmentSize(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)}MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)}KB`;
  }

  return `${size}B`;
}

export function formatMonthDayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatSignedPoints(points: number): string {
  if (points > 0) {
    return `+${points}`;
  }
  return `${points}`;
}

export function matchesHabitFilter(habit: Habit, filter: HabitBoardFilter, dateKey: string): boolean {
  const progress = getHabitProgress(habit, dateKey);
  const isCompleted = progress.count >= progress.limit;

  switch (filter) {
    case "positive":
      return habit.points > 0;
    case "negative":
      return habit.points < 0;
    case "completed":
      return isCompleted;
    case "pending":
      return !isCompleted;
    case "dailyMultiple":
      return habit.frequency === "dailyMultiple";
    case "weeklyMultiple":
      return habit.frequency === "weeklyMultiple";
    default:
      return true;
  }
}

export function matchesHabitStatsRange(dateKey: string, range: HabitStatsRange, referenceDateKey: string): boolean {
  if (range === "history") {
    return true;
  }

  if (range === "week") {
    return getWeekDates(referenceDateKey).includes(dateKey);
  }

  const target = parseDateKey(referenceDateKey);
  const candidate = parseDateKey(dateKey);
  return target.getFullYear() === candidate.getFullYear() && target.getMonth() === candidate.getMonth();
}

export function summarizeHabitStats(state: AppState, habits: Habit[], range: HabitStatsRange, referenceDateKey: string): HabitStatsSummary {
  const rows = habits
    .map((habit) => {
      const checkIns = Object.entries(habit.completions).reduce((total, [dateKey, count]) => {
        if (!matchesHabitStatsRange(dateKey, range, referenceDateKey)) {
          return total;
        }
        return total + count;
      }, 0);

      const points = state.starTransactions.reduce((total, transaction) => {
        const transactionDateKey = currentDateKey(transaction.createdAt);
        if (!matchesHabitStatsRange(transactionDateKey, range, referenceDateKey)) {
          return total;
        }
        const isHabitTransaction =
          (transaction.reason.startsWith("习惯打卡：") || transaction.reason.startsWith("习惯打卡调整积分：")) &&
          transaction.reason.includes(habit.name);
        return isHabitTransaction ? total + transaction.amount : total;
      }, 0);

      return {
        habitId: habit.id,
        name: habit.name,
        checkIns,
        points,
      };
    })
    .filter((row) => row.checkIns > 0)
    .sort((left, right) => right.checkIns - left.checkIns || right.points - left.points || left.name.localeCompare(right.name, "zh-CN"));

  const checkIns = rows.reduce((total, row) => total + row.checkIns, 0);
  const totalPoints = rows.reduce((total, row) => total + row.points, 0);
  const habitCount = rows.length;
  const averagePoints = checkIns === 0 ? 0 : Math.round((totalPoints / checkIns) * 10) / 10;

  return {
    checkIns,
    totalPoints,
    habitCount,
    averagePoints,
    rows,
  };
}

export function buildPetStatusCopy(companion: OwnedPet, definition: PetDefinition): string {
  if (companion.lastInteractionId) {
    const action = PET_INTERACTION_ACTIONS.find((item) => item.id === companion.lastInteractionId);
    if (action) {
      return `${definition.name}${action.successMessage}`;
    }
  }

  if (companion.satiety < 60) {
    return `${definition.name} 有点饿了，记得来喂喂它。`;
  }

  if (companion.cleanliness < 60) {
    return `${definition.name} 想洗香香，准备一点泡泡吧。`;
  }

  if (companion.mood < 60) {
    return `${definition.name} 想和你一起出去走走。`;
  }

  return `今天${definition.name}状态很好，正摇着尾巴等你来陪它。`;
}

export function createPetNeedCards(companion: OwnedPet): PetNeedCard[] {
  return [
    { id: "satiety", title: "饱腹", icon: "🍽", value: companion.satiety, helper: "吃得饱饱的" },
    { id: "cleanliness", title: "清洁", icon: "🫧", value: companion.cleanliness, helper: "干净又蓬松" },
    { id: "mood", title: "心情", icon: "🙂", value: companion.mood, helper: "今天很开心" },
  ];
}
