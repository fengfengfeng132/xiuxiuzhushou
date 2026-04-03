import type { PlanRepeatType } from "../../domain/model.js";

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
    label: "本周1次",
    helper: () => "任务会记录为本周 1 次的跨日任务。",
  },
  {
    value: "current-biweekly-cross-day-once",
    label: "本双周1次",
    helper: () => "任务会记录为本双周 1 次的跨日任务。",
  },
  {
    value: "current-month-cross-day-once",
    label: "本月1次",
    helper: () => "任务会记录为本月 1 次的跨日任务。",
  },
  {
    value: "weekly-cross-day-once",
    label: "每周1次",
    helper: () => "任务会记录为每周 1 次的跨日任务。",
  },
  {
    value: "biweekly-cross-day-once",
    label: "每双周1次",
    helper: () => "任务会记录为每双周 1 次的跨日任务。",
  },
  {
    value: "monthly-cross-day-once",
    label: "每月1次",
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
