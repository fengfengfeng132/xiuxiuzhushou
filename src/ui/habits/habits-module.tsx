import type { CSSProperties, FormEvent, ReactNode, RefObject } from "react";
import {
  HABIT_FREQUENCY_OPTIONS,
  getHabitFrequencyOption,
  getHabitProgress,
  type Habit,
  type HabitFrequencyOption,
} from "../../domain/model.js";
import {
  HABIT_COLORS,
  HABIT_FILTER_OPTIONS,
  HABIT_ICONS,
  HABIT_STATS_RANGE_OPTIONS,
  WEEKDAY_LABELS,
} from "../app-content.js";
import { formatMonthDayLabel, formatSignedPoints, formatWeekLabel } from "../app-helpers.js";
import { DateJumpPopover } from "../date-jump-popover.js";
import type {
  HabitBoardFilter,
  HabitBoardLayout,
  HabitCheckInDraft,
  HabitDraft,
  HabitStatsRange,
  HabitStatsSummary,
} from "../app-types.js";

interface HabitBoardProps {
  activeHabits: Habit[];
  filteredHabits: Habit[];
  selectedDateKey: string;
  today: string;
  weekDates: string[];
  search: string;
  filter: HabitBoardFilter;
  layout: HabitBoardLayout;
  onOpenManagement: () => void;
  onOpenStatistics: () => void;
  onOpenFutureFlow: (message: string) => void;
  onJumpToToday: () => void;
  onShiftSelectedDate: (offset: number) => void;
  onSetSelectedDateKey: (dateKey: string) => void;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
  onSetLayout: (layout: HabitBoardLayout) => void;
  onSetFilter: (filter: HabitBoardFilter) => void;
  onCheckIn: (habitId: string) => void;
}

interface HabitManagementScreenProps {
  activeHabits: Habit[];
  selectedHabitIds: string[];
  onBack: () => void;
  onOpenCreateHabit: () => void;
  onImportHabits: () => void;
  onAddDefaultHabits: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onToggleSelection: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onOpenFutureFlow: (message: string) => void;
}

interface HabitStatisticsScreenProps {
  summary: HabitStatsSummary;
  range: HabitStatsRange;
  onBack: () => void;
  onSetRange: (range: HabitStatsRange) => void;
  onGoCheckIn: () => void;
}

interface HabitModalProps {
  open: boolean;
  draft: HabitDraft;
  canCreate: boolean;
  typeMenuOpen: boolean;
  typeRef: RefObject<HTMLDivElement | null>;
  typeOption: HabitFrequencyOption;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof HabitDraft, value: string | boolean) => void;
  onToggleTypeMenu: () => void;
  onSelectFrequency: (frequency: HabitDraft["frequency"]) => void;
}

interface HabitCheckInModalProps {
  habit: Habit | null;
  draft: HabitCheckInDraft;
  resolvedPoints: number;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof HabitCheckInDraft, value: string | boolean) => void;
}

function HabitControlIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <svg className="habit-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function HabitBoardCard({ habit, layout, selectedDateKey, onCheckIn }: { habit: Habit; layout: HabitBoardLayout; selectedDateKey: string; onCheckIn: (habitId: string) => void }) {
  const progress = getHabitProgress(habit, selectedDateKey);
  const frequency = getHabitFrequencyOption(habit.frequency);
  const isCompleted = progress.count >= progress.limit;
  const iconStyle = { "--habit-color": habit.color } as CSSProperties;

  return (
    <article className={`habit-board-card${layout === "list" ? " is-list" : ""}`}>
      <div className="habit-board-card-main">
        <div className="habit-card-title">
          <span className="habit-icon-chip" style={iconStyle}>
            {habit.icon}
          </span>
          <div>
            <h3>{habit.name}</h3>
            <div className="habit-badges">
              <span className="habit-badge">{frequency.label}</span>
              <span className={`habit-badge ${habit.points < 0 ? "habit-badge-negative" : "habit-badge-positive"}`}>
                {formatSignedPoints(habit.points)} 积分
              </span>
              {habit.approvalRequired ? <span className="habit-badge habit-badge-warning">待审核</span> : null}
            </div>
          </div>
        </div>
        <p className="habit-board-caption">
          {progress.period === "day" ? `今日 ${progress.count}/${progress.limit}` : `本周 ${progress.count}/${progress.limit}`}
        </p>
      </div>
      <div className="habit-board-card-side">
        <span className={`habit-status-pill${isCompleted ? " is-complete" : ""}`}>{isCompleted ? "已完成" : "可打卡"}</span>
        <button type="button" className="inline-primary-button habit-checkin-button" onClick={() => onCheckIn(habit.id)} disabled={isCompleted}>
          {isCompleted ? "已完成" : "+ 打卡"}
        </button>
      </div>
    </article>
  );
}

