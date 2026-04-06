import type { FormEvent } from "react";
import { currentDateKey } from "../../domain/model.js";
import {
  READING_BOOK_CATEGORY_OPTIONS,
  READING_BOOK_STATUS_OPTIONS,
  type ReadingBook,
  type ReadingBookCategory,
  type ReadingBookStatus,
  type ReadingRecord,
} from "../../persistence/reading-storage.js";

export type ReadingFilterStatus = "all" | ReadingBookStatus;
export type ReadingFilterCategory = "all" | ReadingBookCategory;

export interface ReadingBookDraft {
  title: string;
  author: string;
  totalPages: string;
  category: ReadingBookCategory;
  status: ReadingBookStatus;
  coverFileName: string;
}

export interface ReadingRecordDraft {
  bookId: string;
  readDate: string;
  startPage: string;
  endPage: string;
  durationMinutes: string;
  note: string;
}

export function createInitialReadingBookDraft(): ReadingBookDraft {
  return {
    title: "",
    author: "",
    totalPages: "",
    category: "other",
    status: "reading",
    coverFileName: "",
  };
}

export function createInitialReadingRecordDraft(bookId: string = "", dateKey: string = currentDateKey()): ReadingRecordDraft {
  return {
    bookId,
    readDate: dateKey,
    startPage: "",
    endPage: "",
    durationMinutes: "30",
    note: "",
  };
}

export function getReadingBookStatusLabel(status: ReadingBookStatus): string {
  return READING_BOOK_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? "阅读中";
}

export function getReadingBookCategoryLabel(category: ReadingBookCategory): string {
  return READING_BOOK_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? "其他";
}

function getBookRecords(records: ReadingRecord[], bookId: string): ReadingRecord[] {
  return records.filter((record) => record.bookId === bookId);
}

function getBookLatestEndPage(records: ReadingRecord[]): number {
  return records.reduce((max, record) => Math.max(max, record.endPage ?? record.startPage ?? 0), 0);
}

function getBookMinutes(records: ReadingRecord[]): number {
  return records.reduce((sum, record) => sum + record.durationMinutes, 0);
}

function getBookNoteCount(records: ReadingRecord[]): number {
  return records.filter((record) => record.note.trim().length > 0).length;
}

function formatBookProgress(book: ReadingBook, records: ReadingRecord[]): string {
  const latestPage = getBookLatestEndPage(records);
  if (book.totalPages) {
    return `${Math.min(latestPage, book.totalPages)}/${book.totalPages}`;
  }
  if (latestPage > 0) {
    return `${latestPage}页`;
  }
  return "0页";
}

function formatMinutesAsHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

function formatMonthDay(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) {
    return dateKey;
  }
  return `${month}-${String(day).padStart(2, "0")}`;
}

function shiftDateKey(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  return currentDateKey(date.toISOString());
}

interface ReadingJourneyScreenProps {
  today: string;
  books: ReadingBook[];
  records: ReadingRecord[];
  search: string;
  statusFilter: ReadingFilterStatus;
  categoryFilter: ReadingFilterCategory;
  onBack: () => void;
  onOpenFlowTab: () => void;
  onOpenStatsTab: () => void;
  onOpenSyncTab: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ReadingFilterStatus) => void;
  onCategoryFilterChange: (value: ReadingFilterCategory) => void;
  onOpenAddBook: () => void;
  onOpenAddRecord: (bookId?: string) => void;
  onOpenBookDetail: (bookId: string) => void;
  onOpenEditBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
}

