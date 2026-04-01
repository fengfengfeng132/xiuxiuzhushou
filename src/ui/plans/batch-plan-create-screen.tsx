import type { CSSProperties, FormEvent } from "react";
import { estimatePlanStars } from "./batch-plan-helpers.js";
import { getSubjectStyle } from "../app-helpers.js";
import type { BatchPlanDraft, BatchPlanPreviewItem, PlanRepeatType } from "../app-types.js";

interface BatchPlanCreateScreenProps {
  today: string;
  draft: BatchPlanDraft;
  previewPlans: BatchPlanPreviewItem[];
  canSubmit: boolean;
  resolvedDurationMinutes: number | null;
  resolvedCustomStars: number | null;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof BatchPlanDraft, value: string | boolean | PlanRepeatType) => void;
  onTryAiParse: () => void;
}

function getDurationSummary(minutes: number | null): string {
  if (!minutes) {
    return "请填写大于 0 的默认学习时长。";
  }

  return `每个解析出的任务会先按 ${minutes} 分钟创建，后续仍可在计时页调整。`;
}

function getPointSummary(draft: BatchPlanDraft, resolvedDurationMinutes: number | null, resolvedCustomStars: number | null): string {
  if (!draft.useCustomPoints) {
    return `当前按系统规则估算，默认每项约 ${estimatePlanStars(resolvedDurationMinutes ?? 10)} 星。`;
  }

  if (!resolvedCustomStars) {
    return "请填写有效的自定义积分数值。";
  }

  if (draft.approvalRequired) {
    return `所有任务会按 ${resolvedCustomStars} 星创建；管理员审定开关先保留界面状态，后续再接入。`;
  }

  return `所有任务会按 ${resolvedCustomStars} 星创建，后续仍可逐项调整。`;
}

const GUIDE_RULES = [
  "第一行写类别名称（如：语文、数学，最多 50 字）",
  "接下来写任务列表，每行格式：数字 + 标点 + 任务",
  "支持的标点：.、，:：) ）",
  "可以添加多个类别，空行会被忽略",
];

const GUIDE_EXAMPLE = ["语文", "1. 修改《映雪堂》28-30", "2、预习三单元语文园地", "", "数学", "1，完成练习册第3章"].join("\n");