function HabitManagerRow({
  habit,
  selected,
  onToggleSelection,
  onDeleteHabit,
  onOpenFutureFlow,
}: {
  habit: Habit;
  selected: boolean;
  onToggleSelection: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onOpenFutureFlow: (message: string) => void;
}) {
  const frequency = getHabitFrequencyOption(habit.frequency);
  const iconStyle = { "--habit-color": habit.color } as CSSProperties;

  return (
    <article className={`habit-manager-row${selected ? " is-selected" : ""}`}>
      <label className="habit-manager-checkbox">
        <input type="checkbox" checked={selected} onChange={() => onToggleSelection(habit.id)} aria-label={`选择 ${habit.name}`} />
      </label>
      <span className="habit-icon-chip" style={iconStyle}>
        {habit.icon}
      </span>
      <div className="habit-manager-row-copy">
        <h3>{habit.name}</h3>
        <div className="habit-badges">
          <span className="habit-badge">{frequency.label}</span>
          <span className={`habit-badge ${habit.points < 0 ? "habit-badge-negative" : "habit-badge-positive"}`}>
            {formatSignedPoints(habit.points)} 积分
          </span>
          {habit.approvalRequired ? <span className="habit-badge habit-badge-warning">待审核</span> : null}
        </div>
      </div>
      <div className="habit-manager-row-actions">
        <button type="button" className="habit-row-action" onClick={() => onOpenFutureFlow("编辑流程仍在开发中。")} aria-label={`编辑 ${habit.name}`}>
          编辑
        </button>
        <button type="button" className="habit-row-action" onClick={() => onDeleteHabit(habit.id)} aria-label={`删除 ${habit.name}`}>
          删除
        </button>
        <button type="button" className="habit-row-action" onClick={() => onOpenFutureFlow("排序流程仍在开发中。")} aria-label={`排序 ${habit.name}`}>
          排序
        </button>
      </div>
    </article>
  );
}

