import type { FormEvent } from "react";
import { currentDateKey } from "../../domain/model.js";
import type { InterestClassItem, InterestClassRecord } from "../../persistence/interest-storage.js";

export interface InterestClassDraft {
  name: string;
  totalUnits: string;
  unitLabel: string;
  note: string;
  overflowWarningEnabled: boolean;
  overflowWarningThreshold: string;
}

export interface InterestClassRecordDraft {
  classId: string;
  dateKey: string;
  amount: string;
  note: string;
}

interface InterestClassScreenProps {
  classes: InterestClassItem[];
  records: InterestClassRecord[];
  filterStartDate: string;
  filterEndDate: string;
  onBack: () => void;
  onOpenAddClass: () => void;
  onOpenEditClass: (classId: string) => void;
  onOpenAddRecord: (classId?: string) => void;
  onOpenEditRecord: (recordId: string) => void;
  onDeleteClass: (classId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onChangeFilterStartDate: (dateKey: string) => void;
  onChangeFilterEndDate: (dateKey: string) => void;
  onResetDateFilters: () => void;
}

interface InterestClassModalProps {
  open: boolean;
  mode: "create" | "edit";
  draft: InterestClassDraft;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof InterestClassDraft, value: string | boolean) => void;
}

interface InterestClassRecordModalProps {
  open: boolean;
  mode: "create" | "edit";
  classes: InterestClassItem[];
  draft: InterestClassRecordDraft;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof InterestClassRecordDraft, value: string) => void;
}

interface MonthlySummaryItem {
  monthKey: string;
  totalAmount: number;
}

function formatDecimal(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Math.round(value * 100) / 100);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  if (!year || !month) {
    return monthKey;
  }
  return `${year}/${month}`;
}

function buildRecordMap(records: InterestClassRecord[]): Map<string, InterestClassRecord[]> {
  const recordsByClassId = new Map<string, InterestClassRecord[]>();
  for (const record of records) {
    const bucket = recordsByClassId.get(record.classId) ?? [];
    bucket.push(record);
    recordsByClassId.set(record.classId, bucket);
  }
  for (const bucket of recordsByClassId.values()) {
    bucket.sort((left, right) => {
      if (left.dateKey === right.dateKey) {
        return right.createdAt.localeCompare(left.createdAt);
      }
      return right.dateKey.localeCompare(left.dateKey);
    });
  }
  return recordsByClassId;
}

function buildMonthlySummary(records: InterestClassRecord[]): MonthlySummaryItem[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    const monthKey = record.dateKey.slice(0, 7);
    totals.set(monthKey, (totals.get(monthKey) ?? 0) + record.amount);
  }
  return Array.from(totals.entries())
    .map(([monthKey, totalAmount]) => ({ monthKey, totalAmount }))
    .sort((left, right) => left.monthKey.localeCompare(right.monthKey));
}

export function createInitialInterestClassDraft(): InterestClassDraft {
  return {
    name: "",
    totalUnits: "",
    unitLabel: "课时",
    note: "",
    overflowWarningEnabled: false,
    overflowWarningThreshold: "0",
  };
}

export function createInterestClassDraftFromClass(item: InterestClassItem): InterestClassDraft {
  return {
    name: item.name,
    totalUnits: formatDecimal(item.totalUnits),
    unitLabel: item.unitLabel,
    note: item.note,
    overflowWarningEnabled: item.overflowWarningEnabled,
    overflowWarningThreshold: formatDecimal(item.overflowWarningThreshold),
  };
}

export function createInitialInterestClassRecordDraft(classId: string = "", dateKey: string = currentDateKey()): InterestClassRecordDraft {
  return {
    classId,
    dateKey,
    amount: "1",
    note: "",
  };
}

export function createInterestClassRecordDraftFromRecord(record: InterestClassRecord): InterestClassRecordDraft {
  return {
    classId: record.classId,
    dateKey: record.dateKey,
    amount: formatDecimal(record.amount),
    note: record.note,
  };
}

