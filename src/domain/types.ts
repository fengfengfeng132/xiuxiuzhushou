export type PlanStatus = "pending" | "done";
export type PlanCompletionMode = "duration" | "actual";
export type PlanRepeatType =
  | "once"
  | "daily"
  | "weekly-custom"
  | "biweekly-custom"
  | "ebbinghaus"
  | "current-week-cross-day-once"
  | "current-biweekly-cross-day-once"
  | "current-month-cross-day-once"
  | "weekly-cross-day-once"
  | "biweekly-cross-day-once"
  | "monthly-cross-day-once";
export type HabitFrequency = "dailyOnce" | "dailyMultiple" | "weeklyMultiple";
export type HabitStatus = "active" | "archived";
export type PetInteractionId = "feed" | "bathe" | "park" | "sleep";
export type RewardCategory = "toy" | "food" | "activity" | "electronics" | "books" | "privilege" | "other";
export type RewardRepeatMode = "single" | "multi" | "cycle" | "forever";
export type RewardResetPeriod = "daily" | "weekly" | "monthly";

export interface Profile {
  id: string;
  name: string;
  role: "student";
}

export interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  repeatType: PlanRepeatType;
  minutes: number;
  stars: number;
  status: PlanStatus;
  createdAt: string;
  completedAt: string | null;
  completionRecords: PlanCompletionRecord[];
}

export interface PlanCompletionAttachment {
  name: string;
  type: string;
  size: number;
}

export interface PlanCompletionRecord {
  id: string;
  mode: PlanCompletionMode;
  durationSeconds: number;
  note: string;
  attachments: PlanCompletionAttachment[];
  completedAt: string;
}

export interface Habit {
  id: string;
  profileId: string;
  name: string;
  description: string;
  frequency: HabitFrequency;
  targetCount: number;
  points: number;
  approvalRequired: boolean;
  icon: string;
  color: string;
  createdAt: string;
  status: HabitStatus;
  completions: Record<string, number>;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: RewardCategory;
  icon: string;
  customImage: string | null;
  repeatMode: RewardRepeatMode;
  repeatConfig: {
    maxRedemptions: number | null;
    resetPeriod: RewardResetPeriod | null;
    redemptionsPerPeriod: number | null;
  } | null;
  redeemedCount: number;
  redemptionHistory: string[];
}

export interface PetDefinition {
  id: string;
  name: string;
  species: string;
  description: string;
  emoji: string;
  accent: string;
  accentSoft: string;
  badge: string;
  cost: number;
}

export interface OwnedPet {
  definitionId: string;
  profileId: string;
  adoptedAt: string;
  intimacy: number;
  satiety: number;
  cleanliness: number;
  mood: number;
  lastInteractionId: PetInteractionId | null;
  lastInteractionAt: string | null;
}

export interface PetCenterState {
  activePetDefinitionId: string | null;
  companions: OwnedPet[];
}

export interface PetLevelTier {
  level: number;
  title: string;
  threshold: number;
  description: string;
}

export interface PetInteractionAction {
  id: PetInteractionId;
  title: string;
  badge: string;
  description: string;
  accent: string;
  accentSoft: string;
  intimacyDelta: number;
  satietyDelta: number;
  cleanlinessDelta: number;
  moodDelta: number;
  activityMessage: string;
  successMessage: string;
}

export interface StarTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  kind:
    | "plan-added"
    | "plan-completed"
    | "habit-created"
    | "habit-checked"
    | "reward-redeemed"
    | "pet-adopted"
    | "pet-switched"
    | "pet-interacted"
    | "system";
  message: string;
  createdAt: string;
}

export interface AppState {
  version: string;
  profile: Profile;
  plans: StudyPlan[];
  habits: Habit[];
  rewards: Reward[];
  pets: PetCenterState;
  starTransactions: StarTransaction[];
  activity: ActivityEntry[];
  meta: {
    nextId: number;
    lastUpdatedAt: string;
  };
}

export interface CommandResult {
  ok: boolean;
  nextState: AppState;
  message: string;
}

export interface Summary {
  starBalance: number;
  pendingPlans: number;
  completedPlans: number;
  todayHabitCheckins: number;
  redeemableRewards: number;
}

export interface HabitFrequencyOption {
  value: HabitFrequency;
  label: string;
  helper: string;
  targetCount: number;
  period: "day" | "week";
}

export interface HabitProgress {
  count: number;
  limit: number;
  remaining: number;
  period: "day" | "week";
}

export interface CreateHabitInput {
  name: string;
  description: string;
  frequency: HabitFrequency;
  points: number;
  approvalRequired: boolean;
  icon: string;
  color: string;
}

export interface CreateRewardInput {
  title: string;
  description?: string;
  cost: number;
  category: RewardCategory;
  icon: string;
  customImage?: string | null;
  repeatMode: RewardRepeatMode;
  repeatConfig?: {
    maxRedemptions?: number | null;
    resetPeriod?: RewardResetPeriod | null;
    redemptionsPerPeriod?: number | null;
  };
}

export interface CheckInHabitInput {
  note?: string;
  useCustomPoints?: boolean;
  customPoints?: number;
}

export interface CompletePlanInput {
  mode?: PlanCompletionMode;
  durationSeconds?: number;
  note?: string;
  attachments?: PlanCompletionAttachment[];
}

export interface RewardRedeemSummary {
  canRedeem: boolean;
  shortfall: number;
  remainingLabel: string;
  blockedReason: string | null;
}
