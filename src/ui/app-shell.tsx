import type { DragEvent, FormEvent, JSX } from "react";
import { useEffect, useRef, useState } from "react";
import {
  acknowledgeSyncedOperations,
  addDefaultHabits,
  addPlan,
  adoptPet,
  archiveHabits,
  checkInHabit,
  completePlan,
  createHabit,
  createReward,
  deleteReward,
  deletePlansForDate,
  deletePlans,
  currentDateKey,
  getActivePetCompanion,
  getHabitFrequencyOption,
  getPetDefinition,
  getPetLevelTier,
  isPlanCompletedForDate,
  isPlanScheduledForDate,
  interactWithPet,
  markStateMutation,
  mergeStateForSync,
  PET_RECYCLE_REFUND_STARS,
  recyclePet,
  redeemReward,
  reviewPlanCompletion,
  switchActivePet,
  summarizeState,
  updatePlan,
  updateReward,
  type AppState,
  type Habit,
  type PlanCompletionAttachment,
  type PetInteractionAction,
  type Reward,
  type RewardCategory,
  type RewardRepeatMode,
  type RewardResetPeriod,
  type StudyPlan,
} from "../domain/model.js";
import {
  createDefaultDashboardConfigPreference,
  MAX_LOCAL_PROFILES,
  createLocalProfile,
  clearLocalProfileData,
  type DashboardConfigPreference,
  type DashboardModuleId,
  deleteLocalProfile,
  loadLocalProfileWorkspace,
  loadAppState,
  loadDashboardConfigPreference,
  loadDashboardTabPreference,
  loadOrCreateSyncDeviceId,
  logoutLocalProfile,
  renameLocalProfile,
  resetAppState,
  saveAppState,
  saveDashboardConfigPreference,
  saveDashboardTabPreference,
  switchLocalProfile,
  type LocalProfileWorkspace,
  type DashboardTab,
} from "../persistence/storage.js";
import {
  fetchRemoteSyncSnapshot,
  pushRemoteSyncSnapshot,
  refreshSupabaseSession,
  runSupabaseInitializationCheck,
  signInSupabaseWithPassword,
  signUpSupabaseWithPassword,
  type SupabaseInitializationCheckItem,
  type SupabaseSyncConfig,
} from "../persistence/supabase-sync.js";
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL } from "../persistence/supabase-config.js";
import {
  loadSyncAccountSession,
  loadSyncAccountSettings,
  saveSyncAccountSession,
  saveSyncAccountSettings,
  type SyncAccountSession,
  type SyncAccountSettings,
} from "../persistence/sync-storage.js";
import {
  loadHeightManagementState,
  resetHeightManagementState,
  saveHeightManagementState,
  type HeightManagementState,
} from "../persistence/height-storage.js";
import {
  loadMorningReadingState,
  resetMorningReadingState,
  saveMorningReadingState,
  type MorningReadingState,
} from "../persistence/morning-reading-storage.js";
import {
  loadInterestClassState,
  resetInterestClassState,
  saveInterestClassState,
  type InterestClassItem,
  type InterestClassRecord,
  type InterestClassState,
} from "../persistence/interest-storage.js";
import {
  loadReadingJourneyState,
  resetReadingJourneyState,
  saveReadingJourneyState,
  type ReadingBook,
  type ReadingJourneyState,
  type ReadingRecord,
} from "../persistence/reading-storage.js";
import {
  INITIAL_AI_PLAN_COMPOSER_DRAFT,
  DASHBOARD_MODULE_DEFINITIONS,
  createInitialBatchPlanDraft,
  createInitialPlanDraft,
  createPlanDraftFromPlan,
  createInitialWishDraft,
  INITIAL_HABIT_CHECKIN_DRAFT,
  INITIAL_HABIT_DRAFT,
  INITIAL_PLAN_POINTS_REVIEW_DRAFT,
  INITIAL_QUICK_COMPLETE_DRAFT,
  MORE_FEATURE_SECTIONS,
} from "./app-content.js";
import {
  buildHeroSummary,
  createMetricCards,
  getCompletedPlansForDate,
  getPendingPlansForDate,
  getWeekDates,
  matchesHabitFilter,
  matchesMoreFeatureCard,
  shiftDateKey,
  summarizeHabitStats,
} from "./app-helpers.js";
import type {
  AiPlanAttachmentDraft,
  AiPlanComposerDraft,
  AiPlanMessage,
  AiPlanSession,
  BatchPlanDraft,
  MetricCard,
  HabitBoardFilter,
  HabitBoardLayout,
  HabitCheckInDraft,
  HabitDraft,
  HabitStatsRange,
  MoreFeatureCard,
  PlanDraft,
  PlanPointsReviewDecision,
  PlanPointsReviewDraft,
  PlanRepeatType,
  PendingPlanReviewItem,
  QuickCompleteAttachmentDraft,
  QuickCompleteDraft,
  QuickCompleteMode,
  PlanDeleteScope,
  Screen,
  WishDraft,
} from "./app-types.js";
import { HabitBoard, HabitCheckInModal, HabitManagementScreen, HabitModal, HabitStatisticsScreen } from "./habits/habits-module.js";
import { HelpCenterScreen } from "./help/help-center-screen.js";
import { HeightManagementScreen } from "./height/height-management-screen.js";
import { HomeScreen } from "./home/home-screen.js";
import { SyncAccountModal } from "./home/sync-account-modal.js";
import {
  InterestClassModal,
  InterestClassRecordModal,
  InterestClassScreen,
  createInterestClassDraftFromClass,
  createInterestClassRecordDraftFromRecord,
  createInitialInterestClassDraft,
  createInitialInterestClassRecordDraft,
  type InterestClassDraft,
  type InterestClassRecordDraft,
} from "./interest/interest-class-screen.js";
import { DashboardConfigScreen } from "./more-features/dashboard-config-screen.js";
import { MoreFeaturesScreen } from "./more-features/more-features-screen.js";
import { MorningReadingScreen } from "./morning-reading/morning-reading-screen.js";
import { PetCenterScreen } from "./pets/pet-center-screen.js";
import { AchievementSystemScreen } from "./points/achievement-system-screen.js";
import { PointsCenterScreen } from "./points/points-center-screen.js";
import { PointsHistoryScreen } from "./points/points-history-screen.js";
import { StarRulesScreen } from "./points/star-rules-screen.js";
import { WishDeleteConfirmModal } from "./points/wish-delete-confirm-modal.js";
import { WishModal } from "./points/wish-modal.js";
import { getWishIconCategory } from "./points/wish-config.js";
import { buildAchievementOverview, buildDailyPointOpportunities, summarizePointsMetrics } from "./points/points-helpers.js";
import { AiPlanAssistantScreen } from "./plans/ai-plan-assistant-screen.js";
import { resolveBatchCustomStars, resolveBatchDurationMinutes, parseBatchPlanInput } from "./plans/batch-plan-helpers.js";
import { BatchPlanCreateScreen } from "./plans/batch-plan-create-screen.js";
import { applyManagedPlanOrder, createManagedPlanOrder, reorderManagedPlanIds } from "./plans/plan-management-helpers.js";
import { PlanDeleteSelectedModal, PlanManagementScreen } from "./plans/plan-management-screen.js";
import { PlanCreateScreen } from "./plans/plan-create-screen.js";
import {
  PLAN_EBBINGHAUS_PRESET_OPTIONS,
  formatPlanRepeatSaveNotice,
  isCrossDayRepeatType,
  isCustomWeekdayRepeatType,
  isEbbinghausRepeatType,
} from "./plans/plan-repeat.js";
import { PlanBoard, PlanDetailModal, PlanPointsReviewModal, QuickCompleteModal } from "./plans/plans-module.js";
import {
  ReadingBookDetailScreen,
  ReadingBookModal,
  ReadingJourneyScreen,
  ReadingRecordModal,
  createInitialReadingBookDraft,
  createInitialReadingRecordDraft,
  type ReadingBookDraft,
  type ReadingFilterCategory,
  type ReadingFilterStatus,
  type ReadingRecordDraft,
} from "./reading/reading-journey-screen.js";
import { StudyTimerScreen } from "./timer/study-timer-screen.js";
import { AddProfileModal } from "./profile/add-profile-modal.js";
import { ProfileManagementScreen } from "./profile/profile-management-screen.js";

// AppShell keeps state and navigation only. Feature JSX lives in feature modules for future agent handoff.
function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseClockToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatClockInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function resolvePlanDurationMinutes(draft: PlanDraft): number | null {
  if (draft.timeMode === "duration") {
    const minutes = Math.round(Number(draft.durationMinutes));
    return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
  }

  const startMinutes = parseClockToMinutes(draft.startTime);
  const endMinutes = parseClockToMinutes(draft.endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return endMinutes - startMinutes;
}

const PLAN_ALL_WEEKDAYS: ReadonlyArray<1 | 2 | 3 | 4 | 5 | 6 | 7> = [1, 2, 3, 4, 5, 6, 7];
const PLAN_WORKDAYS: ReadonlyArray<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];
const PLAN_WEEKENDS: ReadonlyArray<6 | 7> = [6, 7];

function resolvePlanWeekdayFromDateKey(dateKey: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const date = new Date(dateKey);
  const day = date.getDay();
  return (day === 0 ? 7 : day) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

function normalizeDraftWeekdays(values: ReadonlyArray<number>): Array<1 | 2 | 3 | 4 | 5 | 6 | 7> {
  const unique = [...new Set(values.filter((value): value is 1 | 2 | 3 | 4 | 5 | 6 | 7 => PLAN_ALL_WEEKDAYS.includes(value as 1 | 2 | 3 | 4 | 5 | 6 | 7)))];
  unique.sort((left, right) => left - right);
  return unique;
}

function resolveEbbinghausOffsets(preset: PlanDraft["ebbinghausPreset"]): number[] {
  return PLAN_EBBINGHAUS_PRESET_OPTIONS.find((option) => option.value === preset)?.offsets ?? PLAN_EBBINGHAUS_PRESET_OPTIONS[0].offsets;
}

function resolveCompletionDateLimitDays(draft: PlanDraft, fallbackDay: 1 | 2 | 3 | 4 | 5 | 6 | 7): Array<1 | 2 | 3 | 4 | 5 | 6 | 7> | null {
  if (draft.completionDateLimitMode === "anytime") {
    return null;
  }
  if (draft.completionDateLimitMode === "workday") {
    return [...PLAN_WORKDAYS];
  }
  if (draft.completionDateLimitMode === "weekend") {
    return [...PLAN_WEEKENDS];
  }
  const normalized = normalizeDraftWeekdays(draft.completionDateLimitDays);
  return normalized.length > 0 ? normalized : [fallbackDay];
}

function resolvePlanRepeatConfig(draft: PlanDraft, startDate: string): StudyPlan["repeatConfig"] {
  const fallbackDay = resolvePlanWeekdayFromDateKey(startDate);
  const hasDateRange = draft.endDate.trim().length > 0 || (isCustomWeekdayRepeatType(draft.repeatType) || draft.repeatType === "weekly-cross-day-once" || draft.repeatType === "biweekly-cross-day-once" || draft.repeatType === "monthly-cross-day-once");

  const weeklyDays =
    isCustomWeekdayRepeatType(draft.repeatType) ? (() => {
      const normalized = normalizeDraftWeekdays(draft.repeatWeekdays);
      return normalized.length > 0 ? normalized : [fallbackDay];
    })() : null;

  const completionDateLimitDays = isCrossDayRepeatType(draft.repeatType) ? resolveCompletionDateLimitDays(draft, fallbackDay) : null;

  const parsedRequired = Math.round(Number(draft.requiredCompletionsPerPeriod));
  const requiredCompletionsPerPeriod = isCrossDayRepeatType(draft.repeatType) && Number.isFinite(parsedRequired) && parsedRequired > 0 ? parsedRequired : 1;

  const parsedMaxPerDay = Math.round(Number(draft.maxCompletionsPerDay));
  const maxCompletionsPerDay =
    isCrossDayRepeatType(draft.repeatType) && Number.isFinite(parsedMaxPerDay) && parsedMaxPerDay > 0 ? parsedMaxPerDay : null;

  const hasAnyConfig =
    hasDateRange ||
    weeklyDays !== null ||
    isEbbinghausRepeatType(draft.repeatType) ||
    isCrossDayRepeatType(draft.repeatType);

  if (!hasAnyConfig) {
    return null;
  }

  return {
    dateRangeStart: hasDateRange ? startDate : null,
    dateRangeEnd: draft.endDate.trim().length > 0 ? draft.endDate : null,
    weeklyDays,
    ebbinghausPreset: isEbbinghausRepeatType(draft.repeatType) ? draft.ebbinghausPreset : null,
    ebbinghausOffsets: isEbbinghausRepeatType(draft.repeatType) ? resolveEbbinghausOffsets(draft.ebbinghausPreset) : null,
    completionDateLimitMode: isCrossDayRepeatType(draft.repeatType) ? draft.completionDateLimitMode : null,
    completionDateLimitDays,
    requiredCompletionsPerPeriod: isCrossDayRepeatType(draft.repeatType) ? requiredCompletionsPerPeriod : null,
    maxCompletionsPerDay,
  };
}

function validatePlanRepeatDraft(draft: PlanDraft, startDate: string): string | null {
  if (draft.endDate && !isValidDateKey(draft.endDate)) {
    return "结束日期格式无效，请重新选择。";
  }

  if (draft.endDate && draft.endDate < startDate) {
    return "结束日期不能早于开始日期。";
  }

  if (isCustomWeekdayRepeatType(draft.repeatType) && normalizeDraftWeekdays(draft.repeatWeekdays).length === 0) {
    return "请至少选择一个重复日期。";
  }

  if (isCrossDayRepeatType(draft.repeatType)) {
    const parsedRequired = Math.round(Number(draft.requiredCompletionsPerPeriod));
    if (!Number.isInteger(parsedRequired) || parsedRequired <= 0) {
      return "完成次数必须是大于 0 的整数。";
    }

    if (draft.maxCompletionsPerDay.trim().length > 0) {
      const parsedMaxPerDay = Math.round(Number(draft.maxCompletionsPerDay));
      if (!Number.isInteger(parsedMaxPerDay) || parsedMaxPerDay <= 0) {
        return "每日最多次数需要留空或填写大于 0 的整数。";
      }
    }

    if (draft.completionDateLimitMode === "custom" && normalizeDraftWeekdays(draft.completionDateLimitDays).length === 0) {
      return "自定义完成日期时，请至少选择一天。";
    }
  }

  return null;
}

function buildPlanDateTime(dateKey: string, time: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

function createLocalUiId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneDashboardConfigPreference(config: DashboardConfigPreference): DashboardConfigPreference {
  return {
    displayMode: config.displayMode,
    moduleOrder: [...config.moduleOrder],
    visibleModuleIds: [...config.visibleModuleIds],
  };
}

function areDashboardConfigPreferencesEqual(left: DashboardConfigPreference, right: DashboardConfigPreference): boolean {
  return (
    left.displayMode === right.displayMode &&
    left.moduleOrder.length === right.moduleOrder.length &&
    left.visibleModuleIds.length === right.visibleModuleIds.length &&
    left.moduleOrder.every((moduleId, index) => moduleId === right.moduleOrder[index]) &&
    left.visibleModuleIds.every((moduleId, index) => moduleId === right.visibleModuleIds[index])
  );
}

function reorderDashboardModuleIds(moduleIds: DashboardModuleId[], draggedId: DashboardModuleId, targetId: DashboardModuleId): DashboardModuleId[] {
  if (draggedId === targetId) {
    return moduleIds;
  }

  const draggedIndex = moduleIds.indexOf(draggedId);
  const targetIndex = moduleIds.indexOf(targetId);
  if (draggedIndex === -1 || targetIndex === -1) {
    return moduleIds;
  }

  const nextIds = [...moduleIds];
  const [movedId] = nextIds.splice(draggedIndex, 1);
  nextIds.splice(targetIndex, 0, movedId);
  return nextIds;
}

const PROFILE_AVATAR_COLOR_OPTIONS = ["#64A187", "#9F7F69", "#5A9B7E", "#9BA66A", "#7CAD93", "#9F7F69", "#7A9CA4", "#9BA66A"];

function collectPendingPlanReviewItems(plans: StudyPlan[]): PendingPlanReviewItem[] {
  const pendingItems: PendingPlanReviewItem[] = [];
  for (const plan of plans) {
    for (const record of plan.completionRecords) {
      if (record.reviewStatus !== "pending") {
        continue;
      }
      pendingItems.push({
        planId: plan.id,
        completionRecordId: record.id,
        title: plan.title,
        subject: plan.subject,
        completedAt: record.completedAt,
        durationSeconds: record.durationSeconds,
        sessionCount: plan.completionRecords.length,
        suggestedStars: plan.stars,
      });
    }
  }
  pendingItems.sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));
  return pendingItems;
}

