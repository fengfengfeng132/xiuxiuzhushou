import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type {
  HeightGender,
  HeightGrowthCheckIn,
  HeightManagementState,
  HeightMeasurementRecord,
  HeightProfile,
} from "../../persistence/height-storage.js";

type HeightScreenView = "hub" | "assessment" | "checkin" | "record" | "profile";
type HeightChartMetric = "height" | "weight";

interface HeightProfileDraft {
  childName: string;
  gender: HeightGender;
  birthday: string;
  currentHeightCm: string;
  currentWeightKg: string;
  targetHeightCm: string;
  motherHeightCm: string;
  fatherHeightCm: string;
}

interface HeightRecordDraft {
  dateKey: string;
  heightCm: string;
  weightKg: string;
  photoUrl: string;
  note: string;
}

interface HeightCheckInDraft {
  dateKey: string;
  sleepHours: string;
  jumpRopeMinutes: string;
  milkMl: string;
  vitaminDMinutes: string;
  note: string;
}

interface HeightManagementScreenProps {
  state: HeightManagementState;
  today: string;
  onBack: () => void;
  onChangeState: (state: HeightManagementState) => void;
  onShowNotice: (message: string) => void;
}

interface HeightReferenceRow {
  age: number;
  minus2Sd: number;
  minus1Sd: number;
  median: number;
  plus1Sd: number;
  plus2Sd: number;
}

interface HeightTrendPoint {
  id: string;
  dateKey: string;
  value: number;
}

