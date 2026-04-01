import type { ChangeEvent, FormEvent } from "react";
import { useRef } from "react";
import type { RewardCategory, RewardRepeatMode, RewardResetPeriod } from "../../domain/model.js";
import type { WishDraft } from "../app-types.js";
import {
  WISH_CATEGORY_OPTIONS,
  WISH_COST_GUIDE_LINES,
  WISH_ICON_CATEGORIES,
  WISH_REPEAT_MODE_OPTIONS,
  WISH_RESET_PERIOD_OPTIONS,
  formatWishCategoryLabel,
  getWishRepeatModeDescription,
} from "./wish-config.js";

interface WishModalProps {
  open: boolean;
  draft: WishDraft;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof WishDraft, value: string | RewardCategory | RewardRepeatMode | RewardResetPeriod | null) => void;
  onSelectIconCategory: (category: RewardCategory) => void;
  onSelectIcon: (icon: string) => void;
  onSelectCustomImage: (files: FileList | null) => void;
  onClearCustomImage: () => void;
}

function renderModeHelper(draft: WishDraft): string {
  if (draft.repeatMode === "single") {
    return "兑换后会从可兑换清单里隐藏。";
  }

  if (draft.repeatMode === "multi") {
    return `最多可兑换 ${draft.maxRedemptions || 0} 次。`;
  }

  if (draft.repeatMode === "cycle") {
    return `每个周期可兑换 ${draft.redemptionsPerPeriod || 0} 次，按${draft.resetPeriod === "daily" ? "日" : draft.resetPeriod === "weekly" ? "周" : "月"}自动重置。`;
  }

  return "常驻愿望，可长期重复兑换。";
}

export function WishModal({
  open,
  draft,
  canSubmit,
  onClose,
  onSubmit,
  onUpdateDraft,
  onSelectIconCategory,
  onSelectIcon,
  onSelectCustomImage,
  onClearCustomImage,
}: WishModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) {
    return null;
  }

  const currentIconCategory = WISH_ICON_CATEGORIES.find((category) => category.value === draft.iconCategory) ?? WISH_ICON_CATEGORIES[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wish-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="wish-modal-head">
          <div className="wish-modal-title-row">
            <span className="wish-modal-title-icon" aria-hidden="true">
              ✨
            </span>
            <div>
              <h2>添加我的愿望</h2>
              <p>设定你想要的奖励，努力攒星星去实现吧！</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭添加愿望弹窗">
            ×
          </button>
        </div>

        <form className="wish-modal-form" onSubmit={onSubmit}>
          <section className="wish-modal-section">
            <h3>选择图标</h3>
            <div className="wish-preview-card">
              <div className="wish-preview-visual" aria-hidden="true">
                {draft.customImage ? <img src={draft.customImage} alt="" className="wish-preview-image" /> : <span>{draft.icon}</span>}
              </div>
              <div className="wish-preview-copy">
                <strong>{draft.title.trim() || "点击下方选择你喜欢的图标"}</strong>
                <span>{formatWishCategoryLabel(draft.category)}</span>
              </div>
            </div>

            <div className="wish-icon-category-tabs" role="tablist" aria-label="愿望图标分类">
              {WISH_ICON_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={`wish-icon-category-tab${draft.iconCategory === category.value ? " is-active" : ""}`}
                  onClick={() => onSelectIconCategory(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="wish-icon-grid">
              {currentIconCategory.icons.map((icon) => (
                <button
                  key={`${currentIconCategory.value}-${icon}`}
                  type="button"
                  className={`wish-icon-button${draft.icon === icon ? " is-active" : ""}`}
                  onClick={() => onSelectIcon(icon)}
                  aria-label={`选择图标 ${icon}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </section>

          <section className="wish-modal-section">
            <h3>自定义图片（可选）</h3>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => onSelectCustomImage(event.target.files)}
            />
            <div className="wish-upload-row">
              <button type="button" className="wish-upload-button" onClick={() => fileInputRef.current?.click()}>
                选择图片（建议小图）
              </button>
              {draft.customImageName ? (
                <button type="button" className="wish-upload-clear" onClick={onClearCustomImage}>
                  清除图片
                </button>
              ) : null}
            </div>
            <p className="wish-upload-helper">
              {draft.customImageName ? `已选择：${draft.customImageName}` : "图片将显示在愿望卡片上；当前本地版仅建议使用较小图片。"}
            </p>
          </section>

          <section className="wish-modal-section">
            <label className="field-block">
              <span>愿望名称 *</span>
              <input
                type="text"
                maxLength={100}
                value={draft.title}
                onChange={(event) => onUpdateDraft("title", event.target.value)}
                placeholder="例如：周末和朋友一起玩新卡牌"
              />
            </label>

            <label className="field-block">
              <span>描述一下这个愿望的细节...</span>
              <textarea
                rows={4}
                maxLength={200}
                value={draft.description}
                onChange={(event) => onUpdateDraft("description", event.target.value)}
                placeholder="描述一下这个愿望的细节..."
              />
            </label>
            <div className="wish-char-count">{draft.description.length}/200</div>

            <label className="field-block">
              <span>分类</span>
              <select value={draft.category} onChange={(event) => onUpdateDraft("category", event.target.value)}>
                {WISH_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span>需要多少星星？ *</span>
              <input type="number" min={1} step={1} value={draft.cost} onChange={(event) => onUpdateDraft("cost", event.target.value)} />
            </label>

            <div className="wish-cost-guide">
              <strong>参考指南:</strong>
              <ul>
                {WISH_COST_GUIDE_LINES.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="wish-modal-section">
            <div className="wish-repeat-head">
              <h3>重复兑换设置</h3>
              <span className="wish-repeat-hint">?</span>
            </div>

            <div className="wish-repeat-grid">
              {WISH_REPEAT_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`wish-repeat-card${draft.repeatMode === option.value ? " is-active" : ""}`}
                  onClick={() => onUpdateDraft("repeatMode", option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>

            {draft.repeatMode === "multi" ? (
              <label className="field-block">
                <span>最大兑换次数</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={draft.maxRedemptions}
                  onChange={(event) => onUpdateDraft("maxRedemptions", event.target.value)}
                />
              </label>
            ) : null}

            {draft.repeatMode === "cycle" ? (
              <div className="wish-cycle-panel">
                <div className="field-block">
                  <span>重置周期</span>
                  <div className="wish-reset-period-row">
                    {WISH_RESET_PERIOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`wish-reset-chip${draft.resetPeriod === option.value ? " is-active" : ""}`}
                        onClick={() => onUpdateDraft("resetPeriod", option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="field-block">
                  <span>每个周期可兑换次数</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={draft.redemptionsPerPeriod}
                    onChange={(event) => onUpdateDraft("redemptionsPerPeriod", event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <p className="wish-repeat-helper">
              {getWishRepeatModeDescription(draft.repeatMode)}。{renderModeHelper(draft)}
            </p>
          </section>

          <div className="modal-actions wish-modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="modal-submit modal-submit-primary wish-submit-button" disabled={!canSubmit}>
              添加愿望
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
