import { type JSX, useEffect, useMemo, useState } from "react";

type AppView = "home" | "add" | "batch" | "points" | "achievement" | "history" | "timer" | "habitPunch" | "habitStats" | "habitManage";
type MainTab = "plans" | "habits";
type TimeMode = "duration" | "range";
type HistoryMode = "all" | "gain" | "spend";
type HistoryRange = "all" | "7d" | "30d" | "90d" | "custom";
type WishRedeemMode = "single" | "multi" | "cycle" | "forever";
type WishCyclePeriod = "daily" | "weekly" | "monthly";
type QuickCompleteMode = "duration" | "actual";
type TimerMode = "elapsed" | "countdown" | "pomodoro";
type HabitFrequency = "daily-once" | "daily-multi" | "weekly-multi";
type HabitFilter = "all" | "gain" | "deduct" | "completed" | "pending" | "daily-multi" | "weekly-multi";

interface DayCard {
  weekday: string;
  date: string;
  fullDate: string;
  mark: string;
}

interface QuickStat {
  label: string;
  value: string;
  action?: "points" | "habits";
}

interface PreviewItem {
  subject: string;
  task: string;
}

interface WishItem {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  remaining: string;
  tag: string;
  icon: string;
  iconCategory: string;
  shortfall: number;
  redeemMode: WishRedeemMode;
  multiLimit: number;
  cyclePeriod: WishCyclePeriod;
  cycleCount: number;
}

interface WishIconOption {
  category: string;
  icon: string;
  label: string;
}

interface WishCategoryOption {
  value: string;
  label: string;
  icon: string;
  tabLabel?: string;
}

interface HistoryRecord {
  id: string;
  date: string;
  time: string;
  title: string;
  category: string;
  tag?: string;
  change: number;
}

interface PlanRecordEntry {
  start: string;
  end: string;
  minutes: number;
}

interface StudyPlan {
  id: string;
  dayKey: string;
  title: string;
  subject: string;
  content: string;
  icon: string;
  accent: "lime" | "amber" | "violet" | "cyan" | "blue";
  repeatLabel: string;
  statusLabel: string;
  statusTone: "completed" | "adjusted" | "pending";
  scheduleLabel: string;
  scheduleMode: TimeMode;
  durationMinutes: number;
  points: number;
  createdAt: string;
  dateStart: string;
  dateEnd: string;
  rewardNote?: string;
  completionWindow?: string;
  firstSessionMinutes?: number;
  secondSessionMinutes?: number;
  totalMinutes?: number;
  records: PlanRecordEntry[];
  attachmentName?: string;
  attachmentSize?: string;
}

interface HabitItem {
  id: string;
  title: string;
  description: string;
  frequency: HabitFrequency;
  points: number;
  requiresApproval: boolean;
  icon: string;
  color: string;
  completions: Record<string, number>;
  records: Record<string, Array<{ time: string; note: string; points: number }>>;
  createdAt: string;
}

interface HabitTemplate {
  title: string;
  description: string;
  frequency: HabitFrequency;
  points: number;
  requiresApproval: boolean;
  icon: string;
  color: string;
}

interface HabitTypeOption {
  value: HabitFrequency;
  label: string;
  hint: string;
}

const DAY_CARDS: DayCard[] = [
  { weekday: "鍛ㄤ竴", date: "3/16", fullDate: "2026-03-16", mark: "" },
  { weekday: "鍛ㄤ簩", date: "3/17", fullDate: "2026-03-17", mark: "" },
  { weekday: "鍛ㄤ笁", date: "3/18", fullDate: "2026-03-18", mark: "鈼?5" },
  { weekday: "鍛ㄥ洓", date: "3/19", fullDate: "2026-03-19", mark: "鈼?2" },
  { weekday: "鍛ㄤ簲", date: "3/20", fullDate: "2026-03-20", mark: "" },
  { weekday: "鍛ㄥ叚", date: "3/21", fullDate: "2026-03-21", mark: "" },
  { weekday: "鍛ㄦ棩", date: "3/22", fullDate: "2026-03-22", mark: "" },
];

