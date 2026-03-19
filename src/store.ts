import type { AppState, LearningPlan, PlanTask } from "./types";

const STORAGE_KEY = "xiaodaka_clone_state_v1";

export const FEATURE_FLAGS = [
  { id: "plans.add", name: "添加学习计划", path: "/plans/add" },
  { id: "plans.batch-add", name: "批量添加计划", path: "/plans/batch-add" },
  { id: "plans.ai-add", name: "AI添加计划", path: "/plans/ai-add" },
  { id: "plans.manage", name: "管理计划", path: "/plans/manage" },
  { id: "habits.manage", name: "管理行为习惯", path: "/habits/manage" },
  { id: "habits.checkin", name: "行为习惯打卡", path: "/habits/checkin" },
  { id: "exams.add", name: "添加考试成绩", path: "/exams/add" },
  { id: "exams.ai-add", name: "AI添加考试成绩", path: "/exams/ai-add" },
  { id: "exams.subjects", name: "科目管理", path: "/exams/subjects" },
  { id: "weakness.page", name: "薄弱知识", path: "/weakness" },
  { id: "weakness.add", name: "提交练习记录", path: "/weakness/add" },
  { id: "rewards.rules", name: "奖励规则设置", path: "/rewards/rules" },
  { id: "membership", name: "会员管理", path: "/membership" },
  { id: "redeem", name: "兑换码", path: "/redeem" },
  { id: "users", name: "用户管理", path: "/users" },
  { id: "settings", name: "系统设置", path: "/settings" },
  { id: "export", name: "数据导出", path: "/export" },
  { id: "import", name: "数据导入", path: "/import" },
];

export const DEFAULT_DISABLED_FEATURES = FEATURE_FLAGS.filter((feature) =>
  [
    "plans.ai-add",
    "exams.ai-add",
    "membership",
    "redeem",
    "export",
    "import",
    "users",
  ].includes(feature.id),
).map((feature) => feature.id);

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function starterTasks(baseTitle: string): PlanTask[] {
  const today = todayDate();
  return [
    {
      id: createId("task"),
      title: `${baseTitle} - 理解概念`,
      dueDate: today,
      stars: 2,
      done: false,
    },
    {
      id: createId("task"),
      title: `${baseTitle} - 练习 20 分钟`,
      dueDate: today,
      stars: 2,
      done: false,
    },
  ];
}

function starterPlans(profileId: string): LearningPlan[] {
  return [
    {
      id: createId("plan"),
      profileId,
      title: "数学错题复盘",
      subject: "数学",
      frequency: "daily",
      createdAt: new Date().toISOString(),
      tasks: starterTasks("数学错题复盘"),
    },
    {
      id: createId("plan"),
      profileId,
      title: "英语阅读训练",
      subject: "英语",
      frequency: "weekly",
      createdAt: new Date().toISOString(),
      tasks: starterTasks("英语阅读训练"),
    },
  ];
}

export function getDefaultState(): AppState {
  const defaultProfileId = createId("profile");
  return {
    version: "1.0.0",
    activeProfileId: defaultProfileId,
    profiles: [
      { id: defaultProfileId, name: "主账号", role: "student", isDefault: true },
      { id: createId("profile"), name: "家长视角", role: "parent" },
    ],
    plans: starterPlans(defaultProfileId),
    todos: [
      {
        id: createId("todo"),
        profileId: defaultProfileId,
        title: "整理错题本",
        note: "晚饭后完成",
        done: false,
        createdAt: new Date().toISOString(),
      },
    ],
    habits: [
      {
        id: createId("habit"),
        profileId: defaultProfileId,
        name: "按时作息",
        stars: 1,
        rule: "每天 22:30 前睡觉",
        checkins: [],
      },
      {
        id: createId("habit"),
        profileId: defaultProfileId,
        name: "饭后阅读",
        stars: 2,
        rule: "每天阅读 30 分钟",
        checkins: [],
      },
    ],
    examSubjects: [
      { id: createId("subject"), profileId: defaultProfileId, name: "语文", maxScore: 150 },
      { id: createId("subject"), profileId: defaultProfileId, name: "数学", maxScore: 150 },
      { id: createId("subject"), profileId: defaultProfileId, name: "英语", maxScore: 150 },
    ],
    examRecords: [],
    weaknesses: [],
    rewards: [
      { id: createId("reward"), profileId: defaultProfileId, title: "周末看电影", cost: 30, redeemedCount: 0 },
      { id: createId("reward"), profileId: defaultProfileId, title: "新文具", cost: 60, redeemedCount: 0 },
    ],
    starTransactions: [
      {
        id: createId("star"),
        profileId: defaultProfileId,
        amount: 20,
        reason: "新用户初始星星",
        createdAt: new Date().toISOString(),
      },
    ],
    membership: {
      status: "inactive",
      type: "free",
      expiresAt: null,
    },
    childMode: {
      enabled: false,
      password: "",
      disabledFeatures: DEFAULT_DISABLED_FEATURES,
    },
    settings: {
      dailyGoalMinutes: 45,
      soundEnabled: true,
    },
    accountPassword: "123456",
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const fallback = getDefaultState();
    return {
      ...fallback,
      ...parsed,
      childMode: {
        ...fallback.childMode,
        ...(parsed.childMode ?? {}),
        disabledFeatures:
          parsed.childMode?.disabledFeatures && parsed.childMode.disabledFeatures.length > 0
            ? parsed.childMode.disabledFeatures
            : fallback.childMode.disabledFeatures,
      },
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
      },
      membership: {
        ...fallback.membership,
        ...(parsed.membership ?? {}),
      },
      profiles: parsed.profiles && parsed.profiles.length > 0 ? parsed.profiles : fallback.profiles,
      activeProfileId:
        parsed.activeProfileId &&
        (parsed.profiles ?? fallback.profiles).some((profile) => profile.id === parsed.activeProfileId)
          ? parsed.activeProfileId
          : (parsed.profiles?.[0]?.id ?? fallback.activeProfileId),
      plans: parsed.plans ?? fallback.plans,
      todos: parsed.todos ?? fallback.todos,
      habits: parsed.habits ?? fallback.habits,
      examSubjects: parsed.examSubjects ?? fallback.examSubjects,
      examRecords: parsed.examRecords ?? fallback.examRecords,
      weaknesses: parsed.weaknesses ?? fallback.weaknesses,
      rewards: parsed.rewards ?? fallback.rewards,
      starTransactions: parsed.starTransactions ?? fallback.starTransactions,
    };
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state: AppState): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      source: "xiaodaka-clone",
      state,
    },
    null,
    2,
  );
}

export function importState(raw: string): AppState {
  const parsed = JSON.parse(raw) as { state?: AppState } | AppState;
  if ("state" in parsed && parsed.state) {
    return parsed.state;
  }
  return parsed as AppState;
}

export function calculateStars(state: AppState, profileId: string): number {
  return state.starTransactions
    .filter((item) => item.profileId === profileId)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function membershipIsActive(state: AppState): boolean {
  if (state.membership.status !== "active") {
    return false;
  }
  if (!state.membership.expiresAt) {
    return true;
  }
  return new Date(state.membership.expiresAt).getTime() > Date.now();
}

export function getBlockedFeatureId(pathname: string, state: AppState): string | null {
  if (!state.childMode.enabled) {
    return null;
  }
  const matched = FEATURE_FLAGS.find((feature) => pathname.startsWith(feature.path));
  if (!matched) {
    return null;
  }
  return state.childMode.disabledFeatures.includes(matched.id) ? matched.id : null;
}
