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
import type { DashboardConfigPreference, DashboardModuleId } from "../persistence/storage.js";
import { DASHBOARD_MODULE_DEFINITIONS } from "./app-content.js";
import type {
  DashboardModuleDefinition,
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
    语文: { accent: "#9BA66A", tint: "rgba(155, 166, 106, 0.16)", glow: "rgba(155, 166, 106, 0.22)" },
    数学: { accent: "#4B8C70", tint: "rgba(75, 140, 112, 0.16)", glow: "rgba(75, 140, 112, 0.24)" },
    英语: { accent: "#7A9CA4", tint: "rgba(122, 156, 164, 0.16)", glow: "rgba(122, 156, 164, 0.22)" },
    物理: { accent: "#5E9A80", tint: "rgba(94, 154, 128, 0.16)", glow: "rgba(94, 154, 128, 0.22)" },
    化学: { accent: "#5A9B7E", tint: "rgba(90, 155, 126, 0.16)", glow: "rgba(90, 155, 126, 0.22)" },
    生物: { accent: "#74AB90", tint: "rgba(116, 171, 144, 0.16)", glow: "rgba(116, 171, 144, 0.22)" },
    历史: { accent: "#9BA66A", tint: "rgba(155, 166, 106, 0.16)", glow: "rgba(155, 166, 106, 0.22)" },
    地理: { accent: "#7A9CA4", tint: "rgba(122, 156, 164, 0.16)", glow: "rgba(122, 156, 164, 0.22)" },
    政治: { accent: "#9F7F69", tint: "rgba(159, 127, 105, 0.16)", glow: "rgba(159, 127, 105, 0.22)" },
    道德与法治: { accent: "#7CAD93", tint: "rgba(124, 173, 147, 0.16)", glow: "rgba(124, 173, 147, 0.22)" },
    信息技术: { accent: "#64A187", tint: "rgba(100, 163, 134, 0.16)", glow: "rgba(100, 163, 134, 0.22)" },
    运动: { accent: "#9BA66A", tint: "rgba(155, 166, 106, 0.16)", glow: "rgba(155, 166, 106, 0.22)" },
    娱乐: { accent: "#8FA490", tint: "rgba(143, 164, 144, 0.16)", glow: "rgba(143, 164, 144, 0.22)" },
    技能: { accent: "#7CAD93", tint: "rgba(124, 173, 147, 0.16)", glow: "rgba(124, 173, 147, 0.22)" },
  };
  return palette[subject] ?? { accent: "#5D7769", tint: "rgba(93, 119, 105, 0.16)", glow: "rgba(93, 119, 105, 0.22)" };
}

export function getCompletedPlansForDate(plans: StudyPlan[], dateKey: string): StudyPlan[] {
  return plans.filter((plan) => isPlanCompletedForDate(plan, dateKey));
}

export function getPendingPlansForDate(plans: StudyPlan[], dateKey: string): StudyPlan[] {
  return plans.filter((plan) => isPlanScheduledForDate(plan, dateKey) && !isPlanCompletedForDate(plan, dateKey));
}

export function buildHeroSummary(state: AppState, today: string): string {
  if (state.profile.id === "profile_guest") {
    return "请点击右上角“用户登录”，创建自己的名字后开始记录学习。";
  }
  const summary = summarizeState(state, today);
  return `${state.profile.name} 今天还有 ${summary.pendingPlans} 个学习计划待完成，已经记录 ${summary.todayHabitCheckins} 次习惯打卡，当前累计 ${summary.starBalance} 颗星星。`;
}

const DASHBOARD_MODULE_LOOKUP = new Map<DashboardModuleId, DashboardModuleDefinition>(
  DASHBOARD_MODULE_DEFINITIONS.map((definition) => [definition.id, definition]),
);

function createStaticMetricCard(definition: DashboardModuleDefinition, value: string, hint: string): MetricCard {
  return {
    id: definition.id,
    title: definition.title,
    value,
    hint,
    tone: definition.tone,
    action: definition.action,
    message: definition.message,
  };
}

