import type {
  HabitFrequency,
  PlanRepeatType as DomainPlanRepeatType,
  RewardCategory,
  RewardRepeatMode,
  RewardResetPeriod,
} from "../domain/model.js";

// Local UI state and view-model types live here so future agents can open one small file first.
export type Screen =
  | "home"
  | "plan-create"
  | "plan-batch-create"
  | "ai-plan-assistant"
  | "plan-management"
  | "habit-management"
  | "habit-statistics"
  | "pet-center"
  | "help-center"
  | "more-features"
  | "height-management"
  | "morning-reading"
  | "interest-class"
  | "reading-journey"
  | "reading-book-detail"
  | "achievement-system"
  | "points-center"
  | "star-rules"
  | "points-history"
  | "study-timer";

export type PlanRepeatType = DomainPlanRepeatType;
export type PlanTimeMode = "duration" | "time-range";

export interface PlanAttachmentDraft {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface PlanDraft {
  startDate: string;
  category: string;
  title: string;
  content: string;
  repeatType: PlanRepeatType;
  timeMode: PlanTimeMode;
  durationMinutes: string;
  startTime: string;
  endTime: string;
  useCustomPoints: boolean;
  customPoints: string;
  approvalRequired: boolean;
  attachments: PlanAttachmentDraft[];
}

export interface BatchPlanDraft {
  rawText: string;
  startDate: string;
  repeatType: PlanRepeatType;
  defaultDurationMinutes: string;
  useCustomPoints: boolean;
  customPoints: string;
  approvalRequired: boolean;
}

export interface BatchPlanPreviewItem {
  id: string;
  category: string;
  title: string;
  lineNumber: number;
}

export interface AiPlanAttachmentDraft {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface AiPlanComposerDraft {
  prompt: string;
  attachments: AiPlanAttachmentDraft[];
}

export interface AiPlanMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  attachments: AiPlanAttachmentDraft[];
  createdAt: string;
}

export interface AiPlanSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: AiPlanMessage[];
}

export type QuickCompleteMode = "duration" | "actual";

export interface QuickCompleteAttachmentDraft {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface QuickCompleteDraft {
  planId: string;
  mode: QuickCompleteMode;
  hours: string;
  minutes: string;
  seconds: string;
  note: string;
  attachments: QuickCompleteAttachmentDraft[];
}

export type PlanPointsReviewDecision = "approve" | "adjust" | "reject";

export interface PlanPointsReviewDraft {
  planId: string;
  completionRecordId: string;
  decision: PlanPointsReviewDecision;
  adjustedStars: string;
  reason: string;
}

export interface PendingPlanReviewItem {
  planId: string;
  completionRecordId: string;
  title: string;
  subject: string;
  completedAt: string;
  durationSeconds: number;
  sessionCount: number;
  suggestedStars: number;
}

export interface HabitDraft {
  name: string;
  description: string;
  frequency: HabitFrequency;
  points: string;
  approvalRequired: boolean;
  icon: string;
  color: string;
}

export interface HabitCheckInDraft {
  habitId: string;
  note: string;
  useCustomPoints: boolean;
  customPoints: string;
}

export interface WishDraft {
  iconCategory: RewardCategory;
  icon: string;
  customImage: string | null;
  customImageName: string;
  title: string;
  description: string;
  category: RewardCategory;
  cost: string;
  repeatMode: RewardRepeatMode;
  maxRedemptions: string;
  resetPeriod: RewardResetPeriod;
  redemptionsPerPeriod: string;
}

export type PlanDeleteScope = "currentDateOnly" | "allOccurrences";

export interface SubjectStyle {
  accent: string;
  tint: string;
  glow: string;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string;
  hint: string;
  tone: string;
}

export type HabitBoardFilter = "all" | "positive" | "negative" | "completed" | "pending" | "dailyMultiple" | "weeklyMultiple";
export type HabitBoardLayout = "grid" | "list";
export type HabitStatsRange = "week" | "month" | "history";

export interface HabitFilterOption {
  value: HabitBoardFilter;
  label: string;
}

export interface HabitStatsRangeOption {
  value: HabitStatsRange;
  label: string;
}

export interface HabitStatsRow {
  habitId: string;
  name: string;
  checkIns: number;
  points: number;
}

export interface HabitStatsSummary {
  checkIns: number;
  totalPoints: number;
  habitCount: number;
  averagePoints: number;
  rows: HabitStatsRow[];
}

export interface PetNeedCard {
  id: "satiety" | "cleanliness" | "mood";
  title: string;
  icon: string;
  value: number;
  helper: string;
}

export interface HelpFeatureCard {
  id: string;
  title: string;
  icon: string;
  accent: string;
  action: "plans" | "habits" | "habit-stats" | "reading-journey" | "help-placeholder";
  howTo: string[];
  tips: string[];
}

export type MoreFeatureAction =
  | "habit-management"
  | "habit-statistics"
  | "pet-center"
  | "help-center"
  | "reading-journey"
  | "morning-reading"
  | "height-management"
  | "interest-class"
  | "home-habits"
  | "placeholder";

export interface MoreFeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  action: MoreFeatureAction;
  keywords: string[];
  badge?: string;
  featured?: boolean;
  message?: string;
}

export interface MoreFeatureSection {
  id: string;
  title: string;
  icon: string;
  accent: string;
  columns: 2 | 3;
  cards: MoreFeatureCard[];
}

export interface AppInfoItem {
  label: string;
  value: string;
}
