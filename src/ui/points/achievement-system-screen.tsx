import type { CSSProperties } from "react";
import type { AchievementOverview } from "./points-helpers.js";

interface AchievementSystemScreenProps {
  overview: AchievementOverview;
  onBack: () => void;
  onOpenSettings: () => void;
}

const ACHIEVEMENT_TIPS = [
  "完成学习任务，解锁任务成就",
  "连续打卡不中断，获得连续打卡成就",
  "累计学习时长，解锁时长成就",
  "成就奖励的星星会自动添加到你的余额",
];

// AchievementSystemScreen stays separate from the points hub so future badge states can evolve independently.
export function AchievementSystemScreen({ overview, onBack, onOpenSettings }: AchievementSystemScreenProps) {
  return (
    <div className="achievement-page">
      <header className="achievement-hero">
        <button type="button" className="achievement-back-button" onClick={onBack} aria-label="返回积分中心">
          ←
        </button>
        <div className="achievement-hero-copy">
          <h1>
            成就系统 <span aria-hidden="true">🏆</span>
          </h1>
          <p>完成挑战，解锁成就勋章！</p>
        </div>
        <button type="button" className="achievement-settings-button" onClick={onOpenSettings} aria-label="成就设置">
          ⚙
        </button>
      </header>

      <section className="achievement-summary-card">
        <article className="achievement-summary-item is-blue">
          <strong>{overview.unlockedCount}</strong>
          <span>已解锁</span>
        </article>
        <article className="achievement-summary-item is-violet">
          <strong>{overview.totalCount}</strong>
          <span>总成就</span>
        </article>
        <article className="achievement-summary-item is-orange">
          <strong>{overview.rewardStars} ⭐</strong>
          <span>奖励星星</span>
        </article>
      </section>

      {overview.badges.length === 0 ? (
        <section className="achievement-empty-card">
          <div className="achievement-empty-icon" aria-hidden="true">
            🏆
          </div>
          <h2>暂无成就数据</h2>
          <p>继续完成学习任务，解锁更多成就！</p>
        </section>
      ) : (
        <section className="achievement-list-card">
          <div className="achievement-list-head">
            <h2>已解锁成就</h2>
            <p>当前已获得 {overview.rewardStars} 颗奖励星星。</p>
          </div>
          <div className="achievement-list">
            {overview.badges.map((badge) => (
              <article key={badge.id} className="achievement-badge-card" style={{ "--achievement-accent": badge.accent } as CSSProperties}>
                <div className="achievement-badge-icon" aria-hidden="true">
                  {badge.icon}
                </div>
                <div className="achievement-badge-copy">
                  <strong>{badge.title}</strong>
                  <p>{badge.description}</p>
                </div>
                <div className="achievement-badge-side">
                  <span>+{badge.rewardStars} ⭐</span>
                  <small>{badge.unlockedAt.slice(0, 10)}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="achievement-tips-card">
        <div className="achievement-tips-head">
          <span className="achievement-tips-icon" aria-hidden="true">
            🏆
          </span>
          <h2>成就小贴士</h2>
        </div>
        <div className="achievement-tips-list">
          {ACHIEVEMENT_TIPS.map((tip) => (
            <div key={tip} className="achievement-tip-row">
              <span aria-hidden="true">✓</span>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
