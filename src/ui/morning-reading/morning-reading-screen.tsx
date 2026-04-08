import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import type {
  MorningReadingArticle,
  MorningReadingArticleType,
  MorningReadingPlan,
  MorningReadingState,
  MorningReadingTaskGranularity,
} from "../../persistence/morning-reading-storage.js";
import { MORNING_READING_MATRIX, createMorningReadingDefaultArticles } from "../../persistence/morning-reading-storage.js";

type MorningReadingView = "dashboard" | "create" | "manage" | "table" | "guide";

interface MorningReadingScreenProps {
  state: MorningReadingState;
  today: string;
  onBack: () => void;
  onChangeState: (state: MorningReadingState) => void;
  onShowNotice: (message: string) => void;
}

interface MorningReadingCreateDraft {
  name: string;
  weekIndex: string;
  startDate: string;
  taskGranularity: MorningReadingTaskGranularity;
  articles: MorningReadingArticle[];
}

interface MorningReadingTaskCell {
  articleId: string;
  articleOrder: number;
  title: string;
  day: number;
  target: number;
}

type DayTaskAction =
  | { type: "cell"; cell: MorningReadingTaskCell }
  | { type: "day"; day: number; cells: MorningReadingTaskCell[] }
  | { type: "session"; cell: MorningReadingTaskCell; index: number };

interface MorningReadingDayTask {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  progressLabel: string;
  action: DayTaskAction;
}

interface MorningReadingFaqItem {
  question: string;
  answer: string;
}

const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const ARTICLE_TYPE_LABEL_MAP: Record<MorningReadingArticleType, string> = {
  poetry: "古诗",
  classical: "文言文",
  modern: "现代文",
};

const GRANULARITY_OPTIONS: Array<{ value: MorningReadingTaskGranularity; title: string; description: string; helper: string; recommend?: boolean }> = [
  {
    value: "daily",
    title: "每天一个任务",
    description: "整天阅读任务合并为一个",
    helper: "7个任务/周",
  },
  {
    value: "article",
    title: "每篇文章一个任务",
    description: "每篇文章单独一个任务",
    helper: "约30-40个任务/周",
    recommend: true,
  },
  {
    value: "session",
    title: "每次阅读一个任务",
    description: "每读一遍就是一个任务",
    helper: "约70-90个任务/周",
  },
];

const FAQ_ITEMS: MorningReadingFaqItem[] = [
  {
    question: "如何修改已创建的文章？",
    answer: "进入“计划管理”，点击文章卡片右上角的编辑按钮即可修改文章内容。文章标题可以在创建计划时调整。",
  },
  {
    question: "可以同时进行多个晨读计划吗？",
    answer: "可以。创建多个计划后，可在晨读首页顶部切换当前计划。每个计划的打卡进度会分别保存。",
  },
  {
    question: "可以跨天补打卡吗？",
    answer: "可以。点击“查看打卡表”后，直接在对应日期单元格点击即可补打卡，系统会自动更新总进度。",
  },
  {
    question: "如何清空某个计划的记录？",
    answer: "进入“计划管理”，点击右上角删除按钮可删除当前计划并清除其全部打卡记录。",
  },
];

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateKey(dateKey: string): Date | null {
  if (!isDateKey(dateKey)) {
    return null;
  }
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, offset: number): string {
  const base = parseDateKey(dateKey);
  if (!base) {
    return dateKey;
  }
  const next = new Date(base);
  next.setDate(next.getDate() + offset);
  return toDateKey(next);
}

function getWeekStartDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  const weekday = date.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(date);
  monday.setDate(monday.getDate() + mondayOffset);
  return toDateKey(monday);
}

