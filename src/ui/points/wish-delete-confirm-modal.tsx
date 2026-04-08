import type { Reward } from "../../domain/model.js";

interface WishDeleteConfirmModalProps {
  open: boolean;
  reward: Reward | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function WishDeleteConfirmModal({ open, reward, onClose, onConfirm }: WishDeleteConfirmModalProps) {
  if (!open || !reward) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wish-delete-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head wish-delete-modal-head">
          <div className="wish-delete-title-row">
            <span className="wish-delete-title-icon" aria-hidden="true">
              🗑️
            </span>
            <div>
              <h2>删除愿望</h2>
              <p>你确定要删除这个愿望吗？</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭删除愿望弹窗">
            ×
          </button>
        </div>

        <div className="wish-delete-modal-body">
          <section className="wish-delete-warning">
            <strong>删除后无法恢复</strong>
            <p>愿望会从清单中永久移除，兑换记录也不会再出现在该愿望卡片上。</p>
          </section>

          <section className="wish-delete-summary">
            <div className="wish-delete-summary-visual" aria-hidden="true">
              {reward.customImage ? <img src={reward.customImage} alt="" className="wish-delete-summary-image" /> : <span>{reward.icon}</span>}
            </div>
            <div className="wish-delete-summary-copy">
              <strong>{reward.title}</strong>
              <span>需要 {reward.cost} 星才能兑换</span>
            </div>
            <span className="wish-delete-cost-pill">{reward.cost} ⭐</span>
          </section>

          <div className="modal-actions wish-delete-modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              取消
            </button>
            <button type="button" className="wish-delete-confirm" onClick={onConfirm}>
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
