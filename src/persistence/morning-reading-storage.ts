export const MORNING_READING_STORAGE_KEY = "xiuxiuzhushou_morning_reading_v1";

export type MorningReadingArticleType = "poetry" | "classical" | "modern";
export type MorningReadingTaskGranularity = "daily" | "article" | "session";
export type MorningReadingPlanStatus = "active" | "completed";

export interface MorningReadingArticle {
  id: string;
  order: number;
  type: MorningReadingArticleType;
  title: string;
  content: string;
}

export interface MorningReadingPlan {
  id: string;
  name: string;
  weekIndex: number;
  startDate: string;
  taskGranularity: MorningReadingTaskGranularity;
  articles: MorningReadingArticle[];
  completionMap: Record<string, number>;
  status: MorningReadingPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MorningReadingState {
  plans: MorningReadingPlan[];
  activePlanId: string | null;
  onboardingDismissed: boolean;
}

export interface MorningReadingArticleTemplate {
  order: number;
  type: MorningReadingArticleType;
  title: string;
}

export const MORNING_READING_ARTICLE_TEMPLATES: MorningReadingArticleTemplate[] = [
  { order: 1, type: "poetry", title: "静夜思" },
  { order: 2, type: "classical", title: "伯牙鼓琴" },
  { order: 3, type: "modern", title: "草原" },
  { order: 4, type: "poetry", title: "望庐山瀑布" },
  { order: 5, type: "classical", title: "书戴" },
  { order: 6, type: "modern", title: "匆匆" },
  { order: 7, type: "poetry", title: "春晓" },
  { order: 8, type: "classical", title: "学弈" },
  { order: 9, type: "modern", title: "桂林山水" },
];

// Matrix rows are article #1-#9, columns are day #1-#7.
export const MORNING_READING_MATRIX: number[][] = [
  [2, 1, 0, 0, 0, 0, 1],
  [2, 1, 1, 0, 0, 0, 1],
  [2, 1, 1, 1, 0, 0, 1],
  [0, 2, 1, 1, 1, 0, 1],
  [0, 0, 2, 1, 1, 1, 1],
  [0, 0, 0, 2, 1, 1, 1],
  [0, 0, 0, 0, 2, 1, 1],
  [0, 0, 0, 0, 0, 2, 1],
  [0, 0, 0, 0, 0, 0, 2],
];

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function isArticleType(value: unknown): value is MorningReadingArticleType {
  return value === "poetry" || value === "classical" || value === "modern";
}

function isTaskGranularity(value: unknown): value is MorningReadingTaskGranularity {
  return value === "daily" || value === "article" || value === "session";
}

function isPlanStatus(value: unknown): value is MorningReadingPlanStatus {
  return value === "active" || value === "completed";
}

function normalizeWeekIndex(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return 1;
  }
  return value;
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeCompletionMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const map = value as Record<string, unknown>;
  const next: Record<string, number> = {};
  for (const [key, raw] of Object.entries(map)) {
    if (!/^[a-z0-9-]+:d[1-7]$/i.test(key)) {
      continue;
    }
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      continue;
    }
    const rounded = Math.max(0, Math.round(raw));
    if (rounded > 0) {
      next[key] = rounded;
    }
  }
  return next;
}

function createDefaultArticles(): MorningReadingArticle[] {
  return MORNING_READING_ARTICLE_TEMPLATES.map((item) => ({
    id: `article-${item.order}`,
    order: item.order,
    type: item.type,
    title: item.title,
    content: "",
  }));
}

function normalizeArticles(value: unknown): MorningReadingArticle[] {
  if (!Array.isArray(value) || value.length === 0) {
    return createDefaultArticles();
  }

  const rows = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      if (typeof record.id !== "string") {
        return null;
      }
      if (typeof record.order !== "number" || !Number.isInteger(record.order) || record.order <= 0 || record.order > 9) {
        return null;
      }
      if (!isArticleType(record.type)) {
        return null;
      }

      return {
        id: record.id,
        order: record.order,
        type: record.type,
        title: normalizeString(record.title, `文章${record.order}`),
        content: typeof record.content === "string" ? record.content.trim() : "",
      } satisfies MorningReadingArticle;
    })
    .filter((item): item is MorningReadingArticle => item !== null);

  if (rows.length === 0) {
    return createDefaultArticles();
  }

  rows.sort((left, right) => left.order - right.order);
  const uniqueOrder = new Set<number>();
  const deduped = rows.filter((item) => {
    if (uniqueOrder.has(item.order)) {
      return false;
    }
    uniqueOrder.add(item.order);
    return true;
  });

  // Ensure all 9 rows exist and stay ordered.
  const existingByOrder = new Map(deduped.map((item) => [item.order, item]));
  return MORNING_READING_ARTICLE_TEMPLATES.map((template) => {
    const existing = existingByOrder.get(template.order);
    if (existing) {
      return existing;
    }
    return {
      id: `article-${template.order}`,
      order: template.order,
      type: template.type,
      title: template.title,
      content: "",
    };
  });
}

function normalizePlan(value: unknown): MorningReadingPlan | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string") {
    return null;
  }
  if (!isIsoDate(record.createdAt) || !isIsoDate(record.updatedAt)) {
    return null;
  }

  return {
    id: record.id,
    name: normalizeString(record.name, "新计划"),
    weekIndex: normalizeWeekIndex(record.weekIndex),
    startDate: isDateKey(record.startDate) ? record.startDate : new Date().toISOString().slice(0, 10),
    taskGranularity: isTaskGranularity(record.taskGranularity) ? record.taskGranularity : "article",
    articles: normalizeArticles(record.articles),
    completionMap: normalizeCompletionMap(record.completionMap),
    status: isPlanStatus(record.status) ? record.status : "active",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function createInitialMorningReadingState(): MorningReadingState {
  return {
    plans: [],
    activePlanId: null,
    onboardingDismissed: false,
  };
}

export function loadMorningReadingState(): MorningReadingState {
  if (typeof window === "undefined") {
    return createInitialMorningReadingState();
  }

  try {
    const raw = window.localStorage.getItem(MORNING_READING_STORAGE_KEY);
    if (!raw) {
      return createInitialMorningReadingState();
    }

    const parsed = JSON.parse(raw) as {
      plans?: unknown;
      activePlanId?: unknown;
      onboardingDismissed?: unknown;
    };

    const plans = (Array.isArray(parsed.plans) ? parsed.plans : [])
      .map(normalizePlan)
      .filter((item): item is MorningReadingPlan => item !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const activePlanId = typeof parsed.activePlanId === "string" ? parsed.activePlanId : null;
    const hasActivePlan = activePlanId !== null && plans.some((item) => item.id === activePlanId);

    return {
      plans,
      activePlanId: hasActivePlan ? activePlanId : (plans[0]?.id ?? null),
      onboardingDismissed: parsed.onboardingDismissed === true,
    };
  } catch {
    return createInitialMorningReadingState();
  }
}

export function saveMorningReadingState(state: MorningReadingState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MORNING_READING_STORAGE_KEY, JSON.stringify(state));
}

export function resetMorningReadingState(): MorningReadingState {
  const nextState = createInitialMorningReadingState();
  saveMorningReadingState(nextState);
  return nextState;
}

export function createMorningReadingDefaultArticles(): MorningReadingArticle[] {
  return createDefaultArticles();
}