function parsePositiveInteger(value: string): number | null {
  const parsed = Math.round(Number(value));
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parsePositiveDecimal(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  const rounded = Math.round(parsed * 100) / 100;
  return rounded > 0 ? rounded : null;
}

function parseNonNegativeDecimal(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

function deriveAiSessionTitle(prompt: string, attachments: AiPlanAttachmentDraft[]): string {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length > 0) {
    return trimmedPrompt.slice(0, 18);
  }

  if (attachments.length > 0) {
    return attachments[0].name.slice(0, 18);
  }

  return "新会话";
}

function buildAiTrialReply(prompt: string, attachments: AiPlanAttachmentDraft[]): string {
  const trimmedPrompt = prompt.trim();
  const promptSummary = trimmedPrompt.length > 0 ? `我已经收到你的需求：“${trimmedPrompt}”。` : "我已经收到你上传的图片。";
  const attachmentSummary = attachments.length > 0 ? ` 本次还附带了 ${attachments.length} 张图片。` : "";
  return `${promptSummary}${attachmentSummary} 当前版本先保留对话草稿页，后续会把识别结果转换成可确认保存的学习计划。你也可以继续补充科目、频率、开始时间或时长。`;
}

function createWishDraftFromReward(reward: Reward): WishDraft {
  const iconCategory = getWishIconCategory(reward.category);
  const resolvedIcon = iconCategory.icons.includes(reward.icon) ? reward.icon : iconCategory.icons[0];
  return {
    iconCategory: reward.category,
    icon: resolvedIcon,
    customImage: reward.customImage,
    customImageName: reward.customImage ? "已上传图片" : "",
    title: reward.title,
    description: reward.description,
    category: reward.category,
    cost: String(reward.cost),
    repeatMode: reward.repeatMode,
    maxRedemptions: String(reward.repeatConfig?.maxRedemptions ?? 5),
    resetPeriod: reward.repeatConfig?.resetPeriod ?? "weekly",
    redemptionsPerPeriod: String(reward.repeatConfig?.redemptionsPerPeriod ?? 1),
  };
}

function AppShell(): JSX.Element {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => currentDateKey());
  const [planDraft, setPlanDraft] = useState<PlanDraft>(() => createInitialPlanDraft(currentDateKey()));
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [batchPlanDraft, setBatchPlanDraft] = useState<BatchPlanDraft>(() => createInitialBatchPlanDraft(currentDateKey()));
  const [aiPlanComposerDraft, setAiPlanComposerDraft] = useState<AiPlanComposerDraft>(INITIAL_AI_PLAN_COMPOSER_DRAFT);
  const [aiPlanSessions, setAiPlanSessions] = useState<AiPlanSession[]>([]);
  const [activeAiPlanSessionId, setActiveAiPlanSessionId] = useState<string | null>(null);
  const [habitDraft, setHabitDraft] = useState<HabitDraft>(INITIAL_HABIT_DRAFT);
  const [wishDraft, setWishDraft] = useState<WishDraft>(createInitialWishDraft());
  const [notice, setNotice] = useState("本地数据已加载。");
  const [profileWorkspace, setProfileWorkspace] = useState<LocalProfileWorkspace>(() => loadLocalProfileWorkspace());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [addProfileModalOpen, setAddProfileModalOpen] = useState(false);
  const [addProfileNameDraft, setAddProfileNameDraft] = useState("");
  const [addProfileAvatarColor, setAddProfileAvatarColor] = useState(PROFILE_AVATAR_COLOR_OPTIONS[0]);
  const [addProfileAvatarImage, setAddProfileAvatarImage] = useState<string | null>(null);
  const [profileManagementSearch, setProfileManagementSearch] = useState("");
  const [profileManagementBackTarget, setProfileManagementBackTarget] = useState<"home" | "more-features">("more-features");
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncSettings, setSyncSettings] = useState<SyncAccountSettings>(() => loadSyncAccountSettings());
  const [syncPassword, setSyncPassword] = useState("");
  const [syncSession, setSyncSession] = useState<SyncAccountSession | null>(() => loadSyncAccountSession());
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState("尚未开始同步。");
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => loadDashboardTabPreference());
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfigPreference>(() =>
    loadDashboardConfigPreference(loadLocalProfileWorkspace().activeProfileId),
  );
  const [dashboardConfigDraft, setDashboardConfigDraft] = useState<DashboardConfigPreference>(() =>
    loadDashboardConfigPreference(loadLocalProfileWorkspace().activeProfileId),
  );
  const [screen, setScreen] = useState<Screen>("home");
  const [quickCompleteDraft, setQuickCompleteDraft] = useState<QuickCompleteDraft>(INITIAL_QUICK_COMPLETE_DRAFT);
  const [planPointsReviewDraft, setPlanPointsReviewDraft] = useState<PlanPointsReviewDraft>(INITIAL_PLAN_POINTS_REVIEW_DRAFT);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [deletingWishId, setDeletingWishId] = useState<string | null>(null);
  const [habitCheckInDraft, setHabitCheckInDraft] = useState<HabitCheckInDraft>(INITIAL_HABIT_CHECKIN_DRAFT);
  const [habitTypeMenuOpen, setHabitTypeMenuOpen] = useState(false);
  const [habitSearch, setHabitSearch] = useState("");
  const [moreFeaturesSearch, setMoreFeaturesSearch] = useState("");
  const [heightState, setHeightState] = useState<HeightManagementState>(() => loadHeightManagementState());
  const [morningReadingState, setMorningReadingState] = useState<MorningReadingState>(() => loadMorningReadingState());
  const [interestState, setInterestState] = useState<InterestClassState>(() => loadInterestClassState());
  const [interestClassModalOpen, setInterestClassModalOpen] = useState(false);
  const [interestRecordModalOpen, setInterestRecordModalOpen] = useState(false);
  const [editingInterestClassId, setEditingInterestClassId] = useState<string | null>(null);
  const [editingInterestRecordId, setEditingInterestRecordId] = useState<string | null>(null);
  const [interestClassDraft, setInterestClassDraft] = useState<InterestClassDraft>(createInitialInterestClassDraft());
  const [interestRecordDraft, setInterestRecordDraft] = useState<InterestClassRecordDraft>(() =>
    createInitialInterestClassRecordDraft("", currentDateKey()),
  );
  const [interestFilterStartDate, setInterestFilterStartDate] = useState("");
  const [interestFilterEndDate, setInterestFilterEndDate] = useState("");
  const [readingState, setReadingState] = useState<ReadingJourneyState>(() => loadReadingJourneyState());
  const [readingSearch, setReadingSearch] = useState("");
  const [readingStatusFilter, setReadingStatusFilter] = useState<ReadingFilterStatus>("all");
  const [readingCategoryFilter, setReadingCategoryFilter] = useState<ReadingFilterCategory>("all");
  const [readingBookModalOpen, setReadingBookModalOpen] = useState(false);
  const [editingReadingBookId, setEditingReadingBookId] = useState<string | null>(null);
  const [readingBookDraft, setReadingBookDraft] = useState<ReadingBookDraft>(createInitialReadingBookDraft());
  const [readingRecordModalOpen, setReadingRecordModalOpen] = useState(false);
  const [readingRecordDraft, setReadingRecordDraft] = useState<ReadingRecordDraft>(() => createInitialReadingRecordDraft("", currentDateKey()));
  const [readingDetailBookId, setReadingDetailBookId] = useState<string | null>(null);
  const [habitFilter, setHabitFilter] = useState<HabitBoardFilter>("all");
  const [habitBoardLayout, setHabitBoardLayout] = useState<HabitBoardLayout>("grid");
  const [habitStatsRange, setHabitStatsRange] = useState<HabitStatsRange>("week");
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [planManagementDateKey, setPlanManagementDateKey] = useState<string>(() => currentDateKey());
  const [planManagementOrderIds, setPlanManagementOrderIds] = useState<string[]>([]);
  const [selectedManagedPlanIds, setSelectedManagedPlanIds] = useState<string[]>([]);
  const [planDeleteModalOpen, setPlanDeleteModalOpen] = useState(false);
  const [activeTimerPlanId, setActiveTimerPlanId] = useState<string | null>(null);
  const [planDetailPlanId, setPlanDetailPlanId] = useState<string | null>(null);
  const quickCompleteFileInputRef = useRef<HTMLInputElement | null>(null);
  const aiPlanFileInputRef = useRef<HTMLInputElement | null>(null);
  const habitTypeRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<AppState>(state);
  const [deviceId] = useState(() => loadOrCreateSyncDeviceId());

  const today = currentDateKey();
  const activeHabits = state.habits.filter((habit) => habit.status === "active");
  const ownedPets = state.pets.companions;
  const activePetCompanion = getActivePetCompanion(state);
  const activePetDefinition = activePetCompanion ? getPetDefinition(activePetCompanion.definitionId) : null;
  const activePetLevel = activePetCompanion ? getPetLevelTier(activePetCompanion.intimacy) : null;
  const ownedPetIds = new Set(ownedPets.map((companion) => companion.definitionId));
  const weekDates = getWeekDates(selectedDateKey);
  const summary = summarizeState(state, today);
  const metricCards = createMetricCards(state, today, dashboardConfig);
  const pendingPlans = getPendingPlansForDate(state.plans, selectedDateKey);
  const completedPlans = getCompletedPlansForDate(state.plans, selectedDateKey);
  const recentActivity = state.activity.slice(0, 5);
  const rewardsPreview = state.rewards.slice(0, 3);
  const isProfileLoggedIn = profileWorkspace.activeProfileId !== null;
  const canCreateMoreProfiles = profileWorkspace.profiles.length < MAX_LOCAL_PROFILES;
  const canSubmitAddProfile = addProfileNameDraft.trim().length > 0 && canCreateMoreProfiles;
  const habitType = getHabitFrequencyOption(habitDraft.frequency);
  const parsedHabitPoints = Number(habitDraft.points);
  const canCreateHabit = habitDraft.name.trim().length > 0 && Number.isInteger(parsedHabitPoints) && parsedHabitPoints >= -100 && parsedHabitPoints <= 100;
  const checkInHabitTarget = activeHabits.find((habit) => habit.id === habitCheckInDraft.habitId) ?? null;
  const parsedCheckInPoints = Number(habitCheckInDraft.customPoints);
  const resolvedCheckInPoints =
    habitCheckInDraft.useCustomPoints && Number.isFinite(parsedCheckInPoints) ? parsedCheckInPoints : (checkInHabitTarget?.points ?? 0);
  const canSubmitHabitCheckIn =
    checkInHabitTarget !== null &&
    (!habitCheckInDraft.useCustomPoints || (Number.isInteger(parsedCheckInPoints) && parsedCheckInPoints >= -1000 && parsedCheckInPoints <= 1000));
  const quickCompletePlanTarget = state.plans.find((plan) => plan.id === quickCompleteDraft.planId) ?? null;
  const pendingPlanReviewItems = collectPendingPlanReviewItems(state.plans);
  const activePendingPlanReviewItem =
    pendingPlanReviewItems.find(
      (item) => item.planId === planPointsReviewDraft.planId && item.completionRecordId === planPointsReviewDraft.completionRecordId,
    ) ?? null;
  const activeTimerPlan = state.plans.find((plan) => plan.id === activeTimerPlanId) ?? null;
  const planDetailPlanTarget = state.plans.find((plan) => plan.id === planDetailPlanId) ?? null;
  const planDetailCompletedForSelectedDate = planDetailPlanTarget ? isPlanCompletedForDate(planDetailPlanTarget, selectedDateKey) : false;
  const planDetailCompletionRecordsForSelectedDate = planDetailPlanTarget
    ? planDetailPlanTarget.completionRecords.filter((record) => currentDateKey(record.completedAt) === selectedDateKey)
    : [];
  const activeAiPlanSession = aiPlanSessions.find((session) => session.id === activeAiPlanSessionId) ?? null;
  const parsedBatchPlans = parseBatchPlanInput(batchPlanDraft.rawText);
  const savedPlanManagementOrderIds = createManagedPlanOrder(state.plans, planManagementDateKey);
  const managedPlans = planManagementOrderIds
    .map((planId) => state.plans.find((plan) => plan.id === planId))
    .filter((plan): plan is StudyPlan => {
      if (!plan) {
        return false;
      }
      return isPlanScheduledForDate(plan, planManagementDateKey) && !isPlanCompletedForDate(plan, planManagementDateKey);
    });
  const isPlanManagementDirty =
    savedPlanManagementOrderIds.length !== planManagementOrderIds.length ||
    savedPlanManagementOrderIds.some((planId, index) => planId !== planManagementOrderIds[index]);
  const selectedManagedPlans = managedPlans.filter((plan) => selectedManagedPlanIds.includes(plan.id));
  const hasRecurringManagedSelection = selectedManagedPlans.some((plan) => plan.repeatType !== "once");
  const resolvedPlanMinutes = resolvePlanDurationMinutes(planDraft);
  const normalizedPlanStartDate = isValidDateKey(planDraft.startDate) ? planDraft.startDate : today;
  const planRepeatValidationMessage = validatePlanRepeatDraft(planDraft, normalizedPlanStartDate);
  const parsedPlanCustomPoints = Math.round(Number(planDraft.customPoints));
  const resolvedBatchPlanMinutes = resolveBatchDurationMinutes(batchPlanDraft.defaultDurationMinutes);
  const resolvedBatchPlanCustomStars = resolveBatchCustomStars(batchPlanDraft.customPoints);
  const canSubmitPlan =
    planDraft.category.trim().length > 0 &&
    planDraft.title.trim().length > 0 &&
    planRepeatValidationMessage === null &&
    resolvedPlanMinutes !== null &&
    (!planDraft.useCustomPoints || (Number.isInteger(parsedPlanCustomPoints) && parsedPlanCustomPoints > 0));
  const canSubmitBatchPlan =
    parsedBatchPlans.length > 0 &&
    batchPlanDraft.repeatType === "once" &&
    resolvedBatchPlanMinutes !== null &&
    (!batchPlanDraft.useCustomPoints || resolvedBatchPlanCustomStars !== null);
  const parsedWishCost = Math.round(Number(wishDraft.cost));
  const parsedWishMaxRedemptions = Math.round(Number(wishDraft.maxRedemptions));
  const parsedWishRedemptionsPerPeriod = Math.round(Number(wishDraft.redemptionsPerPeriod));
  const canSubmitWish =
    wishDraft.title.trim().length > 0 &&
    Number.isInteger(parsedWishCost) &&
    parsedWishCost > 0 &&
    (wishDraft.repeatMode !== "multi" || (Number.isInteger(parsedWishMaxRedemptions) && parsedWishMaxRedemptions > 0)) &&
    (wishDraft.repeatMode !== "cycle" || (Number.isInteger(parsedWishRedemptionsPerPeriod) && parsedWishRedemptionsPerPeriod > 0));
  const deletingWishTarget = deletingWishId ? state.rewards.find((item) => item.id === deletingWishId) ?? null : null;
  const quickCompleteHours = Math.max(0, Math.round(Number(quickCompleteDraft.hours) || 0));
  const quickCompleteMinutes = Math.max(0, Math.round(Number(quickCompleteDraft.minutes) || 0));
  const quickCompleteSeconds = Math.max(0, Math.round(Number(quickCompleteDraft.seconds) || 0));
  const quickCompleteDurationSeconds = quickCompleteHours * 3600 + quickCompleteMinutes * 60 + quickCompleteSeconds;
  const quickCompleteActualStartMinutes = parseClockToMinutes(quickCompleteDraft.actualStartTime);
  const quickCompleteActualEndMinutes = parseClockToMinutes(quickCompleteDraft.actualEndTime);
  const quickCompleteActualSeconds =
    quickCompleteActualStartMinutes !== null &&
    quickCompleteActualEndMinutes !== null &&
    quickCompleteActualEndMinutes > quickCompleteActualStartMinutes
      ? (quickCompleteActualEndMinutes - quickCompleteActualStartMinutes) * 60
      : 0;
  const quickCompleteTotalSeconds = quickCompleteDraft.mode === "actual" ? quickCompleteActualSeconds : quickCompleteDurationSeconds;
  const canSubmitQuickComplete = quickCompletePlanTarget !== null && quickCompleteTotalSeconds > 0;
  const parsedPlanPointsReviewStars = Math.round(Number(planPointsReviewDraft.adjustedStars));
  const canSubmitPlanPointsReview =
    activePendingPlanReviewItem !== null &&
    (planPointsReviewDraft.decision !== "adjust" ||
      (Number.isInteger(parsedPlanPointsReviewStars) &&
        parsedPlanPointsReviewStars >= -1000 &&
        parsedPlanPointsReviewStars <= 1000 &&
        planPointsReviewDraft.reason.trim().length > 0));
  const habitSearchKeyword = habitSearch.trim().toLowerCase();
  const moreFeaturesKeyword = moreFeaturesSearch.trim().toLowerCase();
  const dashboardVisibleModuleIds = new Set(dashboardConfigDraft.visibleModuleIds);
  let visibleDashboardOrder = 0;
  const dashboardModuleItems = dashboardConfigDraft.moduleOrder
    .map((moduleId) => {
      const definition = DASHBOARD_MODULE_DEFINITIONS.find((item) => item.id === moduleId);
      if (!definition) {
        return null;
      }
      const visible = dashboardVisibleModuleIds.has(moduleId);
      return {
        ...definition,
        order: visible ? (visibleDashboardOrder += 1) : 0,
        visible,
      };
    })
    .filter((item): item is (typeof DASHBOARD_MODULE_DEFINITIONS)[number] & { order: number; visible: boolean } => item !== null);
  const dashboardConfigDirty = !areDashboardConfigPreferencesEqual(dashboardConfig, dashboardConfigDraft);
  const filteredHabits = activeHabits.filter((habit) => {
    const matchesSearch =
      habitSearchKeyword.length === 0 ||
      habit.name.toLowerCase().includes(habitSearchKeyword) ||
      habit.description.toLowerCase().includes(habitSearchKeyword);
    return matchesSearch && matchesHabitFilter(habit, habitFilter, selectedDateKey);
  });
  const visibleMoreFeatureSections = MORE_FEATURE_SECTIONS.filter((section) => section.id !== "membership")
    .map((section) => ({
      ...section,
      cards: section.cards.filter((card) => matchesMoreFeatureCard(card, moreFeaturesKeyword)),
    }))
    .filter((section) => section.cards.length > 0);
  const habitStats = summarizeHabitStats(state, activeHabits, habitStatsRange, selectedDateKey);
  const pointsMetrics = summarizePointsMetrics(state, today);
  const dailyPointOpportunities = buildDailyPointOpportunities(state, today);
  const achievementOverview = buildAchievementOverview(state);
  const interestClasses = interestState.classes;
  const interestRecords = interestState.records;
  const editingInterestClassTarget = editingInterestClassId ? interestClasses.find((item) => item.id === editingInterestClassId) ?? null : null;
  const editingInterestRecordTarget = editingInterestRecordId ? interestRecords.find((item) => item.id === editingInterestRecordId) ?? null : null;
  const readingBooks = readingState.books;
  const readingRecords = readingState.records;
  const readingDetailBook = readingBooks.find((book) => book.id === readingDetailBookId) ?? null;
  const readingDetailRecords = readingDetailBook ? readingRecords.filter((record) => record.bookId === readingDetailBook.id) : [];

  useEffect(() => {
    stateRef.current = state;
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    saveSyncAccountSettings(syncSettings);
  }, [syncSettings]);

  useEffect(() => {
    saveSyncAccountSession(syncSession);
  }, [syncSession]);

  useEffect(() => {
    saveHeightManagementState(heightState);
  }, [heightState]);

  useEffect(() => {
    saveMorningReadingState(morningReadingState);
  }, [morningReadingState]);

  useEffect(() => {
    saveInterestClassState(interestState);
  }, [interestState]);

  useEffect(() => {
    saveReadingJourneyState(readingState);
  }, [readingState]);

  useEffect(() => {
    saveDashboardTabPreference(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const nextConfig = loadDashboardConfigPreference(state.profile.id);
    setDashboardConfig(nextConfig);
    setDashboardConfigDraft(cloneDashboardConfigPreference(nextConfig));
  }, [state.profile.id]);

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    function handleGlobalPointerDown(event: MouseEvent): void {
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest(".profile-menu-anchor")) {
        return;
      }
      setProfileMenuOpen(false);
    }

    window.addEventListener("mousedown", handleGlobalPointerDown, true);
    return () => {
      window.removeEventListener("mousedown", handleGlobalPointerDown, true);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    setSelectedHabitIds((current) => current.filter((habitId) => state.habits.some((habit) => habit.id === habitId && habit.status === "active")));
  }, [state.habits]);

  useEffect(() => {
    setSelectedManagedPlanIds((current) => current.filter((planId) => planManagementOrderIds.includes(planId)));
  }, [planManagementOrderIds]);

  useEffect(() => {
    if (!activeTimerPlanId || state.plans.some((plan) => plan.id === activeTimerPlanId)) {
      return;
    }
    setActiveTimerPlanId(null);
    if (screen === "study-timer") {
      setScreen("home");
      setActiveTab("plans");
    }
  }, [activeTimerPlanId, screen, state.plans]);

  useEffect(() => {
    if (!planDetailPlanId || state.plans.some((plan) => plan.id === planDetailPlanId)) {
      return;
    }
    setPlanDetailPlanId(null);
  }, [planDetailPlanId, state.plans]);

  useEffect(() => {
    if (!planPointsReviewDraft.planId) {
      return;
    }
    if (activePendingPlanReviewItem) {
      return;
    }
    closePlanPointsReviewModal();
  }, [activePendingPlanReviewItem, planPointsReviewDraft.planId]);

  useEffect(() => {
    if (!readingDetailBookId || readingState.books.some((book) => book.id === readingDetailBookId)) {
      return;
    }
    setReadingDetailBookId(null);
    if (screen === "reading-book-detail") {
      setScreen("reading-journey");
    }
  }, [readingDetailBookId, readingState.books, screen]);

  useEffect(() => {
    if (!editingInterestClassId || interestClasses.some((item) => item.id === editingInterestClassId)) {
      return;
    }
    closeInterestClassModal();
  }, [editingInterestClassId, interestClasses]);

  useEffect(() => {
    if (!editingInterestRecordId || interestRecords.some((item) => item.id === editingInterestRecordId)) {
      return;
    }
    closeInterestRecordModal();
  }, [editingInterestRecordId, interestRecords]);

  useEffect(() => {
    if (!deletingWishId) {
      return;
    }
    if (state.rewards.some((item) => item.id === deletingWishId)) {
      return;
    }
    closeWishDeleteModal();
    setNotice("愿望已不存在。");
  }, [deletingWishId, state.rewards]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!habitTypeMenuOpen) {
      return undefined;
    }
    const handlePointerDown = (event: MouseEvent): void => {
      if (habitTypeRef.current && !habitTypeRef.current.contains(event.target as Node)) {
        setHabitTypeMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [habitTypeMenuOpen]);

  useEffect(() => {
    if (
      !habitModalOpen &&
      !wishModalOpen &&
      !deletingWishId &&
      !planDeleteModalOpen &&
      !checkInHabitTarget &&
      !quickCompletePlanTarget &&
      !activePendingPlanReviewItem &&
      !planDetailPlanTarget &&
      !interestClassModalOpen &&
      !interestRecordModalOpen &&
      !readingBookModalOpen &&
      !readingRecordModalOpen
    ) {
      return undefined;
    }
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        if (interestRecordModalOpen) {
          closeInterestRecordModal();
          return;
        }
        if (interestClassModalOpen) {
          closeInterestClassModal();
          return;
        }
        if (readingRecordModalOpen) {
          closeReadingRecordModal();
          return;
        }
        if (readingBookModalOpen) {
          closeReadingBookModal();
          return;
        }
        if (quickCompletePlanTarget) {
          closeQuickCompleteModal();
          return;
        }
        if (activePendingPlanReviewItem) {
          closePlanPointsReviewModal();
          return;
        }
        if (planDetailPlanTarget) {
          closePlanDetailModal();
          return;
        }
        if (planDeleteModalOpen) {
          closePlanDeleteModal();
          return;
        }
        if (deletingWishId) {
          closeWishDeleteModal();
          return;
        }
        if (wishModalOpen) {
          closeWishModal();
          return;
        }
        if (habitModalOpen) {
          closeHabitModal();
          return;
        }
        closeHabitCheckInModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [
    habitModalOpen,
    wishModalOpen,
    deletingWishId,
    planDeleteModalOpen,
    checkInHabitTarget,
    planDetailPlanTarget,
    quickCompletePlanTarget,
    activePendingPlanReviewItem,
    interestClassModalOpen,
    interestRecordModalOpen,
    readingBookModalOpen,
    readingRecordModalOpen,
  ]);

  useEffect(() => {
    if (!interestClassModalOpen && !interestRecordModalOpen) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [interestClassModalOpen, interestRecordModalOpen]);

  function updatePlanDraft<K extends keyof PlanDraft>(field: K, value: PlanDraft[K]): void {
    setPlanDraft((current) => ({ ...current, [field]: value }));
  }

  function updateBatchPlanDraft(field: keyof BatchPlanDraft, value: string | boolean | PlanRepeatType): void {
    setBatchPlanDraft((current) => ({ ...current, [field]: value }));
  }

  function updateAiPlanComposerDraft(field: keyof AiPlanComposerDraft, value: string | AiPlanAttachmentDraft[]): void {
    setAiPlanComposerDraft((current) => ({ ...current, [field]: value }));
  }

  function updateWishDraft(
    field: keyof WishDraft,
    value: string | RewardCategory | RewardRepeatMode | RewardResetPeriod | null,
  ): void {
    setWishDraft((current) => ({ ...current, [field]: value }));
  }

  function updateInterestClassDraft(field: keyof InterestClassDraft, value: string | boolean): void {
    setInterestClassDraft((current) => ({ ...current, [field]: value }));
  }

  function updateInterestRecordDraft(field: keyof InterestClassRecordDraft, value: string): void {
    setInterestRecordDraft((current) => ({ ...current, [field]: value }));
  }

  function updateReadingBookDraft(field: keyof ReadingBookDraft, value: string): void {
    setReadingBookDraft((current) => ({ ...current, [field]: value }));
  }

  function updateReadingRecordDraft(field: keyof ReadingRecordDraft, value: string): void {
    setReadingRecordDraft((current) => ({ ...current, [field]: value }));
  }

  function openInterestClass(): void {
    setScreen("interest-class");
  }

  function openHeightManagement(): void {
    setScreen("height-management");
  }

  function openMorningReading(): void {
    setScreen("morning-reading");
  }

  function closeInterestClassModal(): void {
    setInterestClassModalOpen(false);
    setEditingInterestClassId(null);
    setInterestClassDraft(createInitialInterestClassDraft());
  }

  function openAddInterestClassModal(): void {
    setEditingInterestClassId(null);
    setInterestClassDraft(createInitialInterestClassDraft());
    setInterestClassModalOpen(true);
  }

  function openEditInterestClassModal(classId: string): void {
    const target = interestClasses.find((item) => item.id === classId);
    if (!target) {
      setNotice("兴趣班不存在，可能已被删除。");
      return;
    }
    setEditingInterestClassId(classId);
    setInterestClassDraft(createInterestClassDraftFromClass(target));
    setInterestClassModalOpen(true);
  }

  function closeInterestRecordModal(): void {
    setInterestRecordModalOpen(false);
    setEditingInterestRecordId(null);
    setInterestRecordDraft(createInitialInterestClassRecordDraft("", today));
  }

  function openInterestRecordModal(classId?: string): void {
    const selectedClassId = classId ?? interestClasses[0]?.id ?? "";
    if (!selectedClassId) {
      setNotice("请先添加一个兴趣班。");
      return;
    }

    if (!interestClasses.some((item) => item.id === selectedClassId)) {
      setNotice("兴趣班不存在，无法记录。");
      return;
    }
    setEditingInterestRecordId(null);
    setInterestRecordDraft(createInitialInterestClassRecordDraft(selectedClassId, today));
    setInterestRecordModalOpen(true);
  }

  function openEditInterestRecordModal(recordId: string): void {
    const target = interestRecords.find((item) => item.id === recordId);
    if (!target) {
      setNotice("记录不存在，可能已被删除。");
      return;
    }

    setEditingInterestRecordId(recordId);
    setInterestRecordDraft(createInterestClassRecordDraftFromRecord(target));
    setInterestRecordModalOpen(true);
  }

  function handleDeleteInterestClass(classId: string): void {
    const target = interestClasses.find((item) => item.id === classId);
    if (!target) {
      setNotice("兴趣班不存在，可能已被删除。");
      return;
    }

    if (!window.confirm(`确定删除“${target.name}”以及对应记录吗？`)) {
      return;
    }

    setInterestState((current) => ({
      classes: current.classes.filter((item) => item.id !== classId),
      records: current.records.filter((record) => record.classId !== classId),
    }));
    setNotice(`已删除兴趣班：${target.name}`);
  }

  function handleDeleteInterestRecord(recordId: string): void {
    const target = interestRecords.find((record) => record.id === recordId);
    if (!target) {
      setNotice("记录不存在，可能已被删除。");
      return;
    }

    if (!window.confirm("确定删除这条兴趣班记录吗？")) {
      return;
    }

    setInterestState((current) => ({
      classes: current.classes,
      records: current.records.filter((record) => record.id !== recordId),
    }));
    setNotice("已删除兴趣班记录。");
  }

  function handleSubmitInterestClass(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = interestClassDraft.name.trim();
    const totalUnits = parsePositiveDecimal(interestClassDraft.totalUnits.trim());
    const unitLabel = interestClassDraft.unitLabel.trim() || "课时";
    const note = interestClassDraft.note.trim();
    const overflowWarningThreshold =
      interestClassDraft.overflowWarningEnabled && interestClassDraft.overflowWarningThreshold.trim().length > 0
        ? parseNonNegativeDecimal(interestClassDraft.overflowWarningThreshold.trim())
        : 0;

    if (!name) {
      setNotice("请填写兴趣班名称。");
      return;
    }
    if (name.length > 24) {
      setNotice("兴趣班名称请控制在 24 个字符以内。");
      return;
    }
    if (unitLabel.length > 8) {
      setNotice("单位请控制在 8 个字符以内。");
      return;
    }
    if (note.length > 200) {
      setNotice("班级备注请控制在 200 个字符以内。");
      return;
    }
    if (totalUnits === null) {
      setNotice("总量需要是大于 0 的数字。");
      return;
    }
    if (interestClassDraft.overflowWarningEnabled && overflowWarningThreshold === null) {
      setNotice("预警阈值需要是不小于 0 的数字。");
      return;
    }
    if (
      interestClasses.some(
        (item) => item.id !== editingInterestClassId && item.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      setNotice("已存在同名兴趣班，请换个名称。");
      return;
    }

    if (editingInterestClassTarget) {
      setInterestState((current) => ({
        classes: current.classes.map((item) =>
          item.id === editingInterestClassTarget.id
            ? {
                ...item,
                name,
                totalUnits,
                unitLabel,
                note,
                overflowWarningEnabled: interestClassDraft.overflowWarningEnabled,
                overflowWarningThreshold: overflowWarningThreshold ?? 0,
              }
            : item,
        ),
        records: current.records,
      }));
      setNotice(`已更新兴趣班：${name}`);
      closeInterestClassModal();
      return;
    }

    const nextClass: InterestClassItem = {
      id: createLocalUiId("interest-class"),
      name,
      totalUnits,
      unitLabel,
      note,
      overflowWarningEnabled: interestClassDraft.overflowWarningEnabled,
      overflowWarningThreshold: overflowWarningThreshold ?? 0,
      createdAt: new Date().toISOString(),
    };

    setInterestState((current) => ({
      classes: [nextClass, ...current.classes],
      records: current.records,
    }));
    closeInterestClassModal();
    setNotice(`已添加兴趣班：${name}`);
  }

  function handleSubmitInterestRecord(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const classId = interestRecordDraft.classId;
    const targetClass = interestClasses.find((item) => item.id === classId);
    if (!targetClass) {
      setNotice("请选择有效兴趣班。");
      return;
    }
    if (!isValidDateKey(interestRecordDraft.dateKey)) {
      setNotice("请选择有效上课日期。");
      return;
    }

    const amount = parsePositiveDecimal(interestRecordDraft.amount.trim());
    if (amount === null) {
      setNotice("数量需要是大于 0 的数字。");
      return;
    }
    const note = interestRecordDraft.note.trim();
    if (note.length > 200) {
      setNotice("备注请控制在 200 个字符以内。");
      return;
    }

    if (editingInterestRecordTarget) {
      setInterestState((current) => ({
        classes: current.classes,
        records: current.records.map((record) =>
          record.id === editingInterestRecordTarget.id
            ? {
                ...record,
                classId,
                dateKey: interestRecordDraft.dateKey,
                amount,
                note,
              }
            : record,
        ),
      }));
      closeInterestRecordModal();
      setNotice(`已更新 ${targetClass.name} 的记录。`);
      return;
    }

    const nextRecord: InterestClassRecord = {
      id: createLocalUiId("interest-record"),
      classId,
      dateKey: interestRecordDraft.dateKey,
      amount,
      note,
      createdAt: new Date().toISOString(),
    };

    setInterestState((current) => ({
      classes: current.classes,
      records: [nextRecord, ...current.records],
    }));
    closeInterestRecordModal();
    setNotice(`已记录 ${targetClass.name}：${amount}${targetClass.unitLabel}`);
  }

  function openReadingJourney(): void {
    setScreen("reading-journey");
  }

  function openReadingBookDetail(bookId: string): void {
    setReadingDetailBookId(bookId);
    setScreen("reading-book-detail");
  }

  function closeReadingBookModal(): void {
    setReadingBookModalOpen(false);
    setEditingReadingBookId(null);
    setReadingBookDraft(createInitialReadingBookDraft());
  }

  function openReadingBookModal(bookId?: string): void {
    if (bookId) {
      const book = readingBooks.find((item) => item.id === bookId);
      if (!book) {
        setNotice("书籍不存在，可能已被删除。");
        return;
      }

      setEditingReadingBookId(book.id);
      setReadingBookDraft({
        title: book.title,
        author: book.author,
        totalPages: book.totalPages ? String(book.totalPages) : "",
        category: book.category,
        status: book.status,
        coverFileName: book.coverFileName,
      });
      setReadingBookModalOpen(true);
      return;
    }

    setEditingReadingBookId(null);
    setReadingBookDraft(createInitialReadingBookDraft());
    setReadingBookModalOpen(true);
  }

  function closeReadingRecordModal(): void {
    setReadingRecordModalOpen(false);
    setReadingRecordDraft(createInitialReadingRecordDraft("", today));
  }

  function openReadingRecordModal(bookId?: string): void {
    const selectedBookId = bookId ?? readingBooks[0]?.id ?? "";
    if (!selectedBookId) {
      setNotice("请先新增一本书，再记录阅读。");
      return;
    }

    if (!readingBooks.some((book) => book.id === selectedBookId)) {
      setNotice("书籍不存在，无法记录。");
      return;
    }

    setReadingRecordDraft(createInitialReadingRecordDraft(selectedBookId, today));
    setReadingRecordModalOpen(true);
  }

  function handleSubmitReadingBook(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const title = readingBookDraft.title.trim();
    if (!title) {
      setNotice("请填写书名。");
      return;
    }

    const totalPagesRaw = readingBookDraft.totalPages.trim();
    const totalPages = totalPagesRaw.length === 0 ? null : parsePositiveInteger(totalPagesRaw);
    if (totalPagesRaw.length > 0 && totalPages === null) {
      setNotice("总页数需要是正整数。");
      return;
    }

    const now = new Date().toISOString();
    setReadingState((current) => {
      if (editingReadingBookId) {
        return {
          books: current.books.map((book) =>
            book.id === editingReadingBookId
              ? {
                  ...book,
                  title,
                  author: readingBookDraft.author.trim(),
                  totalPages,
                  category: readingBookDraft.category,
                  status: readingBookDraft.status,
                  coverFileName: readingBookDraft.coverFileName.trim(),
                }
              : book,
          ),
          records: current.records,
        };
      }

      const nextBook: ReadingBook = {
        id: createLocalUiId("reading-book"),
        title,
        author: readingBookDraft.author.trim(),
        totalPages,
        category: readingBookDraft.category,
        status: readingBookDraft.status,
        coverFileName: readingBookDraft.coverFileName.trim(),
        createdAt: now,
      };

      return {
        books: [nextBook, ...current.books],
        records: current.records,
      };
    });

    closeReadingBookModal();
    setNotice(editingReadingBookId ? "书籍已更新。" : "已新增书籍。");
  }

  function handleDeleteReadingBook(bookId: string): void {
    const targetBook = readingBooks.find((book) => book.id === bookId);
    if (!targetBook) {
      setNotice("书籍不存在，可能已经删除。");
      return;
    }

    if (!window.confirm(`确定删除《${targetBook.title}》以及对应阅读记录吗？`)) {
      return;
    }

    setReadingState((current) => ({
      books: current.books.filter((book) => book.id !== bookId),
      records: current.records.filter((record) => record.bookId !== bookId),
    }));

    if (readingDetailBookId === bookId) {
      setReadingDetailBookId(null);
      setScreen("reading-journey");
    }

    setNotice(`已删除《${targetBook.title}》。`);
  }

  function handleSubmitReadingRecord(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const book = readingBooks.find((item) => item.id === readingRecordDraft.bookId);
    if (!book) {
      setNotice("请选择有效书籍。");
      return;
    }

    if (!isValidDateKey(readingRecordDraft.readDate)) {
      setNotice("请选择有效阅读日期。");
      return;
    }

    const durationMinutes = parsePositiveInteger(readingRecordDraft.durationMinutes.trim());
    if (!durationMinutes) {
      setNotice("阅读时长需要是正整数分钟。");
      return;
    }

    const startPageRaw = readingRecordDraft.startPage.trim();
    const endPageRaw = readingRecordDraft.endPage.trim();
    const startPage = startPageRaw.length === 0 ? null : parsePositiveInteger(startPageRaw);
    const endPage = endPageRaw.length === 0 ? null : parsePositiveInteger(endPageRaw);
    if ((startPageRaw.length > 0 && startPage === null) || (endPageRaw.length > 0 && endPage === null)) {
      setNotice("页码需要是正整数。");
      return;
    }
    if (startPage !== null && endPage !== null && endPage < startPage) {
      setNotice("结束页不能小于开始页。");
      return;
    }

    if (book.totalPages !== null) {
      if (startPage !== null && startPage > book.totalPages) {
        setNotice("开始页超出书籍总页数。");
        return;
      }
      if (endPage !== null && endPage > book.totalPages) {
        setNotice("结束页超出书籍总页数。");
        return;
      }
    }

    const now = new Date().toISOString();
    const nextRecord: ReadingRecord = {
      id: createLocalUiId("reading-record"),
      bookId: book.id,
      readDate: readingRecordDraft.readDate,
      startPage,
      endPage,
      durationMinutes,
      note: readingRecordDraft.note.trim(),
      createdAt: now,
    };

    setReadingState((current) => {
      const nextBookStatus: ReadingBook["status"] =
        book.totalPages !== null && endPage !== null && endPage >= book.totalPages
          ? "finished"
          : book.status === "wishlist"
            ? "reading"
            : book.status;

      return {
        books: current.books.map((item) => (item.id === book.id ? { ...item, status: nextBookStatus } : item)),
        records: [nextRecord, ...current.records],
      };
    });

    closeReadingRecordModal();
    setNotice(`已记录《${book.title}》阅读流水。`);
  }

  function handleOpenReadingStatsTab(): void {
    openFutureFlow("统计分析已先合并到阅读页底部趋势区，后续可拆分为独立页面。");
  }

  function handleOpenReadingSyncTab(): void {
    openFutureFlow("同步图书功能仍在规划中，当前版本先使用本地书架。");
  }

  function handleBackFromReadingDetail(): void {
    setScreen("reading-journey");
    setReadingDetailBookId(null);
  }

  function openWishModal(): void {
    setEditingWishId(null);
    setWishDraft(createInitialWishDraft());
    setWishModalOpen(true);
  }

  function openWishEditModal(rewardId: string): void {
    const reward = state.rewards.find((item) => item.id === rewardId);
    if (!reward) {
      setNotice("愿望已不存在，无法编辑。");
      return;
    }

    setEditingWishId(reward.id);
    setWishDraft(createWishDraftFromReward(reward));
    setWishModalOpen(true);
  }

  function closeWishModal(): void {
    setWishModalOpen(false);
    setEditingWishId(null);
    setWishDraft(createInitialWishDraft());
  }

  function openWishDeleteModal(rewardId: string): void {
    const reward = state.rewards.find((item) => item.id === rewardId);
    if (!reward) {
      setNotice("愿望已不存在。");
      return;
    }
    setDeletingWishId(reward.id);
  }

  function closeWishDeleteModal(): void {
    setDeletingWishId(null);
  }

  function handleSelectWishIconCategory(category: RewardCategory): void {
    const iconCategory = getWishIconCategory(category);
    setWishDraft((current) => ({
      ...current,
      iconCategory: category,
      icon: iconCategory.icons.includes(current.icon) ? current.icon : iconCategory.icons[0],
    }));
  }

  function handleSelectWishIcon(icon: string): void {
    setWishDraft((current) => ({ ...current, icon }));
  }

  function handleWishCustomImageSelection(files: FileList | null): void {
    const file = files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotice("请选择图片文件。");
      return;
    }

    if (file.size > 512 * 1024) {
      setNotice("当前本地版为了稳定保存，自定义图片请控制在 512KB 以内。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === "string" ? reader.result : null;
      if (!imageData) {
        setNotice("图片读取失败，请换一张图片重试。");
        return;
      }

      setWishDraft((current) => ({
        ...current,
        customImage: imageData,
        customImageName: file.name,
      }));
    };
    reader.onerror = () => setNotice("图片读取失败，请换一张图片重试。");
    reader.readAsDataURL(file);
  }

  function clearWishCustomImage(): void {
    setWishDraft((current) => ({
      ...current,
      customImage: null,
      customImageName: "",
    }));
  }

  function applyPlanDurationPreset(minutes: number): void {
    setPlanDraft((current) => ({
      ...current,
      timeMode: "duration",
      durationMinutes: String(minutes),
    }));
  }

  function appendPlanAttachments(files: File[]): void {
    if (files.length === 0) {
      return;
    }

    const oversized = files.find((file) => file.size > 50 * 1024 * 1024);
    if (oversized) {
      setNotice(`文件 ${oversized.name} 超过 50MB，无法添加。`);
      return;
    }

    setPlanDraft((current) => {
      const nextAttachments = [...current.attachments];

      for (const file of files) {
        if (nextAttachments.length >= 3) {
          break;
        }

        nextAttachments.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }

      if (current.attachments.length + files.length > 3) {
        setNotice("添加计划最多保留前 3 个附件。");
      }

      return {
        ...current,
        attachments: nextAttachments,
      };
    });
  }

  function handlePlanAttachmentSelection(files: FileList | null): void {
    if (!files) {
      return;
    }
    appendPlanAttachments(Array.from(files));
  }

  function handlePlanAttachmentDrop(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    appendPlanAttachments(Array.from(event.dataTransfer.files));
  }

  function removePlanAttachment(attachmentId: string): void {
    setPlanDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== attachmentId),
    }));
  }

  function openQuickCompleteModal(plan: StudyPlan): void {
    const now = new Date();
    setQuickCompleteDraft({
      planId: plan.id,
      mode: "duration",
      hours: "0",
      minutes: "0",
      seconds: "0",
      actualStartTime: "",
      actualEndTime: formatClockInput(now),
      note: "",
      attachments: [],
    });
  }

  function closeQuickCompleteModal(): void {
    setQuickCompleteDraft(INITIAL_QUICK_COMPLETE_DRAFT);
    if (quickCompleteFileInputRef.current) {
      quickCompleteFileInputRef.current.value = "";
    }
  }

  function openPlanPointsReviewModal(target?: PendingPlanReviewItem): void {
    const resolvedTarget = target ?? pendingPlanReviewItems[0] ?? null;
    if (!resolvedTarget) {
      setNotice("当前没有待审定的积分任务。");
      return;
    }

    setPlanPointsReviewDraft({
      planId: resolvedTarget.planId,
      completionRecordId: resolvedTarget.completionRecordId,
      decision: "approve",
      adjustedStars: String(resolvedTarget.suggestedStars),
      reason: "",
    });
  }

  function closePlanPointsReviewModal(): void {
    setPlanPointsReviewDraft(INITIAL_PLAN_POINTS_REVIEW_DRAFT);
  }

  function updatePlanPointsReviewDraft(field: keyof PlanPointsReviewDraft, value: string | PlanPointsReviewDecision): void {
    setPlanPointsReviewDraft((current) => ({ ...current, [field]: value }));
  }

  function openPlanDetailModal(plan: StudyPlan): void {
    setPlanDetailPlanId(plan.id);
  }

  function closePlanDetailModal(): void {
    setPlanDetailPlanId(null);
  }

  function updateQuickCompleteDraft(field: keyof QuickCompleteDraft, value: string | QuickCompleteMode | QuickCompleteAttachmentDraft[]): void {
    setQuickCompleteDraft((current) => ({ ...current, [field]: value }));
  }

  function applyQuickCompletePreset(totalSeconds: number): void {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    setQuickCompleteDraft((current) => ({
      ...current,
      hours: String(hours),
      minutes: String(minutes),
      seconds: String(seconds),
    }));
  }

  function appendQuickCompleteAttachments(files: File[]): void {
    if (files.length === 0) {
      return;
    }

    const oversized = files.find((file) => file.size > 50 * 1024 * 1024);
    if (oversized) {
      setNotice(`文件 ${oversized.name} 超过 50MB，无法添加。`);
      return;
    }

    setQuickCompleteDraft((current) => {
      const nextAttachments = [...current.attachments];

      for (const file of files) {
        if (nextAttachments.length >= 15) {
          break;
        }
        nextAttachments.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }

      if (current.attachments.length + files.length > 15) {
        setNotice("附件最多保留前 15 个。");
      }

      return {
        ...current,
        attachments: nextAttachments,
      };
    });
  }

  function handleQuickCompleteFileSelection(files: FileList | null): void {
    if (!files) {
      return;
    }
    appendQuickCompleteAttachments(Array.from(files));
    if (quickCompleteFileInputRef.current) {
      quickCompleteFileInputRef.current.value = "";
    }
  }

  function handleQuickCompleteDrop(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    appendQuickCompleteAttachments(Array.from(event.dataTransfer.files));
  }

  function removeQuickCompleteAttachment(attachmentId: string): void {
    setQuickCompleteDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== attachmentId),
    }));
  }

  function handleOpenPlanPointsReviewFromBoard(): void {
    openPlanPointsReviewModal();
  }

  function handleApproveAllPendingPlanPoints(): void {
    if (pendingPlanReviewItems.length === 0) {
      setNotice("当前没有待审定的积分任务。");
      return;
    }

    let nextState = state;
    let approvedCount = 0;
    for (const item of pendingPlanReviewItems) {
      const result = reviewPlanCompletion(
        nextState,
        item.planId,
        item.completionRecordId,
        {
          decision: "approve",
          reason: "一键通过",
        },
      );
      if (!result.ok) {
        setNotice(`批量通过中断：${result.message}`);
        return;
      }
      nextState = result.nextState;
      approvedCount += 1;
    }

    setState(nextState);
    closePlanPointsReviewModal();
    setNotice(`已一键通过 ${approvedCount} 个待审积分任务。`);
  }

  function updateHabitDraft(field: keyof HabitDraft, value: string | boolean): void {
    setHabitDraft((current) => ({ ...current, [field]: value }));
  }

  function applyMutation(
    result: { ok: boolean; nextState: AppState; message: string },
    onSuccess?: (nextState: AppState) => void,
    successMessage?: string,
  ): void {
    if (result.ok) {
      setState(result.nextState);
      onSuccess?.(result.nextState);
      setNotice(successMessage ?? result.message);
      return;
    }
    setNotice(result.message);
  }

  function openPlanCreate(dateKey: string = selectedDateKey): void {
    const nextDateKey = isValidDateKey(dateKey) ? dateKey : today;
    setPlanDraft(createInitialPlanDraft(nextDateKey));
    setEditingPlanId(null);
    setActiveTab("plans");
    setScreen("plan-create");
  }

  function closePlanCreate(): void {
    setPlanDraft(createInitialPlanDraft(selectedDateKey));
    setEditingPlanId(null);
    setScreen("home");
    setActiveTab("plans");
  }

  function openBatchPlanCreate(dateKey: string = selectedDateKey): void {
    const nextDateKey = isValidDateKey(dateKey) ? dateKey : today;
    setBatchPlanDraft(createInitialBatchPlanDraft(nextDateKey));
    setActiveTab("plans");
    setScreen("plan-batch-create");
  }

  function closeBatchPlanCreate(): void {
    setBatchPlanDraft(createInitialBatchPlanDraft(selectedDateKey));
    setScreen("home");
    setActiveTab("plans");
  }

  function openPlanManagement(dateKey: string = selectedDateKey): void {
    const nextDateKey = isValidDateKey(dateKey) ? dateKey : today;
    const nextOrderIds = createManagedPlanOrder(state.plans, nextDateKey);
    setPlanManagementDateKey(nextDateKey);
    setPlanManagementOrderIds(nextOrderIds);
    setSelectedManagedPlanIds([]);
    setActiveTab("plans");
    setScreen("plan-management");
  }

  function closePlanManagement(): void {
    setSelectedDateKey(planManagementDateKey);
    setScreen("home");
    setActiveTab("plans");
  }

  function openPlanDeleteModal(): void {
    setPlanDeleteModalOpen(true);
  }

  function closePlanDeleteModal(): void {
    setPlanDeleteModalOpen(false);
  }

  function openAiPlanAssistant(): void {
    setActiveTab("plans");
    setScreen("ai-plan-assistant");
  }

  function closeAiPlanAssistant(): void {
    setScreen("home");
    setActiveTab("plans");
  }

  function appendAiPlanAttachments(files: File[]): void {
    if (files.length === 0) {
      return;
    }

    const oversized = files.find((file) => file.size > 20 * 1024 * 1024);
    if (oversized) {
      setNotice(`图片 ${oversized.name} 超过 20MB，暂时无法添加。`);
      return;
    }

    setAiPlanComposerDraft((current) => {
      const nextAttachments = [...current.attachments];

      for (const file of files) {
        if (nextAttachments.length >= 4) {
          break;
        }

        nextAttachments.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }

      if (current.attachments.length + files.length > 4) {
        setNotice("AI 创建最多暂存前 4 张图片。");
      }

      return {
        ...current,
        attachments: nextAttachments,
      };
    });
  }

  function handleAiPlanFileSelection(files: FileList | null): void {
    if (!files) {
      return;
    }

    appendAiPlanAttachments(Array.from(files));
    if (aiPlanFileInputRef.current) {
      aiPlanFileInputRef.current.value = "";
    }
  }

  function removeAiPlanAttachment(attachmentId: string): void {
    setAiPlanComposerDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== attachmentId),
    }));
  }

  function openHabitManagement(): void {
    setScreen("habit-management");
    setActiveTab("habits");
    setSelectedHabitIds([]);
  }

  function openHabitStatistics(): void {
    setScreen("habit-statistics");
    setActiveTab("habits");
  }

  function openPetCenter(): void {
    setScreen("pet-center");
  }

  function openPointsCenter(): void {
    setScreen("points-center");
  }

  function openAchievementSystem(): void {
    setScreen("achievement-system");
  }

  function openPointsHistory(): void {
    setScreen("points-history");
  }

  function openStarRulesPage(): void {
    setScreen("star-rules");
  }

  function openHelpCenter(): void {
    setScreen("help-center");
  }

  function openMoreFeatures(): void {
    setScreen("more-features");
    setMoreFeaturesSearch("");
    setProfileMenuOpen(false);
  }

  function openDashboardConfig(): void {
    setDashboardConfigDraft(cloneDashboardConfigPreference(dashboardConfig));
    setScreen("dashboard-config");
    setProfileMenuOpen(false);
  }

  function openStudyTimer(plan: StudyPlan): void {
    setActiveTimerPlanId(plan.id);
    setSelectedDateKey(today);
    setActiveTab("plans");
    setScreen("study-timer");
  }

  function closeHabitModal(): void {
    setHabitModalOpen(false);
    setHabitTypeMenuOpen(false);
    setHabitDraft(INITIAL_HABIT_DRAFT);
  }

  function openHabitCheckInModal(habit: Habit): void {
    setHabitCheckInDraft({
      habitId: habit.id,
      note: "",
      useCustomPoints: false,
      customPoints: String(habit.points),
    });
  }

  function closeHabitCheckInModal(): void {
    setHabitCheckInDraft(INITIAL_HABIT_CHECKIN_DRAFT);
  }

  function updateHabitCheckInDraft(field: keyof HabitCheckInDraft, value: string | boolean): void {
    setHabitCheckInDraft((current) => ({ ...current, [field]: value }));
  }

  function handleReset(): void {
    if (!window.confirm("这会清空本地看板数据并恢复默认状态，确定继续吗？")) {
      return;
    }
    const nextState = resetAppState();
    setState(nextState);
    setProfileWorkspace(loadLocalProfileWorkspace());
    setPlanDraft(createInitialPlanDraft(today));
    setBatchPlanDraft(createInitialBatchPlanDraft(today));
    setAiPlanComposerDraft(INITIAL_AI_PLAN_COMPOSER_DRAFT);
    setAiPlanSessions([]);
    setActiveAiPlanSessionId(null);
    setQuickCompleteDraft(INITIAL_QUICK_COMPLETE_DRAFT);
    setPlanPointsReviewDraft(INITIAL_PLAN_POINTS_REVIEW_DRAFT);
    setHabitDraft(INITIAL_HABIT_DRAFT);
    setWishDraft(createInitialWishDraft());
    setHeightState(resetHeightManagementState());
    setMorningReadingState(resetMorningReadingState());
    setInterestState(resetInterestClassState());
    setInterestClassModalOpen(false);
    setInterestRecordModalOpen(false);
    setEditingInterestClassId(null);
    setEditingInterestRecordId(null);
    setInterestClassDraft(createInitialInterestClassDraft());
    setInterestRecordDraft(createInitialInterestClassRecordDraft("", today));
    setInterestFilterStartDate("");
    setInterestFilterEndDate("");
    setReadingState(resetReadingJourneyState());
    setReadingSearch("");
    setReadingStatusFilter("all");
    setReadingCategoryFilter("all");
    setReadingBookModalOpen(false);
    setEditingReadingBookId(null);
    setReadingBookDraft(createInitialReadingBookDraft());
    setReadingRecordModalOpen(false);
    setReadingRecordDraft(createInitialReadingRecordDraft("", today));
    setReadingDetailBookId(null);
    setSelectedDateKey(today);
    setScreen("home");
    setActiveTab("plans");
    setHabitSearch("");
    setMoreFeaturesSearch("");
    setHabitFilter("all");
    setHabitBoardLayout("grid");
    setHabitStatsRange("week");
    setSelectedHabitIds([]);
    setPlanManagementDateKey(today);
    setPlanManagementOrderIds([]);
    setSelectedManagedPlanIds([]);
    setPlanDeleteModalOpen(false);
    setActiveTimerPlanId(null);
    setWishModalOpen(false);
    setProfileMenuOpen(false);
    setAddProfileModalOpen(false);
    setAddProfileNameDraft("");
    setAddProfileAvatarColor(PROFILE_AVATAR_COLOR_OPTIONS[0]);
    setAddProfileAvatarImage(null);
    setProfileManagementSearch("");
    setProfileManagementBackTarget("more-features");
    setSyncModalOpen(false);
    setHabitCheckInDraft(INITIAL_HABIT_CHECKIN_DRAFT);
    setNotice("本地状态已重置。");
  }

  function openFutureFlow(message: string): void {
    setNotice(message);
  }

  function applyProfileSelection(nextState: AppState, nextWorkspace: LocalProfileWorkspace, noticeMessage: string): void {
    setState(nextState);
    setProfileWorkspace(nextWorkspace);
    setProfileMenuOpen(false);
    setAddProfileModalOpen(false);
    setAddProfileNameDraft("");
    setAddProfileAvatarColor(PROFILE_AVATAR_COLOR_OPTIONS[0]);
    setAddProfileAvatarImage(null);
    setProfileManagementSearch("");
    setProfileManagementBackTarget("more-features");
    setSyncModalOpen(false);
    setSelectedDateKey(today);
    setScreen("home");
    setActiveTab("plans");
    setHabitSearch("");
    setMoreFeaturesSearch("");
    setHabitFilter("all");
    setHabitBoardLayout("grid");
    setHabitStatsRange("week");
    setSelectedHabitIds([]);
    setPlanManagementDateKey(today);
    setPlanManagementOrderIds([]);
    setSelectedManagedPlanIds([]);
    setPlanDeleteModalOpen(false);
    setActiveTimerPlanId(null);
    setPlanDetailPlanId(null);
    setQuickCompleteDraft(INITIAL_QUICK_COMPLETE_DRAFT);
    setPlanPointsReviewDraft(INITIAL_PLAN_POINTS_REVIEW_DRAFT);
    setHabitCheckInDraft(INITIAL_HABIT_CHECKIN_DRAFT);
    setNotice(noticeMessage);
  }

  function handleToggleProfileMenu(): void {
    if (profileWorkspace.profiles.length === 0) {
      openAddProfileModal();
      return;
    }
    setProfileMenuOpen((current) => !current);
  }

  function openAddProfileModal(): void {
    setProfileMenuOpen(false);
    setAddProfileModalOpen(true);
    setAddProfileNameDraft("");
    setAddProfileAvatarColor(PROFILE_AVATAR_COLOR_OPTIONS[profileWorkspace.profiles.length % PROFILE_AVATAR_COLOR_OPTIONS.length]);
    setAddProfileAvatarImage(null);
  }

  function closeAddProfileModal(): void {
    setAddProfileModalOpen(false);
    setAddProfileNameDraft("");
    setAddProfileAvatarColor(PROFILE_AVATAR_COLOR_OPTIONS[0]);
    setAddProfileAvatarImage(null);
  }

  async function handleAddProfileImageSelect(file: File | null): Promise<void> {
    if (!file) {
      setAddProfileAvatarImage(null);
      return;
    }

    const maxBytes = 1024 * 1024;
    if (file.size > maxBytes) {
      setNotice("头像图片不能超过 1MB。");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("头像读取失败，请重试。"));
      reader.readAsDataURL(file);
    }).catch(() => "");

    if (!dataUrl) {
      setNotice("头像读取失败，请重试。");
      return;
    }

    setAddProfileAvatarImage(dataUrl);
  }

  function handleCreateProfile(): void {
    try {
      const result = createLocalProfile(addProfileNameDraft, new Date().toISOString(), {
        avatarColor: addProfileAvatarColor,
        avatarImage: addProfileAvatarImage,
      });
      const noticeMessage = isProfileLoggedIn ? `已创建并切换到档案：${result.state.profile.name}` : `欢迎你，${result.state.profile.name}！`;
      applyProfileSelection(result.state, result.workspace, noticeMessage);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "创建档案失败，请稍后重试。");
    }
  }

  function handleSwitchProfile(profileId: string): void {
    try {
      const result = switchLocalProfile(profileId);
      applyProfileSelection(result.state, result.workspace, `已切换到档案：${result.state.profile.name}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "切换档案失败，请稍后重试。");
    }
  }

  function handleDeleteProfile(profileId: string, profileName: string): void {
    if (!window.confirm(`确定删除档案“${profileName}”吗？删除后不可恢复。`)) {
      return;
    }

    const deletingActiveProfile = state.profile.id === profileId;
    try {
      const result = deleteLocalProfile(profileId);
      if (result.workspace.activeProfileId === null) {
        applyProfileSelection(result.state, result.workspace, `已删除档案：${profileName}。当前未登录。`);
        return;
      }

      if (deletingActiveProfile) {
        applyProfileSelection(result.state, result.workspace, `已删除当前档案，已切换到：${result.state.profile.name}`);
        return;
      }

      applyProfileSelection(result.state, result.workspace, `已删除档案：${profileName}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "删除档案失败，请稍后重试。");
    }
  }

  function handleClearProfileData(profileId: string, profileName: string): void {
    if (!window.confirm(`确定清空档案“${profileName}”的学习数据吗？`)) {
      return;
    }

    try {
      const result = clearLocalProfileData(profileId);
      applyProfileSelection(result.state, result.workspace, `已清空档案：${profileName}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "清空档案失败，请稍后重试。");
    }
  }

  function handleRenameProfile(profileId: string, profileName: string): void {
    try {
      const result = renameLocalProfile(profileId, profileName);
      applyProfileSelection(result.state, result.workspace, `已更新档案名称：${profileName}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "更新档案失败，请稍后重试。");
    }
  }

  function handleLogoutProfile(): void {
    const result = logoutLocalProfile();
    applyProfileSelection(result.state, result.workspace, "已退出登录。");
  }

  function openProfileManagement(backTarget: "home" | "more-features"): void {
    setProfileMenuOpen(false);
    setProfileManagementBackTarget(backTarget);
    setScreen("profile-management");
  }

  function openSyncAccountModal(): void {
    setProfileMenuOpen(false);
    setSyncModalOpen(true);
  }

  function updateSyncEmail(value: string): void {
    setSyncSettings((current) => ({ ...current, email: value }));
  }

  function closeSyncAccountModal(): void {
    setSyncModalOpen(false);
  }

  function resolveSyncConfig(): SupabaseSyncConfig {
    const config: SupabaseSyncConfig = {
      supabaseUrl: DEFAULT_SUPABASE_URL.trim(),
      supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY.trim(),
    };

    if (!config.supabaseUrl) {
      throw new Error("同步服务未配置 Supabase URL。");
    }

    if (!config.supabaseAnonKey) {
      throw new Error("同步服务未配置 Supabase key。");
    }

    return config;
  }

  function resolveSyncSession(): SyncAccountSession {
    if (!syncSession) {
      throw new Error("请先登录同步账号。");
    }
    return syncSession;
  }

  function formatSyncError(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "同步请求失败，请稍后重试。";
  }

  function renderInitializationSummary(checks: SupabaseInitializationCheckItem[]): string {
    if (checks.length === 0) {
      return "初始化检查未返回结果。";
    }

    const summary = checks
      .map((check) => {
        const badge = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
        return `${badge}${check.label}`;
      })
      .join(" | ");
    const failedChecks = checks.filter((check) => check.status === "fail");
    if (failedChecks.length === 0) {
      return `初始化检查完成：${summary}`;
    }

    const failureMessage = failedChecks.map((check) => `${check.label}:${check.message}`).join("；");
    return `初始化检查完成：${summary}。失败项：${failureMessage}`;
  }

  async function runSyncAction(actionLabel: string, task: () => Promise<string>): Promise<void> {
    if (syncBusy) {
      return;
    }

    setSyncBusy(true);
    setSyncStatusMessage(`${actionLabel}进行中...`);
    try {
      const message = await task();
      setSyncStatusMessage(message);
      setNotice(message);
    } catch (error) {
      const message = formatSyncError(error);
      setSyncStatusMessage(`${actionLabel}失败：${message}`);
      setNotice(`${actionLabel}失败：${message}`);
    } finally {
      setSyncBusy(false);
    }
  }

  async function handleSyncSignIn(): Promise<void> {
    await runSyncAction("登录", async () => {
      const config = resolveSyncConfig();
      const session = await signInSupabaseWithPassword(config, syncSettings.email, syncPassword);
      setSyncSession(session);
      setSyncSettings((current) => ({ ...current, email: session.email }));
      setSyncPassword("");
      return `已登录 ${session.email}。`;
    });
  }

  async function handleSyncSignUp(): Promise<void> {
    await runSyncAction("注册", async () => {
      const config = resolveSyncConfig();
      const result = await signUpSupabaseWithPassword(config, syncSettings.email, syncPassword);
      setSyncPassword("");
      if (result.session) {
        setSyncSession(result.session);
        setSyncSettings((current) => ({ ...current, email: result.session?.email ?? current.email }));
        return `注册并登录成功：${result.session.email}`;
      }

      return result.needsEmailConfirmation ? "注册成功，请先在邮箱中确认账号后再登录。" : "注册完成，请继续登录。";
    });
  }

  async function handleSyncRefreshSession(): Promise<void> {
    await runSyncAction("刷新会话", async () => {
      const config = resolveSyncConfig();
      const session = resolveSyncSession();
      const refreshed = await refreshSupabaseSession(config, session);
      setSyncSession(refreshed);
      return `会话已刷新，账号 ${refreshed.email}`;
    });
  }

  async function handleSyncInitializationCheck(): Promise<void> {
    await runSyncAction("初始化检查", async () => {
      const config = resolveSyncConfig();
      const result = await runSupabaseInitializationCheck(config, syncSession);
      setSyncSession(result.session);
      return renderInitializationSummary(result.checks);
    });
  }

  async function handleSyncPushLocal(): Promise<void> {
    await runSyncAction("上传本地", async () => {
      const config = resolveSyncConfig();
      const session = resolveSyncSession();
      const snapshot = stateRef.current;
      const operationIds = snapshot.sync.pendingOps.map((pendingOp) => pendingOp.id);
      const syncedAt = new Date().toISOString();
      const pushed = await pushRemoteSyncSnapshot(config, session, snapshot, syncedAt);
      setSyncSession(pushed.session);
      setState((current) =>
        operationIds.length > 0
          ? acknowledgeSyncedOperations(current, operationIds, syncedAt)
          : {
              ...current,
              sync: {
                ...current.sync,
                lastSyncedAt: syncedAt,
              },
            },
      );
      return operationIds.length > 0 ? `本地数据已上传，已确认 ${operationIds.length} 条待同步操作。` : "本地数据已上传到云端。";
    });
  }

  async function handleSyncPullRemote(): Promise<void> {
    await runSyncAction("下载云端", async () => {
      const config = resolveSyncConfig();
      const session = resolveSyncSession();
      const fetched = await fetchRemoteSyncSnapshot(config, session);
      setSyncSession(fetched.session);
      if (!fetched.snapshot) {
        return "云端还没有可下载的数据。";
      }
      const remoteSnapshot = fetched.snapshot;

      const preview = mergeStateForSync(stateRef.current, remoteSnapshot.state);
      setState((current) => mergeStateForSync(current, remoteSnapshot.state).mergedState);
      return `云端合并完成：远端更新 ${preview.remoteWins} 项，本地保留 ${preview.localWins} 项。`;
    });
  }

  async function handleSyncBidirectional(): Promise<void> {
    await runSyncAction("双向同步", async () => {
      const config = resolveSyncConfig();
      const session = resolveSyncSession();
      const fetched = await fetchRemoteSyncSnapshot(config, session);
      let activeSession = fetched.session;

      if (!fetched.snapshot) {
        const localState = stateRef.current;
        const localOperationIds = localState.sync.pendingOps.map((pendingOp) => pendingOp.id);
        const syncedAt = new Date().toISOString();
        const pushed = await pushRemoteSyncSnapshot(config, activeSession, localState, syncedAt);
        activeSession = pushed.session;
        setSyncSession(activeSession);
        setState((current) =>
          localOperationIds.length > 0
            ? acknowledgeSyncedOperations(current, localOperationIds, syncedAt)
            : {
                ...current,
                sync: {
                  ...current.sync,
                  lastSyncedAt: syncedAt,
                },
              },
        );
        return "云端为空，已把本地数据初始化到云端。";
      }
      const remoteSnapshot = fetched.snapshot;

      const mergePreview = mergeStateForSync(stateRef.current, remoteSnapshot.state);
      const operationIds = mergePreview.mergedState.sync.pendingOps.map((pendingOp) => pendingOp.id);
      const syncedAt = new Date().toISOString();
      const pushed = await pushRemoteSyncSnapshot(config, activeSession, mergePreview.mergedState, syncedAt);
      activeSession = pushed.session;
      setSyncSession(activeSession);
      setState((current) => {
        const merged = mergeStateForSync(current, remoteSnapshot.state).mergedState;
        return acknowledgeSyncedOperations(merged, operationIds, syncedAt);
      });
      return `双向同步完成：远端更新 ${mergePreview.remoteWins} 项，本地保留 ${mergePreview.localWins} 项。`;
    });
  }

  function handleSyncSignOut(): void {
    setSyncSession(null);
    setSyncPassword("");
    setSyncStatusMessage("已退出同步账号。");
    setNotice("已退出同步账号。");
  }

  function handleEditPlanFromDetail(_plan: StudyPlan): void {
    setPlanDraft(createPlanDraftFromPlan(_plan));
    setEditingPlanId(_plan.id);
    closePlanDetailModal();
    setScreen("plan-create");
    setActiveTab("plans");
  }

  function handleEditCurrentOccurrenceFromDetail(plan: StudyPlan): void {
    if (plan.repeatType === "once") {
      setNotice("当前计划已是仅当天任务，可直接编辑计划。");
      return;
    }

    if (!isPlanScheduledForDate(plan, selectedDateKey)) {
      setNotice("当前日期不在该重复计划的执行范围内。");
      return;
    }

    const fallbackTime = /^\d{2}:\d{2}$/.test(plan.createdAt.slice(11, 16)) ? plan.createdAt.slice(11, 16) : "08:00";
    const occurrenceCreatedAt = buildPlanDateTime(selectedDateKey, fallbackTime);
    const deleteForDateResult = deletePlansForDate(state, [plan.id], selectedDateKey, occurrenceCreatedAt);
    if (!deleteForDateResult.ok) {
      setNotice(deleteForDateResult.message);
      return;
    }

    const addSingleResult = addPlan(
      deleteForDateResult.nextState,
      {
        title: plan.title,
        subject: plan.subject,
        repeatType: "once",
        repeatConfig: null,
        minutes: plan.minutes,
        stars: plan.customStarsEnabled ? plan.stars : undefined,
        customStarsEnabled: plan.customStarsEnabled,
        approvalRequired: plan.approvalRequired,
      },
      occurrenceCreatedAt,
    );

    if (!addSingleResult.ok) {
      setNotice(addSingleResult.message);
      return;
    }

    const singlePlan = addSingleResult.nextState.plans[0] ?? null;
    if (!singlePlan) {
      setNotice("创建仅当天任务失败，请重试。");
      return;
    }

    setState(addSingleResult.nextState);
    setSelectedDateKey(selectedDateKey);
    setPlanDraft(createPlanDraftFromPlan(singlePlan));
    setEditingPlanId(singlePlan.id);
    closePlanDetailModal();
    setScreen("plan-create");
    setActiveTab("plans");
    setNotice("已转为仅当天任务，现在可仅修改本次。");
  }

  function handleDeleteRepeatFromDetail(plan: StudyPlan): void {
    const deleteLabel = plan.repeatType === "once" ? "这个计划" : "这个重复计划";
    if (!window.confirm(`确定删除${deleteLabel}吗？`)) {
      return;
    }

    applyMutation(
      deletePlans(state, [plan.id]),
      () => {
        closePlanDetailModal();
        if (selectedDateKey === currentDateKey(plan.completedAt ?? plan.createdAt)) {
          setSelectedDateKey(selectedDateKey);
        }
      },
      `已删除计划：${plan.title}`,
    );
  }

  function handleTabChange(nextTab: DashboardTab): void {
    setActiveTab(nextTab);
    setScreen("home");
  }

  function handleAddPlan(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const title = planDraft.title.trim();
    const category = planDraft.category.trim();
    const startDate = isValidDateKey(planDraft.startDate) ? planDraft.startDate : today;
    const repeatValidationMessage = validatePlanRepeatDraft(planDraft, startDate);
    const repeatConfig = resolvePlanRepeatConfig(planDraft, startDate);
    const resolvedMinutesForSave = resolvePlanDurationMinutes(planDraft);
    const startTimeForSave = planDraft.timeMode === "time-range" && parseClockToMinutes(planDraft.startTime) !== null ? planDraft.startTime : "08:00";

    if (!title || !category) {
      setNotice("请先填写计划名称和类别标签。");
      return;
    }

    if (resolvedMinutesForSave === null) {
      setNotice("请填写有效的时长，或设置结束时间晚于开始时间的时间段。");
      return;
    }

    if (repeatValidationMessage) {
      setNotice(repeatValidationMessage);
      return;
    }

    if (planDraft.useCustomPoints && (!Number.isInteger(parsedPlanCustomPoints) || parsedPlanCustomPoints <= 0)) {
      setNotice("自定义积分必须是大于 0 的整数。");
      return;
    }

    if (editingPlanId) {
      applyMutation(
        updatePlan(
          state,
          editingPlanId,
          {
            title,
            subject: category,
            repeatType: planDraft.repeatType,
            repeatConfig,
            minutes: resolvedMinutesForSave,
            stars: planDraft.useCustomPoints ? parsedPlanCustomPoints : undefined,
            approvalRequired: planDraft.useCustomPoints ? planDraft.approvalRequired : false,
            createdAt: buildPlanDateTime(startDate, startTimeForSave),
          },
        ),
        () => {
          setPlanDraft(createInitialPlanDraft(startDate));
          setEditingPlanId(null);
          setSelectedDateKey(startDate);
          setScreen("home");
          setActiveTab("plans");
        },
        `已更新计划：${title}`,
      );
      return;
    }

    applyMutation(
      addPlan(
        state,
        {
          title,
          subject: category,
          repeatType: planDraft.repeatType,
          repeatConfig,
          minutes: resolvedMinutesForSave,
          stars: planDraft.useCustomPoints ? parsedPlanCustomPoints : undefined,
          approvalRequired: planDraft.useCustomPoints ? planDraft.approvalRequired : false,
        },
        buildPlanDateTime(startDate, startTimeForSave),
      ),
      () => {
        setPlanDraft(createInitialPlanDraft(startDate));
        setSelectedDateKey(startDate);
        setScreen("home");
        setActiveTab("plans");
      },
      formatPlanRepeatSaveNotice(planDraft.repeatType, title),
    );
  }

  function handleOpenPlanCreateFromHome(): void {
    openPlanCreate(selectedDateKey);
  }

  function handleAiPromptExample(prompt: string): void {
    setAiPlanComposerDraft((current) => ({
      ...current,
      prompt,
    }));
  }

  function handleStartNewAiSession(): void {
    setActiveAiPlanSessionId(null);
    setAiPlanComposerDraft(INITIAL_AI_PLAN_COMPOSER_DRAFT);
  }

  function handleSelectAiSession(sessionId: string): void {
    setActiveAiPlanSessionId(sessionId);
    setAiPlanComposerDraft(INITIAL_AI_PLAN_COMPOSER_DRAFT);
  }

  function handleClearAiPlanSession(): void {
    if (activeAiPlanSession) {
      setAiPlanSessions((current) => current.filter((session) => session.id !== activeAiPlanSession.id));
      setActiveAiPlanSessionId(null);
      setAiPlanComposerDraft(INITIAL_AI_PLAN_COMPOSER_DRAFT);
      setNotice("当前 AI 会话已清空。");
      return;
    }

    if (!aiPlanComposerDraft.prompt.trim() && aiPlanComposerDraft.attachments.length === 0) {
      setNotice("当前没有可清空的 AI 草稿。");
      return;
    }

    setAiPlanComposerDraft(INITIAL_AI_PLAN_COMPOSER_DRAFT);
    setNotice("AI 输入草稿已清空。");
  }

  function handleSubmitAiPlan(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const prompt = aiPlanComposerDraft.prompt.trim();
    const attachments = aiPlanComposerDraft.attachments;

    if (!prompt && attachments.length === 0) {
      setNotice("请先输入学习计划需求，或上传图片。");
      return;
    }

    const now = new Date().toISOString();
    const userMessage: AiPlanMessage = {
      id: createLocalUiId("ai-message"),
      role: "user",
      content: prompt || "上传了图片，请帮我识别并生成学习计划。",
      attachments,
      createdAt: now,
    };
    const assistantMessage: AiPlanMessage = {
      id: createLocalUiId("ai-message"),
      role: "assistant",
      content: buildAiTrialReply(prompt, attachments),
      attachments: [],
      createdAt: now,
    };

    if (activeAiPlanSession) {
      setAiPlanSessions((current) =>
        current.map((session) =>
          session.id === activeAiPlanSession.id
            ? {
                ...session,
                updatedAt: now,
                messages: [...session.messages, userMessage, assistantMessage],
              }
            : session,
        ),
      );
      setActiveAiPlanSessionId(activeAiPlanSession.id);
    } else {
      const nextSessionId = createLocalUiId("ai-session");
      const nextSession: AiPlanSession = {
        id: nextSessionId,
        title: deriveAiSessionTitle(prompt, attachments),
        updatedAt: now,
        messages: [userMessage, assistantMessage],
      };
      setAiPlanSessions((current) => [nextSession, ...current]);
      setActiveAiPlanSessionId(nextSessionId);
    }

    setAiPlanComposerDraft(INITIAL_AI_PLAN_COMPOSER_DRAFT);
    setNotice("AI 对话已记录。计划自动生成和保存流程还在接入中。");
  }

  function handleOpenAiPlanAssistantFromHome(): void {
    openAiPlanAssistant();
  }

  function handleOpenPlanManagementFromHome(): void {
    openPlanManagement(selectedDateKey);
  }

  function handleBackFromPlanManagement(): void {
    closePlanManagement();
  }

  function handleSavePlanManagement(): void {
    if (!isPlanManagementDirty) {
      setSelectedDateKey(planManagementDateKey);
      setScreen("home");
      setActiveTab("plans");
      setNotice("计划顺序没有变化。");
      return;
    }

    setState((current) => {
      const now = new Date().toISOString();
      return markStateMutation(
        {
          ...current,
          plans: applyManagedPlanOrder(current.plans, planManagementDateKey, planManagementOrderIds),
        },
        "plan.reorder-for-date",
        { dateKey: planManagementDateKey, planIds: planManagementOrderIds },
        now,
      );
    });
    setSelectedDateKey(planManagementDateKey);
    setScreen("home");
    setActiveTab("plans");
    setNotice("计划顺序已保存。");
  }

  function handleShiftPlanManagementDate(offset: number): void {
    const nextDateKey = shiftDateKey(planManagementDateKey, offset);
    const nextOrderIds = createManagedPlanOrder(state.plans, nextDateKey);
    setPlanManagementDateKey(nextDateKey);
    setPlanManagementOrderIds(nextOrderIds);
    setSelectedManagedPlanIds([]);
  }

  function handleJumpPlanManagementToToday(): void {
    const nextOrderIds = createManagedPlanOrder(state.plans, today);
    setPlanManagementDateKey(today);
    setPlanManagementOrderIds(nextOrderIds);
    setSelectedManagedPlanIds([]);
  }

  function handleToggleManagedPlanSelection(planId: string): void {
    setSelectedManagedPlanIds((current) => (current.includes(planId) ? current.filter((item) => item !== planId) : [...current, planId]));
  }

  function handleToggleSelectAllManagedPlans(): void {
    if (managedPlans.length === 0) {
      setSelectedManagedPlanIds([]);
      return;
    }

    setSelectedManagedPlanIds((current) => (current.length === managedPlans.length ? [] : managedPlans.map((plan) => plan.id)));
  }

  function handleMoveManagedPlan(draggedId: string, targetId: string): void {
    setPlanManagementOrderIds((current) => reorderManagedPlanIds(current, draggedId, targetId));
  }

  function handleCopyManagedPlans(): void {
    if (selectedManagedPlanIds.length === 0) {
      setNotice("请先选择要复制的计划。");
      return;
    }
    openFutureFlow("复制到日期流程仍在开发中。");
  }

  function handleShareManagedPlans(): void {
    if (selectedManagedPlanIds.length === 0) {
      setNotice("请先选择要分享的计划。");
      return;
    }
    openFutureFlow("分享计划流程仍在开发中。");
  }

  function handleDeleteManagedPlans(): void {
    if (selectedManagedPlanIds.length === 0) {
      setNotice("请先选择要删除的计划。");
      return;
    }
    openPlanDeleteModal();
  }

  function handleConfirmDeleteManagedPlans(scope: PlanDeleteScope): void {
    const targetIds = [...selectedManagedPlanIds];
    const isDeleteCurrentDateOnly = scope === "currentDateOnly";
    const mutation = isDeleteCurrentDateOnly
      ? deletePlansForDate(state, targetIds, planManagementDateKey)
      : deletePlans(state, targetIds);

    applyMutation(
      mutation,
      (nextState) => {
        const nextOrderIds = createManagedPlanOrder(nextState.plans, planManagementDateKey);
        setPlanManagementOrderIds(nextOrderIds);
        setSelectedManagedPlanIds([]);
        closePlanDeleteModal();
      },
      isDeleteCurrentDateOnly
        ? `已处理 ${targetIds.length} 个计划：仅删除 ${planManagementDateKey}。`
        : `已删除 ${targetIds.length} 个计划。`,
    );
  }

  function handleAddBatchPlans(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const startDate = isValidDateKey(batchPlanDraft.startDate) ? batchPlanDraft.startDate : today;

    if (parsedBatchPlans.length === 0) {
      setNotice("还没有识别到可保存的任务，请按“类别 + 编号任务”格式输入。");
      return;
    }

    if (batchPlanDraft.repeatType !== "once") {
      setNotice("当前版本只支持“仅当天”的重复类型。");
      return;
    }

    if (resolvedBatchPlanMinutes === null) {
      setNotice("请填写有效的默认学习时长。");
      return;
    }

    if (batchPlanDraft.useCustomPoints && resolvedBatchPlanCustomStars === null) {
      setNotice("自定义积分必须是大于 0 的整数。");
      return;
    }

    let nextState = state;
    for (const item of [...parsedBatchPlans].reverse()) {
      const result = addPlan(
        nextState,
        {
          title: item.title,
          subject: item.category,
          minutes: resolvedBatchPlanMinutes,
          stars: batchPlanDraft.useCustomPoints ? resolvedBatchPlanCustomStars ?? undefined : undefined,
        },
        buildPlanDateTime(startDate, "08:00"),
      );

      if (!result.ok) {
        setNotice(result.message);
        return;
      }

      nextState = result.nextState;
    }

    setState(nextState);
    setBatchPlanDraft(createInitialBatchPlanDraft(startDate));
    setSelectedDateKey(startDate);
    setScreen("home");
    setActiveTab("plans");
    setNotice(
      batchPlanDraft.useCustomPoints && batchPlanDraft.approvalRequired
        ? `已批量添加 ${parsedBatchPlans.length} 个计划。管理员审定仍在开发中，当前仅保留该设置位。`
        : `已批量添加 ${parsedBatchPlans.length} 个计划。`,
    );
  }

  function handleOpenBatchPlanCreateFromHome(): void {
    openBatchPlanCreate(selectedDateKey);
  }

  function handleBackFromPlanCreate(): void {
    closePlanCreate();
  }

  function handleBackFromAiPlanAssistant(): void {
    closeAiPlanAssistant();
  }

  function handleCancelPlanCreate(): void {
    closePlanCreate();
  }

  function handleBackFromBatchPlanCreate(): void {
    closeBatchPlanCreate();
  }

  function handleCancelBatchPlanCreate(): void {
    closeBatchPlanCreate();
  }

  function handleTryBatchAiParse(): void {
    if (parsedBatchPlans.length > 0) {
      setNotice(`当前先使用规则解析，已识别 ${parsedBatchPlans.length} 个计划。`);
      return;
    }

    setNotice("还没有识别到任务，请按“类别 + 编号任务”格式输入，AI 解析后续再接入。");
  }

  function handleSubmitQuickComplete(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!quickCompletePlanTarget) {
      setNotice("所选计划已不存在。");
      return;
    }

    if (quickCompleteDraft.mode === "actual") {
      const startMinutes = parseClockToMinutes(quickCompleteDraft.actualStartTime);
      const endMinutes = parseClockToMinutes(quickCompleteDraft.actualEndTime);
      if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        setNotice("实际时间需要填写开始和结束，且结束时间必须晚于开始时间。");
        return;
      }
    }

    const attachments: PlanCompletionAttachment[] = quickCompleteDraft.attachments.map((attachment) => ({
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
    }));
    const completionClock = quickCompleteDraft.mode === "actual" ? quickCompleteDraft.actualEndTime : formatClockInput(new Date());
    const completionDateTime = buildPlanDateTime(selectedDateKey, completionClock);

    applyMutation(
      completePlan(state, quickCompletePlanTarget.id, {
        mode: quickCompleteDraft.mode,
        durationSeconds: quickCompleteTotalSeconds,
        note: quickCompleteDraft.note,
        attachments,
      }, completionDateTime),
      () => {
        closeQuickCompleteModal();
      },
    );
  }

  function handleSubmitPlanPointsReview(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!activePendingPlanReviewItem) {
      setNotice("待审定记录已不存在。");
      closePlanPointsReviewModal();
      return;
    }

    if (planPointsReviewDraft.decision === "adjust") {
      if (!Number.isInteger(parsedPlanPointsReviewStars) || parsedPlanPointsReviewStars < -1000 || parsedPlanPointsReviewStars > 1000) {
        setNotice("调整积分必须是 -1000 到 1000 的整数。");
        return;
      }
      if (planPointsReviewDraft.reason.trim().length === 0) {
        setNotice("调整积分时需要填写审定说明。");
        return;
      }
    }

    applyMutation(
      reviewPlanCompletion(state, activePendingPlanReviewItem.planId, activePendingPlanReviewItem.completionRecordId, {
        decision: planPointsReviewDraft.decision,
        adjustedStars: parsedPlanPointsReviewStars,
        reason: planPointsReviewDraft.reason,
      }),
      (nextState) => {
        const nextPending = collectPendingPlanReviewItems(nextState.plans);
        if (nextPending.length > 0) {
          openPlanPointsReviewModal(nextPending[0]);
          return;
        }
        closePlanPointsReviewModal();
      },
    );
  }

  function handleCreateHabit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = habitDraft.name.trim();
    const description = habitDraft.description.trim();
    const points = Number(habitDraft.points);

    if (!name || !Number.isInteger(points) || points < -100 || points > 100) {
      setNotice("请输入习惯名称，以及 -100 到 100 之间的整数积分。");
      return;
    }

    applyMutation(
      createHabit(state, {
        name,
        description,
        frequency: habitDraft.frequency,
        points,
        approvalRequired: habitDraft.approvalRequired,
        icon: habitDraft.icon,
        color: habitDraft.color,
      }),
      () => {
        openHabitManagement();
        closeHabitModal();
      },
    );
  }

  function handleHabitCheckIn(habitId: string): void {
    const habit = activeHabits.find((item) => item.id === habitId);
    if (!habit) {
      setNotice("所选习惯已不存在。");
      return;
    }
    openHabitCheckInModal(habit);
  }

  function handleSubmitHabitCheckIn(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!checkInHabitTarget) {
      setNotice("所选习惯已不存在。");
      return;
    }
    applyMutation(
      checkInHabit(state, checkInHabitTarget.id, selectedDateKey, {
        note: habitCheckInDraft.note,
        useCustomPoints: habitCheckInDraft.useCustomPoints,
        customPoints: parsedCheckInPoints,
      }),
      closeHabitCheckInModal,
    );
  }

  function handleSubmitWish(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const title = wishDraft.title.trim();

    if (!title) {
      setNotice("请先填写愿望名称。");
      return;
    }

    if (!Number.isInteger(parsedWishCost) || parsedWishCost <= 0) {
      setNotice("需要多少星星必须是大于 0 的整数。");
      return;
    }

    if (wishDraft.repeatMode === "multi" && (!Number.isInteger(parsedWishMaxRedemptions) || parsedWishMaxRedemptions <= 0)) {
      setNotice("多次兑换需要填写有效的最大兑换次数。");
      return;
    }

    if (wishDraft.repeatMode === "cycle" && (!Number.isInteger(parsedWishRedemptionsPerPeriod) || parsedWishRedemptionsPerPeriod <= 0)) {
      setNotice("循环愿望需要填写每个周期可兑换次数。");
      return;
    }

    const rewardInput = {
      title,
      description: wishDraft.description,
      cost: parsedWishCost,
      category: wishDraft.category,
      icon: wishDraft.icon,
      customImage: wishDraft.customImage,
      repeatMode: wishDraft.repeatMode,
      repeatConfig:
        wishDraft.repeatMode === "multi"
          ? {
              maxRedemptions: parsedWishMaxRedemptions,
            }
          : wishDraft.repeatMode === "cycle"
            ? {
                resetPeriod: wishDraft.resetPeriod,
                redemptionsPerPeriod: parsedWishRedemptionsPerPeriod,
              }
            : undefined,
    } as const;

    if (editingWishId) {
      applyMutation(
        updateReward(state, editingWishId, rewardInput),
        closeWishModal,
        `愿望更新成功，需要 ${parsedWishCost} 星才能兑换这个愿望`,
      );
      return;
    }

    applyMutation(createReward(state, rewardInput), closeWishModal, `愿望添加成功，需要 ${parsedWishCost} 星才能兑换这个愿望`);
  }

  function handleEditWish(rewardId: string): void {
    openWishEditModal(rewardId);
  }

  function handleDeleteWish(rewardId: string): void {
    openWishDeleteModal(rewardId);
  }

  function handleConfirmDeleteWish(): void {
    if (!deletingWishTarget) {
      setNotice("愿望已不存在。");
      closeWishDeleteModal();
      return;
    }

    applyMutation(deleteReward(state, deletingWishTarget.id), closeWishDeleteModal);
  }

  function handleBackToHabitBoard(): void {
    setScreen("home");
    setActiveTab("habits");
  }

  function handleBackToHome(): void {
    setScreen("home");
    setProfileMenuOpen(false);
  }

  function handleBackToPointsCenter(): void {
    setScreen("points-center");
  }

  function handleChangeDashboardDisplayMode(mode: DashboardConfigPreference["displayMode"]): void {
    setDashboardConfigDraft((current) => ({
      ...current,
      displayMode: mode,
    }));
  }

  function handleToggleDashboardModule(moduleId: DashboardModuleId): void {
    setDashboardConfigDraft((current) => {
      const isVisible = current.visibleModuleIds.includes(moduleId);
      const nextVisibleSet = new Set(
        isVisible ? current.visibleModuleIds.filter((item) => item !== moduleId) : [...current.visibleModuleIds, moduleId],
      );
      return {
        ...current,
        visibleModuleIds: current.moduleOrder.filter((item) => nextVisibleSet.has(item)),
      };
    });
  }

  function handleMoveDashboardModule(draggedId: DashboardModuleId, targetId: DashboardModuleId): void {
    setDashboardConfigDraft((current) => ({
      ...current,
      moduleOrder: reorderDashboardModuleIds(current.moduleOrder, draggedId, targetId),
    }));
  }

  function handleRestoreDashboardConfigDefaults(): void {
    setDashboardConfigDraft(createDefaultDashboardConfigPreference());
  }

  function handleSaveDashboardConfig(): void {
    const nextConfig = cloneDashboardConfigPreference(dashboardConfigDraft);
    setDashboardConfig(nextConfig);
    saveDashboardConfigPreference(nextConfig, state.profile.id);
    if (nextConfig.displayMode === "plans-only") {
      setActiveTab("plans");
    }
    setNotice("仪表盘配置已保存。");
  }

  function handleBackFromDashboardConfig(): void {
    if (dashboardConfigDirty && !window.confirm("当前有未保存的仪表盘配置，确定返回吗？")) {
      return;
    }
    setDashboardConfigDraft(cloneDashboardConfigPreference(dashboardConfig));
    setScreen("more-features");
  }

  function handleBackToMoreFeatures(): void {
    setScreen("more-features");
  }

  function handleBackFromStudyTimer(): void {
    setScreen("home");
    setActiveTab("plans");
    setSelectedDateKey(today);
    setActiveTimerPlanId(null);
  }

  function handleCompleteFromStudyTimer(planId: string, durationSeconds: number): void {
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    applyMutation(
      completePlan(state, planId, {
        mode: "actual",
        durationSeconds,
      }),
      () => {
        setScreen("home");
        setActiveTab("plans");
        setSelectedDateKey(today);
        setActiveTimerPlanId(null);
      },
      `已完成计划，自动记录 ${durationMinutes} 分钟。`,
    );
  }

  function handleAdoptPet(definitionId: string): void {
    applyMutation(adoptPet(state, definitionId), openPetCenter);
  }

  function handleSwitchPet(definitionId: string): void {
    applyMutation(switchActivePet(state, definitionId), openPetCenter);
  }

  function handleRecyclePet(definitionId: string): void {
    const definition = getPetDefinition(definitionId);
    const petName = definition?.name ?? "这只宠物";
    if (!window.confirm(`确定回收 ${petName} 吗？回收后将返还 ${PET_RECYCLE_REFUND_STARS} 颗星星。`)) {
      return;
    }
    applyMutation(recyclePet(state, definitionId), openPetCenter);
  }

  function handlePetInteraction(actionId: PetInteractionAction["id"]): void {
    applyMutation(interactWithPet(state, actionId));
  }

  function handleHelpFeatureAction(action: "plans" | "habits" | "habit-stats" | "reading-journey" | "help-placeholder"): void {
    if (action === "plans") {
      setScreen("home");
      setActiveTab("plans");
      setSelectedDateKey(today);
      return;
    }
    if (action === "habits") {
      openHabitManagement();
      return;
    }
    if (action === "habit-stats") {
      openHabitStatistics();
      return;
    }
    if (action === "reading-journey") {
      openReadingJourney();
      return;
    }
    openFutureFlow("该帮助条目已有说明，但功能仍未完成。");
  }

  function handleMoreFeatureAction(card: MoreFeatureCard): void {
    if (card.action === "study-timer") {
      const pendingPlan = state.plans.find((plan) => plan.status === "pending") ?? null;
      if (!pendingPlan) {
        openFutureFlow("请先创建一个待完成计划，再打开专注计时页。");
        return;
      }
      openStudyTimer(pendingPlan);
      return;
    }
    if (card.action === "habit-management") {
      openHabitManagement();
      return;
    }
    if (card.action === "home-plans") {
      setScreen("home");
      setActiveTab("plans");
      setSelectedDateKey(today);
      return;
    }
    if (card.action === "home-habits") {
      setScreen("home");
      setActiveTab("habits");
      setSelectedDateKey(today);
      return;
    }
    if (card.action === "habit-statistics") {
      openHabitStatistics();
      return;
    }
    if (card.action === "points-center") {
      openPointsCenter();
      return;
    }
    if (card.action === "pet-center") {
      openPetCenter();
      return;
    }
    if (card.action === "help-center") {
      openHelpCenter();
      return;
    }
    if (card.action === "more-features") {
      openMoreFeatures();
      return;
    }
    if (card.action === "reading-journey") {
      openReadingJourney();
      return;
    }
    if (card.action === "morning-reading") {
      openMorningReading();
      return;
    }
    if (card.action === "height-management") {
      openHeightManagement();
      return;
    }
    if (card.action === "interest-class") {
      openInterestClass();
      return;
    }
    if (card.action === "dashboard-config") {
      openDashboardConfig();
      return;
    }
    if (card.action === "profile-management") {
      openProfileManagement("more-features");
      return;
    }
    openFutureFlow(card.message ?? "该功能仍在开发中。");
  }

  function toggleHabitSelection(habitId: string): void {
    setSelectedHabitIds((current) => (current.includes(habitId) ? current.filter((item) => item !== habitId) : [...current, habitId]));
  }

  function selectAllHabits(): void {
    setSelectedHabitIds(activeHabits.map((habit) => habit.id));
  }

  function clearHabitSelection(): void {
    setSelectedHabitIds([]);
  }

  function archiveHabitIds(habitIds: string[]): void {
    applyMutation(archiveHabits(state, habitIds), () => {
      setSelectedHabitIds((current) => current.filter((habitId) => !habitIds.includes(habitId)));
    });
  }

  function handleDeleteHabit(habitId: string): void {
    if (!window.confirm("确定将这个习惯从首页和管理页归档吗？")) {
      return;
    }
    archiveHabitIds([habitId]);
  }

  function handleDeleteSelectedHabits(): void {
    if (selectedHabitIds.length === 0) {
      setNotice("请至少选择一个要归档的习惯。");
      return;
    }
    if (!window.confirm(`确定归档已选中的 ${selectedHabitIds.length} 个习惯吗？`)) {
      return;
    }
    archiveHabitIds(selectedHabitIds);
  }

  function handleMetricCardAction(card: MetricCard): void {
    if (card.action === "study-timer") {
      const pendingPlan = state.plans.find((plan) => plan.status === "pending") ?? null;
      if (!pendingPlan) {
        openFutureFlow("请先创建一个待完成计划，再打开专注计时页。");
        return;
      }
      openStudyTimer(pendingPlan);
      return;
    }

    const featureCard = {
      id: card.id,
      title: card.title,
      description: card.hint,
      icon: "",
      accent: "",
      action: card.action,
      keywords: [],
      message: card.message,
    } satisfies MoreFeatureCard;

    if (card.action === "placeholder") {
      openFutureFlow(card.message ?? `${card.title} 仍在开发中。`);
      return;
    }

    handleMoreFeatureAction(featureCard);
  }

  function handleRedeemReward(rewardId: string): void {
    applyMutation(redeemReward(state, rewardId));
  }

  function renderScreen(): JSX.Element {
    const readingJourneyScreen = (
      <ReadingJourneyScreen
        today={today}
        books={readingBooks}
        records={readingRecords}
        search={readingSearch}
        statusFilter={readingStatusFilter}
        categoryFilter={readingCategoryFilter}
        onBack={handleBackToHome}
        onOpenFlowTab={() => setScreen("reading-journey")}
        onOpenStatsTab={handleOpenReadingStatsTab}
        onOpenSyncTab={handleOpenReadingSyncTab}
        onSearchChange={setReadingSearch}
        onStatusFilterChange={setReadingStatusFilter}
        onCategoryFilterChange={setReadingCategoryFilter}
        onOpenAddBook={() => openReadingBookModal()}
        onOpenAddRecord={openReadingRecordModal}
        onOpenBookDetail={openReadingBookDetail}
        onOpenEditBook={(bookId) => openReadingBookModal(bookId)}
        onDeleteBook={handleDeleteReadingBook}
      />
    );

    if (screen === "study-timer") {
      return <StudyTimerScreen plan={activeTimerPlan} onBack={handleBackFromStudyTimer} onComplete={handleCompleteFromStudyTimer} />;
    }

    if (screen === "reading-journey") {
      return readingJourneyScreen;
    }

    if (screen === "reading-book-detail") {
      if (!readingDetailBook) {
        return readingJourneyScreen;
      }

      return (
        <ReadingBookDetailScreen
          book={readingDetailBook}
          records={readingDetailRecords}
          onBack={handleBackFromReadingDetail}
          onEditBook={() => openReadingBookModal(readingDetailBook.id)}
          onAddRecord={() => openReadingRecordModal(readingDetailBook.id)}
        />
      );
    }

    if (screen === "plan-management") {
      return (
        <PlanManagementScreen
          today={today}
          managedDateKey={planManagementDateKey}
          plans={managedPlans}
          selectedPlanIds={selectedManagedPlanIds}
          isDirty={isPlanManagementDirty}
          onBack={handleBackFromPlanManagement}
          onSave={handleSavePlanManagement}
          onJumpToToday={handleJumpPlanManagementToToday}
          onShiftDate={handleShiftPlanManagementDate}
          onToggleSelectAll={handleToggleSelectAllManagedPlans}
          onTogglePlanSelection={handleToggleManagedPlanSelection}
          onMovePlan={handleMoveManagedPlan}
          onCopySelected={handleCopyManagedPlans}
          onShareSelected={handleShareManagedPlans}
          onDeleteSelected={handleDeleteManagedPlans}
        />
      );
    }

    if (screen === "plan-create") {
      return (
        <PlanCreateScreen
          mode={editingPlanId ? "edit" : "create"}
          today={today}
          draft={planDraft}
          canSubmit={canSubmitPlan}
          onBack={handleBackFromPlanCreate}
          onCancel={handleCancelPlanCreate}
          onSubmit={handleAddPlan}
          onUpdateDraft={updatePlanDraft}
          onApplyDurationPreset={applyPlanDurationPreset}
          onSelectFiles={handlePlanAttachmentSelection}
          onDropFiles={handlePlanAttachmentDrop}
          onRemoveAttachment={removePlanAttachment}
        />
      );
    }

    if (screen === "plan-batch-create") {
      return (
        <BatchPlanCreateScreen
          today={today}
          draft={batchPlanDraft}
          previewPlans={parsedBatchPlans}
          canSubmit={canSubmitBatchPlan}
          resolvedDurationMinutes={resolvedBatchPlanMinutes}
          resolvedCustomStars={resolvedBatchPlanCustomStars}
          onBack={handleBackFromBatchPlanCreate}
          onCancel={handleCancelBatchPlanCreate}
          onSubmit={handleAddBatchPlans}
          onUpdateDraft={updateBatchPlanDraft}
          onTryAiParse={handleTryBatchAiParse}
        />
      );
    }

    if (screen === "ai-plan-assistant") {
      return (
        <AiPlanAssistantScreen
          draft={aiPlanComposerDraft}
          sessions={aiPlanSessions}
          activeSessionId={activeAiPlanSessionId}
          fileInputRef={aiPlanFileInputRef}
          onBack={handleBackFromAiPlanAssistant}
          onClear={handleClearAiPlanSession}
          onStartNewSession={handleStartNewAiSession}
          onSelectSession={handleSelectAiSession}
          onSubmit={handleSubmitAiPlan}
          onApplyPromptExample={handleAiPromptExample}
          onUpdateDraft={updateAiPlanComposerDraft}
          onSelectFiles={handleAiPlanFileSelection}
          onRemoveAttachment={removeAiPlanAttachment}
        />
      );
    }

    if (screen === "habit-management") {
      return (
        <HabitManagementScreen
          activeHabits={activeHabits}
          selectedHabitIds={selectedHabitIds}
          onBack={handleBackToHabitBoard}
          onOpenCreateHabit={() => setHabitModalOpen(true)}
          onImportHabits={() => openFutureFlow("导入流程仍在开发中。")}
          onAddDefaultHabits={() => applyMutation(addDefaultHabits(state))}
          onSelectAll={selectAllHabits}
          onClearSelection={clearHabitSelection}
          onDeleteSelected={handleDeleteSelectedHabits}
          onToggleSelection={toggleHabitSelection}
          onDeleteHabit={handleDeleteHabit}
          onOpenFutureFlow={openFutureFlow}
        />
      );
    }

    if (screen === "habit-statistics") {
      return (
        <HabitStatisticsScreen
          summary={habitStats}
          range={habitStatsRange}
          onBack={handleBackToHabitBoard}
          onSetRange={setHabitStatsRange}
          onGoCheckIn={() => {
            setSelectedDateKey(today);
            handleBackToHabitBoard();
          }}
        />
      );
    }

    if (screen === "pet-center") {
      return (
        <PetCenterScreen
          starBalance={summary.starBalance}
          ownedPets={ownedPets}
          ownedPetIds={ownedPetIds}
          activePetCompanion={activePetCompanion}
          activePetDefinition={activePetDefinition}
          activePetLevel={activePetLevel}
          onBack={handleBackToHome}
          onAdoptPet={handleAdoptPet}
          onSwitchPet={handleSwitchPet}
          onRecyclePet={handleRecyclePet}
          onInteract={handlePetInteraction}
        />
      );
    }

    if (screen === "points-center") {
      return (
        <PointsCenterScreen
          starBalance={summary.starBalance}
          rewards={state.rewards}
          pointsMetrics={pointsMetrics}
          dailyOpportunities={dailyPointOpportunities}
          onBack={handleBackToHome}
          onRedeemReward={handleRedeemReward}
          onOpenAchievements={openAchievementSystem}
          onOpenPointsHistory={openPointsHistory}
          onAddWish={openWishModal}
          onEditWish={handleEditWish}
          onDeleteWish={handleDeleteWish}
          onOpenRulesPage={openStarRulesPage}
        />
      );
    }

    if (screen === "star-rules") {
      return <StarRulesScreen onBack={handleBackToPointsCenter} onOpenAchievements={openAchievementSystem} onOpenWishlist={handleBackToPointsCenter} />;
    }

    if (screen === "achievement-system") {
      return (
        <AchievementSystemScreen
          overview={achievementOverview}
          onBack={handleBackToPointsCenter}
          onOpenSettings={() => openFutureFlow("成就设置仍在开发中。")}
        />
      );
    }

    if (screen === "points-history") {
      return (
        <PointsHistoryScreen
          state={state}
          referenceDateKey={today}
          onBack={handleBackToPointsCenter}
          onOpenCustomRange={() => openFutureFlow("自定义时间范围仍在开发中。")}
        />
      );
    }

    if (screen === "help-center") {
      return <HelpCenterScreen onBack={handleBackToHome} onFeatureAction={handleHelpFeatureAction} />;
    }

    if (screen === "height-management") {
      return (
        <HeightManagementScreen
          state={heightState}
          today={today}
          onBack={handleBackToMoreFeatures}
          onChangeState={setHeightState}
          onShowNotice={setNotice}
        />
      );
    }

    if (screen === "morning-reading") {
      return (
        <MorningReadingScreen
          state={morningReadingState}
          today={today}
          onBack={handleBackToHome}
          onChangeState={setMorningReadingState}
          onShowNotice={setNotice}
        />
      );
    }

    if (screen === "more-features") {
      return (
        <MoreFeaturesScreen
          search={moreFeaturesSearch}
          visibleSections={visibleMoreFeatureSections}
          onBack={handleBackToHome}
          onSearchChange={setMoreFeaturesSearch}
          onFeatureAction={handleMoreFeatureAction}
        />
      );
    }

    if (screen === "dashboard-config") {
      return (
        <DashboardConfigScreen
          displayMode={dashboardConfigDraft.displayMode}
          visibleCount={dashboardConfigDraft.visibleModuleIds.length}
          totalCount={DASHBOARD_MODULE_DEFINITIONS.length}
          moduleItems={dashboardModuleItems}
          isDirty={dashboardConfigDirty}
          onBack={handleBackFromDashboardConfig}
          onChangeDisplayMode={handleChangeDashboardDisplayMode}
          onToggleModule={handleToggleDashboardModule}
          onMoveModule={handleMoveDashboardModule}
          onRestoreDefaults={handleRestoreDashboardConfigDefaults}
          onSave={handleSaveDashboardConfig}
        />
      );
    }

    if (screen === "interest-class") {
      return (
        <InterestClassScreen
          classes={interestClasses}
          records={interestRecords}
          filterStartDate={interestFilterStartDate}
          filterEndDate={interestFilterEndDate}
          onBack={handleBackToMoreFeatures}
          onOpenAddClass={openAddInterestClassModal}
          onOpenEditClass={openEditInterestClassModal}
          onOpenAddRecord={openInterestRecordModal}
          onOpenEditRecord={openEditInterestRecordModal}
          onDeleteClass={handleDeleteInterestClass}
          onDeleteRecord={handleDeleteInterestRecord}
          onChangeFilterStartDate={setInterestFilterStartDate}
          onChangeFilterEndDate={setInterestFilterEndDate}
          onResetDateFilters={() => {
            setInterestFilterStartDate("");
            setInterestFilterEndDate("");
          }}
        />
      );
    }

    if (screen === "profile-management") {
      return (
        <ProfileManagementScreen
          profiles={profileWorkspace.profiles}
          activeProfileId={profileWorkspace.activeProfileId}
          accountEmail={syncSettings.email.trim()}
          search={profileManagementSearch}
          onSearchChange={setProfileManagementSearch}
          onBack={profileManagementBackTarget === "home" ? handleBackToHome : handleBackToMoreFeatures}
          onOpenAddProfile={openAddProfileModal}
          onOpenSyncAccount={openSyncAccountModal}
          onSwitchProfile={handleSwitchProfile}
          onRenameProfile={handleRenameProfile}
          onClearProfileData={handleClearProfileData}
          onDeleteProfile={handleDeleteProfile}
          onResetLocalData={handleReset}
        />
      );
    }

    const planBoard = (
      <PlanBoard
        today={today}
        selectedDateKey={selectedDateKey}
        weekDates={weekDates}
        plans={state.plans}
        pendingPlans={pendingPlans}
        completedPlans={completedPlans}
        pendingReviewCount={pendingPlanReviewItems.length}
        onSetSelectedDateKey={setSelectedDateKey}
        onJumpToToday={() => setSelectedDateKey(today)}
        onShiftSelectedDate={(offset) => setSelectedDateKey(shiftDateKey(selectedDateKey, offset))}
        onOpenAiPlanAssistant={handleOpenAiPlanAssistantFromHome}
        onOpenPlanManagement={handleOpenPlanManagementFromHome}
        onOpenPlanCreate={handleOpenPlanCreateFromHome}
        onOpenBatchPlanCreate={handleOpenBatchPlanCreateFromHome}
        onOpenQuickComplete={openQuickCompleteModal}
        onOpenPlanPointsReview={handleOpenPlanPointsReviewFromBoard}
        onApproveAllPlanPointsReview={handleApproveAllPendingPlanPoints}
        onOpenStudyTimer={openStudyTimer}
        onOpenPlanDetail={openPlanDetailModal}
        onOpenFutureFlow={openFutureFlow}
      />
    );

    const habitBoard = (
      <HabitBoard
        activeHabits={activeHabits}
        filteredHabits={filteredHabits}
        selectedDateKey={selectedDateKey}
        today={today}
        weekDates={weekDates}
        search={habitSearch}
        filter={habitFilter}
        layout={habitBoardLayout}
        onOpenManagement={openHabitManagement}
        onOpenStatistics={openHabitStatistics}
        onOpenFutureFlow={openFutureFlow}
        onJumpToToday={() => setSelectedDateKey(today)}
        onShiftSelectedDate={(offset) => {
          const base = new Date(selectedDateKey);
          const next = new Date(base);
          next.setDate(base.getDate() + offset);
          setSelectedDateKey(currentDateKey(next.toISOString()));
        }}
        onSetSelectedDateKey={setSelectedDateKey}
        onSearchChange={setHabitSearch}
        onResetFilters={() => {
          setHabitSearch("");
          setHabitFilter("all");
          setHabitBoardLayout("grid");
        }}
        onSetLayout={setHabitBoardLayout}
        onSetFilter={setHabitFilter}
        onCheckIn={handleHabitCheckIn}
      />
    );

    return (
      <HomeScreen
        profileName={state.profile.name}
        heroSummary={buildHeroSummary(state, today)}
        starBalance={summary.starBalance}
        metricCards={metricCards}
        displayMode={dashboardConfig.displayMode}
        activeTab={activeTab}
        rewardsPreview={rewardsPreview}
        recentActivity={recentActivity}
        planBoard={planBoard}
        habitBoard={habitBoard}
        profileMenuOpen={profileMenuOpen}
        profiles={profileWorkspace.profiles}
        activeProfileId={profileWorkspace.activeProfileId}
        onProfileClick={handleToggleProfileMenu}
        onSwitchProfile={handleSwitchProfile}
        onOpenAddProfile={openAddProfileModal}
        onOpenProfileManagement={() => openProfileManagement("home")}
        onOpenSyncAccount={openSyncAccountModal}
        onLogoutProfile={handleLogoutProfile}
        onMetricCardAction={handleMetricCardAction}
        onTabChange={handleTabChange}
        onOpenPointsCenter={openPointsCenter}
        onRedeemReward={handleRedeemReward}
      />
    );
  }

  return (
    <div className="app-shell">
      {renderScreen()}
      <QuickCompleteModal
        plan={quickCompletePlanTarget}
        draft={quickCompleteDraft}
        totalSeconds={quickCompleteTotalSeconds}
        canSubmit={canSubmitQuickComplete}
        fileInputRef={quickCompleteFileInputRef}
        onClose={closeQuickCompleteModal}
        onUpdateDraft={updateQuickCompleteDraft}
        onApplyPreset={applyQuickCompletePreset}
        onSubmit={handleSubmitQuickComplete}
        onSelectFiles={handleQuickCompleteFileSelection}
        onDropFiles={handleQuickCompleteDrop}
        onRemoveAttachment={removeQuickCompleteAttachment}
      />
      <PlanPointsReviewModal
        item={activePendingPlanReviewItem}
        draft={planPointsReviewDraft}
        canSubmit={canSubmitPlanPointsReview}
        onClose={closePlanPointsReviewModal}
        onSubmit={handleSubmitPlanPointsReview}
        onUpdateDraft={updatePlanPointsReviewDraft}
      />
      <PlanDetailModal
        plan={planDetailPlanTarget}
        selectedDateKey={selectedDateKey}
        completedForSelectedDate={planDetailCompletedForSelectedDate}
        completionRecordsForSelectedDate={planDetailCompletionRecordsForSelectedDate}
        onClose={closePlanDetailModal}
        onEditPlan={handleEditPlanFromDetail}
        onEditCurrentOccurrence={handleEditCurrentOccurrenceFromDetail}
        onDeleteRepeat={handleDeleteRepeatFromDetail}
      />
      <HabitModal
        open={habitModalOpen}
        draft={habitDraft}
        canCreate={canCreateHabit}
        typeMenuOpen={habitTypeMenuOpen}
        typeRef={habitTypeRef}
        typeOption={habitType}
        onClose={closeHabitModal}
        onSubmit={handleCreateHabit}
        onUpdateDraft={updateHabitDraft}
        onToggleTypeMenu={() => setHabitTypeMenuOpen((current) => !current)}
        onSelectFrequency={(frequency) => {
          updateHabitDraft("frequency", frequency);
          setHabitTypeMenuOpen(false);
        }}
      />
      <HabitCheckInModal
        habit={checkInHabitTarget}
        draft={habitCheckInDraft}
        resolvedPoints={resolvedCheckInPoints}
        canSubmit={canSubmitHabitCheckIn}
        onClose={closeHabitCheckInModal}
        onSubmit={handleSubmitHabitCheckIn}
        onUpdateDraft={updateHabitCheckInDraft}
      />
      <PlanDeleteSelectedModal
        open={planDeleteModalOpen}
        managedDateKey={planManagementDateKey}
        today={today}
        selectedCount={selectedManagedPlanIds.length}
        hasRecurringSelection={hasRecurringManagedSelection}
        onClose={closePlanDeleteModal}
        onConfirmDelete={handleConfirmDeleteManagedPlans}
      />
      <ReadingBookModal
        open={readingBookModalOpen}
        mode={editingReadingBookId ? "edit" : "create"}
        draft={readingBookDraft}
        onClose={closeReadingBookModal}
        onSubmit={handleSubmitReadingBook}
        onUpdateDraft={updateReadingBookDraft}
      />
      <ReadingRecordModal
        open={readingRecordModalOpen}
        books={readingBooks}
        draft={readingRecordDraft}
        onClose={closeReadingRecordModal}
        onSubmit={handleSubmitReadingRecord}
        onUpdateDraft={updateReadingRecordDraft}
      />
      <InterestClassModal
        open={interestClassModalOpen}
        mode={editingInterestClassTarget ? "edit" : "create"}
        draft={interestClassDraft}
        onClose={closeInterestClassModal}
        onSubmit={handleSubmitInterestClass}
        onUpdateDraft={updateInterestClassDraft}
      />
      <InterestClassRecordModal
        open={interestRecordModalOpen}
        mode={editingInterestRecordTarget ? "edit" : "create"}
        classes={interestClasses}
        draft={interestRecordDraft}
        onClose={closeInterestRecordModal}
        onSubmit={handleSubmitInterestRecord}
        onUpdateDraft={updateInterestRecordDraft}
      />
      <WishModal
        open={wishModalOpen}
        mode={editingWishId ? "edit" : "create"}
        draft={wishDraft}
        canSubmit={canSubmitWish}
        onClose={closeWishModal}
        onSubmit={handleSubmitWish}
        onUpdateDraft={updateWishDraft}
        onSelectIconCategory={handleSelectWishIconCategory}
        onSelectIcon={handleSelectWishIcon}
        onSelectCustomImage={handleWishCustomImageSelection}
        onClearCustomImage={clearWishCustomImage}
      />
      <WishDeleteConfirmModal
        open={Boolean(deletingWishId)}
        reward={deletingWishTarget}
        onClose={closeWishDeleteModal}
        onConfirm={handleConfirmDeleteWish}
      />
      <AddProfileModal
        open={addProfileModalOpen}
        profileName={addProfileNameDraft}
        avatarColor={addProfileAvatarColor}
        avatarImage={addProfileAvatarImage}
        colorOptions={PROFILE_AVATAR_COLOR_OPTIONS}
        profileCount={profileWorkspace.profiles.length}
        maxProfiles={MAX_LOCAL_PROFILES}
        canSubmit={canSubmitAddProfile}
        onClose={closeAddProfileModal}
        onUpdateProfileName={setAddProfileNameDraft}
        onSelectColor={setAddProfileAvatarColor}
        onSelectImage={(file) => {
          void handleAddProfileImageSelect(file);
        }}
        onSubmit={handleCreateProfile}
      />
      <SyncAccountModal
        open={syncModalOpen}
        settings={syncSettings}
        password={syncPassword}
        session={syncSession}
        deviceId={deviceId}
        pendingOpsCount={state.sync.pendingOps.length}
        isBusy={syncBusy}
        statusMessage={syncStatusMessage}
        onClose={closeSyncAccountModal}
        onUpdateEmail={updateSyncEmail}
        onPasswordChange={setSyncPassword}
        onSignIn={() => void handleSyncSignIn()}
        onSignUp={() => void handleSyncSignUp()}
        onRefreshSession={() => void handleSyncRefreshSession()}
        onInitializationCheck={() => void handleSyncInitializationCheck()}
        onPush={() => void handleSyncPushLocal()}
        onPull={() => void handleSyncPullRemote()}
        onBidirectionalSync={() => void handleSyncBidirectional()}
        onSignOut={handleSyncSignOut}
      />
      {notice ? <div className="toast">{notice}</div> : null}
    </div>
  );
}

export default AppShell;