function formatDateYMD(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function createLocalUiId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMorningReadingDraft(today: string): MorningReadingCreateDraft {
  return {
    name: "",
    weekIndex: "1",
    startDate: getWeekStartDate(today),
    taskGranularity: "article",
    articles: createMorningReadingDefaultArticles(),
  };
}

function getCellTarget(articleOrder: number, day: number): number {
  const row = MORNING_READING_MATRIX[articleOrder - 1];
  if (!row) {
    return 0;
  }
  return row[day - 1] ?? 0;
}

function createCellKey(articleId: string, day: number): string {
  return `${articleId}:d${day}`;
}

function getCellCompletedTimes(plan: MorningReadingPlan, articleId: string, day: number): number {
  const key = createCellKey(articleId, day);
  return Math.max(0, Math.round(plan.completionMap[key] ?? 0));
}

function upsertCompletionMap(
  completionMap: Record<string, number>,
  articleId: string,
  day: number,
  completedTimes: number,
): Record<string, number> {
  const key = createCellKey(articleId, day);
  const next = { ...completionMap };
  const normalized = Math.max(0, Math.round(completedTimes));
  if (normalized <= 0) {
    delete next[key];
  } else {
    next[key] = normalized;
  }
  return next;
}

function summarizePlan(plan: MorningReadingPlan): { totalSessions: number; completedSessions: number; progressPercent: number } {
  let totalSessions = 0;
  let completedSessions = 0;

  for (const article of plan.articles) {
    for (let day = 1; day <= 7; day += 1) {
      const target = getCellTarget(article.order, day);
      if (target <= 0) {
        continue;
      }
      totalSessions += target;
      completedSessions += Math.min(target, getCellCompletedTimes(plan, article.id, day));
    }
  }

  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  return {
    totalSessions,
    completedSessions,
    progressPercent,
  };
}

function resolvePlanStatus(plan: MorningReadingPlan): MorningReadingPlan["status"] {
  return summarizePlan(plan).progressPercent >= 100 ? "completed" : "active";
}

function createDayCells(plan: MorningReadingPlan, day: number): MorningReadingTaskCell[] {
  return plan.articles
    .map((article) => {
      const target = getCellTarget(article.order, day);
      if (target <= 0) {
        return null;
      }
      return {
        articleId: article.id,
        articleOrder: article.order,
        title: article.title,
        day,
        target,
      } satisfies MorningReadingTaskCell;
    })
    .filter((cell): cell is MorningReadingTaskCell => cell !== null);
}

function buildDayTasks(plan: MorningReadingPlan, day: number): MorningReadingDayTask[] {
  const dayCells = createDayCells(plan, day);
  if (dayCells.length === 0) {
    return [];
  }

  if (plan.taskGranularity === "daily") {
    const total = dayCells.reduce((sum, cell) => sum + cell.target, 0);
    const completed = dayCells.reduce((sum, cell) => sum + Math.min(cell.target, getCellCompletedTimes(plan, cell.articleId, day)), 0);
    const done = completed >= total;
    return [
      {
        id: `day-${day}`,
        title: `第${day}天 · 当日任务包`,
        detail: `包含 ${dayCells.length} 篇文章`,
        done,
        progressLabel: `${completed}/${total}遍`,
        action: {
          type: "day",
          day,
          cells: dayCells,
        },
      },
    ];
  }

  if (plan.taskGranularity === "session") {
    const rows: MorningReadingDayTask[] = [];
    for (const cell of dayCells) {
      const completed = Math.min(cell.target, getCellCompletedTimes(plan, cell.articleId, day));
      for (let index = 1; index <= cell.target; index += 1) {
        rows.push({
          id: `${cell.articleId}-d${day}-s${index}`,
          title: `#${cell.articleOrder} ${cell.title}`,
          detail: `第 ${index}/${cell.target} 遍`,
          done: completed >= index,
          progressLabel: `${Math.min(completed, index)}/${index}遍`,
          action: {
            type: "session",
            cell,
            index,
          },
        });
      }
    }
    return rows;
  }

  return dayCells.map((cell) => {
    const completed = Math.min(cell.target, getCellCompletedTimes(plan, cell.articleId, day));
    return {
      id: `${cell.articleId}-d${day}`,
      title: `#${cell.articleOrder} ${cell.title}`,
      detail: `${ARTICLE_TYPE_LABEL_MAP[plan.articles.find((item) => item.id === cell.articleId)?.type ?? "modern"]}`,
      done: completed >= cell.target,
      progressLabel: `${completed}/${cell.target}遍`,
      action: {
        type: "cell",
        cell,
      },
    };
  });
}

function getArticleTypeCount(articles: MorningReadingArticle[], type: MorningReadingArticleType): number {
  return articles.filter((item) => item.type === type && item.title.trim().length > 0).length;
}

export function MorningReadingScreen({ state, today, onBack, onChangeState, onShowNotice }: MorningReadingScreenProps) {
  const [view, setView] = useState<MorningReadingView>("dashboard");
  const [createDraft, setCreateDraft] = useState<MorningReadingCreateDraft>(() => createMorningReadingDraft(today));
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const sortedPlans = useMemo(() => [...state.plans].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)), [state.plans]);
  const activePlan = sortedPlans.find((plan) => plan.id === state.activePlanId) ?? sortedPlans[0] ?? null;
  const activePlanSummary = activePlan ? summarizePlan(activePlan) : null;
  const planDateRange = activePlan ? `${formatDateYMD(activePlan.startDate)} - ${formatDateYMD(shiftDateKey(activePlan.startDate, 6))}` : "--";
  const todayDayIndex = activePlan ? Math.max(1, Math.min(7, Math.floor((Date.parse(today) - Date.parse(activePlan.startDate)) / 86400000) + 1)) : 1;

  function updateState(next: MorningReadingState): void {
    onChangeState(next);
  }

  function patchActivePlan(updater: (plan: MorningReadingPlan) => MorningReadingPlan): void {
    if (!activePlan) {
      onShowNotice("请先创建一个 337 计划。");
      return;
    }

    const now = new Date().toISOString();
    const nextPlans = state.plans.map((plan) => {
      if (plan.id !== activePlan.id) {
        return plan;
      }

      const nextPlan = updater(plan);
      const normalized: MorningReadingPlan = {
        ...nextPlan,
        updatedAt: now,
        status: resolvePlanStatus(nextPlan),
      };
      return normalized;
    });

    updateState({
      ...state,
      plans: nextPlans,
      activePlanId: activePlan.id,
    });
  }

  function handleOpenCreate(): void {
    setCreateDraft(createMorningReadingDraft(today));
    setView("create");
  }

  function handleSelectPlan(planId: string): void {
    if (state.activePlanId === planId) {
      return;
    }
    updateState({
      ...state,
      activePlanId: planId,
    });
  }

  function handleDeleteActivePlan(): void {
    if (!activePlan) {
      onShowNotice("当前没有可删除的计划。");
      return;
    }
    if (!window.confirm(`确定删除计划“${activePlan.name}”吗？该操作不可恢复。`)) {
      return;
    }

    const nextPlans = state.plans.filter((item) => item.id !== activePlan.id);
    updateState({
      ...state,
      plans: nextPlans,
      activePlanId: nextPlans[0]?.id ?? null,
    });
    onShowNotice("删除成功，计划及相关任务已删除。");
    setView("dashboard");
  }

  function handleToggleCell(articleId: string, day: number): void {
    if (!activePlan) {
      return;
    }

    const article = activePlan.articles.find((item) => item.id === articleId);
    if (!article) {
      return;
    }
    const target = getCellTarget(article.order, day);
    if (target <= 0) {
      return;
    }

    patchActivePlan((plan) => {
      const current = getCellCompletedTimes(plan, articleId, day);
      const next = current >= target ? 0 : target;
      return {
        ...plan,
        completionMap: upsertCompletionMap(plan.completionMap, articleId, day, next),
      };
    });
  }

  function handleToggleTask(task: MorningReadingDayTask): void {
    if (!activePlan) {
      return;
    }

    const action = task.action;
    if (action.type === "cell") {
      handleToggleCell(action.cell.articleId, action.cell.day);
      return;
    }

    if (action.type === "day") {
      patchActivePlan((plan) => {
        const isAllDone = action.cells.every(
          (cell) => getCellCompletedTimes(plan, cell.articleId, cell.day) >= cell.target,
        );

        let nextMap = { ...plan.completionMap };
        for (const cell of action.cells) {
          const nextTimes = isAllDone ? 0 : cell.target;
          nextMap = upsertCompletionMap(nextMap, cell.articleId, cell.day, nextTimes);
        }

        return {
          ...plan,
          completionMap: nextMap,
        };
      });
      return;
    }

    patchActivePlan((plan) => {
      const current = getCellCompletedTimes(plan, action.cell.articleId, action.cell.day);
      const next = current >= action.index ? action.index - 1 : action.index;
      return {
        ...plan,
        completionMap: upsertCompletionMap(plan.completionMap, action.cell.articleId, action.cell.day, next),
      };
    });
  }

  function handleUpdateArticleDraft(order: number, field: "title" | "content", value: string): void {
    setCreateDraft((current) => ({
      ...current,
      articles: current.articles.map((article) => (article.order === order ? { ...article, [field]: value } : article)),
    }));
  }

  function handleCreatePlan(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = createDraft.name.trim();
    const weekIndex = Math.round(Number(createDraft.weekIndex));
    const startDate = createDraft.startDate;

    if (name.length === 0) {
      onShowNotice("请填写计划名称。");
      return;
    }
    if (!Number.isInteger(weekIndex) || weekIndex <= 0) {
      onShowNotice("周次需要是大于 0 的整数。");
      return;
    }
    if (!isDateKey(startDate)) {
      onShowNotice("请填写有效的开始日期。");
      return;
    }
    if (createDraft.articles.some((article) => article.title.trim().length === 0)) {
      onShowNotice("9 篇文章标题都需要填写。");
      return;
    }

    const now = new Date().toISOString();
    const nextPlan: MorningReadingPlan = {
      id: createLocalUiId("morning-reading-plan"),
      name,
      weekIndex,
      startDate,
      taskGranularity: createDraft.taskGranularity,
      articles: createDraft.articles.map((article) => ({
        ...article,
        title: article.title.trim(),
        content: article.content.trim(),
      })),
      completionMap: {},
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    updateState({
      ...state,
      plans: [nextPlan, ...state.plans],
      activePlanId: nextPlan.id,
    });
    setView("dashboard");
    onShowNotice("337 晨读计划创建成功。");
  }

  function handleUpdateArticleContent(articleId: string): void {
    if (!activePlan) {
      return;
    }
    const target = activePlan.articles.find((item) => item.id === articleId);
    if (!target) {
      return;
    }
    const nextContent = window.prompt(`为《${target.title}》补充文章内容：`, target.content);
    if (nextContent === null) {
      return;
    }

    patchActivePlan((plan) => ({
      ...plan,
      articles: plan.articles.map((article) => (article.id === articleId ? { ...article, content: nextContent.trim() } : article)),
    }));
    onShowNotice("文章内容已更新。");
  }

  function handleHideWelcomeForever(): void {
    setWelcomeOpen(false);
    updateState({
      ...state,
      onboardingDismissed: true,
    });
  }

  const showWelcomeModal = view === "dashboard" && activePlan !== null && welcomeOpen && !state.onboardingDismissed;

  if (view === "create") {
    const poetryCount = getArticleTypeCount(createDraft.articles, "poetry");
    const classicalCount = getArticleTypeCount(createDraft.articles, "classical");
    const modernCount = getArticleTypeCount(createDraft.articles, "modern");

    return (
      <div className="mr-page">
        <header className="mr-hero">
          <div className="mr-hero-inner">
            <button type="button" className="mr-back-link" onClick={() => setView("dashboard")}>
              ← 返回
            </button>
            <div className="mr-hero-title">
              <h1>＋ 创建337晨读计划</h1>
              <p>准备9篇文章（古诗、文言文、现代文各3篇），开始本周的晨读之旅</p>
            </div>
          </div>
        </header>

        <form className="mr-create-shell" onSubmit={handleCreatePlan}>
          <section className="mr-card">
            <h2>基本信息</h2>
            <div className="mr-form-grid">
              <label className="mr-field is-full">
                计划名称
                <input value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="例如：第一周晨读" />
              </label>
              <label className="mr-field">
                周次
                <input
                  value={createDraft.weekIndex}
                  onChange={(event) => setCreateDraft((current) => ({ ...current, weekIndex: event.target.value }))}
                  inputMode="numeric"
                />
              </label>
              <label className="mr-field">
                开始日期（周一）
                <input
                  type="date"
                  value={createDraft.startDate}
                  onChange={(event) => setCreateDraft((current) => ({ ...current, startDate: event.target.value }))}
                />
              </label>
            </div>
          </section>

          <section className="mr-card">
            <h2>文章信息</h2>
            <div className="mr-article-grid">
              {createDraft.articles.map((article) => (
                <article key={article.id} className="mr-article-card">
                  <div className="mr-article-head">
                    <span className="mr-article-order">#{article.order}</span>
                    <span className={`mr-article-type is-${article.type}`}>{ARTICLE_TYPE_LABEL_MAP[article.type]}</span>
                  </div>
                  <input
                    value={article.title}
                    onChange={(event) => handleUpdateArticleDraft(article.order, "title", event.target.value)}
                    placeholder="请输入文章标题"
                  />
                  <textarea
                    value={article.content}
                    onChange={(event) => handleUpdateArticleDraft(article.order, "content", event.target.value)}
                    placeholder="点击添加内容..."
                    rows={2}
                  />
                </article>
              ))}
            </div>
            <div className="mr-article-summary">
              <span>古诗 ({poetryCount}/3)</span>
              <span>文言文 ({classicalCount}/3)</span>
              <span>现代文 ({modernCount}/3)</span>
            </div>
          </section>

          <section className="mr-card">
            <h2>打卡粒度</h2>
            <div className="mr-granularity-grid">
              {GRANULARITY_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`mr-granularity-card${createDraft.taskGranularity === item.value ? " is-active" : ""}`}
                  onClick={() => setCreateDraft((current) => ({ ...current, taskGranularity: item.value }))}
                >
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <small>{item.helper}</small>
                </button>
              ))}
            </div>
            <p className="mr-granularity-tip">推荐选择“每篇文章一个任务”，既清晰又不繁琐。</p>
          </section>

          <footer className="mr-create-footer">
            <button type="button" className="mr-secondary-button" onClick={() => setView("dashboard")}>
              取消
            </button>
            <button type="submit" className="mr-primary-button">
              创建计划
            </button>
          </footer>
        </form>
      </div>
    );
  }

  if (view === "manage") {
    const activeProgress = activePlan ? summarizePlan(activePlan) : null;
    return (
      <div className="mr-page">
        <header className="mr-hero">
          <div className="mr-hero-inner">
            <button type="button" className="mr-back-link" onClick={() => setView("dashboard")}>
              ← 返回
            </button>
            <div className="mr-hero-title">
              <h1>计划管理</h1>
              <p>管理您的337晨读计划，编辑文章内容</p>
            </div>
          </div>
        </header>

        <div className="mr-manage-shell">
          {activePlan ? (
            <section className="mr-card">
              <div className="mr-manage-plan-head">
                <div>
                  <h2>{activePlan.name}</h2>
                  <p>
                    第{activePlan.weekIndex}周 · {formatDateYMD(activePlan.startDate)} - {formatDateYMD(shiftDateKey(activePlan.startDate, 6))}
                  </p>
                </div>
                <div className="mr-manage-actions">
                  <span className={`mr-status-pill is-${activePlan.status}`}>{activePlan.status === "completed" ? "已完成" : "进行中"}</span>
                  <button type="button" className="mr-icon-button" onClick={() => setView("table")} aria-label="查看打卡表">
                    📅
                  </button>
                  <button type="button" className="mr-icon-button" onClick={handleDeleteActivePlan} aria-label="删除计划">
                    🗑
                  </button>
                </div>
              </div>

              <div className="mr-manage-progress">
                <strong>{activeProgress?.progressPercent ?? 0}%</strong>
                <span>
                  已完成 {activeProgress?.completedSessions ?? 0}/{activeProgress?.totalSessions ?? 0} 遍
                </span>
              </div>

              <div className="mr-manage-grid">
                {activePlan.articles.map((article) => (
                  <article key={article.id} className="mr-manage-article">
                    <div className="mr-manage-article-head">
                      <span className="mr-article-order">#{article.order}</span>
                      <span className={`mr-article-type is-${article.type}`}>{ARTICLE_TYPE_LABEL_MAP[article.type]}</span>
                      <button type="button" className="mr-inline-icon" onClick={() => handleUpdateArticleContent(article.id)} aria-label={`编辑 ${article.title}`}>
                        ✎
                      </button>
                    </div>
                    <strong>{article.title}</strong>
                    <p>{article.content.trim().length > 0 ? article.content : "点击添加内容..."}</p>
                  </article>
                ))}
              </div>

              <div className="mr-manage-footer">
                <button type="button" className="mr-primary-button is-dark" onClick={() => setView("table")}>
                  👁 查看打卡表
                </button>
              </div>
            </section>
          ) : (
            <section className="mr-card mr-empty">
              <h2>还没有晨读计划</h2>
              <p>先创建一个 337 晨读计划，再回来管理文章内容。</p>
              <button type="button" className="mr-primary-button" onClick={handleOpenCreate}>
                + 创建计划
              </button>
            </section>
          )}
        </div>
      </div>
    );
  }

  if (view === "table") {
    return (
      <div className="mr-page">
        <header className="mr-hero">
          <div className="mr-hero-inner">
            <button type="button" className="mr-back-link" onClick={() => setView("dashboard")}>
              ← 返回
            </button>
            <div className="mr-hero-title">
              <h1>{activePlan?.name ?? "337晨读打卡表"}</h1>
              <p>完整打卡计划表 - 点击单元格可快速标记完成</p>
            </div>
          </div>
        </header>

        <div className="mr-table-shell">
          {activePlan ? (
            <section className="mr-card">
              <div className="mr-table-legend">
                <span>图例：</span>
                <span className="mr-legend-chip is-done">◉ 已完成</span>
                <span className="mr-legend-chip">○ 未完成</span>
                <span className="mr-legend-note">数字表示应读遍数</span>
              </div>
              <div className="mr-punch-table-wrap">
                <table className="mr-punch-table">
                  <thead>
                    <tr>
                      <th>文章</th>
                      {WEEKDAY_LABELS.map((label, index) => (
                        <th key={label}>第{index + 1}天</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activePlan.articles.map((article) => (
                      <tr key={article.id}>
                        <th>
                          {article.order}. {ARTICLE_TYPE_LABEL_MAP[article.type]}
                          <br />
                          {article.title}
                        </th>
                        {WEEKDAY_LABELS.map((_, dayIndex) => {
                          const day = dayIndex + 1;
                          const target = getCellTarget(article.order, day);
                          if (target <= 0) {
                            return (
                              <td key={`${article.id}-${day}`} className="is-empty">
                                -
                              </td>
                            );
                          }

                          const completed = getCellCompletedTimes(activePlan, article.id, day) >= target;
                          return (
                            <td key={`${article.id}-${day}`}>
                              <button
                                type="button"
                                className={`mr-punch-cell${completed ? " is-done" : ""}`}
                                onClick={() => handleToggleCell(article.id, day)}
                              >
                                <span>{completed ? "◉" : "○"}</span>
                                <strong>{target}遍</strong>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mr-table-tip">提示：悬停在单元格上可查看详情信息</p>
            </section>
          ) : (
            <section className="mr-card mr-empty">
              <h2>还没有计划</h2>
              <p>创建计划后才能查看打卡表。</p>
              <button type="button" className="mr-primary-button" onClick={handleOpenCreate}>
                + 创建计划
              </button>
            </section>
          )}
        </div>
      </div>
    );
  }

  if (view === "guide") {
    return (
      <div className="mr-page">
        <header className="mr-hero">
          <div className="mr-hero-inner">
            <button type="button" className="mr-back-link" onClick={() => setView("dashboard")}>
              ← 返回
            </button>
            <div className="mr-hero-title">
              <h1>337晨读使用指南</h1>
              <p>全面了解337晨读法，轻松开始科学晨读</p>
            </div>
          </div>
        </header>

        <div className="mr-guide-shell">
          <section className="mr-card">
            <h2>什么是337晨读？</h2>
            <p>337晨读法是一种系统化的语文阅读复习方法，通过科学的间隔重复，提升朗读记忆效果。</p>
            <div className="mr-guide-metrics">
              <article>
                <strong>3</strong>
                <span>种体裁</span>
                <small>古诗、文言文、现代文</small>
              </article>
              <article>
                <strong>3</strong>
                <span>篇文章</span>
                <small>每种体裁精选3篇</small>
              </article>
              <article>
                <strong>7</strong>
                <span>天循环</span>
                <small>一周内多次复习</small>
              </article>
            </div>

            <div className="mr-guide-sample-table">
              <h3>7天计划表格示例</h3>
              <table className="mr-mini-table">
                <thead>
                  <tr>
                    <th>文章</th>
                    {WEEKDAY_LABELS.map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MORNING_READING_MATRIX.map((row, rowIndex) => (
                    <tr key={`sample-${rowIndex + 1}`}>
                      <th>文章{rowIndex + 1}</th>
                      {row.map((value, dayIndex) => (
                        <td key={`sample-${rowIndex + 1}-${dayIndex + 1}`}>{value > 0 ? `${value}遍` : "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mr-card">
            <h2>为什么要用337？</h2>
            <div className="mr-guide-reasons">
              <article>
                <strong>符合记忆规律</strong>
                <p>基于艾宾浩斯记忆曲线，在遗忘前进行复习。</p>
              </article>
              <article>
                <strong>多次重复巩固</strong>
                <p>每篇文章在7天内复习3-6次，加深印象。</p>
              </article>
              <article>
                <strong>提高学习效率</strong>
                <p>每天仅需10-15分钟，效果显著。</p>
              </article>
            </div>
          </section>

          <section className="mr-card">
            <h2>如何使用？</h2>
            <div className="mr-guide-steps">
              <article>
                <span>步骤1</span>
                <strong>创建计划</strong>
                <p>点击“创建计划”，录入9篇文章并确认开始日期。</p>
              </article>
              <article>
                <span>步骤2</span>
                <strong>选择打卡粒度</strong>
                <p>推荐“每篇文章一个任务”，既清晰又不繁琐。</p>
              </article>
              <article>
                <span>步骤3</span>
                <strong>每日打卡</strong>
                <p>每天进入任务列表，完成当日文章的单元格打卡。</p>
              </article>
              <article>
                <span>步骤4</span>
                <strong>查看进度</strong>
                <p>点击“查看打卡表”，查看7天全局完成情况。</p>
              </article>
            </div>
          </section>

          <section className="mr-card">
            <h2>常见问题</h2>
            <div className="mr-faq-list">
              {FAQ_ITEMS.map((item, index) => {
                const opened = openFaqIndex === index;
                return (
                  <article key={item.question} className={`mr-faq-item${opened ? " is-open" : ""}`}>
                    <button type="button" className="mr-faq-question" onClick={() => setOpenFaqIndex(opened ? null : index)}>
                      <span>{item.question}</span>
                      <span>{opened ? "−" : "+"}</span>
                    </button>
                    {opened ? <p>{item.answer}</p> : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mr-guide-cta">
            <h2>准备好开始了吗？</h2>
            <p>准备9篇文章，立即创建你的第一个337晨读计划</p>
            <div className="mr-guide-cta-actions">
              <button type="button" className="mr-primary-button" onClick={handleOpenCreate}>
                + 创建我的第一个计划
              </button>
              <button type="button" className="mr-secondary-button" onClick={() => setView("dashboard")}>
                返回主页
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const planDays =
    activePlan === null
      ? []
      : Array.from({ length: 7 }, (_, index) => {
          const day = index + 1;
          const dateKey = shiftDateKey(activePlan.startDate, index);
          const dayTasks = buildDayTasks(activePlan, day);
          const totalDaySessions = createDayCells(activePlan, day).reduce((sum, cell) => sum + cell.target, 0);
          const completedDaySessions = createDayCells(activePlan, day).reduce(
            (sum, cell) => sum + Math.min(cell.target, getCellCompletedTimes(activePlan, cell.articleId, day)),
            0,
          );
          return {
            day,
            dateKey,
            tasks: dayTasks,
            totalDaySessions,
            completedDaySessions,
          };
        });

  const granularityLabel = GRANULARITY_OPTIONS.find((item) => item.value === activePlan?.taskGranularity)?.title ?? "--";
  const progressBarStyle = {
    "--mr-progress": `${activePlanSummary?.progressPercent ?? 0}%`,
  } as CSSProperties;

  return (
    <div className="mr-page">
      <header className="mr-hero">
        <div className="mr-hero-inner">
          <button type="button" className="mr-back-link" onClick={onBack}>
            ← 返回主页
          </button>
          <div className="mr-hero-title">
            <h1>📖 337晨读</h1>
            <p>科学高效的阅读学习方法</p>
          </div>
          <div className="mr-hero-actions">
            <button type="button" className="mr-ghost-button" onClick={() => setView("guide")}>
              ⓘ 使用说明
            </button>
            <button type="button" className="mr-ghost-button" onClick={() => setView("manage")}>
              ⚙ 管理
            </button>
            <button type="button" className="mr-primary-button" onClick={handleOpenCreate}>
              + 创建计划
            </button>
          </div>
        </div>
      </header>

      <div className="mr-dashboard-shell">
        {activePlan ? (
          <>
            <section className="mr-card mr-plan-switcher">
              <div className="mr-plan-switcher-head">
                <strong>本周计划</strong>
                <span>共 {sortedPlans.length} 个</span>
              </div>
              <div className="mr-plan-chip-row">
                {sortedPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={`mr-plan-chip${activePlan.id === plan.id ? " is-active" : ""}`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="mr-card mr-progress-card">
              <div className="mr-progress-head">
                <div>
                  <h2>{activePlan.name}</h2>
                  <p>
                    {planDateRange} · {granularityLabel}
                  </p>
                </div>
                <div className="mr-progress-rate">
                  <strong>{activePlanSummary?.progressPercent ?? 0}%</strong>
                  <span>当天进度</span>
                </div>
              </div>
              <div className="mr-day-strip">
                {planDays.map((item) => (
                  <button key={`day-${item.day}`} type="button" className={`mr-day-pill${todayDayIndex === item.day ? " is-current" : ""}`} onClick={() => setView("table")}>
                    <small>{WEEKDAY_LABELS[item.day - 1]}</small>
                    <strong>{item.day}</strong>
                    <span>{formatDateLabel(item.dateKey)}</span>
                  </button>
                ))}
              </div>
              <div className="mr-progress-track" style={progressBarStyle}>
                <span />
              </div>
              <button type="button" className="mr-inline-link" onClick={() => setView("table")}>
                查看本周打卡表 &gt;
              </button>
            </section>

            <section className="mr-card">
              <div className="mr-section-head">
                <h2>本周任务</h2>
              </div>
              <div className="mr-task-list">
                {planDays.map((dayItem) => (
                  <article key={`tasks-${dayItem.day}`} className="mr-day-group">
                    <header>
                      <strong>第{dayItem.day}天</strong>
                      <span>
                        {formatDateLabel(dayItem.dateKey)} {WEEKDAY_LABELS[dayItem.day - 1]}
                      </span>
                    </header>
                    <div className="mr-day-rows">
                      {dayItem.tasks.map((task) => (
                        <div key={task.id} className={`mr-task-row${task.done ? " is-done" : ""}`}>
                          <div>
                            <strong>{task.title}</strong>
                            <p>
                              {task.detail} · {task.progressLabel}
                            </p>
                          </div>
                          <button type="button" className={`mr-task-action${task.done ? " is-done" : ""}`} onClick={() => handleToggleTask(task)}>
                            {task.done ? "已打卡" : "打卡"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="mr-card mr-empty">
            <h2>还没有晨读计划</h2>
            <p>先创建一个 337 晨读计划，系统会自动生成 7 天任务。</p>
            <button type="button" className="mr-primary-button" onClick={handleOpenCreate}>
              + 创建第一个计划
            </button>
          </section>
        )}
      </div>

      {showWelcomeModal ? (
        <div className="mr-welcome-overlay">
          <section className="mr-welcome-card">
            <button type="button" className="mr-welcome-close" onClick={() => setWelcomeOpen(false)} aria-label="关闭引导">
              ×
            </button>
            <h2>🎓 欢迎使用337晨读</h2>
            <p>科学高效的阅读学习方法</p>
            <div className="mr-welcome-grid">
              <article>
                <strong>什么是337</strong>
                <ul>
                  <li>3种体裁：古诗、文言文、现代文</li>
                  <li>3篇文章：每种体裁精选3篇</li>
                  <li>7天循环：一周内多次复习</li>
                </ul>
              </article>
              <article>
                <strong>为什么要用337?</strong>
                <p>基于艾宾浩斯记忆曲线原理，通过科学的间隔重复，让复习更高效。</p>
              </article>
              <article>
                <strong>如何开始？</strong>
                <ol>
                  <li>准备9篇文章（3种体裁各3篇）</li>
                  <li>创建本周337晨读计划</li>
                  <li>每天按计划完成打卡</li>
                  <li>可查看“使用说明”进一步了解规则</li>
                </ol>
              </article>
            </div>
            <footer className="mr-welcome-actions">
              <button type="button" className="mr-link-button" onClick={handleHideWelcomeForever}>
                不再显示
              </button>
              <button
                type="button"
                className="mr-secondary-button"
                onClick={() => {
                  setWelcomeOpen(false);
                  setView("guide");
                }}
              >
                查看使用说明
              </button>
              <button
                type="button"
                className="mr-primary-button"
                onClick={() => {
                  setWelcomeOpen(false);
                  handleOpenCreate();
                }}
              >
                立即创建计划
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