// Habits module keeps board, management, stats, and modals together.
export function HabitBoard({
  activeHabits,
  filteredHabits,
  selectedDateKey,
  today: _today,
  weekDates,
  search,
  filter,
  layout,
  onOpenManagement,
  onOpenStatistics,
  onOpenFutureFlow,
  onJumpToToday,
  onShiftSelectedDate,
  onSetSelectedDateKey,
  onSearchChange,
  onResetFilters,
  onSetLayout,
  onSetFilter,
  onCheckIn,
}: HabitBoardProps) {
  if (activeHabits.length === 0) {
    return (
      <div className="board-stack">
        <div className="habit-empty-state">
          <div className="habit-empty-icon" />
          <h3>还没有习惯</h3>
          <p>先创建几个习惯，再开始每天打卡。</p>
          <button type="button" className="inline-primary-button" onClick={onOpenManagement}>
            创建习惯
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="board-stack">
      <div className="habit-section-head">
        <div className="habit-section-title">
          <span className="habit-section-accent" />
          <h3>我的习惯</h3>
        </div>
        <div className="habit-section-actions">
          <button type="button" className="chip-button chip-button-violet" onClick={onOpenStatistics}>
            数据统计
          </button>
          <button type="button" className="chip-button chip-button-strong" onClick={onOpenManagement}>
            习惯管理
          </button>
        </div>
      </div>

      <section className="habit-board-panel">
        <div className="habit-week-head">
          <div>
            <p className="week-label">{formatWeekLabel(selectedDateKey)}</p>
            <strong>按周查看打卡记录</strong>
          </div>
          <div className="habit-week-actions">
            <button type="button" className="filter-chip habit-week-pill" onClick={() => onOpenFutureFlow("补打卡规则仍在开发中。")}>
              <HabitControlIcon>
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="2" />
              </HabitControlIcon>
              可补打卡
            </button>
            <button type="button" className="icon-button icon-button-strong habit-week-pill habit-week-pill-today" onClick={onJumpToToday}>
              今天
            </button>
            <button type="button" className="icon-button habit-nav-button" onClick={() => onShiftSelectedDate(-1)} aria-label="上一天">
              <HabitControlIcon>
                <path d="M14.5 6.5L9 12l5.5 5.5" />
              </HabitControlIcon>
            </button>
            <button type="button" className="icon-button habit-nav-button" onClick={() => onShiftSelectedDate(1)} aria-label="下一天">
              <HabitControlIcon>
                <path d="M9.5 6.5L15 12l-5.5 5.5" />
              </HabitControlIcon>
            </button>
            <DateJumpPopover
              valueDateKey={selectedDateKey}
              todayDateKey={_today}
              onSelectDate={onSetSelectedDateKey}
              buttonClassName="icon-button habit-nav-button"
              buttonLabel={
                <HabitControlIcon>
                  <rect x="4" y="6" width="16" height="14" rx="2" />
                  <path d="M8 4v4M16 4v4M4 10h16" />
                </HabitControlIcon>
              }
              buttonAriaLabel="打开日历跳转日期"
            />
          </div>
        </div>

        <div className="habit-day-strip" role="tablist" aria-label="习惯周日期">
          {weekDates.map((dateKey, index) => {
            const isSelected = dateKey === selectedDateKey;
            const hasCheckin = activeHabits.some((habit) => (habit.completions[dateKey] ?? 0) > 0);
            return (
              <button key={dateKey} type="button" className={`habit-day-pill${isSelected ? " is-selected" : ""}`} onClick={() => onSetSelectedDateKey(dateKey)}>
                <span>{WEEKDAY_LABELS[index]}</span>
                <strong>{formatMonthDayLabel(dateKey)}</strong>
                <small className={`habit-day-dot${hasCheckin ? " has-checkin" : ""}`} />
              </button>
            );
          })}
        </div>

        <div className="habit-toolbar">
          <label className="habit-search-field">
            <span className="habit-search-icon" aria-hidden="true">
              <HabitControlIcon>
                <circle cx="11" cy="11" r="6" />
                <path d="M16 16L20 20" />
              </HabitControlIcon>
            </span>
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="搜索习惯名称或描述..." />
          </label>
          <div className="habit-toolbar-actions" role="group" aria-label="习惯列表工具">
            <button type="button" className="habit-toolbar-button" onClick={onResetFilters} aria-label="重置习惯筛选">
              <HabitControlIcon>
                <path d="M20 12a8 8 0 10-2.2 5.5" />
                <path d="M20 5v7h-7" />
              </HabitControlIcon>
            </button>
            <div className="habit-layout-toggle" role="group" aria-label="切换布局">
              <button type="button" className={`habit-toolbar-button habit-layout-option${layout === "grid" ? " is-active" : ""}`} onClick={() => onSetLayout("grid")} aria-label="宫格视图">
                <HabitControlIcon>
                  <rect x="5" y="5" width="5" height="5" rx="1" />
                  <rect x="14" y="5" width="5" height="5" rx="1" />
                  <rect x="5" y="14" width="5" height="5" rx="1" />
                  <rect x="14" y="14" width="5" height="5" rx="1" />
                </HabitControlIcon>
              </button>
              <button type="button" className={`habit-toolbar-button habit-layout-option${layout === "list" ? " is-active" : ""}`} onClick={() => onSetLayout("list")} aria-label="列表视图">
                <HabitControlIcon>
                  <path d="M9 7h10M9 12h10M9 17h10" />
                  <path d="M5 7h.01M5 12h.01M5 17h.01" />
                </HabitControlIcon>
              </button>
            </div>
          </div>
        </div>

        <div className="habit-filter-row">
          {HABIT_FILTER_OPTIONS.map((option) => (
            <button key={option.value} type="button" className={`habit-filter-pill${filter === option.value ? " is-active" : ""}`} onClick={() => onSetFilter(option.value)}>
              {option.label}
            </button>
          ))}
        </div>

        {filteredHabits.length > 0 ? (
          <div className={`habit-board-cards habit-board-cards-${layout}`}>
            {filteredHabits.map((habit) => (
              <HabitBoardCard key={habit.id} habit={habit} layout={layout} selectedDateKey={selectedDateKey} onCheckIn={onCheckIn} />
            ))}
          </div>
        ) : (
          <div className="habit-filter-empty">
            <h4>没有符合当前筛选条件的习惯</h4>
            <p>请调整筛选条件、清空搜索词，或前往管理页新增习惯。</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function HabitManagementScreen({
  activeHabits,
  selectedHabitIds,
  onBack,
  onOpenCreateHabit,
  onImportHabits,
  onAddDefaultHabits,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onToggleSelection,
  onDeleteHabit,
  onOpenFutureFlow,
}: HabitManagementScreenProps) {
  const selectedSet = new Set(selectedHabitIds);

  return (
    <>
      <header className="manager-hero">
        <button type="button" className="back-button" onClick={onBack}>
          返回
        </button>
        <div className="manager-hero-copy">
          <h1>习惯管理</h1>
          <p>创建并维护行为习惯。</p>
        </div>
        <div className="manager-actions">
          <button type="button" className="chip-button chip-button-strong" onClick={onOpenCreateHabit}>
            新建习惯
          </button>
          <button type="button" className="chip-button" onClick={onImportHabits}>
            导入习惯
          </button>
          <button type="button" className="chip-button" onClick={onAddDefaultHabits}>
            添加默认习惯
          </button>
        </div>
      </header>

      <section className="manager-surface">
        {activeHabits.length === 0 ? (
          <div className="manager-empty-card">
            <div className="manager-empty-icon" />
            <h2>还没有习惯</h2>
            <p>创建第一个习惯后，就可以开始记录行为和星星变化。</p>
            <button type="button" className="inline-primary-button" onClick={onOpenCreateHabit}>
              创建第一个习惯
            </button>
          </div>
        ) : (
          <>
            <div className="habit-selection-bar">
              <strong>
                已选 {selectedHabitIds.length} / {activeHabits.length}
              </strong>
              <div className="habit-selection-actions">
                <button type="button" className="manager-utility-button" onClick={onSelectAll}>
                  全选
                </button>
                <button type="button" className="manager-utility-button" onClick={onClearSelection} disabled={selectedHabitIds.length === 0}>
                  清空
                </button>
                <button type="button" className="manager-danger-button" onClick={onDeleteSelected} disabled={selectedHabitIds.length === 0}>
                  删除所选
                </button>
              </div>
            </div>
            <div className="habit-manager-list">
              {activeHabits.map((habit) => (
                <HabitManagerRow
                  key={habit.id}
                  habit={habit}
                  selected={selectedSet.has(habit.id)}
                  onToggleSelection={onToggleSelection}
                  onDeleteHabit={onDeleteHabit}
                  onOpenFutureFlow={onOpenFutureFlow}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

export function HabitStatisticsScreen({ summary, range, onBack, onSetRange, onGoCheckIn }: HabitStatisticsScreenProps) {
  return (
    <>
      <header className="manager-hero">
        <button type="button" className="back-button" onClick={onBack}>
          返回
        </button>
        <div className="manager-hero-copy">
          <h1>习惯统计</h1>
          <p>查看打卡总数与积分变化趋势。</p>
        </div>
      </header>

      <section className="habit-stats-strip">
        <article className="metric-card habit-stats-card tone-blue">
          <span>打卡次数</span>
          <strong>{summary.checkIns}</strong>
        </article>
        <article className="metric-card habit-stats-card tone-green">
          <span>总积分</span>
          <strong>{summary.totalPoints}</strong>
        </article>
        <article className="metric-card habit-stats-card tone-violet">
          <span>习惯数量</span>
          <strong>{summary.habitCount}</strong>
        </article>
        <article className="metric-card habit-stats-card tone-orange">
          <span>平均积分</span>
          <strong>{summary.averagePoints}</strong>
        </article>
      </section>

      <div className="habit-stats-range-row">
        {HABIT_STATS_RANGE_OPTIONS.map((option) => (
          <button key={option.value} type="button" className={`habit-stats-range-chip${range === option.value ? " is-active" : ""}`} onClick={() => onSetRange(option.value)}>
            {option.label}
          </button>
        ))}
      </div>

      <section className="manager-surface habit-stats-surface">
        {summary.checkIns === 0 ? (
          <div className="manager-empty-card habit-stats-empty-card">
            <div className="manager-empty-icon habit-stats-empty-icon" />
            <h2>还没有打卡记录</h2>
            <p>先去完成打卡，再回来查看统计数据。</p>
            <button type="button" className="inline-primary-button" onClick={onGoCheckIn}>
              去打卡
            </button>
          </div>
        ) : (
          <div className="habit-stats-list">
            {summary.rows.map((row) => (
              <article key={row.habitId} className="habit-stats-row">
                <div>
                  <h3>{row.name}</h3>
                  <p>{row.checkIns} 次打卡</p>
                </div>
                <strong className={row.points >= 0 ? "is-positive" : "is-negative"}>{formatSignedPoints(row.points)} 积分</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function HabitModal({
  open,
  draft,
  canCreate,
  typeMenuOpen,
  typeRef,
  typeOption,
  onClose,
  onSubmit,
  onUpdateDraft,
  onToggleTypeMenu,
  onSelectFrequency,
}: HabitModalProps) {
  if (!open) {
    return null;
  }

  const previewStyle = { "--habit-color": draft.color } as CSSProperties;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>创建习惯</h2>
            <p>配置习惯规则、积分、图标和颜色。</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="habit-form" onSubmit={onSubmit}>
          <label className="field-block">
            <span>名称</span>
            <input value={draft.name} onChange={(event) => onUpdateDraft("name", event.target.value)} placeholder="晨读" />
          </label>

          <label className="field-block">
            <span>描述</span>
            <textarea value={draft.description} onChange={(event) => onUpdateDraft("description", event.target.value)} placeholder="描述这个习惯该怎么做" rows={3} />
          </label>

          <div className="field-block" ref={typeRef}>
            <span>习惯类型</span>
            <button type="button" className={`dropdown-trigger${typeMenuOpen ? " is-open" : ""}`} onClick={onToggleTypeMenu}>
              <span>{typeOption.label}</span>
              <span className="dropdown-arrow">{typeMenuOpen ? "▲" : "▼"}</span>
            </button>
            {typeMenuOpen ? (
              <div className="dropdown-menu">
                {HABIT_FREQUENCY_OPTIONS.map((option) => (
                  <button key={option.value} type="button" className={`dropdown-option${draft.frequency === option.value ? " is-selected" : ""}`} onClick={() => onSelectFrequency(option.value)}>
                    <span>{option.label}</span>
                    {draft.frequency === option.value ? <strong>已选</strong> : null}
                  </button>
                ))}
              </div>
            ) : null}
            <p className="field-helper">{typeOption.helper}</p>
          </div>

          <label className="field-block">
            <span>积分</span>
            <input type="number" min={-100} max={100} step={1} value={draft.points} onChange={(event) => onUpdateDraft("points", event.target.value)} />
            <p className="field-helper">正数奖励星星，负数扣减星星。</p>
          </label>

          <label className="approval-row">
            <input type="checkbox" checked={draft.approvalRequired} onChange={(event) => onUpdateDraft("approvalRequired", event.target.checked)} />
            <span>发放星星前需要审核</span>
          </label>
          <p className="approval-helper">开启后，后续审核流程可以确认或调整本次星星结果。</p>

          <div className="picker-grid">
            <div className="field-block">
              <span>图标</span>
              <div className="icon-grid">
                {HABIT_ICONS.map((icon) => (
                  <button key={icon} type="button" className={`icon-option${draft.icon === icon ? " is-selected" : ""}`} onClick={() => onUpdateDraft("icon", icon)}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-block">
              <span>颜色</span>
              <div className="color-grid">
                {HABIT_COLORS.map((color) => (
                  <button key={color} type="button" className={`color-option${draft.color === color ? " is-selected" : ""}`} style={{ background: color }} onClick={() => onUpdateDraft("color", color)} />
                ))}
              </div>
            </div>
          </div>

          <div className="preview-card">
            <span className="habit-icon-chip" style={previewStyle}>
              {draft.icon}
            </span>
            <div>
              <strong>{draft.name.trim() || "预览"}</strong>
              <p>{typeOption.label}</p>
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="modal-submit" disabled={!canCreate}>
              创建
            </button>
            <button type="button" className="modal-cancel" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HabitCheckInModal({ habit, draft, resolvedPoints, canSubmit, onClose, onSubmit, onUpdateDraft }: HabitCheckInModalProps) {
  if (!habit) {
    return null;
  }

  const isPositive = resolvedPoints >= 0;
  const scoreLabel = habit.approvalRequired ? "待发积分" : resolvedPoints >= 0 ? "获得积分" : "扣减积分";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card checkin-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>习惯打卡</h2>
            <p>记录这次习惯打卡的结果。</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="habit-form" onSubmit={onSubmit}>
          <div className="checkin-habit-name">{habit.name}</div>

          <label className="field-block">
            <span>备注</span>
            <textarea value={draft.note} onChange={(event) => onUpdateDraft("note", event.target.value)} placeholder="为本次打卡补充备注" rows={4} />
          </label>

          <label className="approval-row checkin-toggle-row">
            <input
              type="checkbox"
              checked={draft.useCustomPoints}
              onChange={(event) => {
                onUpdateDraft("useCustomPoints", event.target.checked);
                if (event.target.checked) {
                  onUpdateDraft("customPoints", String(habit.points));
                }
              }}
            />
            <span>本次打卡覆盖默认积分</span>
          </label>

          {draft.useCustomPoints ? (
            <label className="field-block">
              <span>积分值（-1000 到 1000）</span>
              <input type="number" min={-1000} max={1000} step={1} value={draft.customPoints} onChange={(event) => onUpdateDraft("customPoints", event.target.value)} />
            </label>
          ) : null}

          <div className="checkin-points-card">
            <span>{scoreLabel}</span>
            <strong className={isPositive ? "is-positive" : "is-negative"}>{resolvedPoints > 0 ? `+${resolvedPoints}` : resolvedPoints} 星</strong>
          </div>

          <div className="modal-actions checkin-modal-actions">
            <button type="submit" className="modal-submit modal-submit-primary" disabled={!canSubmit}>
              确认打卡
            </button>
            <button type="button" className="modal-cancel" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



