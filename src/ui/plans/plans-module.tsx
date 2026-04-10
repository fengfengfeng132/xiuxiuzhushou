import type { ChangeEvent, CSSProperties, DragEvent, FormEvent, KeyboardEvent, RefObject } from "react";
import type { StudyPlan } from "../../domain/model.js";
import { QUICK_COMPLETE_PRESETS, WEEKDAY_LABELS } from "../app-content.js";
import {
  formatAttachmentSize,
  formatClock,
  formatDateLabel,
  formatDurationSummary,
  formatWeekLabel,
  getCompletedPlansForDate,
  getLatestPlanCompletionRecord,
  getPendingPlansForDate,
  getRecordedPlanMinutes,
  getSubjectStyle,
  parseDateKey,
} from "../app-helpers.js";
import type {
  PendingPlanReviewItem,
  PlanPointsReviewDecision,
  PlanPointsReviewDraft,
  QuickCompleteAttachmentDraft,
  QuickCompleteDraft,
  QuickCompleteMode,
} from "../app-types.js";
import { DateJumpPopover } from "../date-jump-popover.js";
import { formatPlanRepeatBadgeLabel } from "./plan-repeat.js";

interface PlanBoardProps {
  today: string;
  selectedDateKey: string;
  weekDates: string[];
  plans: StudyPlan[];
  pendingPlans: StudyPlan[];
  completedPlans: StudyPlan[];
  pendingReviewCount: number;
  onSetSelectedDateKey: (dateKey: string) => void;
  onJumpToToday: () => void;
  onShiftSelectedDate: (offset: number) => void;
  onOpenAiPlanAssistant: () => void;
  onOpenPlanManagement: () => void;
  onOpenPlanCreate: () => void;
  onOpenBatchPlanCreate: () => void;
  onOpenQuickComplete: (plan: StudyPlan) => void;
  onOpenPlanPointsReview: () => void;
  onApproveAllPlanPointsReview: () => void;
  onOpenStudyTimer: (plan: StudyPlan) => void;
  onOpenPlanDetail: (plan: StudyPlan) => void;
  onOpenFutureFlow: (message: string) => void;
}

interface QuickCompleteModalProps {
  plan: StudyPlan | null;
  draft: QuickCompleteDraft;
  totalSeconds: number;
  canSubmit: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onUpdateDraft: (field: keyof QuickCompleteDraft, value: string | QuickCompleteMode | QuickCompleteAttachmentDraft[]) => void;
  onApplyPreset: (totalSeconds: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectFiles: (files: FileList | null) => void;
  onDropFiles: (event: DragEvent<HTMLButtonElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}

interface PlanPointsReviewModalProps {
  item: PendingPlanReviewItem | null;
  draft: PlanPointsReviewDraft;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof PlanPointsReviewDraft, value: string | PlanPointsReviewDecision) => void;
}

interface PlanDetailModalProps {
  plan: StudyPlan | null;
  selectedDateKey: string;
  completedForSelectedDate: boolean;
  completionRecordsForSelectedDate: StudyPlan["completionRecords"];
  onClose: () => void;
  onEditPlan: (plan: StudyPlan) => void;
  onEditCurrentOccurrence: (plan: StudyPlan) => void;
  onDeleteRepeat: (plan: StudyPlan) => void;
}

interface PlanCardProps {
  today: string;
  plan: StudyPlan;
  variant: "active" | "history";
  selectedDateKey: string;
  onOpenQuickComplete: (plan: StudyPlan) => void;
  onOpenStudyTimer: (plan: StudyPlan) => void;
  onOpenPlanDetail: (plan: StudyPlan) => void;
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatRecordDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatMinuteTotal(durationSeconds: number): string {
  return `${Math.floor(durationSeconds / 60)}分钟`;
}

function formatSessionRange(completedAt: string, durationSeconds: number): string {
  const end = new Date(completedAt);
  const start = new Date(end.getTime() - durationSeconds * 1000);
  return `${formatClock(start.toISOString())} - ${formatClock(completedAt)}`;
}

function formatPlanDateRange(plan: StudyPlan): string {
  const start = plan.createdAt.slice(0, 10);
  const end = plan.completedAt ? plan.completedAt.slice(0, 10) : start;
  return `${start} → ${end}`;
}

function describeAttachmentType(type: string): string {
  if (type.startsWith("audio/")) {
    return "音频";
  }
  if (type.startsWith("video/")) {
    return "视频";
  }
  if (type.startsWith("image/")) {
    return "图片";
  }
  return "附件";
}

function getRecordedSeconds(plan: StudyPlan): number {
  return plan.completionRecords.reduce((sum, record) => sum + record.durationSeconds, 0) || plan.minutes * 60;
}

function PlanCard({
  today,
  plan,
  variant,
  selectedDateKey,
  onOpenQuickComplete,
  onOpenStudyTimer,
  onOpenPlanDetail,
}: PlanCardProps) {
  const style = getSubjectStyle(plan.subject);
  const completionRecord = getLatestPlanCompletionRecord(plan);
  const recordedMinutes = getRecordedPlanMinutes(plan);
  const cardStyle = {
    "--subject-tint": style.tint,
    "--subject-glow": style.glow,
    "--subject-accent": style.accent,
  } as CSSProperties;

  function handleOpenDetail(): void {
    onOpenPlanDetail(plan);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenDetail();
    }
  }

