export const HEIGHT_MANAGEMENT_STORAGE_KEY = "xiuxiuzhushou_height_management_v1";

export type HeightGender = "boy" | "girl" | "unknown";

export interface HeightProfile {
  childName: string;
  gender: HeightGender;
  birthday: string;
  currentHeightCm: number | null;
  currentWeightKg: number | null;
  targetHeightCm: number | null;
  motherHeightCm: number | null;
  fatherHeightCm: number | null;
  updatedAt: string;
}

export interface HeightMeasurementRecord {
  id: string;
  dateKey: string;
  heightCm: number | null;
  weightKg: number | null;
  photoUrl: string;
  note: string;
  createdAt: string;
}

export interface HeightGrowthCheckIn {
  id: string;
  dateKey: string;
  sleepHours: number | null;
  jumpRopeMinutes: number | null;
  milkMl: number | null;
  vitaminDMinutes: number | null;
  note: string;
  createdAt: string;
}

export interface HeightManagementState {
  profile: HeightProfile;
  records: HeightMeasurementRecord[];
  checkIns: HeightGrowthCheckIn[];
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function normalizeOptionalNonNegative(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function normalizeOptionalPositive(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function normalizeGender(value: unknown): HeightGender {
  if (value === "boy" || value === "girl" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function normalizeProfile(value: unknown): HeightProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  if (
    typeof source.childName !== "string" ||
    typeof source.birthday !== "string" ||
    !isIsoDate(source.updatedAt)
  ) {
    return null;
  }

  return {
    childName: source.childName,
    gender: normalizeGender(source.gender),
    birthday: isDateKey(source.birthday) ? source.birthday : "",
    currentHeightCm: normalizeOptionalPositive(source.currentHeightCm),
    currentWeightKg: normalizeOptionalPositive(source.currentWeightKg),
    targetHeightCm: normalizeOptionalPositive(source.targetHeightCm),
    motherHeightCm: normalizeOptionalPositive(source.motherHeightCm),
    fatherHeightCm: normalizeOptionalPositive(source.fatherHeightCm),
    updatedAt: source.updatedAt,
  };
}

function normalizeMeasurementRecord(value: unknown): HeightMeasurementRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  if (
    typeof source.id !== "string" ||
    !isDateKey(source.dateKey) ||
    typeof source.photoUrl !== "string" ||
    typeof source.note !== "string" ||
    !isIsoDate(source.createdAt)
  ) {
    return null;
  }

  const heightCm = normalizeOptionalPositive(source.heightCm);
  const weightKg = normalizeOptionalPositive(source.weightKg);
  if (heightCm === null && weightKg === null) {
    return null;
  }

  return {
    id: source.id,
    dateKey: source.dateKey,
    heightCm,
    weightKg,
    photoUrl: source.photoUrl,
    note: source.note,
    createdAt: source.createdAt,
  };
}

function normalizeGrowthCheckIn(value: unknown): HeightGrowthCheckIn | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  if (
    typeof source.id !== "string" ||
    !isDateKey(source.dateKey) ||
    typeof source.note !== "string" ||
    !isIsoDate(source.createdAt)
  ) {
    return null;
  }

  return {
    id: source.id,
    dateKey: source.dateKey,
    sleepHours: normalizeOptionalNonNegative(source.sleepHours),
    jumpRopeMinutes: normalizeOptionalNonNegative(source.jumpRopeMinutes),
    milkMl: normalizeOptionalNonNegative(source.milkMl),
    vitaminDMinutes: normalizeOptionalNonNegative(source.vitaminDMinutes),
    note: source.note,
    createdAt: source.createdAt,
  };
}

function sortByDateThenCreatedAtDesc<T extends { dateKey: string; createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    if (left.dateKey === right.dateKey) {
      return right.createdAt.localeCompare(left.createdAt);
    }
    return right.dateKey.localeCompare(left.dateKey);
  });
}

export function createInitialHeightManagementState(): HeightManagementState {
  return {
    profile: {
      childName: "",
      gender: "unknown",
      birthday: "",
      currentHeightCm: null,
      currentWeightKg: null,
      targetHeightCm: null,
      motherHeightCm: null,
      fatherHeightCm: null,
      updatedAt: new Date().toISOString(),
    },
    records: [],
    checkIns: [],
  };
}

export function loadHeightManagementState(): HeightManagementState {
  if (typeof window === "undefined") {
    return createInitialHeightManagementState();
  }

  try {
    const raw = window.localStorage.getItem(HEIGHT_MANAGEMENT_STORAGE_KEY);
    if (!raw) {
      return createInitialHeightManagementState();
    }

    const parsed = JSON.parse(raw) as {
      profile?: unknown;
      records?: unknown;
      checkIns?: unknown;
    };

    const initial = createInitialHeightManagementState();
    const profile = normalizeProfile(parsed.profile) ?? initial.profile;
    const recordsSource = Array.isArray(parsed.records) ? parsed.records : [];
    const checkInsSource = Array.isArray(parsed.checkIns) ? parsed.checkIns : [];

    const records = sortByDateThenCreatedAtDesc(
      recordsSource.map(normalizeMeasurementRecord).filter((item): item is HeightMeasurementRecord => item !== null),
    );
    const checkIns = sortByDateThenCreatedAtDesc(
      checkInsSource.map(normalizeGrowthCheckIn).filter((item): item is HeightGrowthCheckIn => item !== null),
    );

    return {
      profile,
      records,
      checkIns,
    };
  } catch {
    return createInitialHeightManagementState();
  }
}

export function saveHeightManagementState(state: HeightManagementState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(HEIGHT_MANAGEMENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep UI responsive when storage quota is exceeded or unavailable.
  }
}

export function resetHeightManagementState(): HeightManagementState {
  const nextState = createInitialHeightManagementState();
  saveHeightManagementState(nextState);
  return nextState;
}