function createLocalUiId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseOptionalPositiveDecimal(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

function parseOptionalNonNegativeDecimal(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

function formatNumber(value: number | null, fractionDigits: number = 1): string {
  if (value === null) {
    return "--";
  }
  return value.toFixed(fractionDigits).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatDateLabel(dateKey: string): string {
  return dateKey.replace(/-/g, "/");
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateKeyToUtcTimestamp(dateKey: string): number | null {
  if (!isDateKey(dateKey)) {
    return null;
  }
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

function diffDays(leftDateKey: string, rightDateKey: string): number | null {
  const left = dateKeyToUtcTimestamp(leftDateKey);
  const right = dateKeyToUtcTimestamp(rightDateKey);
  if (left === null || right === null) {
    return null;
  }
  return Math.round((left - right) / (1000 * 60 * 60 * 24));
}

function calculateAgeYears(birthday: string, today: string): number | null {
  if (!isDateKey(birthday) || !isDateKey(today)) {
    return null;
  }
  const [birthYear, birthMonth, birthDay] = birthday.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  let age = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function createProfileDraft(profile: HeightProfile): HeightProfileDraft {
  return {
    childName: profile.childName,
    gender: profile.gender,
    birthday: profile.birthday,
    currentHeightCm: profile.currentHeightCm === null ? "" : String(profile.currentHeightCm),
    currentWeightKg: profile.currentWeightKg === null ? "" : String(profile.currentWeightKg),
    targetHeightCm: profile.targetHeightCm === null ? "" : String(profile.targetHeightCm),
    motherHeightCm: profile.motherHeightCm === null ? "" : String(profile.motherHeightCm),
    fatherHeightCm: profile.fatherHeightCm === null ? "" : String(profile.fatherHeightCm),
  };
}

function createRecordDraft(today: string): HeightRecordDraft {
  return {
    dateKey: today,
    heightCm: "",
    weightKg: "",
    photoUrl: "",
    note: "",
  };
}

function createCheckInDraft(today: string): HeightCheckInDraft {
  return {
    dateKey: today,
    sleepHours: "",
    jumpRopeMinutes: "",
    milkMl: "",
    vitaminDMinutes: "",
    note: "",
  };
}

function sortRowsByDateDesc<T extends { dateKey: string; createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    if (left.dateKey === right.dateKey) {
      return right.createdAt.localeCompare(left.createdAt);
    }
    return right.dateKey.localeCompare(left.dateKey);
  });
}

function buildTrendPoints(records: HeightMeasurementRecord[], metric: HeightChartMetric): HeightTrendPoint[] {
  return records
    .map((record) => ({
      id: record.id,
      dateKey: record.dateKey,
      value: metric === "height" ? record.heightCm : record.weightKg,
    }))
    .filter((item): item is HeightTrendPoint => item.value !== null)
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function buildPolyline(points: HeightTrendPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const total = Math.max(1, points.length - 1);

  return points
    .map((point, index) => {
      const x = 10 + (index / total) * 80;
      const y = 86 - ((point.value - min) / range) * 68;
      return `${x},${y}`;
    })
    .join(" ");
}

function calculateParentalTargetHeight(profile: HeightProfile): number | null {
  if (profile.fatherHeightCm === null || profile.motherHeightCm === null) {
    return null;
  }
  if (profile.gender === "boy") {
    return Math.round(((profile.fatherHeightCm + profile.motherHeightCm + 13) / 2) * 10) / 10;
  }
  if (profile.gender === "girl") {
    return Math.round(((profile.fatherHeightCm + profile.motherHeightCm - 13) / 2) * 10) / 10;
  }
  return Math.round(((profile.fatherHeightCm + profile.motherHeightCm) / 2) * 10) / 10;
}

function calculateGrowth(records: HeightMeasurementRecord[], windowDays: number): number | null {
  const sorted = records
    .filter((record) => record.heightCm !== null)
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
  if (sorted.length < 2) {
    return null;
  }

  const latest = sorted[0];
  const latestHeight = latest.heightCm;
  if (latestHeight === null) {
    return null;
  }

  const baseline = sorted.find((record) => {
    const days = diffDays(latest.dateKey, record.dateKey);
    return days !== null && days >= windowDays;
  });
  if (!baseline || baseline.heightCm === null) {
    return null;
  }
  return Math.round((latestHeight - baseline.heightCm) * 10) / 10;
}

function buildReferenceRows(gender: HeightGender): HeightReferenceRow[] {
  const medianByAge =
    gender === "girl"
      ? [49.1, 74.0, 86.5, 95.1, 101.8, 108.4, 114.0, 119.3, 124.1, 129.0, 134.0, 139.0, 145.0, 152.0, 157.0, 160.5, 162.0, 162.5, 162.5]
      : [49.9, 76.5, 88.5, 96.8, 102.9, 108.6, 114.6, 120.0, 125.5, 130.8, 136.0, 140.6, 145.2, 150.0, 155.6, 161.0, 170.0, 171.4, 171.4];

  return medianByAge.map((median, age) => {
    const spread = age <= 2 ? 3.8 : age <= 9 ? 5.0 : age <= 14 ? 6.4 : 6.9;
    return {
      age,
      minus2Sd: Math.round((median - spread * 2) * 10) / 10,
      minus1Sd: Math.round((median - spread) * 10) / 10,
      median: Math.round(median * 10) / 10,
      plus1Sd: Math.round((median + spread) * 10) / 10,
      plus2Sd: Math.round((median + spread * 2) * 10) / 10,
    };
  });
}

function calculateProfileCompletion(profile: HeightProfile): number {
  const fields = [
    profile.childName.trim().length > 0,
    profile.gender !== "unknown",
    profile.birthday.length > 0,
    profile.currentHeightCm !== null,
    profile.currentWeightKg !== null,
    profile.targetHeightCm !== null,
    profile.motherHeightCm !== null,
    profile.fatherHeightCm !== null,
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

function summarizeWeeklyCheckIn(checkIns: HeightGrowthCheckIn[], today: string): { completedDays: number; score: number } {
  const windowRows = checkIns.filter((item) => {
    const days = diffDays(today, item.dateKey);
    return days !== null && days >= 0 && days < 7;
  });

  const completedDays = windowRows.filter((item) => {
    const completedMetrics = [item.sleepHours, item.jumpRopeMinutes, item.milkMl, item.vitaminDMinutes].filter(
      (value) => value !== null && value > 0,
    ).length;
    return completedMetrics >= 2;
  }).length;

  const score = Math.round((completedDays / 7) * 100);
  return { completedDays, score };
}

const HUB_CARDS: Array<{ id: HeightScreenView; title: string; description: string; icon: string; tone: string }> = [
  {
    id: "assessment",
    title: "看评测",
    description: "身高评测与预测报告",
    icon: "📄",
    tone: "mint",
  },
  {
    id: "checkin",
    title: "助长打卡",
    description: "睡眠、跳绳、奶量、维D",
    icon: "🫀",
    tone: "green",
  },
  {
    id: "record",
    title: "记身高",
    description: "身高体重记录与历史",
    icon: "📏",
    tone: "blue",
  },
  {
    id: "profile",
    title: "完善资料",
    description: "孩子与父母身高信息",
    icon: "👤",
    tone: "orange",
  },
];

export function HeightManagementScreen({ state, today, onBack, onChangeState, onShowNotice }: HeightManagementScreenProps) {
  const [view, setView] = useState<HeightScreenView>("hub");
  const [chartMetric, setChartMetric] = useState<HeightChartMetric>("height");
  const [profileDraft, setProfileDraft] = useState<HeightProfileDraft>(() => createProfileDraft(state.profile));
  const [recordDraft, setRecordDraft] = useState<HeightRecordDraft>(() => createRecordDraft(today));
  const [checkInDraft, setCheckInDraft] = useState<HeightCheckInDraft>(() => createCheckInDraft(today));

  const profileCompletion = calculateProfileCompletion(state.profile);
  const latestRecord = state.records[0] ?? null;
  const latestHeight = latestRecord?.heightCm ?? state.profile.currentHeightCm;
  const latestWeight = latestRecord?.weightKg ?? state.profile.currentWeightKg;
  const ageYears = calculateAgeYears(state.profile.birthday, today);
  const parentalTarget = calculateParentalTargetHeight(state.profile);
  const targetHeight = state.profile.targetHeightCm ?? parentalTarget;
  const halfYearGrowth = calculateGrowth(state.records, 180);
  const oneYearGrowth = calculateGrowth(state.records, 360);
  const weekSummary = summarizeWeeklyCheckIn(state.checkIns, today);
  const trendPoints = useMemo(() => buildTrendPoints(state.records, chartMetric), [state.records, chartMetric]);
  const trendPolyline = trendPoints.length > 1 ? buildPolyline(trendPoints) : "";
  const referenceRows = useMemo(() => buildReferenceRows(state.profile.gender), [state.profile.gender]);
  const staticAdultHeight =
    targetHeight !== null
      ? targetHeight
      : latestHeight !== null && ageYears !== null
        ? Math.round((latestHeight + Math.max(0, 18 - ageYears) * 2.2) * 10) / 10
        : null;
  const dynamicAdultHeight =
    latestHeight !== null && ageYears !== null && oneYearGrowth !== null
      ? Math.round((latestHeight + Math.max(0, 18 - ageYears) * (oneYearGrowth / 12) * 7.5) * 10) / 10
      : null;

  const roundedTargetRange =
    targetHeight !== null ? `${formatNumber(targetHeight - 5, 1)}cm - ${formatNumber(targetHeight + 5, 1)}cm` : "--";
  const heightGap = targetHeight !== null && latestHeight !== null ? Math.round((latestHeight - targetHeight) * 10) / 10 : null;
  const dataReady = latestHeight !== null && (targetHeight !== null || parentalTarget !== null);

  function openView(nextView: HeightScreenView): void {
    if (nextView === "profile") {
      setProfileDraft(createProfileDraft(state.profile));
    }
    if (nextView === "record") {
      setRecordDraft(createRecordDraft(today));
      setChartMetric("height");
    }
    if (nextView === "checkin") {
      setCheckInDraft(createCheckInDraft(today));
    }
    setView(nextView);
  }

  function closeSubView(): void {
    setView("hub");
  }

  function updateProfileDraft(field: keyof HeightProfileDraft, value: string): void {
    setProfileDraft((current) => ({ ...current, [field]: value }));
  }

  function updateRecordDraft(field: keyof HeightRecordDraft, value: string): void {
    setRecordDraft((current) => ({ ...current, [field]: value }));
  }

  function updateCheckInDraft(field: keyof HeightCheckInDraft, value: string): void {
    setCheckInDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const childName = profileDraft.childName.trim();
    if (childName.length === 0) {
      onShowNotice("请先填写宝宝昵称。");
      return;
    }

    const profile: HeightProfile = {
      childName,
      gender: profileDraft.gender,
      birthday: profileDraft.birthday,
      currentHeightCm: parseOptionalPositiveDecimal(profileDraft.currentHeightCm),
      currentWeightKg: parseOptionalPositiveDecimal(profileDraft.currentWeightKg),
      targetHeightCm: parseOptionalPositiveDecimal(profileDraft.targetHeightCm),
      motherHeightCm: parseOptionalPositiveDecimal(profileDraft.motherHeightCm),
      fatherHeightCm: parseOptionalPositiveDecimal(profileDraft.fatherHeightCm),
      updatedAt: new Date().toISOString(),
    };

    onChangeState({
      ...state,
      profile,
    });
    onShowNotice("资料已保存。");
    setView("hub");
  }

  function handleSaveRecord(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!isDateKey(recordDraft.dateKey)) {
      onShowNotice("请填写有效的记录日期。");
      return;
    }

    const heightCm = parseOptionalPositiveDecimal(recordDraft.heightCm);
    const weightKg = parseOptionalPositiveDecimal(recordDraft.weightKg);
    if (heightCm === null && weightKg === null) {
      onShowNotice("请至少填写身高或体重。");
      return;
    }

    const nextRecord: HeightMeasurementRecord = {
      id: createLocalUiId("height-record"),
      dateKey: recordDraft.dateKey,
      heightCm,
      weightKg,
      photoUrl: recordDraft.photoUrl.trim(),
      note: recordDraft.note.trim(),
      createdAt: new Date().toISOString(),
    };

    onChangeState({
      ...state,
      profile: {
        ...state.profile,
        currentHeightCm: heightCm ?? state.profile.currentHeightCm,
        currentWeightKg: weightKg ?? state.profile.currentWeightKg,
        updatedAt: new Date().toISOString(),
      },
      records: sortRowsByDateDesc([nextRecord, ...state.records]),
    });

    setRecordDraft(createRecordDraft(today));
    onShowNotice("测量记录已保存。");
  }

  function handleDeleteRecord(recordId: string): void {
    if (!window.confirm("确定删除这条测量记录吗？")) {
      return;
    }

    onChangeState({
      ...state,
      records: state.records.filter((record) => record.id !== recordId),
    });
    onShowNotice("已删除测量记录。");
  }

  function handleSaveCheckIn(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!isDateKey(checkInDraft.dateKey)) {
      onShowNotice("请填写有效的打卡日期。");
      return;
    }

    const sleepHours = parseOptionalNonNegativeDecimal(checkInDraft.sleepHours);
    const jumpRopeMinutes = parseOptionalNonNegativeDecimal(checkInDraft.jumpRopeMinutes);
    const milkMl = parseOptionalNonNegativeDecimal(checkInDraft.milkMl);
    const vitaminDMinutes = parseOptionalNonNegativeDecimal(checkInDraft.vitaminDMinutes);
    const hasAnyMetric = [sleepHours, jumpRopeMinutes, milkMl, vitaminDMinutes].some((value) => value !== null && value > 0);
    if (!hasAnyMetric) {
      onShowNotice("请至少填写一个助长指标。");
      return;
    }

    const nextCheckIn: HeightGrowthCheckIn = {
      id: createLocalUiId("height-checkin"),
      dateKey: checkInDraft.dateKey,
      sleepHours,
      jumpRopeMinutes,
      milkMl,
      vitaminDMinutes,
      note: checkInDraft.note.trim(),
      createdAt: new Date().toISOString(),
    };

    onChangeState({
      ...state,
      checkIns: sortRowsByDateDesc([nextCheckIn, ...state.checkIns]),
    });
    setCheckInDraft(createCheckInDraft(today));
    onShowNotice("助长打卡已保存。");
  }

  function handleDeleteCheckIn(checkInId: string): void {
    if (!window.confirm("确定删除这条助长打卡记录吗？")) {
      return;
    }
    onChangeState({
      ...state,
      checkIns: state.checkIns.filter((row) => row.id !== checkInId),
    });
    onShowNotice("已删除助长打卡。");
  }

  if (view === "hub") {
    return (
      <div className="height-page">
        <header className="height-hero">
          <button type="button" className="height-back-button" onClick={onBack} aria-label="返回其他功能">
            ←
          </button>
          <div className="height-hero-copy">
            <h1>身高管理</h1>
            <p>真正的生长记录</p>
          </div>
        </header>

        <section className="height-hub-grid">
          {HUB_CARDS.map((card) => (
            <button key={card.id} type="button" className="height-hub-card" onClick={() => openView(card.id)}>
              <span className={`height-hub-icon tone-${card.tone}`}>{card.icon}</span>
              <strong>{card.title}</strong>
              <p>{card.description}</p>
            </button>
          ))}
        </section>
      </div>
    );
  }

  if (view === "profile") {
    return (
      <div className="height-page height-page-detail">
        <header className="height-subhead">
          <button type="button" className="height-sub-back" onClick={closeSubView} aria-label="返回身高管理">
            ←
          </button>
          <div>
            <h1>完善资料</h1>
            <p>资料完成度 {profileCompletion}%</p>
          </div>
        </header>

        <form className="height-card height-form-card" onSubmit={handleSaveProfile}>
          <div className="height-form-grid">
            <label className="height-form-field is-full">
              宝宝昵称
              <input
                value={profileDraft.childName}
                onChange={(event) => updateProfileDraft("childName", event.target.value)}
                placeholder="请输入昵称"
                maxLength={24}
                required
              />
            </label>

            <div className="height-form-field is-full">
              宝宝性别
              <div className="height-gender-group">
                <button
                  type="button"
                  className={`height-gender-button${profileDraft.gender === "boy" ? " is-active" : ""}`}
                  onClick={() => updateProfileDraft("gender", "boy")}
                >
                  小王子
                </button>
                <button
                  type="button"
                  className={`height-gender-button${profileDraft.gender === "girl" ? " is-active" : ""}`}
                  onClick={() => updateProfileDraft("gender", "girl")}
                >
                  小公主
                </button>
              </div>
            </div>

            <label className="height-form-field is-full">
              宝宝生日
              <input type="date" value={profileDraft.birthday} onChange={(event) => updateProfileDraft("birthday", event.target.value)} />
            </label>

            <label className="height-form-field">
              当前身高 (cm)
              <input
                value={profileDraft.currentHeightCm}
                onChange={(event) => updateProfileDraft("currentHeightCm", event.target.value)}
                placeholder="例如 125.4"
                inputMode="decimal"
              />
            </label>

            <label className="height-form-field">
              当前体重 (kg)
              <input
                value={profileDraft.currentWeightKg}
                onChange={(event) => updateProfileDraft("currentWeightKg", event.target.value)}
                placeholder="例如 24.3"
                inputMode="decimal"
              />
            </label>

            <label className="height-form-field is-full">
              理想身高 (cm)
              <input
                value={profileDraft.targetHeightCm}
                onChange={(event) => updateProfileDraft("targetHeightCm", event.target.value)}
                placeholder="例如 178"
                inputMode="decimal"
              />
            </label>
          </div>

          <div className="height-subsection">
            <h2>父母身高</h2>
            <div className="height-form-grid">
              <label className="height-form-field">
                母亲身高 (cm)
                <input
                  value={profileDraft.motherHeightCm}
                  onChange={(event) => updateProfileDraft("motherHeightCm", event.target.value)}
                  placeholder="例如 165"
                  inputMode="decimal"
                />
              </label>
              <label className="height-form-field">
                父亲身高 (cm)
                <input
                  value={profileDraft.fatherHeightCm}
                  onChange={(event) => updateProfileDraft("fatherHeightCm", event.target.value)}
                  placeholder="例如 175"
                  inputMode="decimal"
                />
              </label>
            </div>
          </div>

          <button type="submit" className="height-primary-button">
            保存并继续
          </button>
        </form>
      </div>
    );
  }

  if (view === "record") {
    return (
      <div className="height-page height-page-detail">
        <header className="height-subhead">
          <button type="button" className="height-sub-back" onClick={closeSubView} aria-label="返回身高管理">
            ←
          </button>
          <div>
            <h1>记身高</h1>
            <p>录入身高体重与历史记录</p>
          </div>
        </header>

        <form className="height-card height-form-card" onSubmit={handleSaveRecord}>
          <div className="height-form-grid">
            <label className="height-form-field is-full">
              记录日期
              <input type="date" value={recordDraft.dateKey} onChange={(event) => updateRecordDraft("dateKey", event.target.value)} required />
            </label>
            <label className="height-form-field">
              本次身高 (cm)
              <input
                value={recordDraft.heightCm}
                onChange={(event) => updateRecordDraft("heightCm", event.target.value)}
                placeholder="例如 125.4"
                inputMode="decimal"
              />
            </label>
            <label className="height-form-field">
              本次体重 (kg)
              <input
                value={recordDraft.weightKg}
                onChange={(event) => updateRecordDraft("weightKg", event.target.value)}
                placeholder="例如 23.8"
                inputMode="decimal"
              />
            </label>
            <label className="height-form-field is-full">
              测量照片 URL（可选）
              <input
                value={recordDraft.photoUrl}
                onChange={(event) => updateRecordDraft("photoUrl", event.target.value)}
                placeholder="后续支持直接上传"
              />
            </label>
            <label className="height-form-field is-full">
              备注（可选）
              <textarea
                value={recordDraft.note}
                onChange={(event) => updateRecordDraft("note", event.target.value)}
                placeholder="例如 晨起测量"
                maxLength={160}
              />
            </label>
          </div>
          <button type="submit" className="height-primary-button">
            保存
          </button>
        </form>

        <section className="height-card height-chart-card">
          <div className="height-card-head">
            <h2>趋势图表</h2>
            <div className="height-segmented">
              <button
                type="button"
                className={`height-segment-button${chartMetric === "height" ? " is-active" : ""}`}
                onClick={() => setChartMetric("height")}
              >
                身高
              </button>
              <button
                type="button"
                className={`height-segment-button${chartMetric === "weight" ? " is-active" : ""}`}
                onClick={() => setChartMetric("weight")}
              >
                体重
              </button>
            </div>
          </div>
          {trendPoints.length > 1 ? (
            <div className="height-chart-shell">
              <svg viewBox="0 0 100 100" role="img" aria-label={`${chartMetric === "height" ? "身高" : "体重"}趋势`}>
                <polyline points={trendPolyline} className="height-chart-line" />
                {trendPoints.map((point, index) => {
                  const values = trendPoints.map((row) => row.value);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const range = Math.max(1, max - min);
                  const total = Math.max(1, trendPoints.length - 1);
                  const x = 10 + (index / total) * 80;
                  const y = 86 - ((point.value - min) / range) * 68;
                  return <circle key={point.id} cx={x} cy={y} r="1.8" className="height-chart-dot" />;
                })}
              </svg>
              <div className="height-chart-axis">
                <span>{formatDateLabel(trendPoints[0].dateKey)}</span>
                <span>{formatDateLabel(trendPoints[trendPoints.length - 1].dateKey)}</span>
              </div>
            </div>
          ) : (
            <p className="height-muted-copy">记录两次以上数据后，将自动生成趋势图。</p>
          )}
        </section>

        <section className="height-card">
          <div className="height-card-head">
            <h2>历史记录</h2>
          </div>
          {state.records.length > 0 ? (
            <ul className="height-record-list">
              {state.records.map((record) => (
                <li key={record.id} className="height-record-row">
                  <div>
                    <strong>{formatDateLabel(record.dateKey)}</strong>
                    <p>
                      身高 {formatNumber(record.heightCm, 1)} cm · 体重 {formatNumber(record.weightKg, 1)} kg
                    </p>
                    <small>{record.note.trim().length > 0 ? record.note : "未填写备注"}</small>
                  </div>
                  <button type="button" className="height-row-action" onClick={() => handleDeleteRecord(record.id)}>
                    删除
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="height-muted-copy">暂无记录，先添加一次测量吧。</p>
          )}
        </section>
      </div>
    );
  }

  if (view === "checkin") {
    return (
      <div className="height-page height-page-detail">
        <header className="height-subhead">
          <button type="button" className="height-sub-back" onClick={closeSubView} aria-label="返回身高管理">
            ←
          </button>
          <div>
            <h1>助长打卡</h1>
            <p>记录睡眠、运动与营养习惯</p>
          </div>
        </header>

        <form className="height-card height-form-card" onSubmit={handleSaveCheckIn}>
          <div className="height-form-grid">
            <label className="height-form-field is-full">
              打卡日期
              <input type="date" value={checkInDraft.dateKey} onChange={(event) => updateCheckInDraft("dateKey", event.target.value)} required />
            </label>
            <label className="height-form-field">
              睡眠时长 (h)
              <input
                value={checkInDraft.sleepHours}
                onChange={(event) => updateCheckInDraft("sleepHours", event.target.value)}
                placeholder="例如 9"
                inputMode="decimal"
              />
            </label>
            <label className="height-form-field">
              跳绳 (min)
              <input
                value={checkInDraft.jumpRopeMinutes}
                onChange={(event) => updateCheckInDraft("jumpRopeMinutes", event.target.value)}
                placeholder="例如 20"
                inputMode="decimal"
              />
            </label>
            <label className="height-form-field">
              奶量 (ml)
              <input
                value={checkInDraft.milkMl}
                onChange={(event) => updateCheckInDraft("milkMl", event.target.value)}
                placeholder="例如 250"
                inputMode="decimal"
              />
            </label>
            <label className="height-form-field">
              户外晒太阳 (min)
              <input
                value={checkInDraft.vitaminDMinutes}
                onChange={(event) => updateCheckInDraft("vitaminDMinutes", event.target.value)}
                placeholder="例如 30"
                inputMode="decimal"
              />
            </label>
            <label className="height-form-field is-full">
              备注（可选）
              <textarea
                value={checkInDraft.note}
                onChange={(event) => updateCheckInDraft("note", event.target.value)}
                placeholder="记录当日作息、食欲或状态变化"
                maxLength={160}
              />
            </label>
          </div>
          <button type="submit" className="height-primary-button">
            保存打卡
          </button>
        </form>

        <section className="height-card height-checkin-summary">
          <h2>近 7 天完成情况</h2>
          <div className="height-checkin-summary-grid">
            <article>
              <strong>{weekSummary.completedDays} / 7</strong>
              <p>完成天数</p>
            </article>
            <article>
              <strong>{weekSummary.score}%</strong>
              <p>习惯完成率</p>
            </article>
          </div>
        </section>

        <section className="height-card">
          <div className="height-card-head">
            <h2>打卡历史</h2>
          </div>
          {state.checkIns.length > 0 ? (
            <ul className="height-record-list">
              {state.checkIns.map((row) => (
                <li key={row.id} className="height-record-row">
                  <div>
                    <strong>{formatDateLabel(row.dateKey)}</strong>
                    <p>
                      睡眠 {formatNumber(row.sleepHours, 1)}h · 跳绳 {formatNumber(row.jumpRopeMinutes, 0)}min · 奶量 {formatNumber(row.milkMl, 0)}ml · 维D{" "}
                      {formatNumber(row.vitaminDMinutes, 0)}min
                    </p>
                    <small>{row.note.trim().length > 0 ? row.note : "未填写备注"}</small>
                  </div>
                  <button type="button" className="height-row-action" onClick={() => handleDeleteCheckIn(row.id)}>
                    删除
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="height-muted-copy">还没有助长打卡记录。</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="height-page height-page-detail">
      <header className="height-subhead">
        <button type="button" className="height-sub-back" onClick={closeSubView} aria-label="返回身高管理">
          ←
        </button>
        <div>
          <h1>看评测</h1>
          <p>评估与预测报告</p>
        </div>
      </header>

      <section className="height-card">
        <div className="height-card-head">
          <h2>当前评估</h2>
        </div>
        <div className="height-assess-grid">
          <article className="height-assess-metric">
            <span>目标区间</span>
            <strong>{roundedTargetRange}</strong>
          </article>
          <article className="height-assess-metric">
            <span>当前状态</span>
            <strong>{dataReady ? (heightGap !== null && heightGap >= 0 ? `高于预期 ${formatNumber(heightGap, 1)}cm` : `低于预期 ${formatNumber(heightGap, 1)}cm`) : "资料不足"}</strong>
          </article>
          <article className="height-assess-metric">
            <span>当前身高</span>
            <strong>{formatNumber(latestHeight, 1)}cm</strong>
          </article>
          <article className="height-assess-metric">
            <span>当前体重</span>
            <strong>{formatNumber(latestWeight, 1)}kg</strong>
          </article>
        </div>
        <p className="height-muted-copy">标准参考：WS/T 423-2022 与 WS/T 612-2018，本地版以持续记录趋势为主。</p>
      </section>

      <section className="height-card">
        <h2>基础评估</h2>
        <p className="height-muted-copy">
          {ageYears !== null ? `当前年龄约 ${ageYears} 岁。` : "先补充生日可得到更准确年龄分层。"}
          {parentalTarget !== null ? ` 按父母身高估算遗传靶高约 ${formatNumber(parentalTarget, 1)}cm。` : " 补充父母身高后可生成遗传靶高。"}
        </p>
      </section>

      <section className="height-card">
        <div className="height-card-head">
          <h2>实测 & 遗传参考曲线</h2>
        </div>
        {trendPoints.length > 1 ? (
          <div className="height-chart-shell">
            <svg viewBox="0 0 100 100" role="img" aria-label="实测趋势与遗传参考">
              <polyline points={buildPolyline(buildTrendPoints(state.records, "height"))} className="height-chart-line" />
              {targetHeight !== null ? <line x1="10" y1="35" x2="90" y2="35" className="height-target-line" /> : null}
            </svg>
          </div>
        ) : (
          <p className="height-muted-copy">对照曲线需要至少两次身高实测记录。</p>
        )}
      </section>

      <section className="height-card height-assess-grid-card">
        <h2>增量对比</h2>
        <div className="height-assess-grid">
          <article className="height-assess-metric">
            <span>近半年增量</span>
            <strong>{halfYearGrowth !== null ? `${formatNumber(halfYearGrowth, 1)}cm` : "--"}</strong>
          </article>
          <article className="height-assess-metric">
            <span>近一年增量</span>
            <strong>{oneYearGrowth !== null ? `${formatNumber(oneYearGrowth, 1)}cm` : "--"}</strong>
          </article>
        </div>
      </section>

      <section className="height-card">
        <h2>成年身高预测</h2>
        <div className="height-assess-grid">
          <article className="height-assess-metric">
            <span>常规静态预测</span>
            <strong>{staticAdultHeight !== null ? `${formatNumber(staticAdultHeight, 1)}cm` : "--"}</strong>
          </article>
          <article className="height-assess-metric">
            <span>动态趋势预测</span>
            <strong>{dynamicAdultHeight !== null ? `${formatNumber(dynamicAdultHeight, 1)}cm` : "--"}</strong>
          </article>
        </div>
      </section>

      <section className="height-card">
        <div className="height-card-head">
          <h2>身高对照表（{state.profile.gender === "girl" ? "女生" : "男生/未选"}）</h2>
        </div>
        <div className="height-reference-table-wrap">
          <table className="height-reference-table">
            <thead>
              <tr>
                <th>年龄</th>
                <th>-2SD</th>
                <th>-1SD</th>
                <th>中位数</th>
                <th>1SD</th>
                <th>2SD</th>
              </tr>
            </thead>
            <tbody>
              {referenceRows.map((row) => (
                <tr key={row.age}>
                  <td>{row.age}岁</td>
                  <td>{row.minus2Sd}</td>
                  <td>{row.minus1Sd}</td>
                  <td>{row.median}</td>
                  <td>{row.plus1Sd}</td>
                  <td>{row.plus2Sd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="height-card">
        <h2>专家建议</h2>
        <p className="height-muted-copy">
          每月固定时间记录一次；确保睡眠、蛋白质与户外活动稳定；若连续 3-6 个月增速明显偏低，建议结合医生评估骨龄和营养方案。
        </p>
      </section>
    </div>
  );
}
