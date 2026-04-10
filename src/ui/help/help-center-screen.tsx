import type { CSSProperties } from "react";
import { HELP_FEATURE_CARDS, HELP_PLAN_FIELD_LINES, HELP_QUICK_START_STEPS } from "../app-content.js";
import type { HelpFeatureCard } from "../app-types.js";

interface HelpCenterScreenProps {
  onBack: () => void;
  onFeatureAction: (action: HelpFeatureCard["action"]) => void;
}

// Help center is isolated so content updates do not require opening the whole shell.
export function HelpCenterScreen({ onBack, onFeatureAction }: HelpCenterScreenProps) {
  return (
    <div className="help-page">
      <header className="help-hero">
        <button type="button" className="help-back-button" onClick={onBack}>
          返回
        </button>
        <div className="help-hero-copy">
          <h1>使用帮助</h1>
          <p>把这里当作当前首页流程的使用手册。</p>
        </div>
      </header>

      <section className="help-summary-card">
        <div className="help-summary-head">
          <span className="help-summary-icon">📘</span>
          <h2>快速开始</h2>
        </div>
        <ol className="help-list-ordered">
          {HELP_QUICK_START_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="help-summary-card">
        <div className="help-summary-head">
          <span className="help-summary-icon help-summary-icon-warm">✓</span>
          <h2>计划字段</h2>
        </div>
        <div className="help-field-copy">
          {HELP_PLAN_FIELD_LINES.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </section>

      <section className="help-grid">
        {HELP_FEATURE_CARDS.map((card) => {
          const cardStyle = {
            "--help-accent": card.accent,
          } as CSSProperties;

          return (
            <article key={card.id} className="help-feature-card" style={cardStyle}>
              <div className="help-feature-head">
                <div className="help-feature-title">
                  <span className="help-feature-icon" aria-hidden="true">
                    {card.icon}
                  </span>
                  <h3>{card.title}</h3>
                </div>
                <button type="button" className="help-feature-button" onClick={() => onFeatureAction(card.action)}>
                  前往功能
                </button>
              </div>
              <div className="help-feature-body">
                <strong>使用方式</strong>
                <ul className="help-list">
                  {card.howTo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <strong>提示</strong>
                <ul className="help-list">
                  {card.tips.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