export function InterestClassScreen({
  classes,
  records,
  filterStartDate,
  filterEndDate,
  onBack,
  onOpenAddClass,
  onOpenEditClass,
  onOpenAddRecord,
  onOpenEditRecord,
  onDeleteClass,
  onDeleteRecord,
  onChangeFilterStartDate,
  onChangeFilterEndDate,
  onResetDateFilters,
}: InterestClassScreenProps) {
  const isRangeInvalid = filterStartDate.length > 0 && filterEndDate.length > 0 && filterStartDate > filterEndDate;
  const filteredRecords = isRangeInvalid
    ? []
    : records.filter((record) => {
        if (filterStartDate.length > 0 && record.dateKey < filterStartDate) {
          return false;
        }
        if (filterEndDate.length > 0 && record.dateKey > filterEndDate) {
          return false;
        }
        return true;
      });
  const recordsByClassId = buildRecordMap(filteredRecords);
  const allRecordsByClassId = buildRecordMap(records);
  const monthlySummary = buildMonthlySummary(filteredRecords);
  const maxMonthlyTotal = Math.max(...monthlySummary.map((item) => item.totalAmount), 1);
  const filteredTotalAmount = filteredRecords.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="interest-page">
      <header className="interest-hero">
        <button type="button" className="interest-back-button" onClick={onBack} aria-label="返回其他功能">
          ←
        </button>
        <div className="interest-hero-copy">
          <h1>兴趣班记录</h1>
          <p>记录您的课程进度与学习轨迹</p>
        </div>
        <button type="button" className="interest-primary-button" onClick={onOpenAddClass}>
          ＋ 添加兴趣班
        </button>
      </header>

      <section className="interest-filter-card">
        <div className="interest-filter-head">
          <strong>按日期区间筛选</strong>
          <button type="button" className="interest-filter-reset" onClick={onResetDateFilters}>
            清空筛选
          </button>
        </div>
        <div className="interest-filter-row">
          <label>
            开始日期
            <input type="date" value={filterStartDate} onChange={(event) => onChangeFilterStartDate(event.target.value)} />
          </label>
          <label>
            结束日期
            <input type="date" value={filterEndDate} onChange={(event) => onChangeFilterEndDate(event.target.value)} />
          </label>
        </div>
        {isRangeInvalid ? <p className="interest-filter-error">开始日期不能晚于结束日期。</p> : null}

        <div className="interest-monthly-card">
          <div className="interest-monthly-head">
            <strong>每月汇总图</strong>
            <span>
              区间共 {filteredRecords.length} 条记录，消耗 {formatDecimal(filteredTotalAmount)}
            </span>
          </div>
          {monthlySummary.length > 0 ? (
            <div className="interest-monthly-chart">
              {monthlySummary.map((item) => {
                const heightPercent = Math.max(12, Math.round((item.totalAmount / maxMonthlyTotal) * 100));
                return (
                  <article key={item.monthKey} className="interest-month-bar">
                    <div className="interest-month-bar-track">
                      <div className="interest-month-bar-fill" style={{ height: `${heightPercent}%` }} />
                    </div>
                    <strong>{formatDecimal(item.totalAmount)}</strong>
                    <span>{formatMonthLabel(item.monthKey)}</span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="interest-monthly-empty">当前筛选区间没有记录，月汇总图会在有记录后展示。</div>
          )}
        </div>
      </section>

      {classes.length > 0 ? (
        <section className="interest-class-grid">
          {classes.map((item) => {
            const classRecords = recordsByClassId.get(item.id) ?? [];
            const allClassRecords = allRecordsByClassId.get(item.id) ?? [];
            const usedUnits = allClassRecords.reduce((sum, record) => sum + record.amount, 0);
            const remainingUnits = item.totalUnits - usedUnits;
            const overflowUnits = Math.max(0, usedUnits - item.totalUnits);
            const warningTriggered =
              item.overflowWarningEnabled && overflowUnits > 0 && overflowUnits >= item.overflowWarningThreshold;

            return (
              <article key={item.id} className="interest-class-card">
                <div className="interest-class-head">
                  <h2>{item.name}</h2>
                  <div className="interest-class-head-actions">
                    <button type="button" className="interest-class-icon-action" onClick={() => onOpenEditClass(item.id)} aria-label={`编辑 ${item.name}`}>
                      ✎
                    </button>
                    <button type="button" className="interest-class-icon-action" onClick={() => onDeleteClass(item.id)} aria-label={`删除 ${item.name}`}>
                      🗑
                    </button>
                  </div>
                </div>

                <div className="interest-metric-grid">
                  <article className="interest-metric-card">
                    <span>总量</span>
                    <strong>
                      {formatDecimal(item.totalUnits)}
                      {item.unitLabel}
                    </strong>
                  </article>
                  <article className="interest-metric-card is-blue">
                    <span>已用</span>
                    <strong>
                      {formatDecimal(usedUnits)}
                      {item.unitLabel}
                    </strong>
                  </article>
                  <article className={`interest-metric-card ${remainingUnits >= 0 ? "is-green" : "is-red"}`}>
                    <span>{remainingUnits >= 0 ? "剩余" : "超出"}</span>
                    <strong>
                      {formatDecimal(Math.abs(remainingUnits))}
                      {item.unitLabel}
                    </strong>
                  </article>
                </div>

                {warningTriggered ? (
                  <div className="interest-warning-banner">
                    预警：已超出 {formatDecimal(overflowUnits)}
                    {item.unitLabel}（阈值 {formatDecimal(item.overflowWarningThreshold)}
                    {item.unitLabel}）
                  </div>
                ) : null}

                <button type="button" className="interest-record-button" onClick={() => onOpenAddRecord(item.id)}>
                  ＋ 记一条记录
                </button>

                <div className="interest-records-head">
                  <strong>区间记录</strong>
                  <span>
                    {classRecords.length} 条（累计 {formatDecimal(classRecords.reduce((sum, record) => sum + record.amount, 0))}
                    {item.unitLabel}）
                  </span>
                </div>

                {classRecords.length > 0 ? (
                  <ul className="interest-records-list">
                    {classRecords.map((record) => (
                      <li key={record.id} className="interest-record-row">
                        <div className="interest-record-copy">
                          <strong>{record.dateKey.replace(/-/g, "/")}</strong>
                          <p>{record.note.trim().length > 0 ? record.note : "未填写备注"}</p>
                        </div>
                        <div className="interest-record-side">
                          <span>
                            -{formatDecimal(record.amount)}
                            {item.unitLabel}
                          </span>
                          <div className="interest-record-actions">
                            <button type="button" className="interest-record-edit" onClick={() => onOpenEditRecord(record.id)}>
                              编辑
                            </button>
                            <button type="button" className="interest-record-delete" onClick={() => onDeleteRecord(record.id)}>
                              删除
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="interest-empty-records">当前筛选区间暂无上课记录</div>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="interest-empty-card">
          <div className="interest-empty-icon">📖</div>
          <h2>还没有兴趣班</h2>
          <p>先添加一个兴趣班，再记录每次上课消耗（可按次数或课时）。</p>
          <button type="button" className="interest-empty-action" onClick={onOpenAddClass}>
            添加兴趣班
          </button>
        </section>
      )}
    </div>
  );
}

export function InterestClassModal({ open, mode, draft, onClose, onSubmit, onUpdateDraft }: InterestClassModalProps) {
  if (!open) {
    return null;
  }

  const isCreate = mode === "create";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card interest-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head interest-modal-head">
          <div>
            <h2>{isCreate ? "添加兴趣班" : "编辑兴趣班"}</h2>
            <p>设置总量、单位和超出总量预警规则。</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭兴趣班表单">
            ×
          </button>
        </div>

        <form className="interest-form" onSubmit={onSubmit}>
          <label>
            兴趣班名称
            <input
              value={draft.name}
              onChange={(event) => onUpdateDraft("name", event.target.value)}
              placeholder="如：钢琴、绘画"
              maxLength={24}
              required
            />
          </label>
          <div className="interest-form-grid">
            <label>
              总量
              <input
                value={draft.totalUnits}
                onChange={(event) => onUpdateDraft("totalUnits", event.target.value)}
                inputMode="decimal"
                placeholder="如：40"
                required
              />
            </label>
            <label>
              单位
              <input value={draft.unitLabel} onChange={(event) => onUpdateDraft("unitLabel", event.target.value)} placeholder="课时" maxLength={8} />
            </label>
          </div>
          <label>
            班级备注（可选）
            <textarea
              value={draft.note}
              onChange={(event) => onUpdateDraft("note", event.target.value)}
              placeholder="可备注报班情况、费用、注意事项等..."
              maxLength={200}
            />
          </label>
          <label className="interest-rule-toggle">
            <input
              type="checkbox"
              checked={draft.overflowWarningEnabled}
              onChange={(event) => onUpdateDraft("overflowWarningEnabled", event.target.checked)}
            />
            <span>开启超出总量预警</span>
          </label>
          {draft.overflowWarningEnabled ? (
            <label>
              预警阈值（超出达到该值触发）
              <input
                value={draft.overflowWarningThreshold}
                onChange={(event) => onUpdateDraft("overflowWarningThreshold", event.target.value)}
                inputMode="decimal"
                placeholder="0 表示只要超出就预警"
              />
            </label>
          ) : null}

          <div className="modal-actions interest-modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="modal-submit">
              {isCreate ? "保存" : "保存修改"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InterestClassRecordModal({ open, mode, classes, draft, onClose, onSubmit, onUpdateDraft }: InterestClassRecordModalProps) {
  if (!open) {
    return null;
  }

  const selectedClass = classes.find((item) => item.id === draft.classId) ?? null;
  const amountUnitLabel = selectedClass?.unitLabel ?? "课时";
  const isCreate = mode === "create";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card interest-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head interest-modal-head">
          <div>
            <h2>{isCreate ? "添加记录" : "编辑记录"}</h2>
            <p>数量支持小数，可超出总量。</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭记录表单">
            ×
          </button>
        </div>

        <form className="interest-form" onSubmit={onSubmit}>
          <label>
            所属兴趣班
            <select value={draft.classId} onChange={(event) => onUpdateDraft("classId", event.target.value)} required>
              <option value="" disabled>
                请选择兴趣班
              </option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="interest-form-grid">
            <label>
              上课日期
              <input type="date" value={draft.dateKey} onChange={(event) => onUpdateDraft("dateKey", event.target.value)} required />
            </label>
            <label>
              数量（{amountUnitLabel}）
              <input
                value={draft.amount}
                onChange={(event) => onUpdateDraft("amount", event.target.value)}
                inputMode="decimal"
                placeholder={`支持小数，例如 1.5${amountUnitLabel}`}
                required
              />
            </label>
          </div>

          <label>
            备注（可选）
            <textarea
              value={draft.note}
              onChange={(event) => onUpdateDraft("note", event.target.value)}
              placeholder="记录今日学习内容、作业或表现..."
              maxLength={200}
            />
          </label>

          <div className="modal-actions interest-modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="modal-submit">
              {isCreate ? "保存" : "保存修改"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
