import type { CSSProperties } from "react";
import { APP_INFO_ITEMS } from "../app-content.js";
import type { MoreFeatureCard, MoreFeatureSection } from "../app-types.js";

interface MoreFeaturesScreenProps {
  search: string;
  visibleSections: MoreFeatureSection[];
  onBack: () => void;
  onSearchChange: (value: string) => void;
  onFeatureAction: (card: MoreFeatureCard) => void;
}

// MoreFeaturesScreen groups deferred modules so other agents can extend navigation from one place.
export function MoreFeaturesScreen({ search, visibleSections, onBack, onSearchChange, onFeatureAction }: MoreFeaturesScreenProps) {
  return (
    <div className="more-page">
      <header className="more-hero">
        <button type="button" className="more-back-button" onClick={onBack}>
          返回
        </button>
        <div className="more-hero-copy">
          <h1>其他功能</h1>
          <p>浏览已实现模块，以及后续待开发的功能入口。</p>
        </div>
      </header>

      <section className="more-search-card">
        <label className="more-search-field">
          <span>搜索</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="搜索功能模块..." />
        </label>
      </section>

      {visibleSections.length > 0 ? (
        <div className="more-sections">
          {visibleSections.map((section) => {
            const sectionStyle = {
              "--more-accent": section.accent,
            } as CSSProperties;

            return (
              <section key={section.id} className="more-section-card" style={sectionStyle}>
                <div className="more-section-head">
                  <div>
                    <p className="more-section-icon">{section.icon}</p>
                    <h2>{section.title}</h2>
                  </div>
                </div>
                <div className={`more-card-grid more-card-grid-${section.columns}`}>
                  {section.cards.map((card) => {
                    const cardStyle = {
                      "--more-card-accent": card.accent,
                    } as CSSProperties;

                    return (
                      <button key={card.id} type="button" className={`more-feature-card${card.featured ? " is-featured" : ""}`} style={cardStyle} onClick={() => onFeatureAction(card)}>
                        <div className="more-feature-card-head">
                          <span className="more-feature-card-icon">{card.icon}</span>
                          {card.badge ? <span className="more-feature-card-badge">{card.badge}</span> : null}
                        </div>
                        <strong>{card.title}</strong>
                        <p>{card.description}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="more-search-empty">
          <h2>未找到匹配功能</h2>
          <p>请修改关键词，或清空搜索框查看完整导航列表。</p>
        </section>
      )}

      <section className="more-info-card">
        <div className="more-section-head">
          <div>
            <p className="more-section-icon">信息</p>
            <h2>应用信息</h2>
          </div>
        </div>
        <dl className="more-info-list">
          {APP_INFO_ITEMS.map((item) => (
            <div key={item.label} className="more-info-row">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

