import type { CreateHabitInput, HabitFrequencyOption, PetDefinition, PetInteractionAction, PetLevelTier } from "./types.js";

// Reference data and static domain defaults live here so feature work can avoid opening model-core.ts.
export const VERSION = "3.1.0";

export const STAR_RULES = {
  planBaseStars: 1,
  durationBonusThresholds: [
    { minimumMinutes: 60, bonusStars: 2 },
    { minimumMinutes: 30, bonusStars: 1 },
  ],
  morningBonus: {
    startHour: 6,
    endHour: 8,
    multiplier: 1.2,
  },
  weekendBonusMultiplier: 1.5,
  dailyFullAttendanceBonusStars: 2,
  streakRewards: [
    { days: 7, stars: 10 },
    { days: 30, stars: 50 },
    { days: 100, stars: 200 },
    { days: 365, stars: 1000 },
  ],
} as const;

export const PET_CATALOG: PetDefinition[] = [
  { id: "pet_teddy", name: "泰迪", species: "卷毛小狗", description: "卷卷毛茸茸，黏人又活泼。", emoji: "🐩", accent: "#f3a15c", accentSoft: "#fff0dc", badge: "轻松陪伴型", cost: 20 },
  { id: "pet_bichon", name: "比熊", species: "雪球小狗", description: "软绵绵的小云朵，笑起来超治愈。", emoji: "🐶", accent: "#90d7f8", accentSoft: "#eef9ff", badge: "轻松陪伴型", cost: 20 },
  { id: "pet_husky", name: "哈士奇", species: "活力伙伴", description: "精力满满，陪你一起玩闹。", emoji: "🐺", accent: "#7d95ff", accentSoft: "#eef1ff", badge: "冒险搭子", cost: 20 },
  { id: "pet_corgi", name: "柯基", species: "短腿伙伴", description: "小短腿冲过来的时候，谁都会被可爱到。", emoji: "🐕", accent: "#2fb5f5", accentSoft: "#e6fbff", badge: "元气搭子", cost: 20 },
  { id: "pet_westie", name: "西高地", species: "白色小棉花", description: "雪白又精神，像一团会跑的小棉花。", emoji: "🐕‍🦺", accent: "#7dd1d0", accentSoft: "#ecfffc", badge: "轻松陪伴型", cost: 20 },
  { id: "pet_samoyed", name: "萨摩耶", species: "微笑天使", description: "笑起来暖乎乎的，像把阳光抱进怀里。", emoji: "🐕", accent: "#cfd8ff", accentSoft: "#f7f8ff", badge: "温柔陪伴型", cost: 20 },
  { id: "pet_orange_cat", name: "橘猫", species: "圆脸猫猫", description: "圆乎乎胖洋洋，看着就想抱一抱。", emoji: "🐈", accent: "#ffb44f", accentSoft: "#fff5e4", badge: "居家治愈型", cost: 20 },
  { id: "pet_ragdoll", name: "布偶", species: "小公主猫", description: "温柔安静，像会发光的小公主。", emoji: "🐱", accent: "#b8b4ff", accentSoft: "#f4f2ff", badge: "温柔陪伴型", cost: 20 },
  { id: "pet_white_cat", name: "白猫", species: "柔软猫猫", description: "干净清爽，像奶油一样柔软。", emoji: "🐈", accent: "#d9f1ff", accentSoft: "#f7fdff", badge: "治愈陪伴型", cost: 20 },
  { id: "pet_black_cat", name: "黑猫", species: "神秘猫猫", description: "神秘灵动，眼睛亮晶晶的。", emoji: "🐈‍⬛", accent: "#66708a", accentSoft: "#edf1f7", badge: "夜光搭子", cost: 20 },
  { id: "pet_rabbit", name: "兔子", species: "软乎乎小耳朵", description: "安安静静的小耳朵，安静时也特别治愈。", emoji: "🐇", accent: "#f3b7cf", accentSoft: "#fff2f7", badge: "安静陪伴型", cost: 20 },
  { id: "pet_chick", name: "小鸡", species: "毛茸茸小可爱", description: "毛茸茸软乎乎，蹦蹦跳跳超可爱。", emoji: "🐤", accent: "#ffcb55", accentSoft: "#fff7de", badge: "轻松陪伴型", cost: 20 },
  { id: "pet_duck", name: "柯尔鸭", species: "软萌小鸭", description: "软萌又爱贴贴，走起路来像小团子。", emoji: "🦆", accent: "#f4c77a", accentSoft: "#fff6e7", badge: "呆萌陪伴型", cost: 20 },
  { id: "pet_parrot", name: "牡丹鹦鹉", species: "彩羽小朋友", description: "颜色像糖果一样鲜亮，叽叽喳喳超热闹。", emoji: "🦜", accent: "#ff9b70", accentSoft: "#fff0ea", badge: "热闹陪伴型", cost: 20 },
  { id: "pet_sunbird", name: "太阳鹦鹉", species: "阳光小鸟", description: "像把小太阳捧在手心里，热情又活泼。", emoji: "🐥", accent: "#ffac38", accentSoft: "#fff4df", badge: "热闹陪伴型", cost: 20 },
  { id: "pet_seagull", name: "海鸥", species: "自由小鸟", description: "自由又轻盈，像会把海风带到你身边。", emoji: "🐦", accent: "#c7d1df", accentSoft: "#f5f8fc", badge: "轻松陪伴型", cost: 20 },
  { id: "pet_hamster", name: "仓鼠", species: "圆滚滚小团子", description: "圆滚滚的小团子，抱着零食最可爱。", emoji: "🐹", accent: "#dca16c", accentSoft: "#fff1e5", badge: "居家治愈型", cost: 20 },
  { id: "pet_capybara", name: "卡皮巴拉", species: "慢悠悠朋友", description: "慢悠悠又稳稳的，看一眼就想一起发呆。", emoji: "🦫", accent: "#c58b5a", accentSoft: "#fdf1e6", badge: "松弛陪伴型", cost: 20 },
  { id: "pet_panda", name: "熊猫", species: "黑白圆滚滚", description: "黑白圆滚滚，看着就让人心安。", emoji: "🐼", accent: "#7b8798", accentSoft: "#f1f4f8", badge: "国宝陪伴型", cost: 20 },
  { id: "pet_lizard", name: "蜥蜴", species: "小小探险家", description: "小小探险家，安静又有点酷。", emoji: "🦎", accent: "#e09c46", accentSoft: "#fff3e0", badge: "探险陪伴型", cost: 20 },
  { id: "pet_koala", name: "考拉", species: "慢慢抱抱兽", description: "抱起来像软云朵，慢慢悠悠特别安心。", emoji: "🐨", accent: "#b8b8c7", accentSoft: "#f7f7fb", badge: "慢慢陪伴型", cost: 20 },
  { id: "pet_piglet", name: "小猪", species: "圆鼻子伙伴", description: "圆鼻子一拱一拱的，开心时格外可爱。", emoji: "🐷", accent: "#f7b7c1", accentSoft: "#fff1f4", badge: "治愈陪伴型", cost: 20 },
  { id: "pet_sloth", name: "树懒", species: "慢节奏伙伴", description: "慢慢陪着你，连心情都会一起放松下来。", emoji: "🦥", accent: "#caa86c", accentSoft: "#fdf4e8", badge: "慢慢陪伴型", cost: 20 },
  { id: "pet_fox", name: "九尾狐", species: "灵气伙伴", description: "灵气满满，像从童话里跑出来的小伙伴。", emoji: "🦊", accent: "#ffb58f", accentSoft: "#fff2eb", badge: "传说陪伴型", cost: 20 },
];

