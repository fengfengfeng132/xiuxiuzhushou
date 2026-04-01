import { useState } from "react";
import type { AppState } from "../../domain/model.js";
import {
  buildPointsHistoryView,
  formatPointsHistoryRangeLabel,
  type PointsHistoryRecordType,
  type PointsHistoryRangePreset,
} from "./points-helpers.js";

interface PointsHistoryScreenProps {
  state: AppState;
  referenceDateKey: string;
  onBack: () => void;
  onOpenCustomRange: () => void;
}

const RANGE_OPTIONS: Array<{ value: PointsHistoryRangePreset; label: string }> = [
  { value: "all", label: "全部" },
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
  { value: "90d", label: "近90天" },
  { value: "custom", label: "自定义" },
];

const RECORD_TYPE_OPTIONS: Array<{ value: PointsHistoryRecordType; label: string }> = [
  { value: "all", label: "全部记录" },
  { value: "gain", label: "获得" },
  { value: "spend", label: "消费" },
];

const HISTORY_TIPS = [
  "积分历史最多显示最近100条记录",
  "绿色表示获得星星，紫色表示消费星星",
  "所有积分记录都会永久保存在数据中",
];

function formatSignedStarAmount(amount: number): string {
  if (amount > 0) {
    return `+${amount}⭐`;
  }

  if (amount < 0) {
    return `-${Math.abs(amount)}⭐`;
  }

  return "0⭐";
}

function getEmptyCopy(recordType: PointsHistoryRecordType): string {
  if (recordType === "spend") {
    return "兑换愿望清单中的奖励，消费记录会显示在这里";
  }

  if (recordType === "gain") {
    return "完成任务和习惯打卡后，获得记录会显示在这里";
  }

  return "兑换愿望清单中的奖励，消费记录会显示在这里";
}

// PointsHistoryScreen manages local filters while deriving all ledger data from the shared star transactions.
export function PointsHistoryScreen({ state, referenceDateKey, onBack, onOpenCustomRange }: PointsHistoryScreenProps) {
  const [rangePreset, setRangePreset] = useState<Exclude<PointsHistoryRangePreset, "custom">>("30d");
  const [recordType, setRecordType] = useState<PointsHistoryRecordType>("all");
  const historyView = buildPointsHistoryView(state, referenceDateKey, rangePreset, recordType);

  return (
    <div className="points-history-page">
      <header className="points-history-hero">
        <button type="button" className="points-history-back-button" onClick={onBack} aria-label="返回积分中心">
          ←
        </button>
        <div className="points-history-hero-copy">
          <h1>
            积分历史 <span aria-hidden="true">📊</span>
          </h1>
          <p>查看你的星星获取和消费记录</p>
        </div>
      </header>

      <section className="points-history-filter-card">
        <div className="points-history-filter-head">
          <span className="points-history-filter-icon" aria-hidden="true">
            🗓
          </span>
          <h2>统计时段</h2>
        </div>

        <div className="points-history-range-row">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`points-history-range-chip${(option.value === "custom" ? false : rangePreset === option.value) ? " is-active" : ""}`}
              onClick={() => {
                if (option.value === "custom") {
                  onOpenCustomRange();
                  return;
                }
                setRangePreset(option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="points-history-range-label">当前统计范围: {formatPointsHistoryRangeLabel(historyView.range)}</p>
      </section>

      <section className="points-history-summary-card">
        <article className="points-history-summary-item is-green">
          <span>↗ 时段获得</span>
          <strong>+{historyView.summary.earned}⭐</strong>
        </article>
        <article className="points-history-summary-item is-violet">
          <span>↘ 时段消费</span>
          <strong>-{historyView.summary.spent}⭐</strong>
        </article>
        <article className="points-history-summary-item is-blue">
          <span>📶 净变化</span>
          <strong>{historyView.summary.net >= 0 ? "+" : "-"}{Math.abs(historyView.summary.net)}⭐</strong>
        </article>
        <article className="points-history-summary-item is-orange">
          <span>🕒 记录条数</span>
          <strong>{historyView.summary.recordCount}</strong>
        </article>
      </section>

      <section className="points-history-type-bar">
        {RECORD_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`points-history-type-chip${recordType === option.value ? ` is-active is-${option.value}` : ""}`}
            onClick={() => setRecordType(option.value)}
          >
            {option.label}
          </button>
        ))}
      </section>

      {historyView.groups.length === 0 ? (
        <section className="points-history-empty-card">
          <div className="points-history-empty-icon" aria-hidden="true">
            📜
          </div>
          <h2>暂无记录</h2>
          <p>{getEmptyCopy(recordType)}</p>
        </section>
      ) : (
        <section className="points-history-list-card">
          <div className="points-history-group-list">
            {historyView.groups.map((group) => (
              <article key={group.dateKey} className="points-history-group">
                <div className="points-history-group-head">
                  <div className="points-history-group-title">
                    <span className="points-history-group-icon" aria-hidden="true">
                      🕒
                    </span>
                    <h3>{group.title}</h3>
                  </div>
                  <span className={`points-history-group-total${group.totalAmount < 0 ? " is-spend" : ""}`}>
                    {formatSignedStarAmount(group.totalAmount)}
                  </span>
                </div>

                <div className="points-history-record-list">
                  {group.records.map((record) => (
                    <article key={record.id} className={`points-history-record-row is-${record.kind}`}>
                      <div className={`points-history-record-rail is-${record.kind}`} aria-hidden="true" />
                      <div className={`points-history-record-icon is-${record.kind}`} aria-hidden="true">
                        {record.kind === "gain" ? "☆" : "↘"}
                      </div>
                      <div className="points-history-record-copy">
                        <strong>{record.title}</strong>
                        <div className="points-history-record-meta">
                          <span>{record.timeLabel}</span>
                          <span>{record.category}</span>
                          {record.statusLabel ? <span className="points-history-record-badge">{record.statusLabel}</span> : null}
                        </div>
                      </div>
                      <div className={`points-history-record-amount is-${record.kind}`}>{formatSignedStarAmount(record.amount)}</div>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="points-history-tips-card">
        <div className="points-history-tips-head">
          <span className="points-history-tips-icon" aria-hidden="true">
            ☆
          </span>
          <h2>温馨提示</h2>
        </div>
        <div className="points-history-tips-list">
          {HISTORY_TIPS.map((tip) => (
            <div key={tip} className="points-history-tip-row">
              <span aria-hidden="true">✓</span>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
