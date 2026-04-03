import type { CSSProperties, DragEvent, JSX } from "react";
import type { StudyPlan } from "../../domain/model.js";
import { WEEKDAY_LABELS } from "../app-content.js";
import { formatDateLabel, getSubjectStyle, parseDateKey } from "../app-helpers.js";
import type { PlanDeleteScope } from "../app-types.js";
import { formatPlanRepeatBadgeLabel } from "./plan-repeat.js";

interface PlanManagementScreenProps {
  today: string;
  managedDateKey: string;
  plans: StudyPlan[];
  selectedPlanIds: string[];
  isDirty: boolean;
  onBack: () => void;
  onSave: () => void;
  onJumpToToday: () => void;
  onShiftDate: (offset: number) => void;
  onToggleSelectAll: () => void;
  onTogglePlanSelection: (planId: string) => void;
  onMovePlan: (draggedId: string, targetId: string) => void;
  onCopySelected: () => void;
  onShareSelected: () => void;
  onDeleteSelected: () => void;
}

interface PlanDeleteSelectedModalProps {
  open: boolean;
  managedDateKey: string;
  today: string;
  selectedCount: number;
  hasRecurringSelection: boolean;
  onClose: () => void;
  onConfirmDelete: (scope: PlanDeleteScope) => void;
}

const MANAGEMENT_TIPS = [
  "点击日期按钮可切换管理日期。",
  "拖动右侧手柄图标可调整计划顺序。",
  "排序只会应用到当前所选日期的任务显示。",
  "勾选复选框后可对计划做批量操作。",
  "非当天日期也可以复制任务到其他日期。",
  "分享和删除入口会在后续流程里继续补齐。",
  "完成调整后记得点击右上角“保存”。",
];

function formatManagedDateChip(dateKey: string, today: string): string {
  if (dateKey === today) {
    return "今天";
  }
  return formatDateLabel(dateKey);
}

function getWeekdayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return WEEKDAY_LABELS[(date.getDay() + 6) % 7];
}

