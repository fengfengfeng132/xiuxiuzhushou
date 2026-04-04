import { STAR_RULES } from "../../domain/model.js";

interface StarRulesScreenProps {
  onBack: () => void;
  onOpenAchievements: () => void;
  onOpenWishlist: () => void;
}

const ACHIEVEMENT_CATEGORIES = ["任务达人", "学霸之路", "进步之星", "坚持不懈"];

const STAR_USAGE_GUIDE = [
  "小愿望（零食、贴纸）：5-20 ⭐",
  "中愿望（玩具、电影）：20-50 ⭐",
  "大愿望（学习用品）：50-200 ⭐",
  "超级愿望（特别奖励）：200+ ⭐",
];

const STAR_TIPS = [
  "早上 6:00-8:00 学习，可获得早起加成",
  "使用计时功能记录学习时长，能拿到时长奖励",
  "每天尽量完成全部学习任务，可触发全勤奖励",
  "周末学习同样计入加成，收益更高",
  "连续打卡不中断，奖励会越来越高",
];

function formatMultiplier(multiplier: number): string {
  return multiplier.toFixed(2).replace(/\.?0+$/, "");
}

function getDurationBonusStars(minutes: number): number {
  for (const threshold of STAR_RULES.durationBonusThresholds) {
    if (minutes >= threshold.minimumMinutes) {
      return threshold.bonusStars;
    }
  }

  return 0;
}

