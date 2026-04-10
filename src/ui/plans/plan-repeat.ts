import type {
  PlanCompletionDateLimitMode,
  PlanEbbinghausPreset,
  PlanRepeatType,
  PlanWeekday,
} from "../../domain/model.js";

interface PlanRepeatDefinition {
  value: PlanRepeatType;
  label: string;
  helper: (dateKey: string) => string;
}

const PLAN_REPEAT_DEFINITIONS: readonly PlanRepeatDefinition[] = [
  {
    value: "once",
    label: "仅当天",
    helper: (dateKey) => `该任务会在 ${dateKey} 这一天出现。`,
  },
  {
    value: "daily",
    label: "每天",
    helper: (dateKey) => `任务会从 ${dateKey} 开始按天记录为重复计划。`,
  },
  {
    value: "weekly-custom",
    label: "每周(自定义)",
    helper: () => "任务会按每周节奏记录，后续可补充更细的自定义规则。",
  },
  {
    value: "biweekly-custom",
    label: "每双周(自定义)",
    helper: () => "任务会按每双周节奏记录，适合同周期安排。",
  },
  {
    value: "ebbinghaus",
    label: "艾宾浩斯",
    helper: () => "任务会按艾宾浩斯记忆节奏记录为复习计划。",
  },
  {
    value: "current-week-cross-day-once",
    label: "本周1次（跨日任务）",
    helper: () => "任务会记录为本周 1 次的跨日任务。",
  },
  {
    value: "current-biweekly-cross-day-once",
    label: "本双周1次（跨日任务）",
    helper: () => "任务会记录为本双周 1 次的跨日任务。",
  },
  {
    value: "current-month-cross-day-once",
    label: "本月1次（跨日任务）",
    helper: () => "任务会记录为本月 1 次的跨日任务。",
  },
  {
    value: "weekly-cross-day-once",
    label: "每周1次（跨日任务）",
    helper: () => "任务会记录为每周 1 次的跨日任务。",
  },
  {
    value: "biweekly-cross-day-once",
    label: "每双周1次（跨日任务）",
    helper: () => "任务会记录为每双周 1 次的跨日任务。",
  },
  {
    value: "monthly-cross-day-once",
    label: "每月1次（跨日任务）",
    helper: () => "任务会记录为每月 1 次的跨日任务。",
  },
];

function getPlanRepeatDefinition(repeatType: PlanRepeatType): PlanRepeatDefinition {
  return PLAN_REPEAT_DEFINITIONS.find((definition) => definition.value === repeatType) ?? PLAN_REPEAT_DEFINITIONS[0];
}

export const PLAN_REPEAT_OPTIONS = PLAN_REPEAT_DEFINITIONS.map((definition) => ({
  value: definition.value,
  label: definition.label,
})) satisfies ReadonlyArray<{ value: PlanRepeatType; label: string }>;

export function formatPlanRepeatBadgeLabel(repeatType: PlanRepeatType): string {
  return getPlanRepeatDefinition(repeatType).label;
}

export function formatPlanRepeatOptionLabel(repeatType: PlanRepeatType, dateKey: string): string {
  return repeatType === "once" ? `${formatPlanRepeatBadgeLabel(repeatType)} (${dateKey})` : formatPlanRepeatBadgeLabel(repeatType);
}

export function formatPlanRepeatHelper(repeatType: PlanRepeatType, dateKey: string): string {
  return getPlanRepeatDefinition(repeatType).helper(dateKey);
}

export function formatPlanRepeatSaveNotice(repeatType: PlanRepeatType, title: string): string {
  if (repeatType === "once") {
    return `已添加计划：${title}`;
  }

  return `已添加计划：${title}。已按“${formatPlanRepeatBadgeLabel(repeatType)}”安排到对应日期。`;
}

export const PLAN_WEEKDAY_OPTIONS: ReadonlyArray<{ value: PlanWeekday; label: string }> = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 7, label: "周日" },
];

export const PLAN_EBBINGHAUS_PRESET_OPTIONS: ReadonlyArray<{
  value: PlanEbbinghausPreset;
  label: string;
  offsets: number[];
  description: string;
}> = [
  {
    value: "standard",
    label: "标准 (0,1,3,6,14,29)",
    offsets: [0, 1, 3, 6, 14, 29],
    description: "经典艾宾浩斯曲线（含当天）",
  },
  {
    value: "gentle",
    label: "温和 (0,2,6,13,29)",
    offsets: [0, 2, 6, 13, 29],
    description: "适合日常巩固（含当天）",
  },
  {
    value: "exam",
    label: "考前 (0,1,2,4,6,9,14)",
    offsets: [0, 1, 2, 4, 6, 9, 14],
    description: "考前密集复习（含当天）",
  },
  {
    value: "intensive",
    label: "强化 (0,1,3,6,14,29,59)",
    offsets: [0, 1, 3, 6, 14, 29, 59],
    description: "长期强化记忆（含当天）",
  },
];

export const PLAN_COMPLETION_DATE_LIMIT_OPTIONS: ReadonlyArray<{ value: PlanCompletionDateLimitMode; label: string }> = [
  { value: "anytime", label: "任意时间" },
  { value: "workday", label: "仅工作日 (周一至周五)" },
  { value: "weekend", label: "仅周末 (周六、周日)" },
  { value: "custom", label: "自定义选择" },
];

export function isCustomWeekdayRepeatType(repeatType: PlanRepeatType): boolean {
  return repeatType === "weekly-custom" || repeatType === "biweekly-custom";
}

export function isEbbinghausRepeatType(repeatType: PlanRepeatType): boolean {
  return repeatType === "ebbinghaus";
}

export function isCrossDayRepeatType(repeatType: PlanRepeatType): boolean {
  return (
    repeatType === "current-week-cross-day-once" ||
    repeatType === "current-biweekly-cross-day-once" ||
    repeatType === "current-month-cross-day-once" ||
    repeatType === "weekly-cross-day-once" ||
    repeatType === "biweekly-cross-day-once" ||
    repeatType === "monthly-cross-day-once"
  );
}

export function requiresRepeatDateRange(repeatType: PlanRepeatType): boolean {
  return (
    repeatType === "weekly-custom" ||
    repeatType === "biweekly-custom" ||
    repeatType === "weekly-cross-day-once" ||
    repeatType === "biweekly-cross-day-once" ||
    repeatType === "monthly-cross-day-once"
  );
}

export function getCrossDayRepeatSummary(repeatType: PlanRepeatType): string {
  switch (repeatType) {
    case "current-week-cross-day-once":
      return "本周内完成即可，不会重复生成";
    case "current-biweekly-cross-day-once":
      return "本双周内完成即可，不会重复生成";
    case "current-month-cross-day-once":
      return "本月内完成即可，不会重复生成";
    case "weekly-cross-day-once":
      return "每周都会生成一个新任务，需在7天内完成";
    case "biweekly-cross-day-once":
      return "每两周生成一个新任务，需在14天内完成";
    case "monthly-cross-day-once":
      return "每月都会生成一个新任务，需在30天内完成";
    default:
      return "";
  }
}
