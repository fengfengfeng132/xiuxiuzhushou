import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useRef } from "react";
import { PLAN_DURATION_PRESETS, SUBJECT_OPTIONS } from "../app-content.js";
import type { PlanDraft } from "../app-types.js";
import {
  PLAN_COMPLETION_DATE_LIMIT_OPTIONS,
  PLAN_EBBINGHAUS_PRESET_OPTIONS,
  PLAN_REPEAT_OPTIONS,
  PLAN_WEEKDAY_OPTIONS,
  formatPlanRepeatHelper,
  formatPlanRepeatOptionLabel,
  getCrossDayRepeatSummary,
  isCrossDayRepeatType,
  isCustomWeekdayRepeatType,
  isEbbinghausRepeatType,
  requiresRepeatDateRange,
} from "./plan-repeat.js";

interface PlanCreateScreenProps {
  mode: "create" | "edit";
  today: string;
  draft: PlanDraft;
  canSubmit: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: <K extends keyof PlanDraft>(field: K, value: PlanDraft[K]) => void;
  onApplyDurationPreset: (minutes: number) => void;
  onSelectFiles: (files: FileList | null) => void;
  onDropFiles: (event: DragEvent<HTMLElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}

function parseClockToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function getResolvedMinutes(draft: PlanDraft): number | null {
  if (draft.timeMode === "duration") {
    const minutes = Math.round(Number(draft.durationMinutes));
    return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
  }

  const startMinutes = parseClockToMinutes(draft.startTime);
  const endMinutes = parseClockToMinutes(draft.endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return endMinutes - startMinutes;
}

function getTimeSummary(draft: PlanDraft): string {
  const resolvedMinutes = getResolvedMinutes(draft);

  if (draft.timeMode === "duration") {
    return resolvedMinutes ? `计划预计学习 ${resolvedMinutes} 分钟，可在计时页直接使用。` : "请填写有效的预计时长。";
  }

  if (!resolvedMinutes) {
    return "请设置有效的开始和结束时间，且结束时间必须晚于开始时间。";
  }

  return `该任务会在 ${draft.startTime} - ${draft.endTime} 之间出现，预计 ${resolvedMinutes} 分钟。`;
}

function getDerivedStars(draft: PlanDraft): number {
  const resolvedMinutes = getResolvedMinutes(draft);
  return Math.max(1, Math.round((resolvedMinutes ?? 10) / 10));
}

function getAttachmentHint(count: number): string {
  if (count === 0) {
    return "支持图片、音频、视频、PDF，最多 3 个，单个不超过 50MB。";
  }

  return `已暂存 ${count} 个附件。当前版本仅保留文件名和大小预览，不写入本地计划正文。`;
}

function normalizeWeekdays(values: ReadonlyArray<number>): Array<1 | 2 | 3 | 4 | 5 | 6 | 7> {
  const filtered = values.filter((value): value is 1 | 2 | 3 | 4 | 5 | 6 | 7 => value >= 1 && value <= 7);
  const unique = [...new Set(filtered)];
  unique.sort((left, right) => left - right);
  return unique;
}

function toggleWeekday(values: ReadonlyArray<number>, target: 1 | 2 | 3 | 4 | 5 | 6 | 7): Array<1 | 2 | 3 | 4 | 5 | 6 | 7> {
  const current = normalizeWeekdays(values);
  if (current.includes(target)) {
    return current.filter((value) => value !== target);
  }
  return normalizeWeekdays([...current, target]);
}

export function PlanCreateScreen({
  mode,
  today,
  draft,
  canSubmit,
  onBack,
  onCancel,
  onSubmit,
  onUpdateDraft,
  onApplyDurationPreset,
  onSelectFiles,
  onDropFiles,
  onRemoveAttachment,
}: PlanCreateScreenProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resolvedMinutes = getResolvedMinutes(draft);
  const selectedDuration = Math.round(Number(draft.durationMinutes));
  const derivedStars = getDerivedStars(draft);
  const effectiveDate = draft.startDate || today;
  const isCustomRepeat = isCustomWeekdayRepeatType(draft.repeatType);
  const isEbbinghausRepeat = isEbbinghausRepeatType(draft.repeatType);
  const isCrossDayRepeat = isCrossDayRepeatType(draft.repeatType);
  const showRepeatDateRange = requiresRepeatDateRange(draft.repeatType);
  const repeatWeekdays = normalizeWeekdays(draft.repeatWeekdays);
  const completionLimitDays = normalizeWeekdays(draft.completionDateLimitDays);
  const completionLimitHint =
    draft.completionDateLimitMode === "workday"
      ? "仅可在工作日完成此任务"
      : draft.completionDateLimitMode === "weekend"
        ? "仅可在周末完成此任务"
        : draft.completionDateLimitMode === "custom"
          ? "仅可在自定义选择的日期完成此任务"
          : "可以在任何一天完成此任务";

  function updateRepeatWeekdays(nextValues: ReadonlyArray<number>): void {
    onUpdateDraft("repeatWeekdays", normalizeWeekdays(nextValues));
  }

  function updateCompletionLimitDays(nextValues: ReadonlyArray<number>): void {
    onUpdateDraft("completionDateLimitDays", normalizeWeekdays(nextValues));
  }

  return (
    <div className="plan-create-page">
      <header className="plan-create-hero">
        <div className="plan-create-hero-inner">
          <button type="button" className="plan-create-back-button" onClick={onBack} aria-label="返回首页">
            ←
          </button>
          <div className="plan-create-hero-copy">
            <h1>{mode === "edit" ? "编辑学习计划" : "添加学习计划"}</h1>
            <div className="plan-create-breadcrumb">
              <span>正在为</span>
              <strong>{effectiveDate}</strong>
              <span>{mode === "edit" ? "编辑计划" : "添加计划"}</span>
            </div>
          </div>
        </div>
      </header>

      <form className="plan-create-card" onSubmit={onSubmit}>
        {!showRepeatDateRange ? (
          <section className="plan-create-section">
            <div className="plan-create-section-head">
              <span className="plan-create-section-icon is-violet">日</span>
              <div>
                <h2>
                  起始日期 <small>可选</small>
                </h2>
                <p>选择计划的起始日期。默认是今天；仅当天任务只会出现在当天，其他重复类型会记录为从这里开始。</p>
              </div>
            </div>
            <input
              type="date"
              className="plan-create-input"
              value={draft.startDate}
              onChange={(event) => onUpdateDraft("startDate", event.target.value)}
            />
          </section>
        ) : null}

        <section className="plan-create-section">
          <div className="plan-create-section-head">
            <span className="plan-create-section-icon is-blue">签</span>
            <div>
              <h2>
                类别标签 <small>必填</small>
              </h2>
              <p>当前先复用首页学科标签，后续再扩展为更完整的分类体系。</p>
            </div>
          </div>
          <select
            className="plan-create-input"
            value={draft.category}
            onChange={(event) => onUpdateDraft("category", event.target.value)}
          >
            <option value="">请选择类别</option>
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </section>

        <section className="plan-create-section">
          <div className="plan-create-section-head">
            <span className="plan-create-section-icon is-green">名</span>
            <div>
              <h2>
                计划名称 <small>必填</small>
              </h2>
              <p>建议写成“动作 + 对象 + 数量/时长”，例如“每天背 10 个英语单词”。</p>
            </div>
          </div>
          <input
            type="text"
            className="plan-create-input"
            maxLength={100}
            placeholder="如：每天背10个英语单词"
            value={draft.title}
            onChange={(event) => onUpdateDraft("title", event.target.value)}
          />
          <div className="plan-create-meta-row">
            <span>限制 1-100 字</span>
            <strong>{draft.title.length}/100</strong>
          </div>
        </section>

        <section className="plan-create-section">
          <div className="plan-create-section-head">
            <span className="plan-create-section-icon is-violet">述</span>
            <div>
              <h2>
                计划内容 <small>可选</small>
              </h2>
              <p>可补充教材范围、执行方式或提醒语，便于后续快速进入任务。</p>
            </div>
          </div>
          <textarea
            className="plan-create-textarea"
            maxLength={1000}
            placeholder="如：利用晨读时间，结合课本 Unit1 单词表"
            value={draft.content}
            onChange={(event) => onUpdateDraft("content", event.target.value)}
            rows={6}
          />
          <div className="plan-create-meta-row">
            <span>限制 0-1000 字</span>
            <strong>{draft.content.length}/1000</strong>
          </div>
        </section>

        <section className="plan-create-section">
          <div className="plan-create-section-head">
            <span className="plan-create-section-icon is-orange">重</span>
            <div>
              <h2>
                重复类型 <small>必填</small>
              </h2>
              <p>根据任务节奏选择重复类型，起始日期会作为首次生效时间。</p>
            </div>
          </div>
          <select
            className="plan-create-input"
            value={draft.repeatType}
            onChange={(event) => onUpdateDraft("repeatType", event.target.value as PlanDraft["repeatType"])}
          >
            {PLAN_REPEAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {formatPlanRepeatOptionLabel(option.value, effectiveDate)}
              </option>
            ))}
          </select>
          <div className="plan-create-inline-note is-blue">{formatPlanRepeatHelper(draft.repeatType, effectiveDate)}</div>

          {showRepeatDateRange ? (
            <section className="plan-repeat-config-card is-green">
              <div className="plan-repeat-config-head">
                <span className="plan-create-section-icon is-green">日</span>
                <div>
                  <h3>
                    计划起止日期 <small>(可选)</small>
                  </h3>
                  <p>设置起止日期后，系统将在这个时间范围内生成任务。不设置则默认持续生成。</p>
                </div>
              </div>
              <div className="plan-repeat-date-grid">
                <label className="plan-create-field">
                  <span>开始日期</span>
                  <input
                    type="date"
                    className="plan-create-input"
                    value={draft.startDate}
                    onChange={(event) => onUpdateDraft("startDate", event.target.value)}
                  />
                </label>
                <label className="plan-create-field">
                  <span>结束日期</span>
                  <input
                    type="date"
                    className="plan-create-input"
                    value={draft.endDate}
                    onChange={(event) => onUpdateDraft("endDate", event.target.value)}
                  />
                </label>
              </div>
            </section>
          ) : null}

          {isCustomRepeat ? (
            <section className="plan-repeat-config-card is-blue">
              <div className="plan-repeat-config-head">
                <span className="plan-create-section-icon is-blue">周</span>
                <div>
                  <h3>
                    选择重复日期 <small>*</small>
                  </h3>
                  <p>按勾选的星期生成任务。</p>
                </div>
              </div>
              {draft.repeatType === "biweekly-custom" ? (
                <div className="plan-create-inline-note is-blue">
                  双周重复：从创建日期开始，每两周在选定的星期几出现一次。
                </div>
              ) : null}
              <div className="plan-repeat-quick-actions">
                <button type="button" className="filter-chip" onClick={() => updateRepeatWeekdays([1, 2, 3, 4, 5, 6, 7])}>
                  全选
                </button>
                <button type="button" className="filter-chip" onClick={() => updateRepeatWeekdays([1, 2, 3, 4, 5])}>
                  工作日
                </button>
                <button type="button" className="filter-chip" onClick={() => updateRepeatWeekdays([6, 7])}>
                  周末
                </button>
              </div>
              <div className="plan-repeat-weekday-grid">
                {PLAN_WEEKDAY_OPTIONS.map((option) => {
                  const active = repeatWeekdays.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`plan-repeat-weekday-chip${active ? " is-active" : ""}`}
                      onClick={() => updateRepeatWeekdays(toggleWeekday(repeatWeekdays, option.value))}
                    >
                      <span className="plan-repeat-weekday-check">{active ? "✓" : ""}</span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {isEbbinghausRepeat ? (
            <section className="plan-repeat-config-card is-purple">
              <div className="plan-repeat-config-head">
                <span className="plan-create-section-icon is-violet">记</span>
                <div>
                  <h3>
                    选择记忆周期 <small>*</small>
                  </h3>
                  <p>根据场景选择复习节奏。</p>
                </div>
              </div>
              <div className="plan-ebbinghaus-grid">
                {PLAN_EBBINGHAUS_PRESET_OPTIONS.map((option) => {
                  const active = draft.ebbinghausPreset === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`plan-ebbinghaus-card${active ? " is-active" : ""}`}
                      onClick={() => onUpdateDraft("ebbinghausPreset", option.value)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  );
                })}
              </div>
              <div className="plan-create-inline-note is-purple">
                艾宾浩斯记忆曲线：根据遗忘规律设计复习时间表，数字表示从起始日期算起的天数。
              </div>
            </section>
          ) : null}

          {isCrossDayRepeat ? (
            <section className="plan-repeat-config-card is-indigo">
              <div className="plan-repeat-config-head">
                <span className="plan-create-section-icon is-blue">限</span>
                <div>
                  <h3>完成日期限制</h3>
                  <p>设置跨日任务可完成的日期范围。</p>
                </div>
              </div>
              <label className="plan-create-field">
                <span>完成日期</span>
                <select
                  className="plan-create-input"
                  value={draft.completionDateLimitMode}
                  onChange={(event) => onUpdateDraft("completionDateLimitMode", event.target.value as PlanDraft["completionDateLimitMode"])}
                >
                  {PLAN_COMPLETION_DATE_LIMIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {draft.completionDateLimitMode === "custom" ? (
                <div className="plan-repeat-weekday-grid">
                  {PLAN_WEEKDAY_OPTIONS.map((option) => {
                    const active = completionLimitDays.includes(option.value);
                    return (
                      <button
                        key={`limit-${option.value}`}
                        type="button"
                        className={`plan-repeat-weekday-chip${active ? " is-active" : ""}`}
                        onClick={() => updateCompletionLimitDays(toggleWeekday(completionLimitDays, option.value))}
                      >
                        <span className="plan-repeat-weekday-check">{active ? "✓" : ""}</span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="plan-repeat-completion-grid">
                <label className="plan-create-field">
                  <span>完成次数</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    step={1}
                    className="plan-create-input"
                    value={draft.requiredCompletionsPerPeriod}
                    onChange={(event) => onUpdateDraft("requiredCompletionsPerPeriod", event.target.value)}
                  />
                  <small className="plan-create-field-helper">例如：本周3次、每周2次</small>
                </label>
                <label className="plan-create-field">
                  <span>每日最多次数 (可选)</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    step={1}
                    className="plan-create-input"
                    value={draft.maxCompletionsPerDay}
                    onChange={(event) => onUpdateDraft("maxCompletionsPerDay", event.target.value)}
                    placeholder="不限制"
                  />
                  <small className="plan-create-field-helper">留空表示不限制次数</small>
                </label>
              </div>

              <div className="plan-create-inline-note is-indigo">{completionLimitHint}</div>
              <div className="plan-create-inline-note is-slate">{getCrossDayRepeatSummary(draft.repeatType)}</div>
            </section>
          ) : null}
        </section>

        <section className="plan-create-section">
          <div className="plan-create-section-head">
            <span className="plan-create-section-icon is-sky">时</span>
            <div>
              <h2>
                时间设置 <small>可选</small>
              </h2>
              <p>只能二选一：要么设置预计时长，要么设置固定时间段。</p>
            </div>
          </div>

          <div className="plan-create-mode-bar" role="tablist" aria-label="时间设置模式">
            <button
              type="button"
              className={`plan-create-mode-button${draft.timeMode === "time-range" ? " is-active" : ""}`}
              onClick={() => onUpdateDraft("timeMode", "time-range")}
            >
              时间段
            </button>
            <button
              type="button"
              className={`plan-create-mode-button${draft.timeMode === "duration" ? " is-active" : ""}`}
              onClick={() => onUpdateDraft("timeMode", "duration")}
            >
              时长
            </button>
          </div>

          {draft.timeMode === "duration" ? (
            <div className="plan-create-tone-panel is-green">
              <div className="plan-create-tone-head">
                <strong>设置计划的预计时长</strong>
                <span>默认建议 25 分钟</span>
              </div>
              <div className="plan-create-duration-grid">
                {PLAN_DURATION_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={`plan-create-duration-chip${selectedDuration === minutes ? " is-active" : ""}`}
                    onClick={() => onApplyDurationPreset(minutes)}
                  >
                    {minutes}分钟
                  </button>
                ))}
              </div>
              <label className="plan-create-custom-row">
                <span>自定义时长</span>
                <input
                  type="number"
                  min={5}
                  max={720}
                  step={5}
                  className="plan-create-input"
                  value={draft.durationMinutes}
                  onChange={(event) => onUpdateDraft("durationMinutes", event.target.value)}
                />
                <strong>分钟</strong>
              </label>
              <div className="plan-create-inline-note is-green">{getTimeSummary(draft)}</div>
            </div>
          ) : (
            <div className="plan-create-tone-panel is-blue">
              <div className="plan-create-tone-head">
                <strong>设置计划的固定时间段</strong>
                <span>例如 19:00 - 20:30</span>
              </div>
              <div className="plan-create-time-grid">
                <label className="plan-create-field">
                  <span>开始时间</span>
                  <input
                    type="time"
                    className="plan-create-input"
                    value={draft.startTime}
                    onChange={(event) => onUpdateDraft("startTime", event.target.value)}
                  />
                </label>
                <label className="plan-create-field">
                  <span>结束时间</span>
                  <input
                    type="time"
                    className="plan-create-input"
                    value={draft.endTime}
                    onChange={(event) => onUpdateDraft("endTime", event.target.value)}
                  />
                </label>
              </div>
              <div className="plan-create-inline-note is-blue">{getTimeSummary(draft)}</div>
            </div>
          )}
        </section>

        <section className="plan-create-section plan-create-section-gold">
          <div className="plan-create-section-head">
            <span className="plan-create-section-icon is-gold">星</span>
            <div>
              <h2>
                积分设置 <small>可选</small>
              </h2>
              <p>默认按系统规则计算。打开后可覆盖当前计划的默认奖励值。</p>
            </div>
          </div>

          <div className="plan-create-points-card">
            <div className="plan-create-toggle-row">
              <div>
                <strong>启用自定义积分</strong>
                <p>为任务设置固定奖励积分，替代系统默认计算规则。</p>
              </div>
              <button
                type="button"
                className={`plan-create-switch${draft.useCustomPoints ? " is-active" : ""}`}
                role="switch"
                aria-checked={draft.useCustomPoints}
                onClick={() => onUpdateDraft("useCustomPoints", !draft.useCustomPoints)}
              >
                <span />
              </button>
            </div>

            {draft.useCustomPoints ? (
              <>
                <div className="plan-create-points-grid">
                  <label className="plan-create-field">
                    <span>积分数值</span>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      step={1}
                      className="plan-create-input"
                      value={draft.customPoints}
                      onChange={(event) => onUpdateDraft("customPoints", event.target.value)}
                    />
                    <small className="plan-create-field-helper">1-1000 星星</small>
                  </label>
                  <div className="plan-create-points-preview">
                    <strong>奖励：{draft.customPoints || 0}⭐</strong>
                    <p>固定积分，无额外加成</p>
                  </div>
                </div>

                <div className="plan-create-approval-panel">
                  <div className="plan-create-approval-head">
                    <div>
                      <strong>需要审定</strong>
                      <p>任务完成后需要手动审定才发放积分。</p>
                    </div>
                    <button
                      type="button"
                      className={`plan-create-switch${draft.approvalRequired ? " is-active" : ""}`}
                      role="switch"
                      aria-checked={draft.approvalRequired}
                      onClick={() => onUpdateDraft("approvalRequired", !draft.approvalRequired)}
                    >
                      <span />
                    </button>
                  </div>
                  {draft.approvalRequired ? (
                    <div className="plan-create-approval-guide">
                      <strong>审定流程说明</strong>
                      <ul>
                        <li>任务完成后显示“审定积分”入口。</li>
                        <li>可选择通过、调整积分或拒绝。</li>
                        <li>审定通过后才会计入积分余额。</li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="plan-create-rule-card">
                <strong>系统默认规则</strong>
                <ul>
                  <li>基础积分：1 星</li>
                  <li>时间奖励：30 分钟 +1 星，60 分钟 +2 星</li>
                  <li>早起加成：6:00-8:00 x 1.2 倍</li>
                  <li>周末加成：x 1.5 倍</li>
                </ul>
              </div>
            )}

            <div className="plan-create-inline-note is-gold">
              {draft.useCustomPoints
                ? draft.approvalRequired
                  ? `当前将按自定义积分保存，计划完成后需审定，通过后发放 ${draft.customPoints || 0} 星。`
                  : `当前将按自定义积分保存，计划完成后奖励 ${draft.customPoints || 0} 星。`
                : `按当前时长估算，系统会给出约 ${resolvedMinutes ? derivedStars : 1} 星奖励。`}
            </div>
          </div>
        </section>

        <section className="plan-create-section plan-create-section-slate">
          <div className="plan-create-section-head">
            <span className="plan-create-section-icon is-slate">附</span>
            <div>
              <h2>
                附件 <small>可选</small>
              </h2>
              <p>支持图片、音频、视频、PDF。当前版本仅保留文件名预览，不进入领域数据。</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept="image/*,audio/*,video/*,.pdf,application/pdf"
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSelectFiles(event.target.files)}
          />

          <button
            type="button"
            className="plan-create-upload"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event: DragEvent<HTMLButtonElement>) => event.preventDefault()}
            onDrop={onDropFiles}
          >
            <span className="plan-create-upload-icon" aria-hidden="true">
              ⇪
            </span>
            <strong>点击上传或拖拽文件到此处</strong>
            <small>{getAttachmentHint(draft.attachments.length)}</small>
          </button>

          {draft.attachments.length > 0 ? (
            <div className="plan-create-attachment-list">
              {draft.attachments.map((attachment) => (
                <div key={attachment.id} className="plan-create-attachment-row">
                  <div>
                    <strong>{attachment.name}</strong>
                    <small>
                      {attachment.type || "未知类型"} · {Math.max(1, Math.round(attachment.size / 1024))}KB
                    </small>
                  </div>
                  <button type="button" className="plan-create-attachment-remove" onClick={() => onRemoveAttachment(attachment.id)}>
                    删除
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <footer className="plan-create-footer">
          <button type="button" className="plan-create-cancel" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="plan-create-submit" disabled={!canSubmit}>
            {mode === "edit" ? "保存修改" : "保存计划"}
          </button>
        </footer>
      </form>
    </div>
  );
}