export function ReadingJourneyScreen({
  today,
  books,
  records,
  search,
  statusFilter,
  categoryFilter,
  onBack,
  onOpenFlowTab,
  onOpenStatsTab,
  onOpenSyncTab,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onOpenAddBook,
  onOpenAddRecord,
  onOpenBookDetail,
  onOpenEditBook,
  onDeleteBook,
}: ReadingJourneyScreenProps) {
  const keyword = search.trim().toLowerCase();
  const filteredBooks = books.filter((book) => {
    const matchedKeyword =
      keyword.length === 0 ||
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword) ||
      getReadingBookCategoryLabel(book.category).toLowerCase().includes(keyword);
    const matchedStatus = statusFilter === "all" || book.status === statusFilter;
    const matchedCategory = categoryFilter === "all" || book.category === categoryFilter;
    return matchedKeyword && matchedStatus && matchedCategory;
  });

  const orderedRecentRecords = [...records].sort((left, right) => {
    if (left.readDate === right.readDate) {
      return right.createdAt.localeCompare(left.createdAt);
    }
    return right.readDate.localeCompare(left.readDate);
  });
  const recentRecords = orderedRecentRecords.slice(0, 6);

  const totalReadMinutes = records.reduce((sum, record) => sum + record.durationMinutes, 0);
  const totalBooks = books.length;
  const activeBooks = books.filter((book) => book.status === "reading").length;
  const notesCount = records.filter((record) => record.note.trim().length > 0).length;

  const trendDays = Array.from({ length: 7 }, (_item, index) => shiftDateKey(today, index - 6)).map((dateKey) => {
    const dayRecords = records.filter((record) => record.readDate === dateKey);
    return {
      dateKey,
      count: dayRecords.length,
      minutes: dayRecords.reduce((sum, record) => sum + record.durationMinutes, 0),
    };
  });
  const maxTrendMinutes = Math.max(...trendDays.map((item) => item.minutes), 1);
  const trendPolyline = trendDays
    .map((item, index) => {
      const x = trendDays.length <= 1 ? 0 : Math.round((index / (trendDays.length - 1)) * 10000) / 100;
      const y = Math.round((1 - item.minutes / maxTrendMinutes) * 10000) / 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="reading-page">
      <header className="reading-hero">
        <button type="button" className="reading-back-button" onClick={onBack} aria-label="返回">
          ←
        </button>
        <div className="reading-hero-copy">
          <h1>我的阅读</h1>
          <p>READING JOURNEY</p>
        </div>
        <nav className="reading-hero-tabs" aria-label="阅读页面导航">
          <button type="button" className="reading-hero-tab is-active" onClick={onOpenFlowTab}>
            流水
          </button>
          <button type="button" className="reading-hero-tab" onClick={onOpenStatsTab}>
            统计分析
          </button>
          <button type="button" className="reading-hero-tab" onClick={onOpenSyncTab}>
            同步图书
          </button>
        </nav>
        <button type="button" className="reading-primary-button" onClick={onOpenAddBook}>
          + 新增书籍
        </button>
      </header>

      <section className="reading-summary-card">
        <h2>数据概览</h2>
        <div className="reading-summary-grid">
          <article className="reading-summary-item">
            <span>总书本数</span>
            <strong>{totalBooks}</strong>
            <small>📘</small>
          </article>
          <article className="reading-summary-item">
            <span>正在阅读</span>
            <strong>{activeBooks}</strong>
            <small>✅</small>
          </article>
          <article className="reading-summary-item">
            <span>累计时长</span>
            <strong>{formatMinutesAsHours(totalReadMinutes)}</strong>
            <small>⏰</small>
          </article>
          <article className="reading-summary-item">
            <span>笔记次数</span>
            <strong>{notesCount}</strong>
            <small>📝</small>
          </article>
        </div>
      </section>

      <div className="reading-main-grid">
        <section className="reading-library-card">
          <div className="reading-toolbar">
            <label className="reading-search-field">
              <span>📖</span>
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="搜索书名、作者或分类..."
                aria-label="搜索书籍"
              />
            </label>
            <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as ReadingFilterStatus)} aria-label="按状态筛选">
              <option value="all">所有状态</option>
              {READING_BOOK_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value as ReadingFilterCategory)} aria-label="按分类筛选">
              <option value="all">全部分类</option>
              {READING_BOOK_CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {filteredBooks.length > 0 ? (
            <div className="reading-book-list">
              {filteredBooks.map((book) => {
                const bookRecords = getBookRecords(records, book.id);
                const readMinutes = getBookMinutes(bookRecords);
                const noteTotal = getBookNoteCount(bookRecords);

                return (
                  <article key={book.id} className="reading-book-card">
                    <div className="reading-book-head">
                      <div>
                        <h3>{book.title}</h3>
                        <p>
                          {getReadingBookCategoryLabel(book.category)} · {book.author || "未知作者"}
                        </p>
                      </div>
                      <span className={`reading-status-pill is-${book.status}`}>{getReadingBookStatusLabel(book.status)}</span>
                    </div>

                    <div className="reading-book-metrics">
                      <div>
                        <span>进度</span>
                        <strong>{formatBookProgress(book, bookRecords)}</strong>
                      </div>
                      <div>
                        <span>时长</span>
                        <strong>{formatMinutesAsHours(readMinutes)}</strong>
                      </div>
                      <div>
                        <span>笔记</span>
                        <strong>{noteTotal}</strong>
                      </div>
                    </div>

                    <div className="reading-book-meta">
                      <span>📄 {book.totalPages ? `${book.totalPages} 页` : "页数未填"}</span>
                      <span>🕒 {bookRecords.length} 次</span>
                    </div>

                    <div className="reading-book-actions">
                      <button type="button" className="reading-inline-button" onClick={() => onOpenBookDetail(book.id)}>
                        详情
                      </button>
                      <button type="button" className="reading-inline-button" onClick={() => onOpenEditBook(book.id)}>
                        编辑
                      </button>
                      <button type="button" className="reading-inline-button is-primary" onClick={() => onOpenAddRecord(book.id)}>
                        记阅读
                      </button>
                      <button type="button" className="reading-inline-button is-danger" onClick={() => onDeleteBook(book.id)}>
                        删除
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="reading-empty-state">
              <span aria-hidden="true">📚</span>
              <h3>暂无书籍数据</h3>
              <p>尝试调整筛选条件，或者立即添加你的第一本书。</p>
              <button type="button" className="reading-primary-button" onClick={onOpenAddBook}>
                开始添加
              </button>
            </div>
          )}
        </section>

        <aside className="reading-recent-card">
          <div className="reading-card-head">
            <h2>最近阅读</h2>
            <button type="button" onClick={onOpenFlowTab}>
              全部流水
            </button>
          </div>

          {recentRecords.length > 0 ? (
            <ul className="reading-recent-list">
              {recentRecords.map((record) => {
                const book = books.find((item) => item.id === record.bookId);
                return (
                  <li key={record.id}>
                    <strong>{book?.title ?? "已删除书籍"}</strong>
                    <p>{record.note.trim().length > 0 ? record.note : "已记录阅读进度"}</p>
                    <span>
                      {record.readDate} · {record.durationMinutes} 分钟
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="reading-recent-empty">暂无阅读记录</div>
          )}
        </aside>
      </div>

      <section className="reading-trend-card">
        <div className="reading-card-head">
          <h2>阅读趋势</h2>
          <p>记录每日阅读次数与时长变化</p>
        </div>
        <div className="reading-trend-chart">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="近七日阅读时长趋势">
            <polyline className="reading-trend-line" points={trendPolyline} />
            {trendDays.map((item, index) => {
              const cx = trendDays.length <= 1 ? 0 : Math.round((index / (trendDays.length - 1)) * 10000) / 100;
              const cy = Math.round((1 - item.minutes / maxTrendMinutes) * 10000) / 100;
              return <circle key={item.dateKey} className="reading-trend-dot" cx={cx} cy={cy} r={2.2} />;
            })}
          </svg>
          <div className="reading-trend-axis">
            {trendDays.map((item) => (
              <div key={item.dateKey}>
                <strong>{item.minutes} 分钟</strong>
                <span>{formatMonthDay(item.dateKey)}</span>
                <small>{item.count} 次</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

interface ReadingBookDetailScreenProps {
  book: ReadingBook;
  records: ReadingRecord[];
  onBack: () => void;
  onEditBook: () => void;
  onAddRecord: () => void;
}

export function ReadingBookDetailScreen({ book, records, onBack, onEditBook, onAddRecord }: ReadingBookDetailScreenProps) {
  const orderedRecords = [...records].sort((left, right) => {
    if (left.readDate === right.readDate) {
      return right.createdAt.localeCompare(left.createdAt);
    }
    return right.readDate.localeCompare(left.readDate);
  });
  const latestPage = getBookLatestEndPage(records);
  const totalMinutes = getBookMinutes(records);
  const noteTotal = getBookNoteCount(records);

  return (
    <div className="reading-detail-page">
      <header className="reading-detail-hero">
        <button type="button" className="reading-back-button" onClick={onBack} aria-label="返回阅读页">
          ←
        </button>
        <h1>书籍详情</h1>
        <div className="reading-detail-actions">
          <button type="button" className="reading-inline-button" onClick={onEditBook}>
            编辑
          </button>
          <button type="button" className="reading-primary-button" onClick={onAddRecord}>
            记阅读
          </button>
        </div>
      </header>

      <section className="reading-detail-summary">
        <div className="reading-detail-cover">NO COVER</div>
        <div className="reading-detail-copy">
          <div className="reading-detail-tags">
            <span>{getReadingBookCategoryLabel(book.category)}</span>
            <span>{getReadingBookStatusLabel(book.status)}</span>
          </div>
          <h2>{book.title}</h2>
          <p>by {book.author || "未知作者"}</p>
          <div className="reading-detail-metrics">
            <article>
              <span>阅读进度</span>
              <strong>{book.totalPages ? `${Math.min(latestPage, book.totalPages)} / ${book.totalPages}` : `${latestPage}页`}</strong>
              <small>页数</small>
            </article>
            <article>
              <span>累计时长</span>
              <strong>{formatMinutesAsHours(totalMinutes)}</strong>
              <small>小时</small>
            </article>
            <article>
              <span>阅读次数</span>
              <strong>{records.length}</strong>
              <small>记录</small>
            </article>
            <article>
              <span>笔记心得</span>
              <strong>{noteTotal}</strong>
              <small>感想</small>
            </article>
          </div>
        </div>
      </section>

      <section className="reading-detail-flow">
        <div className="reading-card-head">
          <h2>阅读流水</h2>
        </div>

        {orderedRecords.length > 0 ? (
          <div className="reading-detail-records">
            {orderedRecords.map((record) => (
              <article key={record.id} className="reading-detail-record">
                <div>
                  <strong>{record.readDate}</strong>
                  <p>
                    {record.startPage ?? "-"} ~ {record.endPage ?? "-"} 页 · {record.durationMinutes} 分钟
                  </p>
                </div>
                <span>{record.note.trim().length > 0 ? record.note : "未填写心得"}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="reading-empty-state">
            <span aria-hidden="true">📝</span>
            <h3>记录您的第一次阅读体验吧</h3>
            <button type="button" className="reading-primary-button" onClick={onAddRecord}>
              立即记笔记
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

interface ReadingBookModalProps {
  open: boolean;
  mode: "create" | "edit";
  draft: ReadingBookDraft;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof ReadingBookDraft, value: string) => void;
}

export function ReadingBookModal({ open, mode, draft, onClose, onSubmit, onUpdateDraft }: ReadingBookModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card reading-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="reading-modal-head">
          <h2>{mode === "create" ? "新增书籍" : "编辑书籍"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭新增书籍">
            ×
          </button>
        </div>
        <form className="reading-form" onSubmit={onSubmit}>
          <label>
            书名
            <input value={draft.title} onChange={(event) => onUpdateDraft("title", event.target.value)} placeholder="例如：夏洛的网" required />
          </label>
          <div className="reading-form-grid">
            <label>
              作者
              <input value={draft.author} onChange={(event) => onUpdateDraft("author", event.target.value)} placeholder="可选" />
            </label>
            <label>
              总页数
              <input value={draft.totalPages} onChange={(event) => onUpdateDraft("totalPages", event.target.value)} placeholder="可选" inputMode="numeric" />
            </label>
          </div>
          <div className="reading-form-grid">
            <label>
              分类
              <select value={draft.category} onChange={(event) => onUpdateDraft("category", event.target.value)}>
                {READING_BOOK_CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              状态
              <select value={draft.status} onChange={(event) => onUpdateDraft("status", event.target.value)}>
                {READING_BOOK_STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            封面图片
            <div className="reading-upload-row">
              <input
                type="file"
                onChange={(event) => onUpdateDraft("coverFileName", event.target.files?.[0]?.name ?? "")}
                aria-label="上传封面图片"
              />
              <span>{draft.coverFileName || "未选择任何文件"}</span>
            </div>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost-action" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="primary-action">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ReadingRecordModalProps {
  open: boolean;
  books: ReadingBook[];
  draft: ReadingRecordDraft;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (field: keyof ReadingRecordDraft, value: string) => void;
}

export function ReadingRecordModal({ open, books, draft, onClose, onSubmit, onUpdateDraft }: ReadingRecordModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card reading-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="reading-modal-head">
          <h2>新增阅读记录</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭新增阅读记录">
            ×
          </button>
        </div>
        <form className="reading-form" onSubmit={onSubmit}>
          <label>
            书籍
            <select value={draft.bookId} onChange={(event) => onUpdateDraft("bookId", event.target.value)} required>
              <option value="" disabled>
                请选择书籍
              </option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </label>
          <div className="reading-form-grid reading-form-grid-triple">
            <label>
              日期
              <input type="date" value={draft.readDate} onChange={(event) => onUpdateDraft("readDate", event.target.value)} required />
            </label>
            <label>
              开始页
              <input value={draft.startPage} onChange={(event) => onUpdateDraft("startPage", event.target.value)} inputMode="numeric" />
            </label>
            <label>
              结束页
              <input value={draft.endPage} onChange={(event) => onUpdateDraft("endPage", event.target.value)} inputMode="numeric" />
            </label>
          </div>
          <label>
            阅读时长（分钟）
            <input
              value={draft.durationMinutes}
              onChange={(event) => onUpdateDraft("durationMinutes", event.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          <label>
            阅读心得
            <textarea
              value={draft.note}
              onChange={(event) => onUpdateDraft("note", event.target.value)}
              placeholder="记录读了什么、想到了什么..."
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost-action" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="primary-action">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
