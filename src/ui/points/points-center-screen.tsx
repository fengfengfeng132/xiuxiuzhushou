import { useState } from "react";
import type { Reward } from "../../domain/model.js";
import { buildRewardWishlistGroups, type DailyPointOpportunity, type PointsSummaryMetrics } from "./points-helpers.js";

interface PointsCenterScreenProps {
  starBalance: number;
  rewards: Reward[];
  pointsMetrics: PointsSummaryMetrics;
  dailyOpportunities: DailyPointOpportunity[];
  onBack: () => void;
  onRedeemReward: (rewardId: string) => void;
  onOpenAchievements: () => void;
  onOpenPointsHistory: () => void;
  onAddWish: () => void;
  onEditWish: (rewardId: string) => void;
  onDeleteWish: (rewardId: string) => void;
  onOpenRulesPage: () => void;
}

// Points center owns the dedicated wallet view so future achievement/history pages can branch from one module.
export function PointsCenterScreen({
  starBalance,
  rewards,
  pointsMetrics,
  dailyOpportunities,
  onBack,
  onRedeemReward,
  onOpenAchievements,
  onOpenPointsHistory,
  onAddWish,
  onEditWish,
  onDeleteWish,
  onOpenRulesPage,
}: PointsCenterScreenProps) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const wishlistGroups = buildRewardWishlistGroups(rewards, starBalance);
  const totalPotential = dailyOpportunities.reduce((total, item) => total + item.stars, 0);

  return (
    <div className="points-page">
      <header className="points-hero">
        <button type="button" className="points-back-button" onClick={onBack} aria-label="返回首页">
          ←
        </button>
        <div className="points-hero-copy">
          <h1>我的积分和成就</h1>
          <p>完成学习任务，攒星星，兑换愿望。</p>
        </div>
      </header>

      <section className="points-wallet-card">
        <div className="points-wallet-head">
          <div className="points-balance-block">
            <span className="points-balance-label">我的星星余额</span>
            <div className="points-balance-value">
              <strong>{starBalance}</strong>
              <span>⭐</span>
            </div>
          </div>

          <div className="points-rules-area">
            <button type="button" className="points-rules-trigger" onClick={() => setRulesOpen((current) => !current)}>
              如何获得?
            </button>

            {rulesOpen ? (
              <div className="points-rules-popover">
                <div className="points-rules-popover-head">
                  <strong>星星获得方式</strong>
                  <button type="button" className="points-rules-close" onClick={() => setRulesOpen(false)} aria-label="关闭规则预览">
                    ×
                  </button>
                </div>
                <div className="points-rules-list">
                  <div className="points-rules-row">
                    <div>
                      <strong>完成学习计划</strong>
                      <p>每个计划都会按设定发放星星。</p>
                    </div>
                    <span>基础奖励</span>
                  </div>
                  <div className="points-rules-row">
                    <div>
                      <strong>完成正向习惯打卡</strong>
                      <p>习惯卡片里的加分项目会进入积分账本。</p>
                    </div>
                    <span>日常积累</span>
                  </div>
                  <div className="points-rules-row">
                    <div>
                      <strong>星星可用于兑换愿望</strong>
                      <p>积分余额和愿望清单会始终保持一致。</p>
                    </div>
                    <span>本地账本</span>
                  </div>
                </div>
                <button type="button" className="points-rules-link" onClick={onOpenRulesPage}>
                  查看完整规则
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="points-metric-row">
          <article className="points-metric-chip">
            <span>本周</span>
            <strong>+{pointsMetrics.weekEarned} ⭐</strong>
          </article>
          <article className="points-metric-chip">
            <span>本月</span>
            <strong>+{pointsMetrics.monthEarned} ⭐</strong>
          </article>
          <article className="points-metric-chip">
            <span>已消费</span>
            <strong>{pointsMetrics.spentTotal} ⭐</strong>
          </article>
        </div>

        {dailyOpportunities.length > 0 ? (
          <div className="points-daily-card">
            <div className="points-daily-head">
              <span className="points-daily-icon">!</span>
              <div>
                <strong>今日还可获得</strong>
                <p>继续完成计划和习惯，就能把今天的星星拿满。</p>
              </div>
            </div>
            <div className="points-daily-list">
              {dailyOpportunities.map((item) => (
                <div key={item.id} className="points-daily-row">
                  <span>{item.label}</span>
                  <strong>+{item.stars} ⭐</strong>
                </div>
              ))}
            </div>
            <p className="points-daily-total">今天最多还能获得 {totalPotential} ⭐</p>
          </div>
        ) : null}
      </section>

      <section className="points-entry-grid">
        <button type="button" className="points-entry-card is-achievement" onClick={onOpenAchievements}>
          <span className="points-entry-icon" aria-hidden="true">
            🏅
          </span>
          <strong>成就系统</strong>
          <p>查看当前成就进度和奖励说明</p>
        </button>

        <button type="button" className="points-entry-card is-history" onClick={onOpenPointsHistory}>
          <span className="points-entry-icon" aria-hidden="true">
            📜
          </span>
          <strong>积分历史</strong>
          <p>查看星星获得和消费记录</p>
        </button>
      </section>

      <section className="points-wishlist-card">
        <div className="points-wishlist-head">
          <div>
            <h2>我的愿望清单</h2>
            <p>用当前积分余额兑换想要的奖励。</p>
          </div>
          <div className="points-wishlist-actions">
            <button type="button" className="points-sort-chip" disabled>
              默认排序
            </button>
            <button type="button" className="points-primary-button" onClick={onAddWish}>
              + 添加愿望
            </button>
          </div>
        </div>

        {wishlistGroups.length === 0 ? (
          <div className="points-empty-state">
            <span className="points-empty-icon" aria-hidden="true">
              🎁
            </span>
            <h3>还没有愿望</h3>
            <p>先添加一个想兑换的奖励，积分攒够后就能在这里直接兑换。</p>
            <button type="button" className="points-primary-button" onClick={onAddWish}>
              添加第一个愿望
            </button>
          </div>
        ) : (
          wishlistGroups.map((group) => (
            <section key={group.id} className="points-wishlist-group">
              <div className="points-group-head">
                <h3>{group.title}</h3>
                <span className="points-group-count">{group.count} 个</span>
              </div>

              <div className="points-reward-grid">
                {group.rewards.map((item) => (
                  <article key={item.reward.id} className="points-wish-card">
                    <div className="points-wish-head">
                      <div className="points-wish-icon" aria-hidden="true">
                        {item.image ? <img src={item.image} alt="" className="points-wish-image" /> : item.icon}
                      </div>
                      <div className="points-wish-copy">
                        <span className="points-wish-badge">{item.badge}</span>
                        <h4>{item.reward.title}</h4>
                        <p>已兑换 {item.reward.redeemedCount} 次</p>
                      </div>
                    </div>

                    <div className="points-wish-meta">
                      <strong>{item.reward.cost} ⭐</strong>
                      <span>{item.canRedeem ? "当前可兑换" : `还差 ${item.shortfall} ⭐`}</span>
                    </div>

                    <div className="points-wish-actions">
                      <button type="button" className="points-secondary-button" onClick={() => onEditWish(item.reward.id)}>
                        编辑
                      </button>
                      <button type="button" className="points-secondary-button is-danger" onClick={() => onDeleteWish(item.reward.id)}>
                        删除
                      </button>
                      <button
                        type="button"
                        className={`points-redeem-button${item.canRedeem ? " is-active" : ""}`}
                        onClick={() => onRedeemReward(item.reward.id)}
                        disabled={!item.canRedeem}
                      >
                        {item.canRedeem ? "兑换" : "星星不足"}
                      </button>
                    </div>

                    <p className={`points-wish-status${item.canRedeem ? " is-available" : " is-short"}`}>
                      {item.canRedeem ? "当前余额足够，可以立即兑换。" : `还差 ${item.shortfall} ⭐ 才能兑换这个愿望`}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