// StarRulesScreen is the canonical rule page linked from the points-center popover.
export function StarRulesScreen({ onBack, onOpenAchievements, onOpenWishlist }: StarRulesScreenProps) {
  const durationRules = [...STAR_RULES.durationBonusThresholds].sort((left, right) => left.minimumMinutes - right.minimumMinutes);
  const morningMultiplierLabel = `x${formatMultiplier(STAR_RULES.morningBonus.multiplier)}`;
  const weekendMultiplierLabel = `x${formatMultiplier(STAR_RULES.weekendBonusMultiplier)}`;
  const thirtyMinuteStars = STAR_RULES.planBaseStars + getDurationBonusStars(30);
  const sixtyMinuteStars = STAR_RULES.planBaseStars + getDurationBonusStars(60);
  const stackedRaw = sixtyMinuteStars * STAR_RULES.morningBonus.multiplier * STAR_RULES.weekendBonusMultiplier;
  const stackedRounded = Math.max(1, Math.round(stackedRaw));

  return (
    <div className="star-rules-page">
      <header className="star-rules-hero">
        <button type="button" className="star-rules-back-button" onClick={onBack} aria-label="返回积分中心">
          ←
        </button>
        <div className="star-rules-hero-copy">
          <h1>
            星星积分规则 <span aria-hidden="true">⭐</span>
          </h1>
          <p>了解如何获得星星，实现你的愿望！</p>
        </div>
      </header>

      <section className="star-rules-quick-card">
        <div className="star-rules-title-row">
          <span className="star-rules-title-icon" aria-hidden="true">
            ⚡
          </span>
          <strong>快速总结</strong>
        </div>
        <p>
          完成学习任务领取基础星星，学习时间越久奖励越高；早起和周末学习还能享受倍率加成，连续打卡与成就系统会给额外奖励，最终可在愿望清单兑换奖励。
        </p>
      </section>

      <section className="star-rules-section">
        <h2>基础获得方式</h2>
        <div className="star-rules-card-grid">
          <article className="star-rules-rule-card">
            <div className="star-rules-rule-head">
              <strong>完成学习任务</strong>
              <span className="star-rules-rule-tag">基础 {STAR_RULES.planBaseStars} ⭐</span>
            </div>
            <p>每完成一个学习任务，都能获得基础星星奖励。</p>
            <ul>
              <li>完成数学任务：+{STAR_RULES.planBaseStars} ⭐</li>
              <li>完成英语任务：+{STAR_RULES.planBaseStars} ⭐</li>
            </ul>
          </article>

          <article className="star-rules-rule-card">
            <div className="star-rules-rule-head">
              <strong>学习时长奖励</strong>
              <span className="star-rules-rule-tag">+1~2 ⭐</span>
            </div>
            <p>学习时长越长，额外奖励越多。</p>
            <ul>
              {durationRules.map((rule) => (
                <li key={rule.minimumMinutes}>
                  学习满 {rule.minimumMinutes} 分钟：+{rule.bonusStars} ⭐
                </li>
              ))}
            </ul>
          </article>

          <article className="star-rules-rule-card">
            <div className="star-rules-rule-head">
              <strong>每日全勤奖励</strong>
              <span className="star-rules-rule-tag">+{STAR_RULES.dailyFullAttendanceBonusStars} ⭐</span>
            </div>
            <p>当天学习任务全部完成后，会额外发放全勤奖励。</p>
            <ul>
              <li>当日所有计划都完成后自动入账</li>
              <li>每天仅发放一次</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="star-rules-section">
        <h2>加成奖励</h2>
        <div className="star-rules-card-grid">
          <article className="star-rules-rule-card is-morning">
            <div className="star-rules-rule-head">
              <strong>早起学习加成</strong>
              <span className="star-rules-rule-tag">{morningMultiplierLabel}</span>
            </div>
            <p>
              每天 {String(STAR_RULES.morningBonus.startHour).padStart(2, "0")}:00-
              {String(STAR_RULES.morningBonus.endHour).padStart(2, "0")}:00 完成学习任务，奖励按倍率结算。
            </p>
            <div className="star-rules-example">
              示例：{thirtyMinuteStars} ⭐ × {formatMultiplier(STAR_RULES.morningBonus.multiplier)} ={" "}
              {Math.max(1, Math.round(thirtyMinuteStars * STAR_RULES.morningBonus.multiplier))} ⭐
            </div>
          </article>

          <article className="star-rules-rule-card is-weekend">
            <div className="star-rules-rule-head">
              <strong>周末学习加成</strong>
              <span className="star-rules-rule-tag">{weekendMultiplierLabel}</span>
            </div>
            <p>周六、周日完成学习任务，同样触发周末倍率加成。</p>
            <div className="star-rules-example">
              示例：{thirtyMinuteStars} ⭐ × {formatMultiplier(STAR_RULES.weekendBonusMultiplier)} ={" "}
              {Math.max(1, Math.round(thirtyMinuteStars * STAR_RULES.weekendBonusMultiplier))} ⭐
            </div>
          </article>

          <article className="star-rules-rule-card is-stack">
            <div className="star-rules-rule-head">
              <strong>多重加成叠加</strong>
              <span className="star-rules-rule-tag">可叠加</span>
            </div>
            <p>早起与周末可同时生效，最终奖励按叠加后的倍率四舍五入入账。</p>
            <div className="star-rules-example">
              示例：{sixtyMinuteStars} ⭐ × {formatMultiplier(STAR_RULES.morningBonus.multiplier)} ×{" "}
              {formatMultiplier(STAR_RULES.weekendBonusMultiplier)} = {stackedRaw.toFixed(1)} ⭐ ≈ {stackedRounded} ⭐
            </div>
          </article>
        </div>
      </section>

      <section className="star-rules-section">
        <h2>连续打卡奖励</h2>
        <p className="star-rules-section-note">只要每天至少完成一个任务，连续天数就会累计。</p>
        <div className="star-rules-streak-grid">
          {STAR_RULES.streakRewards.map((tier) => (
            <article key={tier.days} className="star-rules-streak-card">
              <span aria-hidden="true">🔥</span>
              <strong>连续 {tier.days} 天</strong>
              <p>{tier.stars} ⭐</p>
            </article>
          ))}
        </div>
      </section>

      <section className="star-rules-section">
        <h2>成就系统</h2>
        <p className="star-rules-section-note">达成特定目标后可以解锁勋章，并获得额外星星奖励。</p>
        <div className="star-rules-achievement-grid">
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <article key={category} className="star-rules-achievement-card">
              <span aria-hidden="true">🏅</span>
              <strong>{category}</strong>
            </article>
          ))}
        </div>
        <button type="button" className="star-rules-link-button" onClick={onOpenAchievements}>
          查看所有成就
        </button>
      </section>

      <section className="star-rules-section is-usage">
        <h2>如何使用星星</h2>
        <div className="star-rules-usage-card">
          <strong>兑换愿望清单</strong>
          <ul>
            {STAR_USAGE_GUIDE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="star-rules-primary-button" onClick={onOpenWishlist}>
          前往愿望清单
        </button>
      </section>

      <section className="star-rules-tips-card">
        <div className="star-rules-title-row">
          <span className="star-rules-title-icon" aria-hidden="true">
            📈
          </span>
          <strong>获得星星的小技巧</strong>
        </div>
        <ul>
          {STAR_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
