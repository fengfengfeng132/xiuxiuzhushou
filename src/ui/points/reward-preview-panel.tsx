import type { Reward } from "../../domain/model.js";

interface RewardPreviewPanelProps {
  rewards: Reward[];
  starBalance: number;
  onOpenPointsCenter: () => void;
  onRedeemReward: (rewardId: string) => void;
}

// 奖励预览单独放在积分模块里，后续扩展积分中心时不用重开首页壳子。
export function RewardPreviewPanel({
  rewards,
  starBalance,
  onOpenPointsCenter,
  onRedeemReward,
}: RewardPreviewPanelProps) {
  return (
    <article className="extra-panel">
      <div className="extra-head">
        <div>
          <p className="eyebrow">奖励</p>
          <h2>奖励预览</h2>
        </div>
        <button type="button" className="chip-button" onClick={onOpenPointsCenter}>
          打开积分中心
        </button>
      </div>
      <div className="reward-list">
        {rewards.map((reward) => {
          const canRedeem = starBalance >= reward.cost;
          return (
            <article key={reward.id} className="reward-card">
              <div>
                <p className="section-title-kicker">奖励项目</p>
                <h3>{reward.title}</h3>
                <p className="reward-copy">
                  需要 {reward.cost} 颗星星，已兑换 {reward.redeemedCount} 次。
                </p>
              </div>
              <button
                type="button"
                className={`card-action ${canRedeem ? "primary-action" : "ghost-action"}`}
                onClick={() => onRedeemReward(reward.id)}
              >
                {canRedeem ? "立即兑换" : "星星不足"}
              </button>
            </article>
          );
        })}
      </div>
    </article>
  );
}