export const PET_LEVEL_TIERS: PetLevelTier[] = [
  { level: 1, title: "刚认识", threshold: 0, description: "解锁基础陪伴交流" },
  { level: 2, title: "好朋友", threshold: 50, description: "解锁更多互动反馈" },
  { level: 3, title: "好伙伴", threshold: 150, description: "陪你越来越有默契" },
  { level: 4, title: "最佳伙伴", threshold: 300, description: "解锁成长伙伴展示页" },
];

export const PET_INTERACTION_ACTIONS: PetInteractionAction[] = [
  {
    id: "feed",
    title: "喂食",
    badge: "+10 亲密",
    description: "轻轻点一下，就能让它更开心。",
    accent: "#ff9d2f",
    accentSoft: "#fff0d9",
    intimacyDelta: 10,
    satietyDelta: 18,
    cleanlinessDelta: -2,
    moodDelta: 5,
    activityMessage: "开心地吃完了小零食。",
    successMessage: "吃得饱饱，心情也跟着亮了起来。",
  },
  {
    id: "bathe",
    title: "洗香香",
    badge: "+15 亲密",
    description: "轻轻点一下，就能让它更舒服。",
    accent: "#2fb5f5",
    accentSoft: "#e6f8ff",
    intimacyDelta: 15,
    satietyDelta: -3,
    cleanlinessDelta: 20,
    moodDelta: 6,
    activityMessage: "洗得香香的，甩了甩身上的水珠。",
    successMessage: "清爽又蓬松，忍不住想靠近你。",
  },
  {
    id: "park",
    title: "去公园",
    badge: "+20 亲密",
    description: "轻轻点一下，就能和它一起放风。",
    accent: "#35c97f",
    accentSoft: "#e7fbef",
    intimacyDelta: 20,
    satietyDelta: -6,
    cleanlinessDelta: -4,
    moodDelta: 18,
    activityMessage: "在外面跑了一圈，开心得转起圈圈。",
    successMessage: "玩得很尽兴，看你的眼神更亮了。",
  },
  {
    id: "sleep",
    title: "睡觉",
    badge: "+8 亲密",
    description: "安安稳稳地睡一觉，醒来更有精神。",
    accent: "#8b6ef7",
    accentSoft: "#f0ebff",
    intimacyDelta: 8,
    satietyDelta: 4,
    cleanlinessDelta: 3,
    moodDelta: 12,
    activityMessage: "安安稳稳睡醒后，蹭了蹭你的手。",
    successMessage: "睡足了精神满满，想继续陪你玩。",
  },
];