  return (
    <article
      className={`plan-card plan-card-${variant} is-clickable`}
      style={cardStyle}
      onClick={handleOpenDetail}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="plan-rail">
        <span>{plan.subject.slice(0, 2)}</span>
      </div>
      <div className="plan-main">
        <div className="plan-badges">
          <span className="plan-tag">{plan.subject}</span>
          <span className="plan-tag">{formatPlanRepeatBadgeLabel(plan.repeatType)}</span>
          <span className="plan-tag plan-tag-muted">{variant === "active" && selectedDateKey === today ? "今日计划" : formatDateLabel(selectedDateKey)}</span>
          {variant === "history" ? <span className="status-pill">已完成</span> : null}
        </div>
        <h3>{plan.title}</h3>
        <p className="plan-copy">
          {variant === "active"
            ? `安排 ${plan.minutes} 分钟专注学习，可直接快速完成，或进入专注计时页。`
            : `完成于 ${formatClock(plan.completedAt)}，本次记录 ${recordedMinutes} 分钟，点击卡片可查看详情。`}
        </p>
        <div className="plan-meta">
          <span>{variant === "active" ? `${plan.minutes} 分钟` : `${recordedMinutes} 分钟`}</span>
          <span>{plan.stars} 星星</span>
          <span>{variant === "active" ? "支持快速完成与专注计时" : completionRecord?.note ? "含学习备注" : `完成于 ${formatClock(plan.completedAt)}`}</span>
        </div>
      </div>
      <div className="plan-side">
        {variant === "active" ? (
          <>
            <button
              type="button"
              className="card-action primary-action"
              onClick={(event) => {
                event.stopPropagation();
                onOpenQuickComplete(plan);
              }}
            >
              快速完成
            </button>
            <button
              type="button"
              className="card-action ghost-action"
              onClick={(event) => {
                event.stopPropagation();
                onOpenStudyTimer(plan);
              }}
            >
              开始计时
            </button>
          </>
        ) : (
          <button
            type="button"
            className="card-action ghost-action"
            onClick={(event) => {
              event.stopPropagation();
              handleOpenDetail();
            }}
          >
            查看详情
          </button>
        )}
      </div>
    </article>
  );
}

export function PlanBoard({
  today,
  selectedDateKey,
  weekDates,
  plans,
  pendingPlans,
  completedPlans,
  pendingReviewCount,
  onSetSelectedDateKey,
  onJumpToToday,
  onShiftSelectedDate,
  onOpenAiPlanAssistant,
  onOpenPlanManagement,
  onOpenPlanCreate,
  onOpenBatchPlanCreate,
  onOpenQuickComplete,
  onOpenPlanPointsReview,
  onApproveAllPlanPointsReview,
  onOpenStudyTimer,
  onOpenPlanDetail,
  onOpenFutureFlow,
}: PlanBoardProps) {
  const hasPlans = pendingPlans.length > 0 || completedPlans.length > 0;

  return (
    <div className="board-stack">
      <div className="board-head">
        <div>
          <p className="eyebrow">首页看板</p>
          <h2>学习计划</h2>
        </div>
        <div className="board-actions">
          <button type="button" className="chip-button" onClick={onOpenAiPlanAssistant}>
            智能创建
          </button>
          <button type="button" className="chip-button" onClick={onOpenBatchPlanCreate}>
            批量添加
          </button>
          <button type="button" className="chip-button chip-button-strong" onClick={onOpenPlanCreate}>
            添加计划
          </button>
        </div>
      </div>

      <section className="week-panel">
        <div className="week-head">
          <div>
            <p className="week-label">{formatWeekLabel(selectedDateKey)}</p>
            <strong>{selectedDateKey === today ? "今日计划支持直接操作" : `${formatDateLabel(selectedDateKey)} 的历史记录`}</strong>
          </div>
          <div className="week-actions">
            <button type="button" className="icon-button" onClick={() => onShiftSelectedDate(-1)}>
              前一天
            </button>
            <button type="button" className="icon-button icon-button-strong" onClick={onJumpToToday}>
              今天
            </button>
            <button type="button" className="icon-button" onClick={() => onShiftSelectedDate(1)}>
              后一天
            </button>
            <DateJumpPopover
              valueDateKey={selectedDateKey}
              todayDateKey={today}
              onSelectDate={onSetSelectedDateKey}
              buttonClassName="icon-button"
              buttonLabel="日历"
              buttonAriaLabel="打开日历跳转日期"
            />
          </div>
        </div>
        <div className="day-strip" role="tablist" aria-label="本周日期">
          {weekDates.map((dateKey, index) => {
            const isSelected = dateKey === selectedDateKey;
            const isToday = dateKey === today;
            const visiblePlanCount = getPendingPlansForDate(plans, dateKey).length + getCompletedPlansForDate(plans, dateKey).length;
            return (
              <button
                key={dateKey}
                type="button"
                className={`day-pill${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                onClick={() => onSetSelectedDateKey(dateKey)}
              >
                <span>{WEEKDAY_LABELS[index]}</span>
                <strong>{parseDateKey(dateKey).getDate()}</strong>
                <small>{visiblePlanCount > 0 ? `${visiblePlanCount} 条计划` : isToday ? "今天" : "空白"}</small>
              </button>
            );
          })}
        </div>
      </section>

      {pendingReviewCount > 0 ? (
        <section className="plan-review-strip" aria-live="polite">
          <div className="plan-review-strip-copy">
            <strong>待审定积分任务</strong>
            <p>有 {pendingReviewCount} 个任务的积分需要审定</p>
          </div>
          <div className="plan-review-strip-actions">
            <button type="button" className="filter-chip" onClick={onOpenPlanPointsReview}>
              逐个审定
            </button>
            <button type="button" className="filter-chip filter-chip-strong" onClick={onApproveAllPlanPointsReview}>
              一键通过
            </button>
          </div>
        </section>
      ) : null}

      <section className="board-section">
        <div className="section-head">
          <div>
            <p className="section-title-kicker">{selectedDateKey === today ? "当前日期" : "所选日期"}</p>
            <h3>我的计划</h3>
          </div>
          <div className="section-tools">
            <button type="button" className="filter-chip" onClick={() => onOpenFutureFlow("分享流程仍在开发中。")}>
              分享
            </button>
            <button type="button" className="filter-chip" onClick={() => onOpenFutureFlow("科目筛选仍在开发中。")}>
              全部科目
            </button>
            <button type="button" className="filter-chip" onClick={() => onOpenFutureFlow("排序切换仍在开发中。")}>
              默认排序
            </button>
            <button type="button" className="filter-chip" onClick={() => onOpenFutureFlow("布局切换仍在开发中。")}>
              布局
            </button>
            <button type="button" className="filter-chip filter-chip-strong" onClick={onOpenPlanManagement}>
              管理
            </button>
          </div>
        </div>

        {hasPlans ? (
          <div className="plan-stack">
            {pendingPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                today={today}
                plan={plan}
                variant="active"
                selectedDateKey={selectedDateKey}
                onOpenQuickComplete={onOpenQuickComplete}
                onOpenStudyTimer={onOpenStudyTimer}
                onOpenPlanDetail={onOpenPlanDetail}
              />
            ))}
            {completedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                today={today}
                plan={plan}
                variant="history"
                selectedDateKey={selectedDateKey}
                onOpenQuickComplete={onOpenQuickComplete}
                onOpenStudyTimer={onOpenStudyTimer}
                onOpenPlanDetail={onOpenPlanDetail}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <div className="empty-state-icon" />
            <h4>这一天还没有计划</h4>
            <p>可以先添加一条计划，或切换到其他日期查看历史记录。</p>
            <button type="button" className="inline-primary-button" onClick={onOpenPlanCreate}>
              添加计划
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export function QuickCompleteModal({
  plan,
  draft,
  totalSeconds,
  canSubmit,
  fileInputRef,
  onClose,
  onUpdateDraft,
  onApplyPreset,
  onSubmit,
  onSelectFiles,
  onDropFiles,
  onRemoveAttachment,
}: QuickCompleteModalProps) {
  if (!plan) {
    return null;
  }

  const summaryDate = plan.createdAt.slice(0, 10);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card quick-complete-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="quick-complete-header">
          <div className="quick-complete-header-main">
            <span className="quick-complete-header-icon" aria-hidden="true">
              完
            </span>
            <div className="quick-complete-header-copy">
              <h2>快速完成</h2>
              <p>{plan.title}</p>
            </div>
          </div>
          <button type="button" className="modal-close quick-complete-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="quick-complete-form" onSubmit={onSubmit}>
          <section className="quick-complete-summary-card">
            <div className="quick-complete-summary-top">
              <span className="quick-complete-summary-badge">{plan.subject}</span>
              <span className="quick-complete-summary-date">{summaryDate}</span>
            </div>
            <h3>{plan.title}</h3>
            <p>本次计划目标 {plan.minutes} 分钟，可在这里记录真实完成情况。</p>
          </section>

          <section className="quick-complete-section">
            <div className="quick-complete-section-title">
              <span aria-hidden="true">●</span>
              <strong>时间设置</strong>
            </div>

            <div className="quick-complete-tabs" role="tablist" aria-label="快速完成时间模式">
              <button type="button" className={`quick-complete-tab${draft.mode === "duration" ? " is-active" : ""}`} onClick={() => onUpdateDraft("mode", "duration")}>
                时长录入
              </button>
              <button type="button" className={`quick-complete-tab${draft.mode === "actual" ? " is-active" : ""}`} onClick={() => onUpdateDraft("mode", "actual")}>
                实际时间
              </button>
            </div>

            {draft.mode === "duration" ? (
              <div className="quick-complete-time-grid">
                <label className="quick-complete-time-field">
                  <span>小时</span>
                  <input type="number" min={0} max={23} step={1} value={draft.hours} onChange={(event) => onUpdateDraft("hours", event.target.value)} />
                </label>
                <span className="quick-complete-separator" aria-hidden="true">
                  :
                </span>
                <label className="quick-complete-time-field">
                  <span>分钟</span>
                  <input type="number" min={0} max={59} step={1} value={draft.minutes} onChange={(event) => onUpdateDraft("minutes", event.target.value)} />
                </label>
                <span className="quick-complete-separator" aria-hidden="true">
                  :
                </span>
                <label className="quick-complete-time-field">
                  <span>秒</span>
                  <input type="number" min={0} max={59} step={1} value={draft.seconds} onChange={(event) => onUpdateDraft("seconds", event.target.value)} />
                </label>
              </div>
            ) : (
              <div className="quick-complete-clock-grid">
                <label className="quick-complete-clock-field">
                  <span>开始时间</span>
                  <input type="time" value={draft.actualStartTime} onChange={(event) => onUpdateDraft("actualStartTime", event.target.value)} />
                </label>
                <label className="quick-complete-clock-field">
                  <span>结束时间</span>
                  <input type="time" value={draft.actualEndTime} onChange={(event) => onUpdateDraft("actualEndTime", event.target.value)} />
                </label>
              </div>
            )}

            <div className="quick-complete-total">总计：{formatDurationSummary(totalSeconds)}</div>

            {draft.mode === "duration" ? (
              <div className="quick-complete-presets">
                <strong>常用时长</strong>
                <div className="quick-complete-preset-grid">
                  {QUICK_COMPLETE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`quick-complete-preset${totalSeconds === preset.seconds ? " is-active" : ""}`}
                      onClick={() => onApplyPreset(preset.seconds)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <label className="field-block">
            <span>备注</span>
            <textarea value={draft.note} onChange={(event) => onUpdateDraft("note", event.target.value)} placeholder="记录本次学习情况" rows={4} />
          </label>

          <div className="field-block">
            <span>附件</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,video/*"
              multiple
              hidden
              onChange={(event: ChangeEvent<HTMLInputElement>) => onSelectFiles(event.target.files)}
            />
            <button
              type="button"
              className="quick-complete-upload"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event: DragEvent<HTMLButtonElement>) => event.preventDefault()}
              onDrop={onDropFiles}
            >
              <span className="quick-complete-upload-icon" aria-hidden="true">
                +
              </span>
              <strong>点击上传或拖拽文件到此处</strong>
              <small>最多 15 个文件，单个文件不超过 50MB</small>
            </button>
            {draft.attachments.length > 0 ? (
              <div className="quick-complete-attachment-list">
                {draft.attachments.map((attachment) => (
                  <div key={attachment.id} className="quick-complete-attachment-chip">
                    <div>
                      <strong>{attachment.name}</strong>
                      <small>
                        {attachment.type || "未知类型"} · {formatAttachmentSize(attachment.size)}
                      </small>
                    </div>
                    <button type="button" className="quick-complete-attachment-remove" onClick={() => onRemoveAttachment(attachment.id)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="modal-actions quick-complete-modal-actions">
            <button type="button" className="modal-cancel quick-complete-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="modal-submit quick-complete-submit" disabled={!canSubmit}>
              确认完成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PlanPointsReviewModal({ item, draft, canSubmit, onClose, onSubmit, onUpdateDraft }: PlanPointsReviewModalProps) {
  if (!item) {
    return null;
  }

  const parsedAdjustedStars = Math.round(Number(draft.adjustedStars));
  const resolvedAdjustedStars = Number.isFinite(parsedAdjustedStars) ? parsedAdjustedStars : 0;
  const previewStars = draft.decision === "reject" ? 0 : draft.decision === "adjust" ? resolvedAdjustedStars : item.suggestedStars;
  const statusLabel = draft.decision === "approve" ? "通过" : draft.decision === "adjust" ? "调整" : "拒绝";
  const statusClassName =
    draft.decision === "approve"
      ? "plan-points-review-status is-approved"
      : draft.decision === "adjust"
        ? "plan-points-review-status is-adjusted"
        : "plan-points-review-status is-rejected";
  const reasonRequired = draft.decision === "adjust";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card plan-points-review-modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="plan-points-review-header">
          <div className="plan-points-review-header-main">
            <span className="plan-points-review-icon" aria-hidden="true">
              ★
            </span>
            <div>
              <h2>积分审定</h2>
              <p>审定并发放任务积分</p>
            </div>
          </div>
          <div className={statusClassName}>{statusLabel}</div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="plan-points-review-form" onSubmit={onSubmit}>
          <section className="plan-points-review-summary">
            <div className="plan-points-review-summary-top">
              <span className="plan-points-review-badge">{item.subject}</span>
              <span>{formatDateTime(item.completedAt)}</span>
            </div>
            <h3>{item.title}</h3>
            <p>
              学习时长：{formatDurationSummary(item.durationSeconds)} · 学习次数：{item.sessionCount}
            </p>
          </section>

          <section className="plan-points-review-section">
            <strong>审定操作</strong>
            <div className="plan-points-review-actions">
              <button
                type="button"
                className={`plan-points-review-action${draft.decision === "approve" ? " is-active is-approved" : ""}`}
                onClick={() => onUpdateDraft("decision", "approve")}
              >
                <span>通过</span>
                <small>{item.suggestedStars} ⭐</small>
              </button>
              <button
                type="button"
                className={`plan-points-review-action${draft.decision === "adjust" ? " is-active is-adjusted" : ""}`}
                onClick={() => onUpdateDraft("decision", "adjust")}
              >
                <span>调整</span>
                <small>修改积分</small>
              </button>
              <button
                type="button"
                className={`plan-points-review-action${draft.decision === "reject" ? " is-active is-rejected" : ""}`}
                onClick={() => onUpdateDraft("decision", "reject")}
              >
                <span>拒绝</span>
                <small>0 ⭐</small>
              </button>
            </div>
          </section>

          {draft.decision === "adjust" ? (
            <label className="field-block plan-points-review-adjust-field">
              <span>调整后积分数值</span>
              <input
                type="number"
                min={-1000}
                max={1000}
                step={1}
                value={draft.adjustedStars}
                onChange={(event) => onUpdateDraft("adjustedStars", event.target.value)}
              />
              <small>范围：-1000 到 1000 星星</small>
            </label>
          ) : null}

          <label className={`field-block${reasonRequired ? " plan-points-review-reason-required" : ""}`}>
            <span>审定说明 {reasonRequired ? "*" : "(可选)"}</span>
            <textarea
              value={draft.reason}
              onChange={(event) => onUpdateDraft("reason", event.target.value)}
              placeholder={reasonRequired ? "请说明调整积分的理由..." : "说明通过或拒绝的原因（可选）"}
              maxLength={200}
              rows={4}
            />
            <small>{draft.reason.length}/200</small>
          </label>

          <section className="plan-points-review-result">
            <strong>审定结果预览</strong>
            <p>
              发放积分：<span>{previewStars}</span> ⭐
            </p>
          </section>

          <div className="modal-actions plan-points-review-footer">
            <button type="button" className="modal-cancel plan-points-review-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="modal-submit modal-submit-primary" disabled={!canSubmit}>
              确认审定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PlanDetailModal({
  plan,
  selectedDateKey,
  completedForSelectedDate,
  completionRecordsForSelectedDate,
  onClose,
  onEditPlan,
  onEditCurrentOccurrence,
  onDeleteRepeat,
}: PlanDetailModalProps) {
  if (!plan) {
    return null;
  }

  const style = getSubjectStyle(plan.subject);
  const fallbackRecords = plan.completionRecords;
  const scopedRecords = completionRecordsForSelectedDate.length > 0 ? completionRecordsForSelectedDate : fallbackRecords;
  const visibleRecords = scopedRecords.slice(0, 12);
  const hiddenRecordCount = Math.max(0, scopedRecords.length - visibleRecords.length);
  const scopedTotalSeconds = scopedRecords.reduce((sum, record) => sum + record.durationSeconds, 0);
  const totalSeconds = scopedRecords.length > 0 ? scopedTotalSeconds : getRecordedSeconds(plan);
  const statusLabel = completedForSelectedDate ? "已完成" : "待完成";
  const statusClassName = completedForSelectedDate ? "plan-detail-status-badge" : "plan-detail-status-badge is-pending";
  const showEditCurrentOccurrence = plan.repeatType !== "once" && !completedForSelectedDate;
  const detailStyle = {
    "--subject-tint": style.tint,
    "--subject-glow": style.glow,
    "--subject-accent": style.accent,
  } as CSSProperties;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card plan-detail-modal-card" style={detailStyle} onClick={(event) => event.stopPropagation()}>
        <div className="plan-detail-header">
          <div className="plan-detail-header-main">
            <div className="plan-detail-icon-card">
              <span>{plan.subject.slice(0, 2)}</span>
            </div>
            <div className="plan-detail-header-copy">
              <h2>{plan.title}</h2>
              <div className="plan-detail-badges">
                <span className="plan-detail-subject-badge">{plan.subject}</span>
                <span className={statusClassName}>{statusLabel}</span>
              </div>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="plan-detail-body">
          <section className="plan-detail-summary-grid">
            <article className="plan-detail-info-card">
              <div className="plan-detail-info-main">
                <span className="plan-detail-info-icon">≡</span>
                <div>
                  <strong>计划内容</strong>
                  <p>{plan.title}</p>
                </div>
              </div>
              <div className="plan-detail-inline-actions">
                <button type="button" className="plan-detail-chip is-disabled" disabled title="功能开发中">
                  听写
                </button>
                <button type="button" className="plan-detail-chip is-disabled" disabled title="功能开发中">
                  播放
                </button>
              </div>
            </article>

            <article className="plan-detail-info-card">
              <div className="plan-detail-info-main">
                <span className="plan-detail-info-icon">↻</span>
                <div>
                  <strong>计划类型</strong>
                  <p>{formatPlanRepeatBadgeLabel(plan.repeatType)}</p>
                </div>
              </div>
            </article>

            <article className="plan-detail-info-card">
              <div className="plan-detail-info-main">
                <span className="plan-detail-info-icon">📅</span>
                <div>
                  <strong>计划日期</strong>
                  <p>{formatPlanDateRange(plan)}</p>
                </div>
              </div>
            </article>

            <article className="plan-detail-info-card">
              <div className="plan-detail-info-main">
                <span className="plan-detail-info-icon">★</span>
                <div>
                  <strong>积分奖励</strong>
                  <p className="plan-detail-badge-line">
                    <span className="plan-detail-star-pill">{plan.stars} 星</span>
                    <span className="plan-detail-note-pill">{plan.approvalRequired ? "需审定" : "固定奖励"}</span>
                  </p>
                </div>
              </div>
            </article>

            <article className="plan-detail-info-card">
              <div className="plan-detail-info-main">
                <span className="plan-detail-info-icon">🕒</span>
                <div>
                  <strong>创建时间</strong>
                  <p>{formatDateTime(plan.createdAt)}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="plan-detail-record-card">
            <div className="plan-detail-record-head">
              <div>
                <strong>完成记录与备注</strong>
                <p>
                  {completionRecordsForSelectedDate.length > 0
                    ? `${formatDateLabel(selectedDateKey)} 共 ${completionRecordsForSelectedDate.length} 次，累计 ${formatDurationSummary(totalSeconds)}`
                    : `共 ${plan.completionRecords.length} 次记录，累计 ${formatDurationSummary(totalSeconds)}`}
                </p>
              </div>
            </div>

            {visibleRecords.length > 0 ? (
              <div className="plan-detail-record-list">
                {visibleRecords.map((record) => (
                  <article key={record.id} className="plan-detail-record-item">
                    <div className="plan-detail-record-top">
                      <strong>{formatRecordDate(record.completedAt)}</strong>
                      <span>{formatMinuteTotal(record.durationSeconds)}</span>
                    </div>
                    <div className="plan-detail-record-row">
                      <span>{formatSessionRange(record.completedAt, record.durationSeconds)}</span>
                      <span>{formatMinuteTotal(record.durationSeconds)}</span>
                    </div>
                    <div className="plan-detail-record-note">
                      <strong>{record.note ? "学习记录" : "完成备注"}</strong>
                      <p>{record.note || "本次学习未填写备注。"}</p>
                    </div>
                    {record.attachments.length > 0 ? (
                      <div className="plan-detail-attachment-block">
                        <strong>附件</strong>
                        <div className="plan-detail-attachment-list">
                          {record.attachments.map((attachment, index) => (
                            <div key={`${record.id}-${attachment.name}-${index}`} className="plan-detail-attachment-item">
                              <span className="plan-detail-attachment-type">{describeAttachmentType(attachment.type)}</span>
                              <div>
                                <strong>{attachment.name}</strong>
                                <small>{formatAttachmentSize(attachment.size)}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
                {hiddenRecordCount > 0 ? <div className="plan-detail-record-hint">已折叠 {hiddenRecordCount} 条更早记录。</div> : null}
              </div>
            ) : (
              <div className="plan-detail-empty-records">这条计划还没有完成记录。</div>
            )}
          </section>
        </div>

        <div className={`plan-detail-footer${showEditCurrentOccurrence ? " has-three-actions" : ""}`}>
          <button type="button" className="plan-detail-footer-button plan-detail-footer-button-danger" onClick={() => onDeleteRepeat(plan)}>
            删除重复任务
          </button>
          {showEditCurrentOccurrence ? (
            <button type="button" className="plan-detail-footer-button plan-detail-footer-button-secondary" onClick={() => onEditCurrentOccurrence(plan)}>
              仅修改本次
            </button>
          ) : null}
          <button type="button" className="plan-detail-footer-button plan-detail-footer-button-primary" onClick={() => onEditPlan(plan)}>
            编辑计划
          </button>
        </div>
      </div>
    </div>
  );
}