function buildDashboardMetricCard(
  moduleId: DashboardModuleId,
  context: {
    state: AppState;
    today: string;
    summary: ReturnType<typeof summarizeState>;
    activeHabits: Habit[];
    completedToday: StudyPlan[];
    pendingToday: StudyPlan[];
  },
): MetricCard {
  const definition = DASHBOARD_MODULE_LOOKUP.get(moduleId);
  if (!definition) {
    return {
      id: moduleId,
      title: moduleId,
      value: "--",
      hint: "模块定义缺失。",
      tone: "slate",
      action: "placeholder",
      message: "该模块定义缺失，请刷新后重试。",
    };
  }

  const { summary, activeHabits, completedToday, pendingToday } = context;
  const todayPlanCount = completedToday.length + pendingToday.length;
  const recordedStudyMinutes = completedToday.reduce((total, plan) => total + getRecordedPlanMinutes(plan), 0);
  const exerciseMinutes = completedToday
    .filter((plan) => plan.subject === "运动")
    .reduce((total, plan) => total + getRecordedPlanMinutes(plan), 0);
  const remainingMinutes = pendingToday.reduce((total, plan) => total + plan.minutes, 0);
  const completionRate = todayPlanCount === 0 ? 0 : Math.round((completedToday.length / todayPlanCount) * 100);

  switch (moduleId) {
    case "remaining-time":
      return createStaticMetricCard(
        definition,
        `${remainingMinutes}分钟`,
        pendingToday.length > 0 ? `剩余 ${pendingToday.length} 项计划待完成` : "今天暂时没有待完成计划",
      );
    case "study-time":
      return createStaticMetricCard(
        definition,
        `${recordedStudyMinutes}分钟`,
        completedToday.length > 0 ? `已完成 ${completedToday.length} 项学习计划` : "今天还没有完成记录",
      );
    case "exercise-time":
      return createStaticMetricCard(definition, `${exerciseMinutes}分钟`, exerciseMinutes > 0 ? "来自运动类学习计划" : "还没有记录运动类时长");
    case "task-count":
      return createStaticMetricCard(
        definition,
        `${todayPlanCount}项`,
        todayPlanCount > 0 ? `其中 ${pendingToday.length} 项待完成` : "今天还没有安排学习计划",
      );
    case "star-count":
      return createStaticMetricCard(definition, `${summary.starBalance}星`, `${summary.redeemableRewards} 个愿望当前可兑换`);
    case "completion-rate":
      return createStaticMetricCard(
        definition,
        `${completionRate}%`,
        todayPlanCount > 0 ? `今天已完成 ${completedToday.length}/${todayPlanCount} 项` : "今天还没有学习计划",
      );
    case "chart-stats":
      return createStaticMetricCard(definition, "趋势复盘", activeHabits.length > 0 ? "打开图表统计查看近况" : "创建习惯后可查看统计图表");
    case "points-achievement":
      return createStaticMetricCard(definition, `${summary.starBalance}星`, `${summary.redeemableRewards} 个愿望可兑换`);
    case "habit-management":
      return createStaticMetricCard(definition, `${activeHabits.length}个`, activeHabits.length > 0 ? "打开习惯管理继续打卡" : "创建第一个行为习惯");
    case "score-tracking":
      return createStaticMetricCard(definition, "录入成绩", "考试成绩录入和历史记录仍在开发中");
    case "score-analysis":
      return createStaticMetricCard(definition, "专项分析", "薄弱项分析页面将在后续继续补齐");
    case "morning-reading":
      return createStaticMetricCard(definition, "晨读计划", "打开 337 晨读继续安排任务");
    case "reading-journey":
      return createStaticMetricCard(definition, "阅读旅程", "管理书架、阅读记录和统计");
    case "height-management":
      return createStaticMetricCard(definition, "成长档案", "打开身高管理查看趋势和记录");
    case "interest-class":
      return createStaticMetricCard(definition, "课程记录", "打开兴趣班记录查看课时消耗");
    case "todos":
      return createStaticMetricCard(definition, "待整理", "待办事项模块仍在开发中");
    case "listening":
      return createStaticMetricCard(definition, "背诵练习", "听写背诵工作区仍在开发中");
    case "focus-timer":
      return createStaticMetricCard(definition, pendingToday.length > 0 ? `待开始 ${pendingToday.length} 项` : "专注模式", "打开专注计时器进入计时页");
    case "savings":
      return createStaticMetricCard(definition, "余额流水", "存钱罐模块仍在开发中");
    case "pet":
      return createStaticMetricCard(
        definition,
        (() => {
          const activePetCompanion = getActivePetCompanion(context.state);
          const activePetDefinition = activePetCompanion ? getPetDefinition(activePetCompanion.definitionId) : null;
          return activePetDefinition ? activePetDefinition.name : context.state.pets.companions.length > 0 ? `${context.state.pets.companions.length}只` : "待领养";
        })(),
        (() => {
          const activePetCompanion = getActivePetCompanion(context.state);
          const activePetDefinition = activePetCompanion ? getPetDefinition(activePetCompanion.definitionId) : null;
          if (activePetDefinition) {
            return `和${activePetDefinition.name}互动，继续提升亲密度`;
          }
          return context.state.pets.companions.length > 0 ? "打开电子宠物中心继续陪伴" : "打开电子宠物中心领养第一只伙伴";
        })(),
      );
    case "plan-selection":
      return createStaticMetricCard(definition, "优质计划", "浏览并复用现成的学习计划模板");
    case "printing":
      return createStaticMetricCard(definition, "打印清单", "任务打印功能仍在开发中");
    case "help":
      return createStaticMetricCard(definition, "功能手册", "打开完整操作说明");
    default:
      return createStaticMetricCard(definition, "--", "暂未提供该模块的统计信息");
  }
}

export function createMetricCards(state: AppState, today: string, dashboardConfig: DashboardConfigPreference): MetricCard[] {
  const summary = summarizeState(state, today);
  const activeHabits = state.habits.filter((habit) => habit.status === "active");
  const completedToday = getCompletedPlansForDate(state.plans, today);
  const pendingToday = getPendingPlansForDate(state.plans, today);
  const visibleModuleIds = new Set(dashboardConfig.visibleModuleIds);
  const context = {
    state,
    today,
    summary,
    activeHabits,
    completedToday,
    pendingToday,
  };

  const metricCards = dashboardConfig.moduleOrder
    .filter((moduleId) => visibleModuleIds.has(moduleId))
    .map((moduleId) => buildDashboardMetricCard(moduleId, context));

  metricCards.push({
    id: "more",
    title: "其他",
    value: "更多功能",
    hint: "打开完整功能导航",
    tone: "slate",
    action: "more-features",
  });

  return metricCards;
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