function PlanManagementCard({
  plan,
  selected,
  onToggleSelection,
  onMovePlan,
}: {
  plan: StudyPlan;
  selected: boolean;
  onToggleSelection: (planId: string) => void;
  onMovePlan: (draggedId: string, targetId: string) => void;
}): JSX.Element {
  const subjectStyle = getSubjectStyle(plan.subject);

  function handleDragStart(event: DragEvent<HTMLButtonElement>): void {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", plan.id);
  }

  function handleDrop(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain");
    if (!draggedId) {
      return;
    }
    onMovePlan(draggedId, plan.id);
  }

  return (
    <article
      className={`plan-management-card${selected ? " is-selected" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      style={
        {
          "--plan-management-accent": subjectStyle.accent,
          "--plan-management-tint": subjectStyle.tint,
        } as CSSProperties
      }
    >
      <label className="plan-management-checkbox">
        <input type="checkbox" checked={selected} onChange={() => onToggleSelection(plan.id)} />
        <span />
      </label>

      <div className="plan-management-card-main">
        <div className="plan-management-card-tags">
          <span className="plan-management-card-tag">{plan.subject}</span>
          <span className="plan-management-card-tag is-muted">{formatPlanRepeatBadgeLabel(plan.repeatType)}</span>
        </div>
        <strong>{plan.title}</strong>
      </div>

      <button
        type="button"
        className="plan-management-handle"
        draggable
        onDragStart={handleDragStart}
        aria-label={`拖动调整 ${plan.title} 的顺序`}
      >
        ⋮⋯
      </button>
    </article>
  );
}

export function PlanManagementScreen({
  today,
  managedDateKey,
  plans,
  selectedPlanIds,
  isDirty,
  onBack,
  onSave,
  onJumpToToday,
  onShiftDate,
  onToggleSelectAll,
  onTogglePlanSelection,
  onMovePlan,
  onCopySelected,
  onShareSelected,
  onDeleteSelected,
}: PlanManagementScreenProps) {
  const selectedCount = selectedPlanIds.length;
  const allSelected = plans.length > 0 && selectedCount === plans.length;

  return (
    <div className="plan-management-page">
      <header className="plan-management-hero">
        <div className="plan-management-topbar">
          <button type="button" className="plan-management-top-button is-ghost" onClick={onBack}>
            × 取消
          </button>

          <div className="plan-management-center">
            <h1>计划管理</h1>
            <div className="plan-management-date-bar">
              <button type="button" className="plan-management-date-chip is-small" onClick={onJumpToToday}>
                今天
              </button>
              <button type="button" className="plan-management-nav-button" onClick={() => onShiftDate(-1)}>
                ←
              </button>
              <div className="plan-management-date-chip is-main">
                <span>{formatManagedDateChip(managedDateKey, today)}</span>
                <strong>{getWeekdayLabel(managedDateKey)}</strong>
              </div>
              <button type="button" className="plan-management-nav-button" onClick={() => onShiftDate(1)}>
                →
              </button>
            </div>
          </div>

          <button type="button" className="plan-management-top-button is-primary" onClick={onSave}>
            保存
          </button>
        </div>
      </header>

      <div className="plan-management-shell">
        <section className="plan-management-selection-bar">
          <button type="button" className="plan-management-select-toggle" onClick={onToggleSelectAll}>
            <span className={`plan-management-checkmark${allSelected ? " is-active" : ""}`}>{allSelected ? "✓" : ""}</span>
            <strong>{selectedCount > 0 ? `已选择 ${selectedCount} 项` : "全选"}</strong>
          </button>

          {selectedCount > 0 ? (
            <div className="plan-management-action-group">
              <button type="button" className="plan-management-action is-green" onClick={onCopySelected}>
                复制到...
              </button>
              <button type="button" className="plan-management-action is-blue" onClick={onShareSelected}>
                分享计划
              </button>
              <button type="button" className="plan-management-action is-red" onClick={onDeleteSelected}>
                删除选中
              </button>
            </div>
          ) : null}
        </section>

        <section className="plan-management-tips">
          <div className="plan-management-tips-head">
            <strong>使用说明:</strong>
            {isDirty ? <span>当前顺序已调整，记得保存。</span> : null}
          </div>
          <ul>
            {MANAGEMENT_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        {plans.length > 0 ? (
          <div className="plan-management-list">
            {plans.map((plan) => (
              <PlanManagementCard
                key={plan.id}
                plan={plan}
                selected={selectedPlanIds.includes(plan.id)}
                onToggleSelection={onTogglePlanSelection}
                onMovePlan={onMovePlan}
              />
            ))}
          </div>
        ) : (
          <section className="plan-management-empty">
            <h2>{managedDateKey === today ? "今天还没有待管理的计划" : `${formatDateLabel(managedDateKey)} 暂无待管理计划`}</h2>
            <p>可以切换日期查看其他任务，或返回首页先创建新的学习计划。</p>
          </section>
        )}
      </div>
    </div>
  );
}

function formatDeleteDateLabel(dateKey: string, today: string): string {
  if (dateKey === today) {
    return "今天";
  }
  return formatDateLabel(dateKey);
}

export function PlanDeleteSelectedModal({
  open,
  managedDateKey,
  today,
  selectedCount,
  hasRecurringSelection,
  onClose,
  onConfirmDelete,
}: PlanDeleteSelectedModalProps) {
  if (!open) {
    return null;
  }

  const scopedDateLabel = formatDeleteDateLabel(managedDateKey, today);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card plan-delete-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head plan-delete-modal-head">
          <div>
            <h2>删除任务</h2>
            <p>{selectedCount === 1 ? "你选中了 1 个任务。" : `你选中了 ${selectedCount} 个任务。`}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭删除任务弹窗">
            ×
          </button>
        </div>

        <div className="plan-delete-modal-body">
          <p className="plan-delete-modal-copy">
            {hasRecurringSelection
              ? "已选任务中包含重复任务，请明确选择删除范围。"
              : "请选择删除范围。当前页面展示的是所选日期下的学习计划。"}
          </p>

          <div className="plan-delete-modal-options">
            <button type="button" className="plan-delete-option" onClick={() => onConfirmDelete("currentDateOnly")}>
              <strong>仅删除 {scopedDateLabel}</strong>
              <span>只删除当前管理日期下的所选计划</span>
            </button>

            <button type="button" className="plan-delete-option is-danger" onClick={() => onConfirmDelete("allOccurrences")}>
              <strong>删除所有重复任务</strong>
              <span>删除这些计划的全部记录与后续日期</span>
            </button>
          </div>

          <div className="plan-delete-modal-warning">
            <strong>注意</strong>
            <p>
              删除后无法恢复。仅删除当前日期会保留重复计划本体并排除该日期，删除所有重复任务会彻底移除该计划。
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
