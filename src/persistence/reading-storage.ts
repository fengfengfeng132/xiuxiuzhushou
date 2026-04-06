export const READING_JOURNEY_STORAGE_KEY = "xiuxiuzhushou_reading_journey_v1";

export type ReadingBookStatus = "wishlist" | "reading" | "finished" | "paused";
export type ReadingBookCategory = "literature" | "history" | "science" | "english" | "biography" | "other";

export interface ReadingBook {
  id: string;
  title: string;
  author: string;
  totalPages: number | null;
  category: ReadingBookCategory;
  status: ReadingBookStatus;
  coverFileName: string;
  createdAt: string;
}

export interface ReadingRecord {
  id: string;
  bookId: string;
  readDate: string;
  startPage: number | null;
  endPage: number | null;
  durationMinutes: number;
  note: string;
  createdAt: string;
}

export interface ReadingJourneyState {
  books: ReadingBook[];
  records: ReadingRecord[];
}

export const READING_BOOK_STATUS_OPTIONS: Array<{ value: ReadingBookStatus; label: string }> = [
  { value: "wishlist", label: "想读" },
  { value: "reading", label: "阅读中" },
  { value: "finished", label: "已读完" },
  { value: "paused", label: "已暂停" },
];

export const READING_BOOK_CATEGORY_OPTIONS: Array<{ value: ReadingBookCategory; label: string }> = [
  { value: "literature", label: "文学" },
  { value: "history", label: "历史" },
  { value: "science", label: "科学" },
  { value: "english", label: "英语" },
  { value: "biography", label: "传记" },
  { value: "other", label: "其他" },
];

function isReadingBookStatus(value: unknown): value is ReadingBookStatus {
  return value === "wishlist" || value === "reading" || value === "finished" || value === "paused";
}

function isReadingBookCategory(value: unknown): value is ReadingBookCategory {
  return value === "literature" || value === "history" || value === "science" || value === "english" || value === "biography" || value === "other";
}

function normalizePositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

function normalizePageNumber(value: unknown): number | null {
  if (value === null) {
    return null;
  }
  return normalizePositiveInteger(value);
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

function normalizeReadingBook(value: unknown): ReadingBook | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.title !== "string" ||
    typeof record.author !== "string" ||
    !isReadingBookCategory(record.category) ||
    !isReadingBookStatus(record.status) ||
    typeof record.coverFileName !== "string" ||
    !isIsoDate(record.createdAt)
  ) {
    return null;
  }

  return {
    id: record.id,
    title: record.title,
    author: record.author,
    totalPages: normalizePageNumber(record.totalPages),
    category: record.category,
    status: record.status,
    coverFileName: record.coverFileName,
    createdAt: record.createdAt,
  };
}

function normalizeReadingRecord(value: unknown): ReadingRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.bookId !== "string" ||
    !isDateKey(record.readDate) ||
    !isIsoDate(record.createdAt) ||
    typeof record.note !== "string"
  ) {
    return null;
  }

  const durationMinutes = normalizePositiveInteger(record.durationMinutes);
  if (durationMinutes === null) {
    return null;
  }

  const startPage = normalizePageNumber(record.startPage);
  const endPage = normalizePageNumber(record.endPage);
  if (startPage !== null && endPage !== null && endPage < startPage) {
    return null;
  }

  return {
    id: record.id,
    bookId: record.bookId,
    readDate: record.readDate,
    startPage,
    endPage,
    durationMinutes,
    note: record.note,
    createdAt: record.createdAt,
  };
}

export function createInitialReadingJourneyState(): ReadingJourneyState {
  return {
    books: [],
    records: [],
  };
}

export function loadReadingJourneyState(): ReadingJourneyState {
  if (typeof window === "undefined") {
    return createInitialReadingJourneyState();
  }

  try {
    const raw = window.localStorage.getItem(READING_JOURNEY_STORAGE_KEY);
    if (!raw) {
      return createInitialReadingJourneyState();
    }

    const parsed = JSON.parse(raw) as { books?: unknown; records?: unknown };
    const booksSource = Array.isArray(parsed.books) ? parsed.books : [];
    const recordsSource = Array.isArray(parsed.records) ? parsed.records : [];

    const books = booksSource.map(normalizeReadingBook).filter((book): book is ReadingBook => book !== null);
    const bookIds = new Set(books.map((book) => book.id));
    const records = recordsSource
      .map(normalizeReadingRecord)
      .filter((record): record is ReadingRecord => record !== null && bookIds.has(record.bookId))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      books: books.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      records,
    };
  } catch {
    return createInitialReadingJourneyState();
  }
}

export function saveReadingJourneyState(state: ReadingJourneyState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(READING_JOURNEY_STORAGE_KEY, JSON.stringify(state));
}

export function resetReadingJourneyState(): ReadingJourneyState {
  const nextState = createInitialReadingJourneyState();
  saveReadingJourneyState(nextState);
  return nextState;
}