const HABIT_TYPE_OPTIONS: HabitTypeOption[] = [
  { value: "daily-once", label: "姣忔棩涓€娆?, hint: "姣忓ぉ鍙兘鎵撳崱涓€娆? },
  { value: "daily-multi", label: "姣忔棩澶氭", hint: "姣忓ぉ鍙噸澶嶆墦鍗★紝閫傚悎楂橀涔犳儻" },
  { value: "weekly-multi", label: "姣忓懆澶氭", hint: "姣忓懆绱鎵撳崱娆℃暟锛岄€傚悎闃舵鎬т範鎯? },
];

const HABIT_ICON_OPTIONS = ["鈽?, "鉁?, "鈼?, "鈼?, "鈿?, "馃弳", "鈾?, "鈻?, "馃摉", "馃彿", "馃Ь", "鉁?, "馃棑", "馃帶", "馃挕", "馃憸", "馃晵", "馃寵", "鈱?, "馃嵈", "馃挧", "猬?, "鈿?, "鈽?];

const HABIT_COLOR_OPTIONS = ["#4f86f7", "#8a7df0", "#58c7df", "#63d0c0", "#63cf81", "#98d64a", "#ffcb57", "#ff9a58", "#f47d7d", "#f1678b", "#de71bd", "#b17bf4"];

const INITIAL_HABITS: HabitItem[] = [];
const DEFAULT_HABIT_LIBRARY: HabitTemplate[] = [
  {
    title: "鏃╃潯",
    description: "姣忓ぉ 22:30 鍓嶅叆鐫?,
    frequency: "daily-once",
    points: 1,
    requiresApproval: false,
    icon: HABIT_ICON_OPTIONS[0] ?? "鈽€",
    color: HABIT_COLOR_OPTIONS[1] ?? "#8a7df0",
  },
  {
    title: "鏅ㄨ 10 鍒嗛挓",
    description: "鏃╅鍓嶅畬鎴愭櫒璇?,
    frequency: "daily-once",
    points: 2,
    requiresApproval: false,
    icon: HABIT_ICON_OPTIONS[8] ?? "馃摎",
    color: HABIT_COLOR_OPTIONS[0] ?? "#4f86f7",
  },
  {
    title: "杩愬姩鎵撳崱",
    description: "姣忓ぉ瀹屾垚鑷冲皯涓€椤硅繍鍔?,
    frequency: "daily-multi",
    points: 1,
    requiresApproval: false,
    icon: HABIT_ICON_OPTIONS[4] ?? "鈿?,
    color: HABIT_COLOR_OPTIONS[6] ?? "#ffcb57",
  },
];
const SHARED_HABIT_LIBRARY: HabitTemplate[] = [
  {
    title: "楗悗鏁寸悊涔﹀寘",
    description: "鏅氶キ鍚庢暣鐞嗙浜屽ぉ瑕佸甫鐨勭墿鍝?,
    frequency: "daily-once",
    points: 1,
    requiresApproval: false,
    icon: HABIT_ICON_OPTIONS[2] ?? "鉁?,
    color: HABIT_COLOR_OPTIONS[3] ?? "#63d0c0",
  },
  {
    title: "姣忓懆闃呰 3 娆?,
    description: "涓€鍛ㄧ疮璁￠槄璇讳笁娆″嵆鍙畬鎴?,
    frequency: "weekly-multi",
    points: 3,
    requiresApproval: false,
    icon: HABIT_ICON_OPTIONS[9] ?? "馃尶",
    color: HABIT_COLOR_OPTIONS[2] ?? "#58c7df",
  },
];

const INITIAL_STUDY_PLANS: StudyPlan[] = [
  {
    id: "plan-1",
    dayKey: "2026-03-18",
    title: "闃冲厜灏忚揪浜?璇?,
    subject: "鎶€鑳?,
    content: "闃冲厜灏忚揪浜?璇?,
    icon: "馃敡",
    accent: "lime",
    repeatLabel: "姣忓ぉ",
    statusLabel: "宸插畬鎴?,
    statusTone: "completed",
    scheduleLabel: "10鍒嗛挓",
    scheduleMode: "duration",
    durationMinutes: 10,
    points: 1,
    createdAt: "2026/03/18 08:00",
    dateStart: "2026-03-18",
    dateEnd: "2026-06-28",
    rewardNote: "鑷畾涔夌Н鍒?,
    completionWindow: "20:35 - 20:40",
    firstSessionMinutes: 0,
    secondSessionMinutes: 5,
    totalMinutes: 5,
    records: [
      { start: "20:38", end: "20:39", minutes: 0 },
      { start: "20:35", end: "20:40", minutes: 5 },
    ],
    attachmentName: "record.m4a",
    attachmentSize: "165.4 KB",
  },
  {
    id: "plan-2",
    dayKey: "2026-03-18",
    title: "璇昏嫳璇?,
    subject: "鑻辫",
    content: "/",
    icon: "馃埡",
    accent: "amber",
    repeatLabel: "浠呭綋澶?,
    statusLabel: "宸插畬鎴?,
    statusTone: "completed",
    scheduleLabel: "15鍒嗛挓",
    scheduleMode: "duration",
    durationMinutes: 15,
    points: 3,
    createdAt: "2026/03/18 08:05",
    dateStart: "2026-03-18",
    dateEnd: "2026-03-18",
    completionWindow: "20:27 - 20:42",
    firstSessionMinutes: 15,
    totalMinutes: 15,
    records: [{ start: "20:27", end: "20:42", minutes: 15 }],
  },
  {
    id: "plan-3",
    dayKey: "2026-03-18",
    title: "瀹為獙鐝暟瀛?璇?,
    subject: "鏁板",
    content: "瀹為獙鐝暟瀛?璇?,
    icon: "馃М",
    accent: "violet",
    repeatLabel: "姣忓ぉ",
    statusLabel: "宸插畬鎴?,
    statusTone: "completed",
    scheduleLabel: "10鍒嗛挓",
    scheduleMode: "duration",
    durationMinutes: 10,
    points: 100,
    createdAt: "2026/03/18 08:10",
    dateStart: "2026-03-18",
    dateEnd: "2026-06-28",
    completionWindow: "20:34 - 20:49",
    firstSessionMinutes: 15,
    totalMinutes: 15,
    records: [{ start: "20:34", end: "20:49", minutes: 15 }],
  },
  {
    id: "plan-4",
    dayKey: "2026-03-18",
    title: "涓槷",
    subject: "鎶€鑳?,
    content: "",
    icon: "馃敡",
    accent: "lime",
    repeatLabel: "浠呭綋澶?,
    statusLabel: "宸插畬鎴?,
    statusTone: "completed",
    scheduleLabel: "19:00 - 20:30",
    scheduleMode: "range",
    durationMinutes: 45,
    points: 10,
    createdAt: "2026/03/18 07:55",
    dateStart: "2026-03-18",
    dateEnd: "2026-03-18",
    completionWindow: "20:07 - 20:52",
    firstSessionMinutes: 45,
    totalMinutes: 45,
    records: [{ start: "20:07", end: "20:52", minutes: 45 }],
  },
  {
    id: "plan-5",
    dayKey: "2026-03-18",
    title: "鑳岃鏂?,
    subject: "璇枃",
    content: "",
    icon: "馃摌",
    accent: "blue",
    repeatLabel: "浠呭綋澶?,
    statusLabel: "宸茶皟鏁?,
    statusTone: "adjusted",
    scheduleLabel: "19:00 - 20:30",
    scheduleMode: "range",
    durationMinutes: 45,
    points: 100,
    createdAt: "2026/03/18 08:12",
    dateStart: "2026-03-18",
    dateEnd: "2026-03-18",
    rewardNote: "绗?,
    completionWindow: "20:09 - 20:54",
    firstSessionMinutes: 45,
    totalMinutes: 45,
    records: [{ start: "20:09", end: "20:54", minutes: 45 }],
  },
  {
    id: "plan-6",
    dayKey: "2026-03-19",
    title: "闃冲厜灏忚揪浜?璇?,
    subject: "鎶€鑳?,
    content: "闃冲厜灏忚揪浜?璇?,
    icon: "馃敡",
    accent: "lime",
    repeatLabel: "姣忓ぉ",
    statusLabel: "寰呭畬鎴?,
    statusTone: "pending",
    scheduleLabel: "10鍒嗛挓",
    scheduleMode: "duration",
    durationMinutes: 10,
    points: 1,
    createdAt: "2026/03/19 08:00",
    dateStart: "2026-03-19",
    dateEnd: "2026-06-28",
    rewardNote: "鑷畾涔夌Н鍒?,
    records: [],
  },
  {
    id: "plan-7",
    dayKey: "2026-03-19",
    title: "瀹為獙鐝暟瀛?璇?,
    subject: "鏁板",
    content: "瀹為獙鐝暟瀛?璇?,
    icon: "馃М",
    accent: "violet",
    repeatLabel: "姣忓ぉ",
    statusLabel: "寰呭畬鎴?,
    statusTone: "pending",
    scheduleLabel: "10鍒嗛挓",
    scheduleMode: "duration",
    durationMinutes: 10,
    points: 100,
    createdAt: "2026/03/19 08:05",
    dateStart: "2026-03-19",
    dateEnd: "2026-06-28",
    records: [],
  },
];
const SUBJECT_OPTIONS = ["鑻辫", "璇枃", "鏁板", "涓槷", "闃呰", "缁冨瓧"];
const DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 120, 150, 180];
const WISH_CATEGORY_OPTIONS: WishCategoryOption[] = [
  { value: "toy", label: "鐜╁叿", icon: "馃Ц", tabLabel: "鐜╁叿娓告垙" },
  { value: "food", label: "缇庨", icon: "馃崟", tabLabel: "缇庨闆堕" },
  { value: "activity", label: "娲诲姩", icon: "馃帾", tabLabel: "娲诲姩濞变箰" },
  { value: "electronics", label: "鐢靛瓙浜у搧", icon: "馃摫", tabLabel: "鐢靛瓙浜у搧" },
  { value: "books", label: "涔︾睄", icon: "馃摎", tabLabel: "涔︾睄瀛︿範" },
  { value: "privilege", label: "鐗规潈", icon: "馃憫", tabLabel: "鐗规潈濂栧姳" },
  { value: "sports", label: "杩愬姩", icon: "鈿? },
  { value: "other", label: "鍏朵粬", icon: "鉁?, tabLabel: "鍏朵粬" },
];
const WISH_ICON_CATEGORY_ROWS = [
  ["toy", "food", "activity"],
  ["electronics", "books", "privilege", "other"],
];
const INITIAL_WISH_ITEMS: WishItem[] = [
  {
    id: "wish-1",
    title: "鐜╂父鎴?5鍒嗛挓",
    description: "瀹屾垚瀛︿範浠诲姟鍚庡鍔辫嚜宸变紤鎭竴涓嬨€?,
    category: "activity",
    cost: 50,
    remaining: "鈭?,
    tag: "姘镐箙",
    icon: "馃幃",
    iconCategory: "toy",
    shortfall: 38,
    redeemMode: "forever",
    multiLimit: 3,
    cyclePeriod: "weekly",
    cycleCount: 1,
  },
];
const WISH_ICON_OPTIONS: WishIconOption[] = [
  { category: "toy", icon: "馃Ц", label: "灏忕唺" },
  { category: "toy", icon: "馃幃", label: "鎵嬫焺" },
  { category: "toy", icon: "馃幉", label: "楠板瓙" },
  { category: "toy", icon: "馃獉", label: "鎮犳偁鐞? },
  { category: "toy", icon: "馃幆", label: "闈跺績" },
  { category: "toy", icon: "馃帹", label: "璋冭壊鐩? },
  { category: "toy", icon: "馃З", label: "鎷煎浘" },
  { category: "toy", icon: "馃殏", label: "鐏溅" },
  { category: "toy", icon: "馃殫", label: "姹借溅" },
  { category: "toy", icon: "鉁堬笍", label: "椋炴満" },
  { category: "toy", icon: "馃殎", label: "鐩村崌鏈? },
  { category: "toy", icon: "馃浉", label: "椋炵" },
  { category: "food", icon: "馃崟", label: "鎶惃" },
  { category: "food", icon: "馃崝", label: "姹夊牎" },
  { category: "food", icon: "馃崯", label: "钖潯" },
  { category: "food", icon: "馃崷", label: "鍐版穱娣? },
  { category: "food", icon: "馃嵃", label: "铔嬬硶" },
  { category: "food", icon: "馃崺", label: "鐢滅敎鍦? },
  { category: "food", icon: "馃崻", label: "楗煎共" },
  { category: "food", icon: "馃崼", label: "宸у厠鍔? },
  { category: "food", icon: "馃イ", label: "楗枡" },
  { category: "food", icon: "馃嵖", label: "鐖嗙背鑺? },
  { category: "food", icon: "馃尛", label: "鐑嫍" },
  { category: "food", icon: "馃", label: "鍩规牴" },
  { category: "activity", icon: "馃幀", label: "鐢靛奖" },
  { category: "activity", icon: "馃帾", label: "椹垙鍥? },
  { category: "activity", icon: "馃帰", label: "杩囧北杞? },
  { category: "activity", icon: "馃帯", label: "鎽╁ぉ杞? },
  { category: "activity", icon: "馃帬", label: "鏃嬭浆鏈ㄩ┈" },
  { category: "activity", icon: "鈿?, label: "瓒崇悆" },
  { category: "activity", icon: "馃弨", label: "绡悆" },
  { category: "activity", icon: "馃彇锔?, label: "娴疯竟" },
  { category: "activity", icon: "馃毚", label: "楠戣" },
  { category: "activity", icon: "馃幍", label: "闊充箰" },
  { category: "activity", icon: "馃幐", label: "鍚変粬" },
  { category: "activity", icon: "馃幑", label: "閽㈢惔" },
  { category: "electronics", icon: "馃摫", label: "鎵嬫満" },
  { category: "electronics", icon: "馃捇", label: "鐢佃剳" },
  { category: "electronics", icon: "馃幃", label: "娓告垙鏈? },
  { category: "electronics", icon: "馃摲", label: "鐩告満" },
  { category: "electronics", icon: "馃帶", label: "鑰虫満" },
  { category: "electronics", icon: "鈴?, label: "闂归挓" },
  { category: "electronics", icon: "馃枼锔?, label: "鏄剧ず鍣? },
  { category: "electronics", icon: "馃摵", label: "鐢佃" },
  { category: "electronics", icon: "鈱笍", label: "閿洏" },
  { category: "electronics", icon: "馃帳", label: "楹﹀厠椋? },
  { category: "electronics", icon: "馃枿锔?, label: "鎵撳嵃鏈? },
  { category: "electronics", icon: "馃攱", label: "鐢垫睜" },
  { category: "books", icon: "馃摎", label: "鍥句功" },
  { category: "books", icon: "馃摉", label: "鎵撳紑鐨勪功" },
  { category: "books", icon: "馃摃", label: "绾功" },
  { category: "books", icon: "馃摋", label: "缁夸功" },
  { category: "books", icon: "馃摌", label: "钃濅功" },
  { category: "books", icon: "馃摍", label: "姗欎功" },
  { category: "books", icon: "馃摂", label: "绗旇鏈? },
  { category: "books", icon: "馃搾", label: "缁冧範鏈? },
  { category: "books", icon: "馃棐锔?, label: "渚跨鏈? },
  { category: "books", icon: "馃摐", label: "鍗疯酱" },
  { category: "books", icon: "馃摑", label: "鏂囧叿" },
  { category: "books", icon: "鉁忥笍", label: "閾呯瑪" },
  { category: "privilege", icon: "馃憫", label: "鐨囧啝" },
  { category: "privilege", icon: "猸?, label: "鏄熸槦" },
  { category: "privilege", icon: "馃弳", label: "濂栨澂" },
  { category: "privilege", icon: "馃巵", label: "绀肩墿" },
  { category: "privilege", icon: "馃拵", label: "閽荤煶" },
  { category: "privilege", icon: "馃専", label: "闂€€" },
  { category: "privilege", icon: "鉁?, label: "鏄熷厜" },
  { category: "privilege", icon: "馃帀", label: "搴嗙" },
  { category: "privilege", icon: "馃弲", label: "鍕嬬珷" },
  { category: "privilege", icon: "馃", label: "绗竴鍚? },
  { category: "privilege", icon: "馃", label: "绗簩鍚? },
  { category: "privilege", icon: "馃", label: "绗笁鍚? },
  { category: "other", icon: "馃巿", label: "姘旂悆" },
  { category: "other", icon: "馃寛", label: "褰╄櫣" },
  { category: "other", icon: "馃", label: "鐙鍏? },
  { category: "other", icon: "馃惗", label: "灏忕嫍" },
  { category: "other", icon: "馃惐", label: "灏忕尗" },
  { category: "other", icon: "馃", label: "鎭愰緳" },
  { category: "other", icon: "馃殌", label: "鐏" },
  { category: "other", icon: "馃寵", label: "鏈堜寒" },
  { category: "other", icon: "馃尀", label: "澶槼" },
  { category: "other", icon: "馃尭", label: "鑺辨湹" },
  { category: "other", icon: "馃尯", label: "妯辫姳" },
  { category: "other", icon: "馃尰", label: "鍚戞棩钁? },
];
const HISTORY_RECORDS: HistoryRecord[] = [
  { id: "h1", date: "2026骞?鏈?8鏃?, time: "22:23", title: "纾ㄨ€虫湹锛堝瀹氶€氳繃锛?, category: "鑻辫", tag: "宸插瀹?, change: 1 },
  { id: "h2", date: "2026骞?鏈?8鏃?, time: "21:52", title: "涓槷锛堝瀹氳皟鏁达級", category: "鎶€鑳?, tag: "宸插瀹?, change: 4 },
  { id: "h3", date: "2026骞?鏈?8鏃?, time: "20:50", title: "璇昏嫳璇紙瀹″畾閫氳繃锛?, category: "鑻辫", tag: "宸插瀹?, change: 4 },
  { id: "h4", date: "2026骞?鏈?8鏃?, time: "20:50", title: "姣忔棩鍏ㄥ嫟", category: "", change: 3 },
];

function formatClockTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toTimerUnits(totalSeconds: number): [string, string, string] {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, "0")) as [string, string, string];
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatHistoryDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}骞?{date.getMonth() + 1}鏈?{date.getDate()}鏃;
}

function addDays(dateKey: string, delta: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return formatDateKey(date);
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const nextDate = new Date(year, month - 1 + delta, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarDays(monthKey: string): Array<{ dateKey: string; dayNumber: number; inCurrentMonth: boolean }> {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month - 1, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      dateKey: formatDateKey(date),
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === month - 1,
    };
  });
}

function getWeekdayLabel(dateKey: string): string {
  return ["鍛ㄦ棩", "鍛ㄤ竴", "鍛ㄤ簩", "鍛ㄤ笁", "鍛ㄥ洓", "鍛ㄤ簲", "鍛ㄥ叚"][parseDateKey(dateKey).getDay()] ?? "";
}

function getHabitFrequencyLabel(frequency: HabitFrequency): string {
  return HABIT_TYPE_OPTIONS.find((item) => item.value === frequency)?.label ?? "姣忔棩涓€娆?;
}

function getHabitFrequencyHint(frequency: HabitFrequency): string {
  return HABIT_TYPE_OPTIONS.find((item) => item.value === frequency)?.hint ?? "姣忓ぉ鍙兘鎵撳崱涓€娆?;
}

function getHabitTargetCount(frequency: HabitFrequency): number {
  if (frequency === "daily-multi") return 3;
  if (frequency === "weekly-multi") return 3;
  return 1;
}

function getWeekDateKeys(dateKey: string): string[] {
  const baseDate = parseDateKey(dateKey);
  const mondayOffset = (baseDate.getDay() + 6) % 7;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + index);
    return formatDateKey(next);
  });
}

function getHabitProgressForDate(habit: HabitItem, dateKey: string): number {
  if (habit.frequency === "weekly-multi") {
    return getWeekDateKeys(dateKey).reduce((sum, key) => sum + (habit.completions[key] ?? 0), 0);
  }

  return habit.completions[dateKey] ?? 0;
}

function isHabitCompletedForDate(habit: HabitItem, dateKey: string): boolean {
  return getHabitProgressForDate(habit, dateKey) >= getHabitTargetCount(habit.frequency);
}

function getWeekOfMonthLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstOffset = (firstDay.getDay() + 6) % 7;
  const weekIndex = Math.floor((date.getDate() + firstOffset - 1) / 7) + 1;
  return `${year}骞?{month + 1}鏈堢${weekIndex}鍛╜;
}

function getHabitCreatedAtLabel(): string {
  const now = new Date("2026-03-19T20:00:00");
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function createHabitFromTemplate(template: HabitTemplate, index: number): HabitItem {
  return {
    id: `habit-${Date.now()}-${index}`,
    title: template.title,
    description: template.description,
    frequency: template.frequency,
    points: template.points,
    requiresApproval: template.requiresApproval,
    icon: template.icon,
    color: template.color,
    completions: {},
    records: {},
    createdAt: getHabitCreatedAtLabel(),
  };
}

function collectHabitRecords(
  habits: HabitItem[],
): Array<{ id: string; habitId: string; habitTitle: string; frequency: HabitFrequency; dateKey: string; time: string; note: string; points: number }> {
  return habits
    .flatMap((habit) =>
      Object.entries(habit.records).flatMap(([dateKey, records]) =>
        records.map((record, index) => ({
          id: `${habit.id}-${dateKey}-${index}`,
          habitId: habit.id,
          habitTitle: habit.title,
          frequency: habit.frequency,
          dateKey,
          time: record.time,
          note: record.note,
          points: record.points,
        })),
      ),
    )
    .sort((left, right) => `${right.dateKey} ${right.time}`.localeCompare(`${left.dateKey} ${left.time}`));
}

function parsePreview(raw: string): PreviewItem[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: PreviewItem[] = [];
  let currentSubject = "鏈垎绫?;

  for (const line of lines) {
    const subjectOnly = line.match(/^([\u4e00-\u9fa5A-Za-z0-9]+)\s*[:锛歖$/);
    if (subjectOnly) {
      currentSubject = subjectOnly[1];
      continue;
    }

    const numbered = line.match(/^\d+[.銆?\s]+(.+)$/);
    if (numbered) {
      items.push({ subject: currentSubject, task: numbered[1] });
      continue;
    }

    const inline = line.match(/^([\u4e00-\u9fa5A-Za-z0-9]+)\s*[:锛歖\s*(.+)$/);
    if (inline) {
      items.push({ subject: inline[1], task: inline[2] });
      continue;
    }

    items.push({ subject: currentSubject, task: line });
  }

  return items.slice(0, 80);
}

function StatCard(props: { item: QuickStat; onGotoPoints: () => void; onGotoHabits?: () => void }): JSX.Element {
  if (props.item.action === "points") {
    return (
      <button type="button" className="stat-card interactive" onClick={props.onGotoPoints}>
        <span>{props.item.label}</span>
        <strong>{props.item.value}</strong>
      </button>
    );
  }

  if (props.item.action === "habits" && props.onGotoHabits) {
    return (
      <button type="button" className="stat-card interactive" onClick={props.onGotoHabits}>
        <span>{props.item.label}</span>
        <strong>{props.item.value}</strong>
      </button>
    );
  }

  return (
    <article className="stat-card">
      <span>{props.item.label}</span>
      <strong>{props.item.value}</strong>
    </article>
  );
}

function HomePage(props: {
  onGotoAdd: () => void;
  onGotoBatch: () => void;
  onGotoPoints: () => void;
  onGotoHabits: () => void;
  onGotoHabitStats: () => void;
  onGotoHabitManage: () => void;
  onToast: (text: string) => void;
  studyPlans: StudyPlan[];
  habits: HabitItem[];
  onOpenPlanManage: (planId: string) => void;
  onQuickManage: (dateKey: string) => void;
  onQuickComplete: (planId: string) => void;
  onStartTimer: (planId: string) => void;
  onOpenHabitCreate: () => void;
  onOpenHabitCheck: (habitId: string, dateKey: string) => void;
}): JSX.Element {
  const [tab, setTab] = useState<MainTab>("plans");
  const [activeDay, setActiveDay] = useState(3);
  const [softDay, setSoftDay] = useState(2);
  const [habitQuery, setHabitQuery] = useState("");
  const [habitFilter, setHabitFilter] = useState<HabitFilter>("all");
  const [habitLayout, setHabitLayout] = useState<"grid" | "list">("grid");

  const todayKey = "2026-03-19";
  const activeDate = DAY_CARDS[activeDay]?.fullDate ?? DAY_CARDS[0].fullDate;
  const visiblePlans = props.studyPlans.filter((plan) => plan.dayKey === activeDate);
  const todayPlans = props.studyPlans.filter((plan) => plan.dayKey === todayKey);
  const totalMinutes = todayPlans.reduce((sum, plan) => sum + (plan.totalMinutes ?? 0), 0);
  const completedCount = props.studyPlans.filter((plan) => plan.statusTone !== "pending").length;
  const todayCompletedCount = todayPlans.filter((plan) => plan.statusTone !== "pending").length;
  const dayCards = DAY_CARDS.map((day) => {
    const count = props.studyPlans.filter((plan) => plan.dayKey === day.fullDate).length;
    return { ...day, mark: count ? `鈼?${count}` : "" };
  });
  const habitDayCards = DAY_CARDS.map((day) => ({
    ...day,
    mark: props.habits.length ? "鈼? : "",
  }));
  const quickStats = useMemo<QuickStat[]>(
    () => [
      { label: "浠婃棩瀛︿範鏃堕棿", value: totalMinutes ? `${(totalMinutes / 60).toFixed(1)}h` : "0m" },
      { label: "杩愬姩鎴峰鏃堕棿", value: "0m" },
      { label: "浠婃棩浠诲姟鏁伴噺", value: `${todayCompletedCount}/${todayPlans.length || 0}` },
      { label: "浠婃棩瀹屾垚鐜?, value: todayPlans.length ? `${Math.round((todayCompletedCount / todayPlans.length) * 100)}%` : "0%" },
      { label: "绉垎鎴愬氨", value: "馃弳", action: "points" },
      { label: "琛屼负涔犳儻", value: "鈽?, action: "habits" },
      { label: "鐢靛瓙瀹犵墿", value: "馃惥" },
      { label: "浣跨敤甯姪", value: "?" },
      { label: "鍏朵粬", value: "..." },
    ],
    [todayCompletedCount, todayPlans.length, totalMinutes],
  );

  const firstRow = quickStats.slice(0, 8);
  const secondRow = quickStats.slice(8);
  const normalizedHabitQuery = habitQuery.trim().toLowerCase();
  const filteredHabits = props.habits.filter((habit) => {
    const matchQuery = !normalizedHabitQuery || (habit.title + " " + habit.description).toLowerCase().includes(normalizedHabitQuery);

    if (!matchQuery) return false;

    switch (habitFilter) {
      case "gain":
        return habit.points > 0;
      case "deduct":
        return habit.points < 0;
      case "completed":
        return isHabitCompletedForDate(habit, activeDate);
      case "pending":
        return !isHabitCompletedForDate(habit, activeDate);
      case "daily-multi":
        return habit.frequency === "daily-multi";
      case "weekly-multi":
        return habit.frequency === "weekly-multi";
      default:
        return true;
    }
  });

  const changeActiveDay = (nextIndex: number): void => {
    if (nextIndex < 0 || nextIndex >= DAY_CARDS.length) return;
    setSoftDay(activeDay);
    setActiveDay(nextIndex);
  };

  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="hero-content">
          <div>
            <h1>缁ｇ唬鍔╂墜 - 瀛︿範鎵撳崱鍔╂墜</h1>
            <p>浣犲凡杩炵画鎵撳崱 1 澶╋紝宸茬疮璁″畬鎴?{completedCount} 涓涔犺鍒?/p>
          </div>
          <div className="hero-right">
            <span className="pill warn">浼氬憳鍓╀綑2澶?/span>
            <button type="button" className="pill ghost">
              鍏戞崲
            </button>
            <button type="button" className="pill user">
              鐪熸 <span>鈻?/span>
            </button>
          </div>
        </div>

        <div className="stat-wrap">
          <div className="stat-grid">
            {firstRow.map((item) => (
              <StatCard key={item.label} item={item} onGotoPoints={props.onGotoPoints} onGotoHabits={props.onGotoHabits} />
            ))}
          </div>
          <div className="stat-grid second">
            {secondRow.map((item) => (
              <StatCard key={item.label} item={item} onGotoPoints={props.onGotoPoints} onGotoHabits={props.onGotoHabits} />
            ))}
          </div>
        </div>
      </header>

      <main className="home-main">
        <div className="main-tabs">
          <button type="button" className={"main-tab " + (tab === "plans" ? "active" : "")} onClick={() => setTab("plans")}>
            瀛︿範璁″垝
          </button>
          <button type="button" className={"main-tab " + (tab === "habits" ? "active" : "")} onClick={() => setTab("habits")}>
            琛屼负涔犳儻
          </button>
        </div>

        <section className={"home-board " + (tab === "habits" ? "home-board-habits" : "")}>
          {tab === "plans" ? (
            <>
              <div className="board-actions">
                <button type="button" className="btn ai" onClick={() => props.onToast("AI鍒涘缓鍔熻兘涓嬩竴姝ュ畬鍠?)}>
                  AI鍒涘缓
                </button>
                <button type="button" className="btn batch" onClick={props.onGotoBatch}>
                  鎵归噺娣诲姞
                </button>
                <button type="button" className="btn add" onClick={props.onGotoAdd}>
                  娣诲姞璁″垝
                </button>
              </div>

              <div className="line" />

              <div className="week-card">
                <div className="week-head">
                  <strong>2026骞?鏈堢12鍛?/strong>
                  <div className="week-actions">
                    <button type="button" className="chip-outline">
                      鎬婚瑙?                    </button>
                    <button type="button" className="round blue">
                      ?
                    </button>
                    <button type="button" className="today">
                      浠婂ぉ
                    </button>
                    <button type="button" className="round blue">
                      ?
                    </button>
                    <button type="button" className="round plain">
                      鏃ュ巻
                    </button>
                  </div>
                </div>

                <div className="day-grid">
                  {dayCards.map((day, index) => (
                    <button
                      key={day.weekday}
                      type="button"
                      className={"day-box " + (index === activeDay ? "active " : "") + (index === softDay ? "soft" : "")}
                      onClick={() => changeActiveDay(index)}
                    >
                      <span>{day.weekday}</span>
                      <strong>{day.date}</strong>
                      <small>{day.mark || " "}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="title-row">
                <div className="title-box">
                  <i />
                  <h2>鎴戠殑璁″垝</h2>
                </div>
                <div className="tools">
                  <button type="button">鍒嗕韩</button>
                  <button type="button">鍏ㄩ儴绉戠洰</button>
                  <button type="button">榛樿鎺掑簭</button>
                  <button type="button">甯冨眬</button>
                  <button type="button" onClick={() => props.onQuickManage(activeDate)}>
                    绠＄悊
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {tab === "plans" ? (
            visiblePlans.length === 0 ? (
              <div className="loading-box">鏆傛棤璁″垝锛岀偣鍑诲彸涓婅鈥滄坊鍔犺鍒掆€濆紑濮嬪垱寤恒€?/div>
            ) : (
              <div className="plan-list">
                {visiblePlans.map((plan) => (
                  <article key={plan.id} className={"plan-card plan-card-" + plan.accent} onClick={() => props.onOpenPlanManage(plan.id)}>
                    <div className={"plan-card-side plan-card-side-" + plan.accent}>
                      <span className="plan-card-icon">{plan.icon}</span>
                      <strong>{plan.subject}</strong>
                    </div>
                    <div className="plan-card-body">
                      <div className="plan-card-header">
                        <div className="plan-card-title-row">
                          <h3>{plan.title}</h3>
                          <span className="plan-pill plan-pill-repeat">{plan.repeatLabel}</span>
                          {plan.statusTone !== "pending" ? <span className={"plan-pill plan-pill-status plan-pill-" + plan.statusTone}>{plan.statusLabel}</span> : null}
                        </div>
                        {plan.statusTone !== "pending" ? <span className="plan-manage-entry">绠＄悊</span> : null}
                      </div>

                      {plan.completionWindow ? (
                        <div className="plan-record-line">
                          <span>瀹屾垚鏃堕棿: {plan.completionWindow}</span>
                          {typeof plan.firstSessionMinutes === "number" ? <span>棣栨: {plan.firstSessionMinutes}鍒嗛挓</span> : null}
                          {typeof plan.secondSessionMinutes === "number" ? <span>绗?娆? {plan.secondSessionMinutes}鍒嗛挓</span> : null}
                          {typeof plan.totalMinutes === "number" ? <span>绱: {plan.totalMinutes}鍒嗛挓</span> : null}
                        </div>
                      ) : null}

                      {plan.statusTone !== "pending" ? (
                        <div className="plan-issued-line">
                          <span>宸插彂鏀? {plan.points} 猸?/span>
                          {plan.rewardNote ? <em>{plan.rewardNote}</em> : null}
                        </div>
                      ) : null}

                      <p className="plan-card-content">{plan.content || "/"}</p>

                      <div className={"plan-card-footer " + (plan.statusTone === "pending" ? "pending" : "") }>
                        <div className="plan-card-footer-meta">
                          <span className={"plan-schedule plan-schedule-" + plan.scheduleMode}>{plan.scheduleLabel}</span>
                          <strong>{plan.points} 猸?/strong>
                        </div>
                        {plan.statusTone === "pending" ? (
                          <div className="plan-card-actions">
                            <button
                              type="button"
                              className="quick-complete-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                props.onQuickComplete(plan.id);
                              }}
                            >
                              蹇€熷畬鎴?                            </button>
                            <button
                              type="button"
                              className="start-timer-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                props.onStartTimer(plan.id);
                              }}
                            >
                              寮€濮嬭鏃?                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : props.habits.length === 0 ? (
            <div className="habit-empty-state">
              <div className="habit-empty-icon" aria-hidden="true">
                鉁?              </div>
              <h3>杩樻病鏈夎涓轰範鎯?/h3>
              <p>鍏堝幓鍒涘缓涓€浜涜涓轰範鎯紝鐒跺悗寮€濮嬫墦鍗″惂!</p>
              <button type="button" className="habit-create-btn" onClick={props.onOpenHabitCreate}>
                锛?鍒涘缓涔犳儻
              </button>
            </div>
          ) : (
            <div className="habit-board">
              <div className="title-row habit-title-row">
                <div className="title-box">
                  <i />
                  <h2>鎴戠殑琛屼负涔犳儻</h2>
                </div>
                <div className="habit-head-actions">
                  <button type="button" className="btn ai" onClick={props.onGotoHabitStats}>
                    鏁版嵁缁熻
                  </button>
                  <button type="button" className="btn batch" onClick={props.onGotoHabitManage}>
                    涔犳儻绠＄悊
                  </button>
                </div>
              </div>

              <div className="line" />

              <div className="week-card habit-week-card">
                <div className="week-head">
                  <strong>{getWeekOfMonthLabel(activeDate)}</strong>
                  <div className="week-actions">
                    <button type="button" className="chip-outline" onClick={() => props.onToast("琛ユ墦鍗¤鍒欎笅涓€姝ヨˉ榻?)}>
                      鍙ˉ鎵撳崱
                    </button>
                    <button type="button" className="today" onClick={() => changeActiveDay(DAY_CARDS.findIndex((item) => item.fullDate === todayKey))}>
                      浠婂ぉ
                    </button>
                    <button type="button" className="round blue" onClick={() => changeActiveDay(activeDay - 1)}>
                      ?
                    </button>
                    <button type="button" className="round blue" onClick={() => changeActiveDay(activeDay + 1)}>
                      ?
                    </button>
                    <button type="button" className="round plain" onClick={() => props.onToast("涔犳儻鏃ュ巻鍔熻兘涓嬩竴姝ヨˉ榻?)}>
                      鏃ュ巻
                    </button>
                  </div>
                </div>

                <div className="day-grid habit-day-grid">
                  {habitDayCards.map((day, index) => (
                    <button
                      key={"habit-" + day.fullDate}
                      type="button"
                      className={"day-box " + (index === activeDay ? "active " : "") + (index === softDay ? "soft" : "")}
                      onClick={() => changeActiveDay(index)}
                    >
                      <span>{day.weekday}</span>
                      <strong>{day.date}</strong>
                      <small className={"habit-day-dot " + (index === activeDay ? "active" : "")}>{day.mark || " "}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="habit-search-row">
                <label className="habit-search-box">
                  <span>馃攳</span>
                  <input type="text" value={habitQuery} onChange={(event) => setHabitQuery(event.target.value)} placeholder="鎼滅储涔犳儻鍚嶇О鎴栨弿杩?.." />
                </label>
                <button
                  type="button"
                  className="habit-view-btn"
                  onClick={() => {
                    setHabitQuery("");
                    setHabitFilter("all");
                  }}
                >
                  鈫?                </button>
                <button type="button" className={"habit-view-btn " + (habitLayout === "grid" ? "active" : "")} onClick={() => setHabitLayout("grid")}>
                  鈻?                </button>
                <button type="button" className={"habit-view-btn " + (habitLayout === "list" ? "active" : "")} onClick={() => setHabitLayout("list")}>
                  鈽?                </button>
              </div>

              <div className="habit-filter-row">
                {[
                  { key: "all", label: "鍏ㄩ儴" },
                  { key: "gain", label: "鍔犲垎" },
                  { key: "deduct", label: "鎵ｅ垎" },
                  { key: "completed", label: "宸插畬鎴? },
                  { key: "pending", label: "寰呭畬鎴? },
                  { key: "daily-multi", label: "姣忔棩澶氭" },
                  { key: "weekly-multi", label: "姣忓懆澶氭" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={"habit-filter-chip " + (habitFilter === item.key ? "active" : "")}
                    onClick={() => setHabitFilter(item.key as HabitFilter)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filteredHabits.length === 0 ? (
                <div className="loading-box habit-loading-box">褰撳墠绛涢€変笅杩樻病鏈夊尮閰嶇殑琛屼负涔犳儻銆?/div>
              ) : (
                <div className={"habit-card-grid " + habitLayout}>
                  {filteredHabits.map((habit) => {
                    const progress = getHabitProgressForDate(habit, activeDate);
                    const target = getHabitTargetCount(habit.frequency);
                    const completed = progress >= target;
                    const progressLabel = habit.frequency === "weekly-multi" ? "鏈懆 " + progress + "/" + target : "浠婃棩 " + progress + "/" + target;

                    return (
                      <article key={habit.id} className={"habit-item-card " + (completed ? "completed" : "") }>
                        <div className="habit-item-top">
                          <div className="habit-item-icon" style={{ background: "linear-gradient(135deg, " + habit.color + ", " + habit.color + "CC)" }}>
                            {habit.icon}
                          </div>
                          <div className="habit-item-meta">
                            <h3>{habit.title}</h3>
                            <p>{habit.description || "鍧氭寔瀹屾垚杩欓」琛屼负涔犳儻銆?}</p>
                          </div>
                        </div>

                        <div className="habit-item-bottom">
                          <div className="habit-item-tags">
                            <span className="habit-tag">{getHabitFrequencyLabel(habit.frequency)}</span>
                            <span className={"habit-tag points " + (habit.points >= 0 ? "gain" : "deduct")}>
                              {habit.points >= 0 ? "+" + habit.points + "猸? : habit.points + "猸?}
                            </span>
                            <span className="habit-tag progress">{progressLabel}</span>
                          </div>
                          <button
                            type="button"
                            className={"habit-check-btn " + (completed ? "done" : "")}
                            onClick={() => props.onOpenHabitCheck(habit.id, activeDate)}
                            disabled={completed}
                          >
                            {completed ? "宸叉墦鍗? : "+ 鎵撳崱"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function HabitPunchPage(props: {
  habits: HabitItem[];
  starBalance: number;
  onBack: () => void;
  onOpenHabitCreate: () => void;
  onGotoHabitStats: () => void;
  onGotoHabitManage: () => void;
  onOpenHabitCheck: (habitId: string, dateKey: string) => void;
  onToast: (text: string) => void;
}): JSX.Element {
  const [activeDay, setActiveDay] = useState(3);
  const [softDay, setSoftDay] = useState(2);
  const [habitQuery, setHabitQuery] = useState("");
  const [habitFilter, setHabitFilter] = useState<HabitFilter>("all");
  const [habitLayout, setHabitLayout] = useState<"grid" | "list">("grid");

  const todayKey = "2026-03-19";
  const activeDate = DAY_CARDS[activeDay]?.fullDate ?? DAY_CARDS[0].fullDate;
  const normalizedHabitQuery = habitQuery.trim().toLowerCase();
  const filteredHabits = props.habits.filter((habit) => {
    const matchQuery =
      !normalizedHabitQuery || `${habit.title} ${habit.description}`.toLowerCase().includes(normalizedHabitQuery);

    if (!matchQuery) return false;

    switch (habitFilter) {
      case "gain":
        return habit.points > 0;
      case "deduct":
        return habit.points < 0;
      case "completed":
        return isHabitCompletedForDate(habit, activeDate);
      case "pending":
        return !isHabitCompletedForDate(habit, activeDate);
      case "daily-multi":
        return habit.frequency === "daily-multi";
      case "weekly-multi":
        return habit.frequency === "weekly-multi";
      default:
        return true;
    }
  });

  const changeActiveDay = (nextIndex: number): void => {
    if (nextIndex < 0 || nextIndex >= DAY_CARDS.length) return;
    setSoftDay(activeDay);
    setActiveDay(nextIndex);
  };

  const dayCards = DAY_CARDS.map((day) => ({
    ...day,
    mark: props.habits.length ? "鈼? : "",
  }));

  const todayGain = props.habits.reduce((sum, habit) => {
    const count = habit.completions[todayKey] ?? 0;
    return sum + (habit.points > 0 ? habit.points * count : 0);
  }, 0);
  const todayDeduct = props.habits.reduce((sum, habit) => {
    const count = habit.completions[todayKey] ?? 0;
    return sum + (habit.points < 0 ? Math.abs(habit.points) * count : 0);
  }, 0);
  const todayChecks = props.habits.reduce((sum, habit) => sum + (habit.completions[todayKey] ?? 0), 0);

  return (
    <div className="habit-punch-page">
      <header className="habit-punch-hero">
        <div className="habit-punch-hero-inner">
          <button type="button" className="habit-punch-back" onClick={props.onBack}>
            鈫?杩斿洖
          </button>
          <div className="habit-punch-title">
            <h1>琛屼负涔犳儻鎵撳崱</h1>
            <p>鍩瑰吇濂戒範鎯紝绉疮灏忔槦鏄?/p>
          </div>
        </div>
      </header>

      <main className="habit-punch-main">
        <div className="habit-punch-stats">
          <article className="habit-punch-stat">
            <span>褰撴棩鑾峰緱</span>
            <strong className="gain">+{todayGain}</strong>
          </article>
          <article className="habit-punch-stat">
            <span>褰撴棩鎵ｉ櫎</span>
            <strong className="deduct">-{todayDeduct}</strong>
          </article>
          <article className="habit-punch-stat">
            <span>褰撴棩鎵撳崱</span>
            <strong className="check">{todayChecks}</strong>
          </article>
          <article className="habit-punch-stat">
            <span>鏄熸槦浣欓</span>
            <strong className="balance">{props.starBalance}</strong>
          </article>
        </div>

        {props.habits.length === 0 ? (
          <section className="habit-punch-board habit-punch-board-empty">
            <div className="habit-empty-state">
              <div className="habit-empty-icon" aria-hidden="true">
                鉁?              </div>
              <h3>杩樻病鏈夎涓轰範鎯?/h3>
              <p>鍏堝幓鍒涘缓涓€浜涜涓轰範鎯紝鐒跺悗寮€濮嬫墦鍗″惂!</p>
              <button type="button" className="habit-create-btn" onClick={props.onOpenHabitCreate}>
                锛?鍒涘缓涔犳儻
              </button>
            </div>
          </section>
        ) : (
          <section className="habit-punch-board">
            <div className="title-row habit-title-row">
              <div className="title-box">
                <i />
                <h2>鎴戠殑琛屼负涔犳儻</h2>
              </div>
              <div className="habit-head-actions">
                <button type="button" className="btn ai" onClick={props.onGotoHabitStats}>
                  鏁版嵁缁熻
                </button>
                <button type="button" className="btn batch" onClick={props.onGotoHabitManage}>
                  涔犳儻绠＄悊
                </button>
              </div>
            </div>

            <div className="line" />

            <div className="week-card habit-week-card">
              <div className="week-head">
                <strong>{getWeekOfMonthLabel(activeDate)}</strong>
                <div className="week-actions">
                  <button type="button" className="chip-outline" onClick={() => props.onToast("鍙ˉ鎵撳崱鍔熻兘涓嬩竴姝ヨˉ榻?)}>
                    鍙ˉ鎵撳崱
                  </button>
                  <button
                    type="button"
                    className="today"
                    onClick={() => changeActiveDay(DAY_CARDS.findIndex((item) => item.fullDate === todayKey))}
                  >
                    浠婂ぉ
                  </button>
                  <button type="button" className="round blue" onClick={() => changeActiveDay(activeDay - 1)}>
                    鈥?                  </button>
                  <button type="button" className="round blue" onClick={() => changeActiveDay(activeDay + 1)}>
                    鈥?                  </button>
                  <button type="button" className="round plain" onClick={() => props.onToast("琛屼负涔犳儻鏃ュ巻鍔熻兘涓嬩竴姝ヨˉ榻?)}>
                    鏃ュ巻
                  </button>
                </div>
              </div>

              <div className="day-grid habit-day-grid">
                {dayCards.map((day, index) => (
                  <button
                    key={`habit-punch-${day.fullDate}`}
                    type="button"
                    className={`day-box ${index === activeDay ? "active" : ""} ${index === softDay ? "soft" : ""}`}
                    onClick={() => changeActiveDay(index)}
                  >
                    <span>{day.weekday}</span>
                    <strong>{day.date}</strong>
                    <small className={`habit-day-dot ${index === activeDay ? "active" : ""}`}>{day.mark || " "}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="habit-search-row">
              <label className="habit-search-box">
                <span>馃攳</span>
                <input type="text" value={habitQuery} onChange={(event) => setHabitQuery(event.target.value)} placeholder="鎼滅储涔犳儻鍚嶇О鎴栨弿杩?.." />
              </label>
              <button
                type="button"
                className="habit-view-btn"
                onClick={() => {
                  setHabitQuery("");
                  setHabitFilter("all");
                }}
              >
                鈫?              </button>
              <button type="button" className={`habit-view-btn ${habitLayout === "grid" ? "active" : ""}`} onClick={() => setHabitLayout("grid")}>
                鈻?              </button>
              <button type="button" className={`habit-view-btn ${habitLayout === "list" ? "active" : ""}`} onClick={() => setHabitLayout("list")}>
                鈽?              </button>
            </div>

            <div className="habit-filter-row">
              {[
                { key: "all", label: "鍏ㄩ儴" },
                { key: "gain", label: "鍔犲垎" },
                { key: "deduct", label: "鎵ｅ垎" },
                { key: "completed", label: "宸插畬鎴? },
                { key: "pending", label: "寰呭畬鎴? },
                { key: "daily-multi", label: "姣忔棩澶氭" },
                { key: "weekly-multi", label: "姣忓懆澶氭" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`habit-filter-chip ${habitFilter === item.key ? "active" : ""}`}
                  onClick={() => setHabitFilter(item.key as HabitFilter)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredHabits.length === 0 ? (
              <div className="loading-box habit-loading-box">褰撳墠绛涢€変笅杩樻病鏈夊尮閰嶇殑琛屼负涔犳儻銆?/div>
            ) : (
              <div className={`habit-card-grid ${habitLayout}`}>
                {filteredHabits.map((habit) => {
                  const progress = getHabitProgressForDate(habit, activeDate);
                  const target = getHabitTargetCount(habit.frequency);
                  const completed = progress >= target;
                  const progressLabel = habit.frequency === "weekly-multi" ? `鏈懆 ${progress}/${target}` : `浠婃棩 ${progress}/${target}`;

                  return (
                    <article key={habit.id} className={`habit-item-card ${completed ? "completed" : ""}`}>
                      <div className="habit-item-top">
                        <div className="habit-item-icon" style={{ background: `linear-gradient(135deg, ${habit.color}, ${habit.color}CC)` }}>
                          {habit.icon}
                        </div>
                        <div className="habit-item-meta">
                          <h3>{habit.title}</h3>
                          <p>{habit.description || "鍧氭寔瀹屾垚杩欓」琛屼负涔犳儻銆?}</p>
                        </div>
                      </div>

                      <div className="habit-item-bottom">
                        <div className="habit-item-tags">
                          <span className="habit-tag">{getHabitFrequencyLabel(habit.frequency)}</span>
                          <span className={`habit-tag points ${habit.points >= 0 ? "gain" : "deduct"}`}>
                            {habit.points >= 0 ? `+${habit.points}猸恅 : `${habit.points}猸恅}
                          </span>
                          <span className="habit-tag progress">{progressLabel}</span>
                        </div>
                        <button
                          type="button"
                          className={`habit-check-btn ${completed ? "done" : ""}`}
                          onClick={() => props.onOpenHabitCheck(habit.id, activeDate)}
                          disabled={completed}
                        >
                          {completed ? "宸叉墦鍗? : "+ 鎵撳崱"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function HabitStatsPage(props: { habits: HabitItem[]; onBack: () => void; onGotoHabitPunch: () => void }): JSX.Element {
  const [range, setRange] = useState<"week" | "month" | "history">("week");
  const todayKey = "2026-03-19";
  const allRecords = useMemo(() => collectHabitRecords(props.habits), [props.habits]);
  const filteredRecords = useMemo(() => {
    if (range === "history") return allRecords;
    const startDate = range === "week" ? addDays(todayKey, -6) : addDays(todayKey, -29);
    return allRecords.filter((record) => record.dateKey >= startDate && record.dateKey <= todayKey);
  }, [allRecords, range]);

  const totalChecks = filteredRecords.length;
  const totalPoints = filteredRecords.reduce((sum, item) => sum + item.points, 0);
  const averagePoints = totalChecks ? (totalPoints / totalChecks).toFixed(1) : "0";

  return (
    <div className="habit-tool-page habit-stats-page">
      <header className="habit-punch-hero">
        <div className="habit-punch-hero-inner">
          <button type="button" className="habit-punch-back" onClick={props.onBack}>
            ← 返回
          </button>
          <div className="habit-punch-title">
            <h1>行为习惯统计</h1>
            <p>查看打卡数据和趋势分析</p>
          </div>
        </div>
      </header>

      <main className="habit-tool-main">
        <section className="habit-stats-summary">
          <article className="habit-stats-card blue">
            <span>打卡次数</span>
            <strong>{totalChecks}</strong>
          </article>
          <article className="habit-stats-card green">
            <span>累计积分</span>
            <strong>{totalPoints}</strong>
          </article>
          <article className="habit-stats-card violet">
            <span>习惯数量</span>
            <strong>{props.habits.length}</strong>
          </article>
          <article className="habit-stats-card orange">
            <span>平均积分</span>
            <strong>{averagePoints}</strong>
          </article>
        </section>

        <section className="habit-stats-range">
          <button type="button" className={`habit-range-btn ${range === "week" ? "active" : ""}`} onClick={() => setRange("week")}>
            本周
          </button>
          <button type="button" className={`habit-range-btn ${range === "month" ? "active" : ""}`} onClick={() => setRange("month")}>
            本月
          </button>
          <button type="button" className={`habit-range-btn ${range === "history" ? "active" : ""}`} onClick={() => setRange("history")}>
            历史记录
          </button>
        </section>

        <section className="habit-stats-panel">
          {filteredRecords.length === 0 ? (
            <div className="habit-stats-empty">
              <div className="habit-stats-empty-icon">📈</div>
              <h2>暂无打卡记录</h2>
              <p>开始打卡行为习惯，查看统计数据吧</p>
              <button type="button" className="habit-stats-goto-btn" onClick={props.onGotoHabitPunch}>
                去打卡
              </button>
            </div>
          ) : (
            <ul className="habit-record-list">
              {filteredRecords.map((record) => (
                <li key={record.id} className="habit-record-item">
                  <div className="habit-record-main">
                    <strong>{record.habitTitle}</strong>
                    <span>{record.dateKey}</span>
                  </div>
                  <div className="habit-record-side">
                    <span>{record.time}</span>
                    <b className={record.points >= 0 ? "gain" : "deduct"}>{record.points >= 0 ? `+${record.points}` : record.points}</b>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function HabitManagePage(props: {
  habits: HabitItem[];
  onBack: () => void;
  onOpenHabitCreate: () => void;
  onDeleteHabits: (habitIds: string[]) => void;
  onImportDefaultHabits: () => number;
  onImportSharedHabits: () => number;
  onToast: (text: string) => void;
}): JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isAllSelected = props.habits.length > 0 && selectedIds.length === props.habits.length;

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => props.habits.some((habit) => habit.id === id)));
  }, [props.habits]);

  const toggleSelect = (habitId: string): void => {
    setSelectedIds((current) => (current.includes(habitId) ? current.filter((item) => item !== habitId) : [...current, habitId]));
  };

  const handleImportDefault = (): void => {
    const addedCount = props.onImportDefaultHabits();
    props.onToast(addedCount ? `已添加 ${addedCount} 个默认习惯` : "默认习惯已存在");
  };

  const handleImportShared = (): void => {
    const addedCount = props.onImportSharedHabits();
    props.onToast(addedCount ? `已导入 ${addedCount} 个共享习惯` : "共享习惯已存在");
  };

  const handleBatchDelete = (): void => {
    if (!selectedIds.length) {
      props.onToast("请先选择要删除的习惯");
      return;
    }
    props.onDeleteHabits(selectedIds);
    props.onToast(`已删除 ${selectedIds.length} 个习惯`);
    setSelectedIds([]);
  };

  return (
    <div className="habit-tool-page habit-manage-page">
      <header className="habit-punch-hero">
        <div className="habit-punch-hero-inner">
          <button type="button" className="habit-punch-back" onClick={props.onBack}>
            ← 返回
          </button>
          <div className="habit-punch-title">
            <h1>行为习惯管理</h1>
            <p>创建和管理您的行为习惯</p>
          </div>
        </div>
      </header>

      <main className="habit-tool-main">
        <section className="habit-manage-toolbar">
          <div className="habit-manage-primary-actions">
            <button type="button" className="btn add" onClick={props.onOpenHabitCreate}>
              + 新建习惯
            </button>
            <button type="button" className="habit-manage-ghost-btn" onClick={handleImportShared}>
              导入其他用户习惯
            </button>
            <button type="button" className="habit-manage-ghost-btn" onClick={handleImportDefault}>
              添加默认习惯
            </button>
          </div>
          <div className="habit-manage-bulk-bar">
            <span>已选择 {selectedIds.length} / {props.habits.length}</span>
            <div className="habit-manage-bulk-actions">
              <button type="button" onClick={() => setSelectedIds(isAllSelected ? [] : props.habits.map((habit) => habit.id))}>
                {isAllSelected ? "取消全选" : "全选"}
              </button>
              <button type="button" onClick={() => setSelectedIds([])}>
                清空选择
              </button>
              <button type="button" className="danger" onClick={handleBatchDelete}>
                批量删除
              </button>
            </div>
          </div>
        </section>

        <section className="habit-manage-list-wrap">
          {props.habits.length === 0 ? (
            <div className="habit-stats-empty">
              <div className="habit-stats-empty-icon">✅</div>
              <h2>暂无习惯</h2>
              <p>点击上方按钮创建你的第一个行为习惯</p>
              <button type="button" className="habit-stats-goto-btn" onClick={props.onOpenHabitCreate}>
                新建习惯
              </button>
            </div>
          ) : (
            <div className="habit-manage-list">
              {props.habits.map((habit) => (
                <article key={habit.id} className="habit-manage-item">
                  <label className="habit-manage-check">
                    <input type="checkbox" checked={selectedIds.includes(habit.id)} onChange={() => toggleSelect(habit.id)} />
                  </label>
                  <div className="habit-manage-icon" style={{ background: `linear-gradient(135deg, ${habit.color}, ${habit.color}CC)` }}>
                    {habit.icon}
                  </div>
                  <div className="habit-manage-copy">
                    <h3>{habit.title}</h3>
                    <div className="habit-manage-tags">
                      <span>{getHabitFrequencyLabel(habit.frequency)}</span>
                      <span>{habit.points >= 0 ? `+${habit.points}` : habit.points} 积分</span>
                    </div>
                  </div>
                  <div className="habit-manage-actions">
                    <button type="button" onClick={() => props.onToast("编辑习惯功能下一步补齐")}>✎</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        props.onDeleteHabits([habit.id]);
                        props.onToast("已删除习惯");
                      }}
                    >
                      🗑
                    </button>
                    <button type="button" onClick={() => props.onToast("排序功能下一步补齐")}>⋮</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function HabitCheckModal(props: {
  habit: HabitItem;
  dateKey: string;
  onClose: () => void;
  onConfirm: (payload: { note: string; points: number }) => void;
  onToast: (text: string) => void;
}): JSX.Element {
  const [note, setNote] = useState("");
  const [shouldAdjustPoints, setShouldAdjustPoints] = useState(false);
  const [customPoints, setCustomPoints] = useState(props.habit.points);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [props]);

  const finalPoints = shouldAdjustPoints ? customPoints : props.habit.points;
  const isGain = finalPoints >= 0;

  const handleSubmit = (): void => {
    if (shouldAdjustPoints && (customPoints < -100 || customPoints > 1000)) {
      props.onToast("绉垎鏁板€奸渶瑕佸湪 -100 鍒?1000 涔嬮棿");
      return;
    }

    props.onConfirm({
      note: note.trim(),
      points: finalPoints,
    });
  };

  return (
    <div className="habit-check-modal" role="dialog" aria-modal="true" onClick={props.onClose}>
      <div className="habit-check-panel" onClick={(event) => event.stopPropagation()}>
        <header className="habit-check-header">
          <div>
            <h2>涔犳儻鎵撳崱</h2>
            <p>璁板綍浣犵殑涔犳儻瀹屾垚鎯呭喌锛寋getHabitFrequencyHint(props.habit.frequency)}</p>
          </div>
          <button type="button" className="wish-close-btn" onClick={props.onClose}>
            脳
          </button>
        </header>

        <div className="habit-check-body">
          <div className="habit-check-name">{props.habit.title}</div>

          <label className="habit-form-field">
            <span>澶囨敞锛堝彲閫夛級</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="璁板綍涓€涓嬩粖澶╃殑鎰熷彈鎴栨垚鏋?.." rows={4} />
          </label>

          <label className="habit-checkbox-line">
            <input type="checkbox" checked={shouldAdjustPoints} onChange={(event) => setShouldAdjustPoints(event.target.checked)} />
            <span>璋冩暣鏈绉垎</span>
          </label>

          {shouldAdjustPoints ? (
            <label className="habit-form-field">
              <span>绉垎鏁板€硷紙-100 鍒?1000锛?/span>
              <input type="number" min={-100} max={1000} value={customPoints} onChange={(event) => setCustomPoints(Number(event.target.value) || 0)} />
            </label>
          ) : null}

          <div className="habit-check-score-box">
            <span>{isGain ? "鑾峰緱绉垎" : "鎵ｉ櫎绉垎"}</span>
            <strong className={isGain ? "gain" : "deduct"}>
              {isGain ? "+" : ""}
              {finalPoints} 猸?            </strong>
          </div>
        </div>

        <footer className="habit-check-footer">
          <button type="button" className="habit-check-confirm" onClick={handleSubmit}>
            纭鎵撳崱
          </button>
          <button type="button" className="habit-cancel-btn" onClick={props.onClose}>
            鍙栨秷
          </button>
        </footer>
      </div>
    </div>
  );
}

function HabitCreateModal(props: {
  onClose: () => void;
  onCreateHabit: (habit: HabitItem) => void;
  onToast: (text: string) => void;
}): JSX.Element {
  const [habitName, setHabitName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily-once");
  const [points, setPoints] = useState(1);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(HABIT_ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(HABIT_COLOR_OPTIONS[0]);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [props]);

  const handleSubmit = (): void => {
    const trimmedName = habitName.trim();
    if (!trimmedName) {
      props.onToast("璇峰～鍐欎範鎯悕绉?);
      return;
    }

    if (points < -100 || points > 100) {
      props.onToast("绉垎鑼冨洿闇€瑕佸湪 -100 鍒?100 涔嬮棿");
      return;
    }

    props.onCreateHabit({
      id: `habit-${Date.now()}`,
      title: trimmedName,
      description: description.trim(),
      frequency,
      points,
      requiresApproval,
      icon: selectedIcon,
      color: selectedColor,
      completions: {},
      records: {},
      createdAt: getHabitCreatedAtLabel(),
    });
    props.onToast(`宸插垱寤轰範鎯細${trimmedName}`);
    props.onClose();
  };

  return (
    <div className="habit-modal" role="dialog" aria-modal="true" onClick={props.onClose}>
      <div className="habit-modal-panel" onClick={(event) => event.stopPropagation()}>
        <header className="habit-modal-header">
          <div>
            <h2>鏂板缓涔犳儻</h2>
            <p>鍒涘缓鍜岄厤缃偍鐨勮涓轰範鎯紝璁剧疆鎵撳崱瑙勫垯鍜岀Н鍒嗗鍔?/p>
          </div>
          <button type="button" className="wish-close-btn" onClick={props.onClose}>
            脳
          </button>
        </header>

        <div className="habit-modal-body">
          <label className="habit-form-field">
            <span>涔犳儻鍚嶇О</span>
            <input type="text" value={habitName} onChange={(event) => setHabitName(event.target.value)} placeholder="渚嬪锛氭棭璧枫€佽繍鍔? />
          </label>

          <label className="habit-form-field">
            <span>鎻忚堪</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="鎻忚堪杩欎釜涔犳儻鐨勫叿浣撳唴瀹? rows={4} />
          </label>

          <div className="habit-form-field">
            <span>涔犳儻绫诲瀷</span>
            <div className={`habit-select ${isTypeMenuOpen ? "open" : ""}`}>
              <button type="button" className="habit-select-trigger" onClick={() => setIsTypeMenuOpen((current) => !current)}>
                <strong>{getHabitFrequencyLabel(frequency)}</strong>
                <em>鈱?/em>
              </button>
              {isTypeMenuOpen ? (
                <div className="habit-select-menu">
                  {HABIT_TYPE_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`habit-select-option ${frequency === item.value ? "active" : ""}`}
                      onClick={() => {
                        setFrequency(item.value);
                        setIsTypeMenuOpen(false);
                      }}
                    >
                      <span>{item.label}</span>
                      {frequency === item.value ? <b>鉁?/b> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <small className="habit-field-hint">{getHabitFrequencyHint(frequency)}</small>
          </div>

          <label className="habit-form-field">
            <span>绉垎璁剧疆</span>
            <input type="number" value={points} min={-100} max={100} onChange={(event) => setPoints(Number(event.target.value) || 0)} />
            <small className="habit-field-hint">姝ｆ暟锛氬鍔辩Н鍒?| 璐熸暟锛氭墸闄ょН鍒嗭紙鑼冨洿锛?100 鍒?100锛?/small>
          </label>

          <label className="habit-checkbox-line">
            <input type="checkbox" checked={requiresApproval} onChange={(event) => setRequiresApproval(event.target.checked)} />
            <span>闇€瑕佸闀垮瀹氬悗鎵嶅彂绉垎</span>
          </label>
          <p className="habit-field-note">寮€鍚悗锛屾墦鍗″彧浼氳褰曚负銆屽緟瀹″畾銆嶏紝瀹堕暱瀹℃牳閫氳繃/璋冩暣鍚庢墠浼氬彂鏀炬槦鏄熴€?/p>

          <div className="habit-palette-grid">
            <div className="habit-palette-box">
              <strong>鍥炬爣</strong>
              <div className="habit-icon-picker">
                {HABIT_ICON_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`habit-icon-option ${selectedIcon === item ? "active" : ""}`}
                    onClick={() => setSelectedIcon(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="habit-palette-box">
              <strong>棰滆壊</strong>
              <div className="habit-color-picker">
                {HABIT_COLOR_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`habit-color-option ${selectedColor === item ? "active" : ""}`}
                    style={{ background: item }}
                    onClick={() => setSelectedColor(item)}
                    aria-label={item}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="habit-preview-card">
            <div className="habit-preview-icon" style={{ background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}CC)` }}>
              {selectedIcon}
            </div>
            <div>
              <strong>棰勮鏁堟灉</strong>
              <p>{habitName.trim() || "鏂颁範鎯?}</p>
            </div>
          </div>
        </div>

        <footer className="habit-modal-footer">
          <button type="button" className="habit-submit-btn" onClick={handleSubmit}>
            鍒涘缓
          </button>
          <button type="button" className="habit-cancel-btn" onClick={props.onClose}>
            鍙栨秷
          </button>
        </footer>
      </div>
    </div>
  );
}

function PlanManageModal(props: {
  plan: StudyPlan;
  onClose: () => void;
  onDelete: (planId: string) => void;
  onToast: (text: string) => void;
}): JSX.Element {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [props]);

  const deleteLabel = props.plan.repeatLabel === "姣忓ぉ" ? "鍒犻櫎閲嶅浠诲姟" : "鍒犻櫎璁″垝";

  return (
    <div className="plan-manage-modal" role="dialog" aria-modal="true" onClick={props.onClose}>
      <div className="plan-manage-panel" onClick={(event) => event.stopPropagation()}>
        <header className={`plan-manage-header plan-manage-header-${props.plan.accent}`}>
          <div className="plan-manage-title">
            <div className={`plan-manage-icon plan-manage-icon-${props.plan.accent}`}>{props.plan.icon}</div>
            <div>
              <h2>{props.plan.title}</h2>
              <span className="plan-manage-tag">{props.plan.subject}</span>
            </div>
          </div>
          <button type="button" className="wish-close-btn" onClick={props.onClose}>
            脳
          </button>
        </header>

        <div className="plan-manage-body">
          <div className="plan-manage-row">
            <div className="plan-manage-label">
              <span className="plan-detail-icon violet">鈮?/span>
              <strong>璁″垝鍐呭</strong>
            </div>
            <div className="plan-manage-value">{props.plan.content || "/"}</div>
            <div className="plan-manage-mini-actions">
              <button type="button" onClick={() => props.onToast("鍚啓鍔熻兘涓嬩竴姝ヨˉ榻?)}>
                鍚啓
              </button>
              <button type="button" onClick={() => props.onToast("鎾斁鍔熻兘涓嬩竴姝ヨˉ榻?)}>
                鎾斁
              </button>
            </div>
          </div>

          <div className="plan-manage-row">
            <div className="plan-manage-label">
              <span className="plan-detail-icon green">鈫?/span>
              <strong>閲嶅绫诲瀷</strong>
            </div>
            <div className="plan-manage-badges">
              <span className="detail-badge detail-badge-green">{props.plan.repeatLabel}</span>
            </div>
          </div>

          <div className="plan-manage-row">
            <div className="plan-manage-label">
              <span className="plan-detail-icon purple">馃棑</span>
              <strong>璁″垝鏃ユ湡</strong>
            </div>
            <div className="plan-manage-badges">
              <span className="detail-badge detail-badge-purple">{props.plan.dateStart}</span>
              <span className="detail-arrow">鈫?/span>
              <span className="detail-badge detail-badge-purple">{props.plan.dateEnd}</span>
            </div>
          </div>

          <div className="plan-manage-row">
            <div className="plan-manage-label">
              <span className="plan-detail-icon gold">鈽?/span>
              <strong>绉垎濂栧姳</strong>
            </div>
            <div className="plan-manage-badges">
              <span className="detail-badge detail-badge-gold">{props.plan.points} 猸?/span>
              {props.plan.rewardNote ? <span className="detail-badge detail-badge-soft-gold">{props.plan.rewardNote}</span> : null}
            </div>
          </div>

          <div className="plan-manage-row">
            <div className="plan-manage-label">
              <span className="plan-detail-icon slate">馃晿</span>
              <strong>鍒涘缓鏃堕棿</strong>
            </div>
            <div className="plan-manage-value">{props.plan.createdAt}</div>
          </div>

          <section className="plan-record-box">
            <div className="plan-manage-label">
              <span className="plan-detail-icon orange">馃摑</span>
              <strong>瀹屾垚璁板綍涓庡娉?/strong>
            </div>
            <div className="plan-record-note">
              <div className="plan-record-date">{props.plan.dateStart}</div>
              <div className="plan-record-title">瀛︿範鍚褰?</div>
              <ul className="plan-record-items">
                {props.plan.records.map((record, index) => (
                  <li key={`${props.plan.id}-${index}`}>
                    <span>
                      {record.start} - {record.end}
                    </span>
                    <em>{record.minutes}鍒嗛挓</em>
                  </li>
                ))}
              </ul>
              {props.plan.attachmentName ? (
                <div className="plan-attachment-box">
                  <strong>闄勪欢:</strong>
                  <div className="plan-attachment-file">
                    <span>{props.plan.attachmentName}</span>
                    <small>{props.plan.attachmentSize}</small>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <footer className="plan-manage-actions">
          <button type="button" className="plan-delete-btn" onClick={() => props.onDelete(props.plan.id)}>
            {deleteLabel}
          </button>
          <button type="button" className="plan-edit-btn" onClick={() => props.onToast("缂栬緫璁″垝涓嬩竴姝ユ帴鍏ヨ〃鍗?)}>
            缂栬緫璁″垝
          </button>
        </footer>
      </div>
    </div>
  );
}

function PlanBoardManageOverlay(props: {
  initialDate: string;
  studyPlans: StudyPlan[];
  onClose: () => void;
  onSave: () => void;
  onDeleteSelected: (planIds: string[]) => void;
  onCopySelected: (planIds: string[], targetDate: string) => void;
  onReorderPlans: (dateKey: string, draggedPlanId: string, targetPlanId: string) => void;
  onToast: (text: string) => void;
}): JSX.Element {
  const todayKey = "2026-03-19";
  const [selectedDate, setSelectedDate] = useState(props.initialDate);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(props.initialDate.slice(0, 7));
  const [copyTargetDate, setCopyTargetDate] = useState(props.initialDate);
  const [copyCalendarMonth, setCopyCalendarMonth] = useState(props.initialDate.slice(0, 7));

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !isCopyModalOpen) {
        props.onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isCopyModalOpen, props]);

  const visiblePlans = props.studyPlans.filter((plan) => plan.dayKey === selectedDate);
  const isAllSelected = visiblePlans.length > 0 && visiblePlans.every((plan) => selectedIds.includes(plan.id));
  const calendarDays = buildCalendarDays(calendarMonth);
  const copyCalendarDays = buildCalendarDays(copyCalendarMonth);
  const currentMonthTitle = `${calendarMonth.slice(0, 4)}骞?{Number(calendarMonth.slice(5, 7))}鏈坄;
  const copyMonthTitle = `${copyCalendarMonth.slice(0, 4)}骞?{Number(copyCalendarMonth.slice(5, 7))}鏈坄;
  const planDateSet = useMemo(() => new Set(props.studyPlans.map((plan) => plan.dayKey)), [props.studyPlans]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedDate]);

  useEffect(() => {
    setCopyTargetDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setCopyCalendarMonth(copyTargetDate.slice(0, 7));
  }, [copyTargetDate]);

  const toggleSelectAll = (): void => {
    if (isAllSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(visiblePlans.map((plan) => plan.id));
  };

  const toggleSelectOne = (planId: string): void => {
    setSelectedIds((current) => (current.includes(planId) ? current.filter((item) => item !== planId) : [...current, planId]));
  };

  const selectedCount = selectedIds.length;

  const handleDrop = (targetPlanId: string): void => {
    if (!draggedPlanId || draggedPlanId === targetPlanId) return;
    props.onReorderPlans(selectedDate, draggedPlanId, targetPlanId);
    setDraggedPlanId(null);
  };

  const handleCopy = (): void => {
    if (!selectedCount) {
      props.onToast("璇峰厛鍕鹃€夎鍒?);
      return;
    }
    setIsCopyModalOpen(true);
  };

  const selectedDateLabel = selectedDate === todayKey ? `浠婂ぉ (${getWeekdayLabel(selectedDate)})` : `${selectedDate} (${getWeekdayLabel(selectedDate)})`;
  const copyDateLabel = `${copyTargetDate} ${getWeekdayLabel(copyTargetDate) ? `(${getWeekdayLabel(copyTargetDate)})` : ""}`.trim();

  return (
    <div className="plan-board-manage">
      <header className="plan-board-manage-header">
        <div className="plan-board-manage-bar">
          <button type="button" className="plan-board-cancel" onClick={props.onClose}>
            脳 鍙栨秷
          </button>
          <h1>璁″垝绠＄悊</h1>
          <button type="button" className="plan-board-save" onClick={props.onSave}>
            淇濆瓨
          </button>
        </div>
        <div className="plan-board-switcher">
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayKey);
              setCalendarMonth(todayKey.slice(0, 7));
              setIsCalendarOpen(false);
            }}
          >
            浠婂ぉ
          </button>
          <button
            type="button"
            onClick={() => {
              const prevDate = addDays(selectedDate, -1);
              setSelectedDate(prevDate);
              setCalendarMonth(prevDate.slice(0, 7));
              setIsCalendarOpen(false);
            }}
          >
            鈫?          </button>
          <div className="plan-board-date-wrap">
            <button type="button" className="plan-board-date-trigger" onClick={() => setIsCalendarOpen((current) => !current)}>
              馃搮 {selectedDateLabel}
            </button>
            {isCalendarOpen ? (
              <div className="plan-board-calendar">
                <div className="plan-board-calendar-head">
                  <button type="button" onClick={() => setCalendarMonth((current) => shiftMonth(current, -1))}>
                    鈥?                  </button>
                  <strong>{currentMonthTitle}</strong>
                  <button type="button" onClick={() => setCalendarMonth((current) => shiftMonth(current, 1))}>
                    鈥?                  </button>
                </div>
                <div className="plan-board-calendar-weekdays">
                  {["涓€", "浜?, "涓?, "鍥?, "浜?, "鍏?, "鏃?].map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="plan-board-calendar-grid">
                  {calendarDays.map((item) => (
                    <button
                      key={item.dateKey}
                      type="button"
                      className={`plan-board-calendar-day ${item.inCurrentMonth ? "" : "muted"} ${selectedDate === item.dateKey ? "active" : ""} ${todayKey === item.dateKey ? "today" : ""}`}
                      onClick={() => {
                        setSelectedDate(item.dateKey);
                        setCalendarMonth(item.dateKey.slice(0, 7));
                        setIsCalendarOpen(false);
                      }}
                    >
                      <span>{item.dayNumber}</span>
                      {planDateSet.has(item.dateKey) ? <i /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              const nextDate = addDays(selectedDate, 1);
              setSelectedDate(nextDate);
              setCalendarMonth(nextDate.slice(0, 7));
              setIsCalendarOpen(false);
            }}
          >
            鈫?          </button>
        </div>
      </header>

      <main className="plan-board-manage-main">
        <div className="plan-board-action-row">
          <label className="plan-board-select-all">
            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
            <span>{selectedCount ? `宸查€夋嫨 ${selectedCount} 涓猔 : "鍏ㄩ€?}</span>
          </label>
          <div className="plan-board-bulk-actions">
            <button type="button" className="plan-board-copy-btn" onClick={handleCopy}>
              澶嶅埗鍒?..
            </button>
            <button
              type="button"
              className="plan-board-share-btn"
              onClick={() => props.onToast(selectedCount ? "鍒嗕韩璁″垝鍔熻兘涓嬩竴姝ヨˉ榻? : "璇峰厛鍕鹃€夎鍒?)}
            >
              鍒嗕韩璁″垝
            </button>
            <button
              type="button"
              className="plan-board-delete-btn"
              onClick={() => {
                if (!selectedCount) {
                  props.onToast("璇峰厛鍕鹃€夎鍒?);
                  return;
                }
                props.onDeleteSelected(selectedIds);
                setSelectedIds([]);
              }}
            >
              鍒犻櫎閫変腑
            </button>
          </div>
        </div>

        <section className="plan-board-tip">
          <strong>浣跨敤璇存槑:</strong>
          <ul>
            <li>鐐瑰嚮鏃ユ湡閫夋嫨鍣ㄥ彲鍒囨崲绠＄悊鏃ユ湡</li>
            <li>鎷栧姩鍙充晶鎵嬫焺鍥炬爣鍙皟鏁村涔犺鍒掗『搴?/li>
            <li>鍕鹃€夊閫夋鍙壒閲忔搷浣滈€変腑浠诲姟</li>
            <li>闈炲綋澶╀篃鍙鍒惰鍒掑埌鎸囧畾鏃ユ湡</li>
            <li>瀹屾垚鍚庣偣鍑诲彸涓婅鈥滀繚瀛樷€濇寜閽?/li>
          </ul>
        </section>

        <section className="plan-board-list">
          {visiblePlans.map((plan) => (
            <article
              key={plan.id}
              className={`plan-board-item ${draggedPlanId === plan.id ? "dragging" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(plan.id)}
            >
              <label className="plan-board-item-check">
                <input type="checkbox" checked={selectedIds.includes(plan.id)} onChange={() => toggleSelectOne(plan.id)} />
              </label>
              <div className="plan-board-item-copy">
                <div className="plan-board-item-tags">
                  <span className="plan-board-tag subject">{plan.subject}</span>
                  <span className="plan-board-tag repeat">{plan.repeatLabel}</span>
                </div>
                <h3>{plan.title}</h3>
              </div>
              <button
                type="button"
                className="plan-board-drag"
                draggable
                onDragStart={() => setDraggedPlanId(plan.id)}
                onDragEnd={() => setDraggedPlanId(null)}
                aria-label="鎷栨嫿鎺掑簭"
              >
                鈰嫯
              </button>
            </article>
          ))}
          {visiblePlans.length === 0 ? <div className="loading-box">璇ユ棩鏈熸殏鏃犺鍒?/div> : null}
        </section>
      </main>

      {isCopyModalOpen ? (
        <div className="plan-copy-modal" role="dialog" aria-modal="true" onClick={() => setIsCopyModalOpen(false)}>
          <div className="plan-copy-panel" onClick={(event) => event.stopPropagation()}>
            <div className="plan-copy-head">
              <h2>澶嶅埗鍒版寚瀹氭棩鏈?/h2>
              <button type="button" className="wish-close-btn" onClick={() => setIsCopyModalOpen(false)}>
                脳
              </button>
            </div>
            <p>
              灏嗗綋鍓嶉€変腑鐨?{selectedCount} 涓鍒掍换鍔★紝浠庛€恵selectedDateLabel}銆戝鍒跺埌锛?            </p>
            <div className="plan-copy-date-box">
              <button type="button" className="plan-board-date-trigger copy" onClick={() => setCopyCalendarMonth(copyTargetDate.slice(0, 7))}>
                馃搮 {copyDateLabel}
              </button>
              <div className="plan-board-calendar copy">
                <div className="plan-board-calendar-head">
                  <button type="button" onClick={() => setCopyCalendarMonth((current) => shiftMonth(current, -1))}>
                    鈥?                  </button>
                  <strong>{copyMonthTitle}</strong>
                  <button type="button" onClick={() => setCopyCalendarMonth((current) => shiftMonth(current, 1))}>
                    鈥?                  </button>
                </div>
                <div className="plan-board-calendar-weekdays">
                  {["涓€", "浜?, "涓?, "鍥?, "浜?, "鍏?, "鏃?].map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="plan-board-calendar-grid">
                  {copyCalendarDays.map((item) => (
                    <button
                      key={`copy-${item.dateKey}`}
                      type="button"
                      className={`plan-board-calendar-day ${item.inCurrentMonth ? "" : "muted"} ${copyTargetDate === item.dateKey ? "active" : ""} ${todayKey === item.dateKey ? "today" : ""}`}
                      onClick={() => setCopyTargetDate(item.dateKey)}
                    >
                      <span>{item.dayNumber}</span>
                      {planDateSet.has(item.dateKey) ? <i /> : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="plan-copy-actions">
              <button type="button" className="plan-delete-btn" onClick={() => setIsCopyModalOpen(false)}>
                鍙栨秷
              </button>
              <button
                type="button"
                className="quick-confirm-btn"
                onClick={() => {
                  props.onCopySelected(selectedIds, copyTargetDate);
                  setSelectedIds([]);
                  setIsCopyModalOpen(false);
                }}
              >
                纭澶嶅埗
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuickCompleteModal(props: {
  plan: StudyPlan;
  onClose: () => void;
  onToast: (text: string) => void;
  onComplete: (payload: { seconds: number; note: string; startTime?: string; endTime?: string }) => void;
}): JSX.Element {
  const [mode, setMode] = useState<QuickCompleteMode>("duration");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [actualStart, setActualStart] = useState("19:00");
  const [actualEnd, setActualEnd] = useState("19:10");
  const [note, setNote] = useState("");

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [props]);

  const inputSeconds = hours * 3600 + minutes * 60 + seconds;
  const actualSeconds = useMemo(() => {
    const [startHour, startMinute] = actualStart.split(":").map(Number);
    const [endHour, endMinute] = actualEnd.split(":").map(Number);
    return endHour * 3600 + endMinute * 60 - (startHour * 3600 + startMinute * 60);
  }, [actualEnd, actualStart]);
  const totalSeconds = mode === "duration" ? inputSeconds : actualSeconds;
  const totalMinutesLabel = Math.max(0, Math.round(totalSeconds / 60));
  const presetOptions = [15, 30, 45, 60, 90, 120];

  const applyPreset = (presetMinutes: number): void => {
    setHours(Math.floor(presetMinutes / 60));
    setMinutes(presetMinutes % 60);
    setSeconds(0);
  };

  const handleConfirm = (): void => {
    if (mode === "actual" && actualSeconds <= 0) {
      props.onToast("瀹為檯鏃堕棿缁撴潫蹇呴』鏅氫簬寮€濮?);
      return;
    }

    if (totalSeconds <= 0) {
      props.onToast("璇峰厛杈撳叆瀹屾垚鏃堕暱");
      return;
    }

    props.onComplete({
      seconds: totalSeconds,
      note,
      startTime: mode === "actual" ? actualStart : undefined,
      endTime: mode === "actual" ? actualEnd : undefined,
    });
  };

  return (
    <div className="quick-complete-modal" role="dialog" aria-modal="true" onClick={props.onClose}>
      <div className="quick-complete-panel" onClick={(event) => event.stopPropagation()}>
        <header className="quick-complete-header">
          <div>
            <h2>蹇€熷畬鎴愪换鍔?/h2>
            <p>{props.plan.title}</p>
          </div>
          <button type="button" className="wish-close-btn" onClick={props.onClose}>
            脳
          </button>
        </header>

        <div className="quick-complete-card">
          <span className="plan-pill plan-pill-repeat">{props.plan.subject}</span>
          <span>{props.plan.dateStart}</span>
          <h3>{props.plan.title}</h3>
          <p>{props.plan.content || props.plan.title}</p>
        </div>

        <section className="quick-complete-section">
          <div className="quick-complete-title">鑰楁椂璁剧疆</div>
          <div className="quick-mode-tabs">
            <button type="button" className={mode === "duration" ? "active" : ""} onClick={() => setMode("duration")}>
              杈撳叆鏃堕暱
            </button>
            <button type="button" className={mode === "actual" ? "active" : ""} onClick={() => setMode("actual")}>
              瀹為檯鏃堕棿
            </button>
          </div>

          {mode === "duration" ? (
            <>
              <div className="quick-time-grid">
                <label>
                  <span>灏忔椂</span>
                  <input type="number" min={0} max={23} value={hours} onChange={(event) => setHours(Number(event.target.value) || 0)} />
                </label>
                <label>
                  <span>鍒嗛挓</span>
                  <input type="number" min={0} max={59} value={minutes} onChange={(event) => setMinutes(Number(event.target.value) || 0)} />
                </label>
                <label>
                  <span>绉?/span>
                  <input type="number" min={0} max={59} value={seconds} onChange={(event) => setSeconds(Number(event.target.value) || 0)} />
                </label>
              </div>
              <div className="quick-total-bar">鎬昏: {totalMinutesLabel}鍒嗛挓</div>
              <div className="quick-presets">
                {presetOptions.map((item) => (
                  <button key={item} type="button" onClick={() => applyPreset(item)}>
                    {item >= 60 ? `${item / 60}灏忔椂` : `${item}鍒嗛挓`}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="quick-actual-grid">
              <label>
                <span>寮€濮嬫椂闂?/span>
                <input type="time" value={actualStart} onChange={(event) => setActualStart(event.target.value)} />
              </label>
              <label>
                <span>缁撴潫鏃堕棿</span>
                <input type="time" value={actualEnd} onChange={(event) => setActualEnd(event.target.value)} />
              </label>
              <div className="quick-total-bar">鎬昏: {Math.max(0, Math.round(actualSeconds / 60))}鍒嗛挓</div>
            </div>
          )}
        </section>

        <section className="quick-complete-section">
          <label className="quick-note-field">
            <span>澶囨敞锛堝彲閫夛級</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="璁板綍瀛︿範蹇冨緱鎴栫瑪璁?.." />
          </label>
          <div className="quick-upload-box">
            <strong>澶囨敞闄勪欢锛堝浘鐗?闊抽/瑙嗛姣忔潯鏈€澶?涓級</strong>
            <span>鐐瑰嚮涓婁紶鎴栨嫋鎷芥枃浠跺埌姝ゅ</span>
          </div>
        </section>

        <footer className="quick-complete-actions">
          <button type="button" className="plan-delete-btn" onClick={props.onClose}>
            鍙栨秷
          </button>
          <button type="button" className="quick-confirm-btn" onClick={handleConfirm}>
            纭瀹屾垚
          </button>
        </footer>
      </div>
    </div>
  );
}

function StudyTimerPage(props: {
  plan: StudyPlan;
  onBack: () => void;
  onToast: (text: string) => void;
  onComplete: (payload: { seconds: number; mode: TimerMode }) => void;
}): JSX.Element {
  const countdownBase = props.plan.durationMinutes * 60 || 600;
  const pomodoroBase = 25 * 60;
  const [mode, setMode] = useState<TimerMode>("elapsed");
  const [running, setRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(countdownBase);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(pomodoroBase);
  const [pomodoroRound, setPomodoroRound] = useState(1);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      if (mode === "elapsed") {
        setElapsedSeconds((current) => current + 1);
        return;
      }

      if (mode === "countdown") {
        setCountdownSeconds((current) => {
          if (current <= 1) {
            window.clearInterval(timer);
            setRunning(false);
            props.onToast("鍊掕鏃剁粨鏉?);
            return 0;
          }
          return current - 1;
        });
        return;
      }

      setPomodoroSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setPomodoroRound((round) => round + 1);
          props.onToast("鐣寗閽熷畬鎴愪竴杞?);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, props, running]);

  const switchMode = (nextMode: TimerMode): void => {
    setMode(nextMode);
    setRunning(false);
    setHasStarted(false);
    setElapsedSeconds(0);
    setCountdownSeconds(countdownBase);
    setPomodoroSeconds(pomodoroBase);
  };

  const visibleSeconds = mode === "elapsed" ? elapsedSeconds : mode === "countdown" ? countdownSeconds : pomodoroSeconds;
  const [hoursText, minutesText, secondsText] = toTimerUnits(visibleSeconds);
  const consumedSeconds = mode === "elapsed" ? elapsedSeconds : mode === "countdown" ? countdownBase - countdownSeconds : pomodoroBase - pomodoroSeconds;
  const statusText = running ? "杩涜涓? : hasStarted ? "宸叉殏鍋? : "鏈紑濮?;
  const modeTitle = mode === "elapsed" ? "姝ｈ鏃? : mode === "countdown" ? "鍊掕鏃? : "鐣寗閽?;
  const modeNote =
    mode === "elapsed"
      ? "馃挕 姝ｈ鏃舵ā寮忥細鑷敱璁℃椂锛岄€傚悎鐏垫椿瀹夋帓瀛︿範鏃堕棿"
      : mode === "countdown"
        ? "鈴?鍊掕鏃舵ā寮忥細灏嗘寜璁″垝榛樿鏃堕暱杩涜鍊掕鏃舵彁閱?
        : "馃崊 鐣寗閽熸ā寮忥細25鍒嗛挓宸ヤ綔鏃堕棿 + 5鍒嗛挓浼戞伅";

  const handlePrimary = (): void => {
    if (running) {
      setRunning(false);
      return;
    }

    if (hasStarted) {
      props.onComplete({
        seconds: Math.max(consumedSeconds, 60),
        mode,
      });
      return;
    }

    setHasStarted(true);
    setRunning(true);
  };

  const primaryLabel = running ? "鏆傚仠瀛︿範" : hasStarted ? "瀹屾垚浠诲姟" : "寮€濮嬪涔?;

  return (
    <div className="study-timer-page">
      <header className="study-timer-header">
        <div className="study-timer-topbar">
          <button type="button" className="study-timer-back" onClick={props.onBack}>
            鈫?杩斿洖
          </button>
        </div>
        <div className="study-timer-copy">
          <span className="study-timer-subject">{props.plan.subject}</span>
          <h1>{props.plan.title}</h1>
          <p>{props.plan.content || props.plan.title}</p>
        </div>
      </header>

      <main className="study-timer-main">
        <section className="study-timer-card">
          <div className="study-timer-toolbar">
            <div className="study-timer-tabs">
              <button type="button" className={mode === "elapsed" ? "active" : ""} onClick={() => switchMode("elapsed")}>
                姝ｈ
              </button>
              <button type="button" className={mode === "countdown" ? "active" : ""} onClick={() => switchMode("countdown")}>
                鍊掕
              </button>
              <button type="button" className={mode === "pomodoro" ? "active" : ""} onClick={() => switchMode("pomodoro")}>
                鐣寗
              </button>
            </div>
            <button type="button" className="study-sound-btn" onClick={() => props.onToast("闊虫晥璁剧疆涓嬩竴姝ヨˉ榻?)}>
              闊虫晥
            </button>
          </div>

          {mode === "countdown" ? <div className="timer-mode-pill">鐩爣鏃堕暱: 00:{String(props.plan.durationMinutes).padStart(2, "0")}:00锛堣鍒掗粯璁ゆ椂闀匡級</div> : null}
          {mode === "pomodoro" ? <div className="timer-mode-pill">鏃堕暱: 25:00</div> : null}
          {mode === "pomodoro" ? <div className="timer-round-copy">绗?{pomodoroRound} 涓暘鑼勯挓 路 宸插畬鎴?{pomodoroRound - 1} 涓?/div> : null}

          <div className="study-timer-title">{modeTitle}</div>
          <div className="study-timer-display">
            <div className="timer-box timer-box-blue">
              <strong>{hoursText}</strong>
              <span>灏忔椂</span>
            </div>
            <em>:</em>
            <div className="timer-box timer-box-purple">
              <strong>{minutesText}</strong>
              <span>鍒嗛挓</span>
            </div>
            <em>:</em>
            <div className="timer-box timer-box-orange">
              <strong>{secondsText}</strong>
              <span>绉?/span>
            </div>
          </div>

          <div className="study-timer-status">{statusText}</div>
          <button type="button" className="study-timer-primary" onClick={handlePrimary}>
            {primaryLabel}
          </button>
          <div className="study-timer-note">{modeNote}</div>
        </section>

        <button type="button" className="study-recording-pill" onClick={() => props.onToast("瀛︿範褰曢煶鍔熻兘涓嬩竴姝ヨˉ榻?)}>
          瀛︿範褰曢煶 (0)
        </button>
      </main>
    </div>
  );
}

function AddPlanPage(props: { onBack: () => void; onToast: (text: string) => void }): JSX.Element {
  const [startDate, setStartDate] = useState("2026-03-20");
  const [subject, setSubject] = useState("");
  const [planName, setPlanName] = useState("");
  const [planContent, setPlanContent] = useState("");
  const [repeatRule, setRepeatRule] = useState("浠呭綋澶?);
  const [timeMode, setTimeMode] = useState<TimeMode>("duration");
  const [duration, setDuration] = useState(25);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("20:30");
  const [customPoints, setCustomPoints] = useState(false);

  const repeatHint =
    repeatRule === "浠呭綋澶?
      ? `璇ヤ换鍔″皢鍙湪 ${startDate} 杩欎竴澶╁嚭鐜癭
      : repeatRule === "姣忔棩"
        ? `璇ヤ换鍔″皢浠?${startDate} 寮€濮嬫瘡鏃ラ噸澶峘
        : `璇ヤ换鍔″皢浠?${startDate} 寮€濮嬫寜姣忓懆閲嶅`;

  const handleSave = (): void => {
    if (!subject || !planName.trim()) {
      props.onToast("璇峰～鍐欑被鍒爣绛惧拰璁″垝鍚嶇О");
      return;
    }

    if (timeMode === "range" && startTime >= endTime) {
      props.onToast("缁撴潫鏃堕棿闇€瑕佹櫄浜庡紑濮嬫椂闂?);
      return;
    }

    props.onToast(`宸蹭繚瀛樿鍒掞細${planName}`);
    props.onBack();
  };

  return (
    <div className="add-page">
      <header className="add-header">
        <div className="add-head-inner">
          <button type="button" className="back-btn" onClick={props.onBack}>
            鈫?          </button>
          <div className="add-head-copy">
            <h1>娣诲姞瀛︿範璁″垝</h1>
            <p>
              <span>姝ｅ湪涓?/span>
              <b>{startDate}</b>
              <span>娣诲姞璁″垝</span>
            </p>
          </div>
        </div>
      </header>

      <main className="add-main">
        <div className="add-card">
          <section className="single-block">
            <div className="single-label">
              <span className="single-icon violet">鏃?/span>
              <h3>
                璧峰鏃ユ湡 <em>鍙€?/em>
              </h3>
            </div>
            <input className="single-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <p className="single-hint">
              閫夋嫨璁″垝鐨勮捣濮嬫棩鏈燂紝榛樿涓轰粖澶┿€傚浜庘€滀粎褰撳ぉ鈥濈被鍨嬶紝浠诲姟灏嗗湪姝ゆ棩鏈熷垱寤猴紱瀵逛簬閲嶅绫诲瀷锛屼粠姝ゆ棩鏈熷紑濮嬬敓鎴愪换鍔°€?            </p>
          </section>

          <section className="single-block">
            <div className="single-label">
              <span className="single-icon blue">绛?/span>
              <h3>
                绫诲埆鏍囩 <em className="required">*</em>
              </h3>
            </div>
            <select className="single-input" value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option value="">璇烽€夋嫨绫诲埆</option>
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </section>

          <section className="single-block">
            <div className="single-label">
              <span className="single-icon green">鍚?/span>
              <h3>
                璁″垝鍚嶇О <em className="required">*</em>
              </h3>
            </div>
            <input
              className="single-input"
              type="text"
              placeholder="濡傦細姣忓ぉ鑳?0涓嫳璇崟璇?
              maxLength={100}
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
            />
            <div className="counter-row">
              <span>闄愬埗 1-100 瀛?/span>
              <span>{planName.length}/100</span>
            </div>
          </section>

          <section className="single-block">
            <div className="single-label">
              <span className="single-icon purple">鍐?/span>
              <h3>
                璁″垝鍐呭 <em>鍙€?/em>
              </h3>
            </div>
            <textarea
              className="single-area"
              placeholder="濡傦細鍒╃敤鏅ㄨ鏃堕棿锛岀粨鍚堣鏈?Unit1 鍗曡瘝琛?
              maxLength={1000}
              value={planContent}
              onChange={(event) => setPlanContent(event.target.value)}
            />
            <div className="counter-row">
              <span>闄愬埗 0-1000 瀛?/span>
              <span>{planContent.length}/1000</span>
            </div>
          </section>

          <section className="single-block">
            <div className="single-label">
              <span className="single-icon orange">寰?/span>
              <h3>
                閲嶅绫诲瀷 <em className="required">*</em>
              </h3>
            </div>
            <select className="single-input" value={repeatRule} onChange={(event) => setRepeatRule(event.target.value)}>
              <option value="浠呭綋澶?>浠呭綋澶╋紙{startDate}锛?/option>
              <option value="姣忔棩">姣忔棩</option>
              <option value="姣忓懆">姣忓懆</option>
            </select>
            <p className="single-hint strong">{repeatHint}</p>
          </section>

          <section className="single-block">
            <div className="single-label">
              <span className="single-icon cyan">鏃?/span>
              <h3>
                鏃堕棿璁剧疆 <em>鍙€?/em>
              </h3>
            </div>

            <div className="mode-switch">
              <button
                type="button"
                className={`mode-tab ${timeMode === "range" ? "active" : ""}`}
                onClick={() => setTimeMode("range")}
              >
                鏃堕棿娈?              </button>
              <button
                type="button"
                className={`mode-tab ${timeMode === "duration" ? "active" : ""}`}
                onClick={() => setTimeMode("duration")}
              >
                鏃堕暱
              </button>
            </div>

            {timeMode === "range" ? (
              <div className="time-panel range-panel">
                <div className="time-panel-title">璁剧疆璁″垝鐨勬椂闂存</div>
                <div className="time-range-grid">
                  <label className="time-field">
                    <span>寮€濮嬫椂闂?/span>
                    <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                  </label>
                  <label className="time-field">
                    <span>缁撴潫鏃堕棿</span>
                    <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                  </label>
                </div>
                <p className="panel-hint">璁剧疆璁″垝鐨勫浐瀹氭椂闂存锛屽 {startTime}-{endTime}</p>
              </div>
            ) : (
              <div className="time-panel duration-panel">
                <div className="time-panel-title">璁剧疆璁″垝鐨勯浼版椂闀?/div>
                <div className="duration-grid">
                  {DURATION_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`duration-chip ${duration === item ? "active" : ""}`}
                      onClick={() => setDuration(item)}
                    >
                      {item}鍒嗛挓
                    </button>
                  ))}
                </div>
                <label className="custom-duration">
                  <span>鑷畾涔夋椂闀?</span>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value) || 0)}
                  />
                  <span>鍒嗛挓</span>
                </label>
                <p className="panel-hint">璁剧疆璁″垝鐨勯璁″涔犳椂闀匡紝鍙湪璁℃椂鍣ㄤ腑浣跨敤</p>
              </div>
            )}
          </section>

          <section className="single-block points-section">
            <div className="single-label">
              <span className="single-icon gold">鍒?/span>
              <h3>
                绉垎璁剧疆 <em>鍙€?/em>
              </h3>
            </div>

            <div className="score-box">
              <div className="score-head">
                <div>
                  <strong>鍚敤鑷畾涔夌Н鍒?/strong>
                  <p>涓轰换鍔¤缃浐瀹氱Н鍒嗘暟鍊硷紝鏇夸唬绯荤粺榛樿璁＄畻瑙勫垯</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={customPoints} onChange={(event) => setCustomPoints(event.target.checked)} />
                  <i />
                </label>
              </div>
              <div className="rule-box">
                <span>绯荤粺榛樿瑙勫垯</span>
                <ul>
                  <li>鍩虹绉垎锛? 鏄?/li>
                  <li>鏃堕棿濂栧姳锛?0鍒嗛挓+1鏄燂紝60鍒嗛挓+2鏄?/li>
                  <li>鏃╄捣鍔犳垚锛?:00-8:00 脳 1.2鍊?/li>
                  <li>鍛ㄦ湯鍔犳垚锛毭?1.5鍊?/li>
                </ul>
              </div>
            </div>
          </section>

          <section className="single-block attachment-section">
            <div className="single-label">
              <span className="single-icon slate">闄?/span>
              <h3>
                闄勪欢 <em>鍙€?/em>
              </h3>
            </div>
            <p className="attachment-copy">涓婁紶鍥剧墖銆侀煶棰戞垨瑙嗛锛堝彲閫夛級</p>
            <div className="upload-box">
              <div className="upload-icon">鈫?/div>
              <strong>鐐瑰嚮涓婁紶鎴栨嫋鎷芥枃浠跺埌姝ゅ</strong>
              <span>鏀寔鍥剧墖銆侀煶棰戙€佽棰戙€丳DF锛堟渶澶?涓紝鍗曚釜鏈€澶?0MB锛?/span>
            </div>
          </section>

          <footer className="bottom-bar single-actions">
            <button type="button" className="cancel-btn" onClick={props.onBack}>
              鍙栨秷
            </button>
            <button type="button" className="save-btn" onClick={handleSave}>
              淇濆瓨璁″垝
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}

function BatchPage(props: { onBack: () => void; onToast: (text: string) => void }): JSX.Element {
  const [inputText, setInputText] = useState("");
  const [startDate, setStartDate] = useState("2026-03-18");
  const [repeatRule, setRepeatRule] = useState("浠呭綋澶?);
  const [minutes, setMinutes] = useState(25);
  const [customPoints, setCustomPoints] = useState(false);

  const previewItems = useMemo(() => parsePreview(inputText), [inputText]);

  const resetForm = (): void => {
    setInputText("");
    setStartDate("2026-03-18");
    setRepeatRule("浠呭綋澶?);
    setMinutes(25);
    setCustomPoints(false);
  };

  return (
    <div className="batch-page">
      <header className="batch-header">
        <div className="batch-head-inner">
          <button type="button" className="back-btn" onClick={props.onBack}>
            鈫?          </button>
          <div>
            <h1>鎵归噺娣诲姞瀛︿範璁″垝</h1>
            <p>蹇€熸坊鍔犲涓涔犱换鍔?/p>
          </div>
        </div>
      </header>

      <main className="batch-main">
        <section className="tip-banner">
          <div className="tip-icon">馃搫</div>
          <div>
            <strong>鍏充簬闄勪欢鍔熻兘</strong>
            <p>鎵归噺娣诲姞鏆備笉鏀寔涓婁紶闄勪欢銆傚鏋滈渶瑕佷负璁″垝娣诲姞鍥剧墖銆侀煶棰戞垨瑙嗛闄勪欢锛岃鍦ㄥ垱寤哄悗杩涘叆缂栬緫椤垫坊鍔犮€?/p>
          </div>
        </section>

        <section className="batch-grid">
          <article className="panel left">
            <h2>杈撳叆瀛︿範璁″垝</h2>

            <div className="format-card">
              <strong>杈撳叆鏍煎紡璇存槑锛?/strong>
              <ul>
                <li>绗竴琛屽啓绫诲埆鍚嶇О锛堝锛氳鏂囥€佹暟瀛︼紝鏈€澶?0瀛楋級</li>
                <li>鎺ヤ笅鏉ュ啓浠诲姟鍒楄〃锛屾瘡琛屾牸寮忥細鏁板瓧 + 鏍囩偣 + 浠诲姟</li>
                <li>鏀寔鐨勬爣鐐癸細`.`銆乣銆乣銆乣)`</li>
                <li>鍙互娣诲姞澶氫釜绫诲埆锛岀┖琛屼細琚拷鐣?/li>
              </ul>
              <div className="example-box">
                <p>璇枃</p>
                <p>1. 鑳岃銆婃櫄闇佽惤銆?8-30</p>
                <p>2銆侀涔犱笁鍗曞厓璇枃鍥湴</p>
                <p>鏁板</p>
                <p>1銆佸畬鎴愮粌涔犲拰绛涙煡</p>
              </div>
            </div>

            <div className="ai-row">
              <span>鏍煎紡涓嶅涔熷彲浠ヨ瘯璇?AI 瑙ｆ瀽</span>
              <button type="button" className="tiny-btn">
                AI瑙ｆ瀽
              </button>
            </div>

            <textarea
              className="input-area"
              placeholder="璇锋寜鐓ф牸寮忚緭鍏ュ涔犺鍒?.."
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
            />

            <h3>缁熶竴璁剧疆锛堝簲鐢ㄥ埌鎵€鏈夎鍒掞級</h3>

            <label className="field">
              <span>璧峰鏃ユ湡锛堝彲閫夛級</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <p className="hint">閫夋嫨璁″垝璧峰鏃ユ湡銆傚浜庘€滀粎褰撳ぉ鈥濈被鍨嬶紝浠诲姟灏嗗湪璧峰鏃ユ湡鍒涘缓銆?/p>

            <label className="field">
              <span>閲嶅绫诲瀷</span>
              <select value={repeatRule} onChange={(event) => setRepeatRule(event.target.value)}>
                <option value="浠呭綋澶?>浠呭綋澶╋紙{startDate}锛?/option>
                <option value="姣忔棩">姣忔棩閲嶅</option>
                <option value="姣忓懆">姣忓懆閲嶅</option>
              </select>
            </label>
            <p className="hint accent">璇ヤ换鍔″皢鍙湪 {startDate} 杩欎竴澶╁嚭鐜?/p>

            <label className="field">
              <span>榛樿瀛︿範鏃堕暱锛堝垎閽燂級</span>
              <input type="number" min={5} max={240} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
            </label>
            <p className="hint">涓烘瘡涓鍒掕缃粯璁ゅ涔犳椂闀匡紝鍦ㄨ鍒掗〉闈㈠彲浠ヨ皟鏁?/p>

            <div className="points-box">
              <div className="points-head">
                <span>鑷畾涔夌Н鍒嗚缃?/span>
                <label className="switch">
                  <input type="checkbox" checked={customPoints} onChange={(event) => setCustomPoints(event.target.checked)} />
                  <i />
                </label>
              </div>
              <small>鍚敤鑷畾涔夌Н鍒?/small>
              <p>缁熶竴璁剧疆浼氳嚜鍔ㄥ簲鐢ㄥ埌鎵€鏈変换鍔★紝姣忎釜浠诲姟涔熷彲鍗曠嫭璋冩暣銆?/p>
            </div>
          </article>

          <article className="panel right">
            <h2>棰勮锛坽previewItems.length} 涓鍒掞級</h2>
            {previewItems.length === 0 ? (
              <div className="empty-preview">
                <span>鈽?/span>
                <p>杈撳叆鍐呭鍚庝細鍦ㄨ繖閲屾樉绀洪瑙?/p>
              </div>
            ) : (
              <ul className="preview-list">
                {previewItems.map((item, index) => (
                  <li key={`${item.subject}-${item.task}-${index}`}>
                    <b>{item.subject}</b>
                    <span>{item.task}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <footer className="bottom-bar">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              resetForm();
              props.onBack();
            }}
          >
            鍙栨秷
          </button>
          <button type="button" className="save-btn" onClick={() => props.onToast(`宸蹭繚瀛?${previewItems.length} 涓鍒掞紙婕旂ず锛塦)}>
            淇濆瓨 {previewItems.length} 涓鍒?          </button>
        </footer>
      </main>
    </div>
  );
}

function PointsPage(props: {
  onBack: () => void;
  onGotoAchievement: () => void;
  onGotoHistory: () => void;
  onGotoWishAdd: () => void;
  onEditWish: (wishId: string) => void;
  onDeleteWish: (wishId: string) => void;
  onToast: (text: string) => void;
  wishItems: WishItem[];
  starBalance: number;
  historyRecords: HistoryRecord[];
}): JSX.Element {
  const repeatableWishCount = props.wishItems.filter((item) => item.remaining !== "1娆?).length;
  const positiveTotal = props.historyRecords.filter((item) => item.change > 0).reduce((sum, item) => sum + item.change, 0);

  return (
    <div className="points-page">
      <header className="points-header">
        <div className="points-header-inner">
          <button type="button" className="back-btn points-back" onClick={props.onBack}>
            鈫?          </button>
          <div className="points-copy">
            <h1>鎴戠殑绉垎鍜屾垚灏?/h1>
            <p>瀹屾垚瀛︿範浠诲姟锛屾敀鏄熸槦锛屽厬鎹㈡効鏈?/p>
          </div>
        </div>
      </header>

      <main className="points-main">
        <section className="points-summary-card">
          <div className="points-summary-top">
            <div>
              <span className="summary-label">鎴戠殑鏄熸槦浣欓</span>
              <div className="summary-value">
                <strong>{props.starBalance}</strong>
                <span>猸?/span>
              </div>
              <div className="summary-trend-row">
                <span className="trend positive">鏈懆: +{positiveTotal}猸?/span>
                <span className="trend primary">鏈湀: +{positiveTotal}猸?/span>
              </div>
            </div>
            <button type="button" className="help-link" onClick={() => props.onToast("绉垎瑙勫垯璇存槑涓嬩竴姝ヨˉ榻?)}>
              濡備綍鑾峰緱?
            </button>
          </div>

          <div className="today-gain-card">
            <div className="today-gain-title">浠婃棩杩樺彲鑾峰緱</div>
            <div className="gain-row">
              <span>瀹屾垚鍓╀綑2涓换鍔?/span>
              <b>+4猸?/b>
            </div>
            <div className="gain-row">
              <span>瀹屾垚鎵€鏈変换鍔★紙鍏ㄥ嫟濂栧姳锛?/span>
              <b>+3猸?/b>
            </div>
            <div className="gain-total">浠婂ぉ鏈€澶氳繕鑳借幏寰?7猸?/div>
          </div>
        </section>

        <section className="points-feature-grid">
          <button type="button" className="feature-card feature-purple" onClick={props.onGotoAchievement}>
            <div className="feature-icon">馃弲</div>
            <strong>鎴愬氨绯荤粺</strong>
            <span>瑙ｉ攣鑽ｈ獕鍕嬬珷</span>
          </button>
          <button type="button" className="feature-card feature-blue" onClick={props.onGotoHistory}>
            <div className="feature-icon">馃摐</div>
            <strong>绉垎鍘嗗彶</strong>
            <span>鏌ョ湅鏄熸槦璁板綍</span>
          </button>
        </section>

        <section className="wish-panel">
          <div className="wish-head">
            <div className="wish-title-wrap">
              <i />
              <h2>鎴戠殑鎰挎湜娓呭崟</h2>
            </div>
            <div className="wish-actions">
              <select className="wish-select" defaultValue="榛樿鎺掑簭">
                <option>榛樿鎺掑簭</option>
                <option>绉垎浠庝綆鍒伴珮</option>
                <option>绉垎浠庨珮鍒颁綆</option>
              </select>
              <button type="button" className="wish-add-btn" onClick={props.onGotoWishAdd}>
                娣诲姞鎰挎湜
              </button>
            </div>
          </div>

          <div className="wish-subhead">
            <span>鍙噸澶嶆効鏈?/span>
            <em>{repeatableWishCount}涓?/em>
          </div>

          {props.wishItems.length === 0 ? (
            <div className="wish-empty">鏆傛棤鎰挎湜锛岀偣鍑诲彸涓婅鈥滄坊鍔犳効鏈涒€濆垱寤虹涓€涓洰鏍囥€?/div>
          ) : (
            <div className="wish-grid">
              {props.wishItems.map((item) => (
                <article key={item.id} className="wish-card">
                  <div className="wish-card-top">
                    <div className="wish-emoji">{item.icon}</div>
                    <span className="wish-tag">{item.tag}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <div className="wish-meta">
                    <div>
                      <strong>{item.cost} 猸?/strong>
                    </div>
                    <div>
                      <span>鍓╀綑</span>
                      <b>{item.remaining}</b>
                    </div>
                  </div>
                  <div className="wish-btn-row">
                    <button type="button" className="icon-btn" onClick={() => props.onEditWish(item.id)}>
                      鉁?                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => props.onDeleteWish(item.id)}>
                      馃棏
                    </button>
                    <button type="button" className="redeem-btn" disabled>
                      鍏戞崲
                    </button>
                  </div>
                  <div className="wish-shortfall">{Math.max(item.cost - props.starBalance, 0) > 0 ? `宸?${Math.max(item.cost - props.starBalance, 0)} 猸恅 : "鍙厬鎹?}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function WishAddPage(props: {
  onBack: () => void;
  onSaveWish: (wish: WishItem) => void;
  onToast: (text: string) => void;
  initialWish?: WishItem | null;
}): JSX.Element {
  const isEditing = Boolean(props.initialWish);
  const [iconCategory, setIconCategory] = useState(props.initialWish?.iconCategory ?? "toy");
  const [selectedIcon, setSelectedIcon] = useState(props.initialWish?.icon ?? "馃巵");
  const [wishName, setWishName] = useState(props.initialWish?.title ?? "");
  const [wishDescription, setWishDescription] = useState(props.initialWish?.description ?? "");
  const [wishCategory, setWishCategory] = useState(props.initialWish?.category ?? "toy");
  const [wishCost, setWishCost] = useState(props.initialWish?.cost ?? 10);
  const [redeemMode, setRedeemMode] = useState<WishRedeemMode>(props.initialWish?.redeemMode ?? "single");
  const [multiLimit, setMultiLimit] = useState(props.initialWish?.multiLimit ?? 5);
  const [cyclePeriod, setCyclePeriod] = useState<WishCyclePeriod>(props.initialWish?.cyclePeriod ?? "weekly");
  const [cycleCount, setCycleCount] = useState(props.initialWish?.cycleCount ?? 1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const visibleIcons = WISH_ICON_OPTIONS.filter((item) => item.category === iconCategory);
  const selectedCategoryOption = WISH_CATEGORY_OPTIONS.find((item) => item.value === wishCategory) ?? WISH_CATEGORY_OPTIONS[0];
  const cycleLabelMap: Record<WishCyclePeriod, string> = {
    daily: "姣忔棩",
    weekly: "姣忓懆",
    monthly: "姣忔湀",
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onBack();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [props]);

  const switchIconCategory = (nextCategory: string): void => {
    setIconCategory(nextCategory);
  };

  const handleSubmit = (): void => {
    if (!wishName.trim()) {
      props.onToast("璇峰～鍐欐効鏈涘悕绉?);
      return;
    }

    if (wishCost <= 0) {
      props.onToast("闇€瑕佺殑鏄熸槦蹇呴』澶т簬 0");
      return;
    }

    const redeemConfig: Record<WishRedeemMode, { tag: string; remaining: string }> = {
      single: { tag: "鍗曟", remaining: "1娆? },
      multi: { tag: "澶氭", remaining: `${multiLimit}娆 },
      cycle: { tag: "寰幆", remaining: `${cycleLabelMap[cyclePeriod]}${cycleCount}娆 },
      forever: { tag: "姘镐箙", remaining: "鈭? },
    };

    const nextWish: WishItem = {
      id: props.initialWish?.id ?? `wish-${Date.now()}`,
      title: wishName.trim(),
      description: wishDescription.trim(),
      category: wishCategory,
      cost: wishCost,
      remaining: redeemConfig[redeemMode].remaining,
      tag: redeemConfig[redeemMode].tag,
      icon: selectedIcon,
      iconCategory,
      shortfall: Math.max(wishCost - 12, 0),
      redeemMode,
      multiLimit,
      cyclePeriod,
      cycleCount,
    };

    props.onSaveWish(nextWish);
    props.onToast(`${isEditing ? "宸叉洿鏂? : "宸叉坊鍔?}鎰挎湜锛?{wishName}`);
    props.onBack();
  };

  return (
    <div className="wish-add-page" role="dialog" aria-modal="true" onClick={props.onBack}>
      <main className="wish-add-main" onClick={(event) => event.stopPropagation()}>
        <section className="wish-add-card">
          <div className="wish-add-top">
            <div className="wish-add-title">
              <div className="wish-add-mark">鉁?/div>
              <div>
                <h1>{isEditing ? "缂栬緫鎴戠殑鎰挎湜" : "娣诲姞鎴戠殑鎰挎湜"}</h1>
                <p>{isEditing ? "淇敼鎰挎湜淇℃伅锛屾竻鍗曚細鍚屾鏇存柊銆? : "璁惧畾浣犳兂瑕佺殑濂栧姳锛屽姫鍔涙敀鏄熸槦鍘诲疄鐜板惂"}</p>
              </div>
            </div>
            <button type="button" className="wish-close-btn" onClick={props.onBack}>
              脳
            </button>
          </div>

          <section className="wish-form-block">
            <h2>閫夋嫨鍥炬爣</h2>
            <div className="selected-icon-card">
              <div className="selected-icon-emoji">{selectedIcon}</div>
              <div className="selected-icon-copy">
                <strong>鐐瑰嚮涓嬫柟閫夋嫨浣犲枩娆㈢殑鍥炬爣</strong>
              </div>
            </div>

            <div className="icon-category-tabs">
              {WISH_ICON_CATEGORY_ROWS.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="icon-category-row">
                  {row.map((value) => {
                    const option = WISH_CATEGORY_OPTIONS.find((item) => item.value === value);
                    if (!option) return null;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`icon-category-tab ${iconCategory === option.value ? "active" : ""}`}
                        onClick={() => switchIconCategory(option.value)}
                      >
                        {option.tabLabel ?? option.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="icon-picker-grid">
              {visibleIcons.map((item) => (
                <button
                  key={`${item.category}-${item.label}`}
                  type="button"
                  className={`icon-choice ${selectedIcon === item.icon ? "active" : ""}`}
                  onClick={() => setSelectedIcon(item.icon)}
                  title={item.label}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            <div className="custom-image-block">
              <h3>鑷畾涔夊浘鐗囷紙鍙€夛級</h3>
              <button type="button" className="image-upload-btn" onClick={() => props.onToast("鑷畾涔夊浘鐗囦笂浼犱笅涓€姝ヨˉ榻?)}>
                閫夋嫨鍥剧墖锛堚墹5MB锛?              </button>
              <p>鍥剧墖灏嗘樉绀哄湪蹇冩効鍗＄墖涓婏紙濡傛湭涓婁紶鍒欎娇鐢ㄥ浘鏍囷級銆?/p>
            </div>
          </section>

          <section className="wish-form-block">
            <label className="wish-field">
              <span>鎰挎湜鍚嶇О *</span>
              <input type="text" maxLength={60} value={wishName} onChange={(event) => setWishName(event.target.value)} placeholder="渚嬪锛氫拱鏂颁功銆佹父涔愬洯闂ㄧエ銆佹柊涔﹀寘" />
            </label>

            <label className="wish-field">
              <span>鎻忚堪涓€涓嬭繖涓効鏈涚殑缁嗚妭鈥?/span>
              <textarea maxLength={200} value={wishDescription} onChange={(event) => setWishDescription(event.target.value)} placeholder="鎻忚堪涓€涓嬭繖涓効鏈涚殑缁嗚妭鈥? />
              <small>{wishDescription.length}/200</small>
            </label>

            <div className="wish-field wish-category-field">
              <span>鍒嗙被</span>
              <div className={`wish-category-select ${isCategoryMenuOpen ? "open" : ""}`}>
                <button type="button" className="wish-category-trigger" onClick={() => setIsCategoryMenuOpen((current) => !current)}>
                  <span className="wish-category-meta">
                    <span>{selectedCategoryOption.icon}</span>
                    <span>{selectedCategoryOption.label}</span>
                  </span>
                  <span className="wish-category-arrow">鈱?/span>
                </button>
                {isCategoryMenuOpen ? (
                  <div className="wish-category-menu">
                    {WISH_CATEGORY_OPTIONS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`wish-category-option ${wishCategory === item.value ? "active" : ""}`}
                        onClick={() => {
                          setWishCategory(item.value);
                          setIsCategoryMenuOpen(false);
                        }}
                      >
                        <span className="wish-category-meta">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="wish-category-check">{wishCategory === item.value ? "鉁? : ""}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <label className="wish-field">
              <span>闇€瑕佸灏戞槦鏄燂紵 *</span>
              <input type="number" min={1} value={wishCost} onChange={(event) => setWishCost(Number(event.target.value) || 0)} />
            </label>

            <div className="wish-guide-card">
              <strong>鍙傝€冩寚鍗楋細</strong>
              <ul>
                <li>灏忔効鏈涳紙闆堕銆佽创绾革級锛?-20猸?/li>
                <li>涓瓑鎰挎湜锛堢帺鍏枫€佷功绫嶏級锛?0-50猸?/li>
                <li>澶ф効鏈涳紙娓镐箰鍥€佺數瀛愪骇鍝侊級锛?0-200猸?/li>
                <li>瓒呯骇鎰挎湜锛堢壒鍒鍔憋級锛?00+猸?/li>
              </ul>
            </div>
          </section>

          <section className="wish-form-block">
            <div className="redeem-head">
              <h2>閲嶅鍏戞崲璁剧疆</h2>
              <button type="button" className="redeem-help" onClick={() => props.onToast("鍏戞崲瑙勫垯璇存槑涓嬩竴姝ヨˉ榻?)}>
                ?
              </button>
            </div>

            <div className="redeem-mode-grid">
              <button type="button" className={`redeem-mode-card ${redeemMode === "single" ? "active" : ""}`} onClick={() => setRedeemMode("single")}>
                <div className="redeem-icon">馃幆</div>
                <strong>鍗曟鍏戞崲</strong>
                <span>鍏戞崲鍚庢秷澶?/span>
              </button>
              <button type="button" className={`redeem-mode-card ${redeemMode === "multi" ? "active" : ""}`} onClick={() => setRedeemMode("multi")}>
                <div className="redeem-icon">馃敘</div>
                <strong>澶氭鍏戞崲</strong>
                <span>璁惧畾鍏戞崲娆℃暟</span>
              </button>
              <button type="button" className={`redeem-mode-card ${redeemMode === "cycle" ? "active" : ""}`} onClick={() => setRedeemMode("cycle")}>
                <div className="redeem-icon">馃攧</div>
                <strong>寰幆鎰挎湜</strong>
                <span>鎸夋湡閲嶇疆娆℃暟</span>
              </button>
              <button type="button" className={`redeem-mode-card ${redeemMode === "forever" ? "active" : ""}`} onClick={() => setRedeemMode("forever")}>
                <div className="redeem-icon">鈭?/div>
                <strong>姘镐箙鎰挎湜</strong>
                <span>鏃犻檺娆″厬鎹?/span>
              </button>
            </div>

            {redeemMode === "multi" ? (
              <>
                <div className="redeem-config-panel multi">
                  <label className="wish-field compact">
                    <span>鏈€澶у厬鎹㈡鏁?/span>
                    <input type="number" min={1} value={multiLimit} onChange={(event) => setMultiLimit(Number(event.target.value) || 1)} />
                    <small>鍙厬鎹?{multiLimit} 娆?/small>
                  </label>
                </div>
                <div className="redeem-note multi">澶氭鍏戞崲妯″紡锛氭瘡鍏戞崲涓€娆★紝鍓╀綑娆℃暟鍑忎竴锛岀敤瀹屽嵆姝?/div>
              </>
            ) : null}

            {redeemMode === "cycle" ? (
              <>
                <div className="redeem-config-panel cycle">
                  <div className="cycle-section-title">閲嶇疆鍛ㄦ湡</div>
                  <div className="cycle-period-grid">
                    <button type="button" className={`cycle-period-card ${cyclePeriod === "daily" ? "active" : ""}`} onClick={() => setCyclePeriod("daily")}>
                      <strong>姣忔棩閲嶇疆</strong>
                      <span>姣忓ぉ0鐐归噸缃鏁?/span>
                    </button>
                    <button type="button" className={`cycle-period-card ${cyclePeriod === "weekly" ? "active" : ""}`} onClick={() => setCyclePeriod("weekly")}>
                      <strong>姣忓懆閲嶇疆</strong>
                      <span>姣忓懆涓€0鐐归噸缃鏁?/span>
                    </button>
                    <button type="button" className={`cycle-period-card ${cyclePeriod === "monthly" ? "active" : ""}`} onClick={() => setCyclePeriod("monthly")}>
                      <strong>姣忔湀閲嶇疆</strong>
                      <span>姣忔湀1鍙?鐐归噸缃鏁?/span>
                    </button>
                  </div>
                  <label className="wish-field compact">
                    <span>姣忎釜鍛ㄦ湡鍙厬鎹㈡鏁?/span>
                    <input type="number" min={1} value={cycleCount} onChange={(event) => setCycleCount(Number(event.target.value) || 1)} />
                    <small>姣忓懆鏈熷彲鍏戞崲 {cycleCount} 娆?/small>
                  </label>
                </div>
                <div className="redeem-note cycle">寰幆鎰挎湜妯″紡锛氭寜鍛ㄦ湡鑷姩閲嶇疆娆℃暟锛屽彲闀挎湡浣跨敤</div>
              </>
            ) : null}

            {redeemMode === "forever" ? <div className="redeem-note forever">姘镐箙鎰挎湜妯″紡锛氭棤闄愬埗鍏戞崲锛岄€傚悎甯哥敤濂栧姳</div> : null}
            {redeemMode === "single" ? <div className="redeem-note single">鍗曟鍏戞崲妯″紡锛氬厬鎹㈠悗浼氫粠娓呭崟涓Щ闄?/div> : null}
          </section>

          <footer className="wish-add-actions">
            <button type="button" className="wish-cancel-btn" onClick={props.onBack}>
              鍙栨秷
            </button>
            <button type="button" className="wish-submit-btn" onClick={handleSubmit}>
              {isEditing ? "淇濆瓨淇敼" : "娣诲姞鎰挎湜"}
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}

function HistoryPage(props: { onBack: () => void; records: HistoryRecord[] }): JSX.Element {
  const [range, setRange] = useState<HistoryRange>("30d");
  const [mode, setMode] = useState<HistoryMode>("all");

  const rangeText = {
    all: "褰撳墠缁熻鑼冨洿锛氬叏閮ㄨ褰?,
    "7d": "褰撳墠缁熻鑼冨洿锛?026-03-12 鑷?2026-03-19",
    "30d": "褰撳墠缁熻鑼冨洿锛?026-02-18 鑷?2026-03-19",
    "90d": "褰撳墠缁熻鑼冨洿锛?025-12-20 鑷?2026-03-19",
    custom: "褰撳墠缁熻鑼冨洿锛氳嚜瀹氫箟鏃堕棿娈?,
  } satisfies Record<HistoryRange, string>;

  const visibleRecords = useMemo(() => {
    if (mode === "gain") return props.records.filter((item) => item.change > 0);
    if (mode === "spend") return props.records.filter((item) => item.change < 0);
    return props.records;
  }, [mode, props.records]);

  const summary = useMemo(() => {
    const gained = visibleRecords.filter((item) => item.change > 0).reduce((sum, item) => sum + item.change, 0);
    const spent = Math.abs(visibleRecords.filter((item) => item.change < 0).reduce((sum, item) => sum + item.change, 0));
    return {
      gained,
      spent,
      net: gained - spent,
      count: visibleRecords.length,
    };
  }, [visibleRecords]);
  const firstDayLabel = visibleRecords[0]?.date ?? "";
  const firstDayTotal = visibleRecords.filter((item) => item.date === firstDayLabel).reduce((sum, item) => sum + item.change, 0);

  return (
    <div className="history-page">
      <header className="history-header">
        <div className="history-header-inner">
          <button type="button" className="back-btn history-back" onClick={props.onBack}>
            鈫?          </button>
          <div className="history-copy">
            <h1>
              绉垎鍘嗗彶 <span>馃搳</span>
            </h1>
            <p>鏌ョ湅浣犵殑鏄熸槦鑾峰彇鍜屾秷璐硅褰?/p>
          </div>
        </div>
      </header>

      <main className="history-main">
        <section className="history-range-card">
          <div className="history-section-title">缁熻鏃舵</div>
          <div className="history-range-grid">
            <button type="button" className={`range-chip ${range === "all" ? "active dark" : ""}`} onClick={() => setRange("all")}>
              鍏ㄩ儴
            </button>
            <button type="button" className={`range-chip ${range === "7d" ? "active dark" : ""}`} onClick={() => setRange("7d")}>
              杩?澶?            </button>
            <button type="button" className={`range-chip ${range === "30d" ? "active dark" : ""}`} onClick={() => setRange("30d")}>
              杩?0澶?            </button>
            <button type="button" className={`range-chip ${range === "90d" ? "active dark" : ""}`} onClick={() => setRange("90d")}>
              杩?0澶?            </button>
            <button type="button" className={`range-chip ${range === "custom" ? "active dark" : ""}`} onClick={() => setRange("custom")}>
              鑷畾涔?            </button>
          </div>
          <p className="range-text">{rangeText[range]}</p>
        </section>

        <section className="history-metric-wrap">
          <article className="history-metric gain">
            <span>鏃舵鑾峰緱</span>
            <strong>+{summary.gained}猸?/strong>
          </article>
          <article className="history-metric spend">
            <span>鏃舵娑堣垂</span>
            <strong>-{summary.spent}猸?/strong>
          </article>
          <article className="history-metric net">
            <span>鍑€鍙樺寲</span>
            <strong>{summary.net >= 0 ? "+" : ""}{summary.net}猸?/strong>
          </article>
          <article className="history-metric count">
            <span>璁板綍鏉℃暟</span>
            <strong>{summary.count}</strong>
          </article>
        </section>

        <section className="history-tabs-card">
          <button type="button" className={`history-tab ${mode === "all" ? "all active" : ""}`} onClick={() => setMode("all")}>
            鍏ㄩ儴璁板綍
          </button>
          <button type="button" className={`history-tab ${mode === "gain" ? "gain active" : ""}`} onClick={() => setMode("gain")}>
            鑾峰緱
          </button>
          <button type="button" className={`history-tab ${mode === "spend" ? "spend active" : ""}`} onClick={() => setMode("spend")}>
            娑堣垂
          </button>
        </section>

        <section className="history-record-card">
          {visibleRecords.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">馃摐</div>
              <h2>鏆傛棤璁板綍</h2>
              <p>鍏戞崲鎰挎湜娓呭崟涓殑濂栧姳锛屾秷璐硅褰曚細鏄剧ず鍦ㄨ繖閲?/p>
            </div>
          ) : (
            <>
              <div className="history-day-head">
                <div className="history-day-title">
                  <span className="day-dot">鈼?/span>
                  <strong>{firstDayLabel}</strong>
                </div>
                <span className="day-total">{firstDayTotal >= 0 ? "+" : ""}{firstDayTotal}猸?/span>
              </div>

              <div className="history-record-list">
                {visibleRecords.map((item) => (
                  <article key={item.id} className="history-record-row">
                    <div className="record-left">
                      <div className="record-badge">鈽?/div>
                      <div className="record-copy">
                        <h3>{item.title}</h3>
                        <div className="record-meta">
                          <span>{item.time}</span>
                          {item.category ? <span>{item.category}</span> : null}
                          {item.tag ? <em>{item.tag}</em> : null}
                        </div>
                      </div>
                    </div>
                    <strong className="record-score">{item.change >= 0 ? "+" : ""}{item.change}猸?/strong>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="history-tip-card">
          <div className="history-tip-title">
            <span>鈽?/span>
            <strong>娓╅Θ鎻愮ず</strong>
          </div>
          <ul>
            <li>绉垎鍘嗗彶鏈€澶氭樉绀烘渶杩?00鏉¤褰?/li>
            <li>缁胯壊琛ㄧず鑾峰緱鏄熸槦锛岀传鑹茶〃绀烘秷璐规槦鏄?/li>
            <li>鎵€鏈夌Н鍒嗚褰曢兘浼氭案涔呬繚瀛樺湪鏁版嵁搴撲腑</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function AchievementPage(props: { onBack: () => void; onToast: (text: string) => void }): JSX.Element {
  return (
    <div className="achievement-page">
      <header className="achievement-header">
        <div className="achievement-header-inner">
          <div className="achievement-left">
            <button type="button" className="back-btn achievement-back" onClick={props.onBack}>
              鈫?            </button>
            <div className="achievement-copy">
              <h1>
                鎴愬氨绯荤粺 <span>馃弳</span>
              </h1>
              <p>瀹屾垚鎸戞垬锛岃В閿佹垚灏卞媼绔?/p>
            </div>
          </div>
          <button type="button" className="achievement-gear" onClick={() => props.onToast("鎴愬氨璁剧疆涓嬩竴姝ヨˉ榻?)}>
            鈿?          </button>
        </div>
      </header>

      <main className="achievement-main">
        <section className="achievement-summary">
          <article className="achievement-stat">
            <strong className="blue">0</strong>
            <span>宸茶В閿?/span>
          </article>
          <article className="achievement-stat">
            <strong className="violet">0</strong>
            <span>鎬绘垚灏?/span>
          </article>
          <article className="achievement-stat">
            <strong className="orange">0 猸?/strong>
            <span>濂栧姳鏄熸槦</span>
          </article>
        </section>

        <section className="achievement-empty-card">
          <div className="achievement-empty-icon">馃弳</div>
          <h2>鏆傛棤鎴愬氨鏁版嵁</h2>
          <p>缁х画瀹屾垚瀛︿範浠诲姟锛岃В閿佹洿澶氭垚灏?/p>
        </section>

        <section className="achievement-tip-card">
          <div className="achievement-tip-title">
            <span>馃弳</span>
            <strong>鎴愬氨灏忚创澹?/strong>
          </div>
          <ul>
            <li>瀹屾垚瀛︿範浠诲姟锛岃В閿佷换鍔℃垚灏?/li>
            <li>杩炵画鎵撳崱涓嶄腑鏂紝鑾峰緱杩炵画鎵撳崱鎴愬氨</li>
            <li>绱瀛︿範鏃堕暱锛岃В閿佹椂闀挎垚灏?/li>
            <li>鎴愬氨濂栧姳鐨勬槦鏄熶細鑷姩娣诲姞鍒颁綘鐨勪綑棰?/li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function App(): JSX.Element {
  const [view, setView] = useState<AppView>("home");
  const [toast, setToast] = useState("");
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(INITIAL_STUDY_PLANS);
  const [habitItems, setHabitItems] = useState<HabitItem[]>(INITIAL_HABITS);
  const [starBalance, setStarBalance] = useState(19);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(HISTORY_RECORDS);
  const [wishItems, setWishItems] = useState<WishItem[]>(INITIAL_WISH_ITEMS);
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [planBoardManageDate, setPlanBoardManageDate] = useState<string | null>(null);
  const [managedPlanId, setManagedPlanId] = useState<string | null>(null);
  const [quickCompletePlanId, setQuickCompletePlanId] = useState<string | null>(null);
  const [timerPlanId, setTimerPlanId] = useState<string | null>(null);
  const [habitBackView, setHabitBackView] = useState<"home" | "habitPunch">("home");
  const [habitCheckDraft, setHabitCheckDraft] = useState<{ habitId: string; dateKey: string } | null>(null);
  const editingWish = wishItems.find((item) => item.id === editingWishId) ?? null;
  const managedPlan = studyPlans.find((item) => item.id === managedPlanId) ?? null;
  const quickCompletePlan = studyPlans.find((item) => item.id === quickCompletePlanId) ?? null;
  const timerPlan = studyPlans.find((item) => item.id === timerPlanId) ?? null;
  const checkingHabit = habitItems.find((item) => item.id === habitCheckDraft?.habitId) ?? null;

  const closeWishModal = (): void => {
    setEditingWishId(null);
    setIsWishModalOpen(false);
  };

  const closeHabitModal = (): void => {
    setIsHabitModalOpen(false);
  };

  const closeHabitCheckModal = (): void => {
    setHabitCheckDraft(null);
  };

  const closePlanManage = (): void => {
    setManagedPlanId(null);
  };

  const closePlanBoardManage = (): void => {
    setPlanBoardManageDate(null);
  };

  const completeStudyPlan = (planId: string, payload: { seconds: number; startTime?: string; endTime?: string }): void => {
    const now = new Date();
    const completedMinutes = Math.max(1, Math.round(payload.seconds / 60));
    const endText = payload.endTime ?? formatClockTime(now);
    const startText = payload.startTime ?? formatClockTime(new Date(now.getTime() - payload.seconds * 1000));

    setStudyPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              statusLabel: "宸插畬鎴?,
              statusTone: "completed",
              completionWindow: `${startText} - ${endText}`,
              firstSessionMinutes: completedMinutes,
              secondSessionMinutes: undefined,
              totalMinutes: completedMinutes,
              records: [...plan.records, { start: startText, end: endText, minutes: completedMinutes }],
            }
          : plan,
      ),
    );
  };

  const reorderPlansWithinDate = (dateKey: string, draggedPlanId: string, targetPlanId: string): void => {
    setStudyPlans((current) => {
      const scopedPlans = current.filter((plan) => plan.dayKey === dateKey);
      const draggedIndex = scopedPlans.findIndex((plan) => plan.id === draggedPlanId);
      const targetIndex = scopedPlans.findIndex((plan) => plan.id === targetPlanId);

      if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) {
        return current;
      }

      const nextScopedPlans = [...scopedPlans];
      const [draggedPlan] = nextScopedPlans.splice(draggedIndex, 1);
      nextScopedPlans.splice(targetIndex, 0, draggedPlan);

      const queue = [...nextScopedPlans];
      return current.map((plan) => (plan.dayKey === dateKey ? queue.shift() ?? plan : plan));
    });
  };

  const copyPlansToDate = (planIds: string[], targetDate: string): void => {
    setStudyPlans((current) => {
      const sourcePlans = current.filter((plan) => planIds.includes(plan.id));
      if (!sourcePlans.length) return current;

      const clonedPlans = sourcePlans.map((plan, index) => ({
        ...plan,
        id: `${plan.id}-copy-${Date.now()}-${index}`,
        dayKey: targetDate,
        dateStart: targetDate,
        dateEnd: plan.repeatLabel === "浠呭綋澶? ? targetDate : plan.dateEnd,
        statusLabel: "寰呭畬鎴?,
        statusTone: "pending" as const,
        completionWindow: undefined,
        firstSessionMinutes: undefined,
        secondSessionMinutes: undefined,
        totalMinutes: undefined,
        records: [],
        attachmentName: undefined,
        attachmentSize: undefined,
      }));

      return [...current, ...clonedPlans];
    });
  };

  const deleteSelectedPlans = (planIds: string[]): void => {
    setStudyPlans((current) => current.filter((plan) => !planIds.includes(plan.id)));
  };

  const openHabitStats = (source: "home" | "habitPunch"): void => {
    setHabitBackView(source);
    setView("habitStats");
  };

  const openHabitManage = (source: "home" | "habitPunch"): void => {
    setHabitBackView(source);
    setView("habitManage");
  };

  const deleteHabits = (habitIds: string[]): void => {
    setHabitItems((current) => current.filter((habit) => !habitIds.includes(habit.id)));
  };

  const addHabitTemplates = (templates: HabitTemplate[]): number => {
    let addedCount = 0;
    setHabitItems((current) => {
      const existingTitles = new Set(current.map((item) => item.title.trim().toLowerCase()));
      const nextHabits = [...current];

      templates.forEach((template, index) => {
        const titleKey = template.title.trim().toLowerCase();
        if (existingTitles.has(titleKey)) return;

        nextHabits.push(createHabitFromTemplate(template, index));
        existingTitles.add(titleKey);
        addedCount += 1;
      });

      return nextHabits;
    });
    return addedCount;
  };

  const registerHabitCheck = (habitId: string, dateKey: string, payload?: { note?: string; points?: number }): void => {
    const targetHabit = habitItems.find((item) => item.id === habitId);
    if (!targetHabit) return;

    const currentProgress = getHabitProgressForDate(targetHabit, dateKey);
    const targetCount = getHabitTargetCount(targetHabit.frequency);

    if (currentProgress >= targetCount) {
      setToast("褰撳墠鏃ユ湡涓嬭繖椤逛範鎯凡缁忓畬鎴?);
      return;
    }

    const awardedPoints = typeof payload?.points === "number" ? payload.points : targetHabit.points;
    const noteText = payload?.note?.trim() ?? "";
    const recordTime = formatClockTime(new Date());

    setHabitItems((current) =>
      current.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              completions: {
                ...habit.completions,
                [dateKey]: (habit.completions[dateKey] ?? 0) + 1,
              },
              records: {
                ...habit.records,
                [dateKey]: [...(habit.records[dateKey] ?? []), { time: recordTime, note: noteText, points: awardedPoints }],
              },
            }
          : habit,
      ),
    );

    if (!targetHabit.requiresApproval && awardedPoints !== 0) {
      setStarBalance((current) => current + awardedPoints);
      setHistoryRecords((current) => [
        {
          id: `habit-history-${Date.now()}`,
          date: formatHistoryDate(dateKey),
          time: recordTime,
          title: `${targetHabit.title}锛堜範鎯墦鍗★級`,
          category: "琛屼负涔犳儻",
          tag: getHabitFrequencyLabel(targetHabit.frequency),
          change: awardedPoints,
        },
        ...current,
      ]);
    }

    setToast(
      targetHabit.requiresApproval
        ? "宸茶褰曚範鎯墦鍗★紝绛夊緟瀹″畾鍚庡彂鏀剧Н鍒?
        : currentProgress + 1 >= targetCount
          ? `宸插畬鎴愭湰娆′範鎯墦鍗★紝鑾峰緱 ${awardedPoints >= 0 ? "+" : ""}${awardedPoints} 猸恅
          : `宸茶褰曚竴娆′範鎯墦鍗★紝鑾峰緱 ${awardedPoints >= 0 ? "+" : ""}${awardedPoints} 猸恅,
    );
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (view !== "points") {
      setEditingWishId(null);
      setIsWishModalOpen(false);
    }

    if (view !== "home" && view !== "habitPunch" && view !== "habitManage") {
      setIsHabitModalOpen(false);
    }

    if (view !== "home" && view !== "habitPunch") {
      setHabitCheckDraft(null);
    }

    if (view !== "home") {
      setPlanBoardManageDate(null);
      setManagedPlanId(null);
      setQuickCompletePlanId(null);
    }
  }, [view]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isWishModalOpen || isHabitModalOpen || Boolean(habitCheckDraft) || Boolean(planBoardManageDate) || Boolean(managedPlan) || Boolean(quickCompletePlan)) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isWishModalOpen, isHabitModalOpen, habitCheckDraft, planBoardManageDate, managedPlan, quickCompletePlan]);

  return (
    <>
      {view === "home" ? (
        <HomePage
          onGotoAdd={() => setView("add")}
          onGotoBatch={() => setView("batch")}
          onGotoPoints={() => setView("points")}
          onGotoHabits={() => setView("habitPunch")}
          onGotoHabitStats={() => openHabitStats("home")}
          onGotoHabitManage={() => openHabitManage("home")}
          onToast={setToast}
          studyPlans={studyPlans}
          habits={habitItems}
          onOpenPlanManage={(planId) => setManagedPlanId(planId)}
          onQuickManage={(dateKey) => setPlanBoardManageDate(dateKey)}
          onQuickComplete={(planId) => setQuickCompletePlanId(planId)}
          onStartTimer={(planId) => {
            setTimerPlanId(planId);
            setView("timer");
          }}
          onOpenHabitCreate={() => setIsHabitModalOpen(true)}
          onOpenHabitCheck={(habitId, dateKey) => setHabitCheckDraft({ habitId, dateKey })}
        />
      ) : null}
      {view === "habitPunch" ? (
        <HabitPunchPage
          habits={habitItems}
          starBalance={starBalance}
          onBack={() => setView("home")}
          onOpenHabitCreate={() => setIsHabitModalOpen(true)}
          onGotoHabitStats={() => openHabitStats("habitPunch")}
          onGotoHabitManage={() => openHabitManage("habitPunch")}
          onOpenHabitCheck={(habitId, dateKey) => setHabitCheckDraft({ habitId, dateKey })}
          onToast={setToast}
        />
      ) : null}
      {view === "habitStats" ? <HabitStatsPage habits={habitItems} onBack={() => setView(habitBackView)} onGotoHabitPunch={() => setView("habitPunch")} /> : null}
      {view === "habitManage" ? (
        <HabitManagePage
          habits={habitItems}
          onBack={() => setView(habitBackView)}
          onOpenHabitCreate={() => setIsHabitModalOpen(true)}
          onDeleteHabits={deleteHabits}
          onImportDefaultHabits={() => addHabitTemplates(DEFAULT_HABIT_LIBRARY)}
          onImportSharedHabits={() => addHabitTemplates(SHARED_HABIT_LIBRARY)}
          onToast={setToast}
        />
      ) : null}
      {(view === "home" || view === "habitPunch") && checkingHabit && habitCheckDraft ? (
        <HabitCheckModal
          habit={checkingHabit}
          dateKey={habitCheckDraft.dateKey}
          onClose={closeHabitCheckModal}
          onConfirm={(payload) => {
            registerHabitCheck(checkingHabit.id, habitCheckDraft.dateKey, payload);
            closeHabitCheckModal();
          }}
          onToast={setToast}
        />
      ) : null}
      {(view === "home" || view === "habitPunch" || view === "habitManage") && isHabitModalOpen ? (
        <HabitCreateModal
          onClose={closeHabitModal}
          onCreateHabit={(habit) => {
            setHabitItems((current) => [habit, ...current]);
          }}
          onToast={setToast}
        />
      ) : null}
      {view === "home" && planBoardManageDate ? (
        <PlanBoardManageOverlay
          initialDate={planBoardManageDate}
          studyPlans={studyPlans}
          onClose={closePlanBoardManage}
          onSave={() => {
            setToast("璁″垝绠＄悊璁剧疆宸蹭繚瀛?);
            closePlanBoardManage();
          }}
          onDeleteSelected={(planIds) => {
            deleteSelectedPlans(planIds);
            setToast(`宸插垹闄?${planIds.length} 涓鍒抈);
          }}
          onCopySelected={(planIds, targetDate) => {
            copyPlansToDate(planIds, targetDate);
            setToast(`宸插鍒跺埌 ${targetDate}`);
          }}
          onReorderPlans={reorderPlansWithinDate}
          onToast={setToast}
        />
      ) : null}
      {view === "home" && quickCompletePlan ? (
        <QuickCompleteModal
          plan={quickCompletePlan}
          onClose={() => setQuickCompletePlanId(null)}
          onToast={setToast}
          onComplete={(payload) => {
            completeStudyPlan(quickCompletePlan.id, payload);
            setQuickCompletePlanId(null);
            setToast("宸茶褰曟湰娆″畬鎴愭儏鍐?);
          }}
        />
      ) : null}
      {view === "home" && managedPlan ? (
        <PlanManageModal
          plan={managedPlan}
          onClose={closePlanManage}
          onDelete={(planId) => {
            setStudyPlans((current) => current.filter((item) => item.id !== planId));
            setManagedPlanId(null);
            setToast("宸插垹闄よ鍒?);
          }}
          onToast={setToast}
        />
      ) : null}
      {view === "add" ? <AddPlanPage onBack={() => setView("home")} onToast={setToast} /> : null}
      {view === "batch" ? <BatchPage onBack={() => setView("home")} onToast={setToast} /> : null}
      {view === "timer" && timerPlan ? (
        <StudyTimerPage
          plan={timerPlan}
          onBack={() => {
            setTimerPlanId(null);
            setView("home");
          }}
          onToast={setToast}
          onComplete={(payload) => {
            completeStudyPlan(timerPlan.id, payload);
            setTimerPlanId(null);
            setView("home");
            setToast("璁℃椂璁板綍宸蹭繚瀛?);
          }}
        />
      ) : null}
      {view === "points" ? (
        <>
        <PointsPage
          onBack={() => setView("home")}
          onGotoAchievement={() => setView("achievement")}
          onGotoHistory={() => setView("history")}
          onGotoWishAdd={() => {
            setEditingWishId(null);
            setIsWishModalOpen(true);
          }}
          onEditWish={(wishId) => {
            setEditingWishId(wishId);
            setIsWishModalOpen(true);
          }}
          onDeleteWish={(wishId) => {
            setWishItems((current) => current.filter((item) => item.id !== wishId));
            setToast("宸插垹闄ゆ効鏈?);
          }}
          onToast={setToast}
          wishItems={wishItems}
          starBalance={starBalance}
          historyRecords={historyRecords}
        />
          {isWishModalOpen ? (
            <WishAddPage
              key={editingWish?.id ?? "new-wish"}
              initialWish={editingWish}
              onBack={closeWishModal}
              onSaveWish={(wish) => {
                setWishItems((current) =>
                  current.some((item) => item.id === wish.id)
                    ? current.map((item) => (item.id === wish.id ? wish : item))
                    : [wish, ...current],
                );
              }}
              onToast={setToast}
            />
          ) : null}
        </>
      ) : null}
      {view === "achievement" ? <AchievementPage onBack={() => setView("points")} onToast={setToast} /> : null}
      {view === "history" ? <HistoryPage onBack={() => setView("points")} records={historyRecords} /> : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </>
  );
}

export default App;