export function BatchPlanCreateScreen({
  today,
  draft,
  previewPlans,
  canSubmit,
  resolvedDurationMinutes,
  resolvedCustomStars,
  onBack,
  onCancel,
  onSubmit,
  onUpdateDraft,
  onTryAiParse,
}: BatchPlanCreateScreenProps) {
  const effectiveDate = draft.startDate || today;

  return (
    <div className="batch-plan-page">
      <header className="plan-create-hero">
        <div className="plan-create-hero-inner">
          <button type="button" className="plan-create-back-button" onClick={onBack} aria-label="返回首页">
            ←
          </button>
          <div className="plan-create-hero-copy">
            <h1>批量添加学习计划</h1>
            <p className="batch-plan-hero-subtitle">快速添加多个学习任务</p>
          </div>
        </div>
      </header>

      <form className="batch-plan-shell" onSubmit={onSubmit}>
        <section className="batch-plan-banner">
          <span className="batch-plan-banner-icon" aria-hidden="true">
            附
          </span>
          <div>
            <strong>关于附件功能</strong>
            <p>批量添加暂不支持上传附件。如需为计划添加图片、音频或视频附件，请在创建后进入编辑页再补充。</p>
          </div>
        </section>

        <div className="batch-plan-workspace">
          <div className="batch-plan-left">
            <section className="batch-plan-panel">
              <div className="batch-plan-panel-head">
                <div>
                  <p className="eyebrow">输入学习计划</p>
                  <h2>输入学习计划</h2>
                </div>
              </div>

              <div className="batch-plan-guide-card">
                <strong>输入格式说明:</strong>
                <ul className="batch-plan-guide-list">
                  {GUIDE_RULES.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <pre className="batch-plan-example">{GUIDE_EXAMPLE}</pre>
              </div>

              <div className="batch-plan-note-row">
                <span>格式不对也可以试试 AI 解析</span>
                <button type="button" className="batch-plan-ai-button" onClick={onTryAiParse}>
                  AI解析
                </button>
              </div>

              <textarea
                className="plan-create-textarea batch-plan-textarea"
                rows={12}
                placeholder="请按上方格式输入学习计划..."
                value={draft.rawText}
                onChange={(event) => onUpdateDraft("rawText", event.target.value)}
              />
            </section>

            <section className="batch-plan-panel">
              <div className="batch-plan-panel-head">
                <div>
                  <p className="eyebrow">统一设置（应用到所有计划）</p>
                  <h2>统一设置</h2>
                </div>
              </div>

              <label className="plan-create-field">
                <span>起始日期（可选）</span>
                <input
                  type="date"
                  className="plan-create-input"
                  value={draft.startDate}
                  onChange={(event) => onUpdateDraft("startDate", event.target.value)}
                />
              </label>
              <div className="plan-create-inline-note is-blue">
                选择计划的起始日期，默认为今天。对于“仅当天”类型，任务将在此日期创建；未来日期的任务会出现在对应日期。
              </div>

              <label className="plan-create-field">
                <span>重复类型</span>
                <select
                  className="plan-create-input"
                  value={draft.repeatType}
                  onChange={(event) => onUpdateDraft("repeatType", event.target.value)}
                >
                  <option value="once">仅当天 ({effectiveDate})</option>
                </select>
              </label>
              <div className="plan-create-inline-note is-blue">这些任务只会在 {effectiveDate} 这一天出现。</div>

              <label className="plan-create-field">
                <span>默认学习时长（分钟）</span>
                <input
                  type="number"
                  min={1}
                  max={720}
                  step={1}
                  className="plan-create-input"
                  value={draft.defaultDurationMinutes}
                  onChange={(event) => onUpdateDraft("defaultDurationMinutes", event.target.value)}
                />
              </label>
              <div className="plan-create-inline-note is-blue">{getDurationSummary(resolvedDurationMinutes)}</div>

              <div className="plan-create-section plan-create-section-gold batch-plan-points-panel">
                <div className="plan-create-toggle-row">
                  <div>
                    <strong>启用自定义积分</strong>
                    <p>统一设置会自动应用到所有任务，创建后仍可逐项调整。</p>
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
                    <label className="plan-create-field">
                      <span>自定义积分数值</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        step={1}
                        className="plan-create-input"
                        value={draft.customPoints}
                        onChange={(event) => onUpdateDraft("customPoints", event.target.value)}
                      />
                    </label>

                    <div className="batch-plan-approval-row">
                      <div>
                        <strong>需要管理员审定</strong>
                        <p>当前版本先保留这个设置位，后续再接入审批链路。</p>
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
                  </>
                ) : null}

                <div className="plan-create-inline-note is-gold">{getPointSummary(draft, resolvedDurationMinutes, resolvedCustomStars)}</div>
              </div>
            </section>
          </div>

          <section className="batch-plan-preview-panel">
            <div className="batch-plan-panel-head">
              <div>
                <p className="eyebrow">预览</p>
                <h2>预览 ({previewPlans.length} 个计划)</h2>
              </div>
            </div>

            {previewPlans.length === 0 ? (
              <div className="batch-plan-empty-state">
                <div className="batch-plan-empty-icon" aria-hidden="true">
                  ≡
                </div>
                <p>输入内容后会在这里显示预览</p>
              </div>
            ) : (
              <div className="batch-plan-preview-list">
                {previewPlans.map((plan) => {
                  const subjectStyle = getSubjectStyle(plan.category);
                  const cardStyle = {
                    "--batch-plan-accent": subjectStyle.accent,
                    "--batch-plan-tint": subjectStyle.tint,
                  } as CSSProperties;
                  const planStars = draft.useCustomPoints && resolvedCustomStars ? resolvedCustomStars : estimatePlanStars(resolvedDurationMinutes ?? 10);

                  return (
                    <article key={plan.id} className="batch-plan-preview-item" style={cardStyle}>
                      <div className="batch-plan-preview-top">
                        <span className="batch-plan-preview-category">{plan.category}</span>
                        <span className="batch-plan-preview-line">第 {plan.lineNumber} 行</span>
                      </div>
                      <strong>{plan.title}</strong>
                      <div className="batch-plan-preview-meta">
                        <span>{resolvedDurationMinutes ?? "--"} 分钟</span>
                        <span>{planStars} 星</span>
                        <span>{effectiveDate}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer className="batch-plan-footer">
          <button type="button" className="plan-create-cancel" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="plan-create-submit" disabled={!canSubmit}>
            保存 {previewPlans.length} 个计划
          </button>
        </footer>
      </form>
    </div>
  );
}
