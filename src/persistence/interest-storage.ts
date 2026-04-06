export const INTEREST_CLASS_STORAGE_KEY = "xiuxiuzhushou_interest_classes_v1";

export interface InterestClassItem {
  id: string;
  name: string;
  totalUnits: number;
  unitLabel: string;
  note: string;
  overflowWarningEnabled: boolean;
  overflowWarningThreshold: number;
  createdAt: string;
}

export interface InterestClassRecord {
  id: string;
  classId: string;
  dateKey: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface InterestClassState {
  classes: InterestClassItem[];
  records: InterestClassRecord[];
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

function normalizePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function normalizeNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function normalizeInterestClass(value: unknown): InterestClassItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  if (
    typeof source.id !== "string" ||
    typeof source.name !== "string" ||
    typeof source.unitLabel !== "string" ||
    typeof source.note !== "string" ||
    !isIsoDate(source.createdAt)
  ) {
    return null;
  }

  const totalUnits = normalizePositiveNumber(source.totalUnits);
  if (totalUnits === null) {
    return null;
  }

  return {
    id: source.id,
    name: source.name,
    totalUnits,
    unitLabel: source.unitLabel,
    note: source.note,
    overflowWarningEnabled: source.overflowWarningEnabled === true,
    overflowWarningThreshold: normalizeNonNegativeNumber(source.overflowWarningThreshold) ?? 0,
    createdAt: source.createdAt,
  };
}

function normalizeInterestClassRecord(value: unknown): InterestClassRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  if (
    typeof source.id !== "string" ||
    typeof source.classId !== "string" ||
    !isDateKey(source.dateKey) ||
    typeof source.note !== "string" ||
    !isIsoDate(source.createdAt)
  ) {
    return null;
  }

  const amount = normalizePositiveNumber(source.amount);
  if (amount === null) {
    return null;
  }

  return {
    id: source.id,
    classId: source.classId,
    dateKey: source.dateKey,
    amount,
    note: source.note,
    createdAt: source.createdAt,
  };
}

export function createInitialInterestClassState(): InterestClassState {
  return {
    classes: [],
    records: [],
  };
}

export function loadInterestClassState(): InterestClassState {
  if (typeof window === "undefined") {
    return createInitialInterestClassState();
  }

  try {
    const raw = window.localStorage.getItem(INTEREST_CLASS_STORAGE_KEY);
    if (!raw) {
      return createInitialInterestClassState();
    }

    const parsed = JSON.parse(raw) as { classes?: unknown; records?: unknown };
    const classesSource = Array.isArray(parsed.classes) ? parsed.classes : [];
    const recordsSource = Array.isArray(parsed.records) ? parsed.records : [];

    const classes = classesSource
      .map(normalizeInterestClass)
      .filter((item): item is InterestClassItem => item !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const classIds = new Set(classes.map((item) => item.id));
    const records = recordsSource
      .map(normalizeInterestClassRecord)
      .filter((item): item is InterestClassRecord => item !== null && classIds.has(item.classId))
      .sort((left, right) => {
        if (left.dateKey === right.dateKey) {
          return right.createdAt.localeCompare(left.createdAt);
        }
        return right.dateKey.localeCompare(left.dateKey);
      });

    return {
      classes,
      records,
    };
  } catch {
    return createInitialInterestClassState();
  }
}

export function saveInterestClassState(state: InterestClassState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(INTEREST_CLASS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep UI responsive when storage quota is exceeded or unavailable.
  }
}

export function resetInterestClassState(): InterestClassState {
  const nextState = createInitialInterestClassState();
  saveInterestClassState(nextState);
  return nextState;
}