export const HABIT_FREQUENCY_OPTIONS: HabitFrequencyOption[] = [
  {
    value: "dailyOnce",
    label: "每日一次",
    helper: "每天只能打卡一次",
    targetCount: 1,
    period: "day",
  },
  {
    value: "dailyMultiple",
    label: "每日多次",
    helper: "默认每天最多打卡 3 次",
    targetCount: 3,
    period: "day",
  },
  {
    value: "weeklyMultiple",
    label: "每周多次",
    helper: "默认每周最多打卡 5 次",
    targetCount: 5,
    period: "week",
  },
];

export const DEFAULT_HABIT_TEMPLATES: CreateHabitInput[] = [
  {
    name: "早睡早起",
    description: "按时休息，第二天更有精神。",
    frequency: "dailyOnce",
    points: 1,
    approvalRequired: false,
    icon: "☾",
    color: "#4f7cff",
  },
  {
    name: "运动打卡",
    description: "完成一次运动、拉伸或户外活动。",
    frequency: "dailyMultiple",
    points: 2,
    approvalRequired: false,
    icon: "⚑",
    color: "#57c884",
  },
  {
    name: "整理书桌",
    description: "每周完成几次整理，保持学习区清爽。",
    frequency: "weeklyMultiple",
    points: 1,
    approvalRequired: false,
    icon: "✎",
    color: "#ffb449",
  },
];
