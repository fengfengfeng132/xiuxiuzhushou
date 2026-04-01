import type { RewardCategory, RewardRepeatMode, RewardResetPeriod } from "../../domain/model.js";

export interface WishOption<TValue extends string> {
  value: TValue;
  label: string;
  description?: string;
}

export interface WishIconCategory {
  value: RewardCategory;
  label: string;
  icons: string[];
}

export const WISH_CATEGORY_OPTIONS: WishOption<RewardCategory>[] = [
  { value: "toy", label: "玩具" },
  { value: "food", label: "零食" },
  { value: "activity", label: "活动娱乐" },
  { value: "electronics", label: "电子产品" },
  { value: "books", label: "书籍学习" },
  { value: "privilege", label: "特权奖励" },
  { value: "other", label: "其他" },
];

export const WISH_ICON_CATEGORIES: WishIconCategory[] = [
  { value: "toy", label: "玩具游戏", icons: ["🧸", "🎮", "🎲", "🪀", "🎯", "🎨", "🧩", "🚂", "🚗", "✈️", "🚁", "🛸"] },
  { value: "food", label: "美食零食", icons: ["🍕", "🍔", "🍟", "🍦", "🍰", "🍩", "🍿", "🧋", "🍓", "🍪", "🍜", "🍫"] },
  { value: "activity", label: "活动娱乐", icons: ["🎬", "⛺", "🎡", "⚽", "🚲", "🎵", "🎸", "🎹", "🎤", "🎳", "🏸", "🎯"] },
  { value: "electronics", label: "电子产品", icons: ["📱", "💻", "🎮", "📷", "🎧", "⌚", "🖥️", "📺", "⌨️", "🖨️", "📟", "🎛️"] },
  { value: "books", label: "书籍学习", icons: ["📚", "📖", "📓", "📝", "🧠", "📐", "🖍️", "✒️", "📒", "📕", "🗂️", "🧮"] },
  { value: "privilege", label: "特权奖励", icons: ["👑", "⭐", "🏆", "🎁", "💎", "🎟️", "🥇", "✨", "🛋️", "🌙", "💤", "🎉"] },
  { value: "other", label: "其他", icons: ["🎈", "🌈", "🦄", "🐶", "🐱", "🦖", "🚀", "🌙", "☀️", "🌸", "🪐", "🎀"] },
];

export const WISH_REPEAT_MODE_OPTIONS: WishOption<RewardRepeatMode>[] = [
  { value: "single", label: "单次兑换", description: "兑换后消失" },
  { value: "multi", label: "多次兑换", description: "设定兑换次数" },
  { value: "cycle", label: "循环愿望", description: "按期重置次数" },
  { value: "forever", label: "永久愿望", description: "无限次兑换" },
];

export const WISH_RESET_PERIOD_OPTIONS: WishOption<RewardResetPeriod>[] = [
  { value: "daily", label: "每日重置" },
  { value: "weekly", label: "每周重置" },
  { value: "monthly", label: "每月重置" },
];

export const WISH_COST_GUIDE_LINES = [
  "小愿望（零食、贴纸）：5-20 ⭐",
  "中等愿望（玩具、书籍）：20-50 ⭐",
  "大愿望（游乐园、电子产品）：50-200 ⭐",
  "超级愿望（特别奖励）：200+ ⭐",
];

export function formatWishCategoryLabel(category: RewardCategory): string {
  return WISH_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "其他";
}

export function formatWishRepeatModeLabel(mode: RewardRepeatMode): string {
  return WISH_REPEAT_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? "愿望";
}

export function formatWishResetPeriodLabel(period: RewardResetPeriod): string {
  return WISH_RESET_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "每周重置";
}

export function getWishIconCategory(category: RewardCategory): WishIconCategory {
  return WISH_ICON_CATEGORIES.find((item) => item.value === category) ?? WISH_ICON_CATEGORIES[0];
}

export function getWishRepeatModeDescription(mode: RewardRepeatMode): string {
  return WISH_REPEAT_MODE_OPTIONS.find((option) => option.value === mode)?.description ?? "";
}
