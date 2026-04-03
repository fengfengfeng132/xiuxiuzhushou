import type { DragEvent, FormEvent, JSX } from "react";
import { useEffect, useRef, useState } from "react";
import {
  addDefaultHabits,
  addPlan,
  adoptPet,
  archiveHabits,
  checkInHabit,
  completePlan,
  createHabit,
  createReward,
  deletePlans,
  currentDateKey,
  getActivePetCompanion,
  getHabitFrequencyOption,
  getPetDefinition,
  getPetLevelTier,
  isPlanCompletedForDate,
  isPlanScheduledForDate,
  interactWithPet,
  redeemReward,
  switchActivePet,
  summarizeState,
  updatePlan,
  type AppState,
  type Habit,
  type PlanCompletionAttachment,
  type PetInteractionAction,
  type RewardCategory,
  type RewardRepeatMode,
  type RewardResetPeriod,
  type StudyPlan,
} from "../domain/model.js";
import {
  loadAppState,
  loadDashboardTabPreference,
  resetAppState,
  saveAppState,
  saveDashboardTabPreference,
  type DashboardTab,
} from "../persistence/storage.js";
import {
  INITIAL_AI_PLAN_COMPOSER_DRAFT,
  createInitialBatchPlanDraft,
  createInitialPlanDraft,
  createPlanDraftFromPlan,
  createInitialWishDraft,
  INITIAL_HABIT_CHECKIN_DRAFT,
  INITIAL_HABIT_DRAFT,
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
  HabitBoardFilter,
  HabitBoardLayout,
  HabitCheckInDraft,
  HabitDraft,
  HabitStatsRange,
  MoreFeatureCard,
  PlanAttachmentDraft,
  PlanDraft,
  PlanRepeatType,
  PlanTimeMode,
  QuickCompleteAttachmentDraft,
  QuickCompleteDraft,
  QuickCompleteMode,
  PlanDeleteScope,
  Screen,
  WishDraft,
} from "./app-types.js";
import { HabitBoard, HabitCheckInModal, HabitManagementScreen, HabitModal, HabitStatisticsScreen } from "./habits/habits-module.js";
import { HelpCenterScreen } from "./help/help-center-screen.js";
import { HomeScreen } from "./home/home-screen.js";
import { MoreFeaturesScreen } from "./more-features/more-features-screen.js";
import { PetCenterScreen } from "./pets/pet-center-screen.js";
import { AchievementSystemScreen } from "./points/achievement-system-screen.js";
import { PointsCenterScreen } from "./points/points-center-screen.js";
import { PointsHistoryScreen } from "./points/points-history-screen.js";
import { WishModal } from "./points/wish-modal.js";
import { getWishIconCategory } from "./points/wish-config.js";
import { buildAchievementOverview, buildDailyPointOpportunities, summarizePointsMetrics } from "./points/points-helpers.js";
import { AiPlanAssistantScreen } from "./plans/ai-plan-assistant-screen.js";
import { resolveBatchCustomStars, resolveBatchDurationMinutes, parseBatchPlanInput } from "./plans/batch-plan-helpers.js";
import { BatchPlanCreateScreen } from "./plans/batch-plan-create-screen.js";
import { applyManagedPlanOrder, createManagedPlanOrder, reorderManagedPlanIds } from "./plans/plan-management-helpers.js";
import { PlanDeleteSelectedModal, PlanManagementScreen } from "./plans/plan-management-screen.js";
import { PlanCreateScreen } from "./plans/plan-create-screen.js";
import { formatPlanRepeatSaveNotice } from "./plans/plan-repeat.js";
import { PlanBoard, PlanDetailModal, QuickCompleteModal } from "./plans/plans-module.js";
import { StudyTimerScreen } from "./timer/study-timer-screen.js";

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

function buildPlanDateTime(dateKey: string, time: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

function createLocalUiId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => loadDashboardTabPreference());
  const [screen, setScreen] = useState<Screen>("home");
  const [quickCompleteDraft, setQuickCompleteDraft] = useState<QuickCompleteDraft>(INITIAL_QUICK_COMPLETE_DRAFT);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [habitCheckInDraft, setHabitCheckInDraft] = useState<HabitCheckInDraft>(INITIAL_HABIT_CHECKIN_DRAFT);
  const [habitTypeMenuOpen, setHabitTypeMenuOpen] = useState(false);
  const [habitSearch, setHabitSearch] = useState("");
  const [moreFeaturesSearch, setMoreFeaturesSearch] = useState("");
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

  const today = currentDateKey();
  const activeHabits = state.habits.filter((habit) => habit.status === "active");
  const ownedPets = state.pets.companions;
  const activePetCompanion = getActivePetCompanion(state);
  const activePetDefinition = activePetCompanion ? getPetDefinition(activePetCompanion.definitionId) : null;
  const activePetLevel = activePetCompanion ? getPetLevelTier(activePetCompanion.intimacy) : null;
  const ownedPetIds = new Set(ownedPets.map((companion) => companion.definitionId));
  const weekDates = getWeekDates(selectedDateKey);
  const summary = summarizeState(state, today);
  const metricCards = createMetricCards(state, today);
  const pendingPlans = getPendingPlansForDate(state.plans, selectedDateKey);
  const completedPlans = getCompletedPlansForDate(state.plans, selectedDateKey);
  const recentActivity = state.activity.slice(0, 5);
  const rewardsPreview = state.rewards.slice(0, 3);
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
  const activeTimerPlan = state.plans.find((plan) => plan.id === activeTimerPlanId) ?? null;
  const planDetailPlanTarget = state.plans.find((plan) => plan.id === planDetailPlanId) ?? null;
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
  const parsedPlanCustomPoints = Math.round(Number(planDraft.customPoints));
  const resolvedBatchPlanMinutes = resolveBatchDurationMinutes(batchPlanDraft.defaultDurationMinutes);
  const resolvedBatchPlanCustomStars = resolveBatchCustomStars(batchPlanDraft.customPoints);
  const canSubmitPlan =
    planDraft.category.trim().length > 0 &&
    planDraft.title.trim().length > 0 &&
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
  const quickCompleteHours = Math.max(0, Math.round(Number(quickCompleteDraft.hours) || 0));
  const quickCompleteMinutes = Math.max(0, Math.round(Number(quickCompleteDraft.minutes) || 0));
  const quickCompleteSeconds = Math.max(0, Math.round(Number(quickCompleteDraft.seconds) || 0));
  const quickCompleteTotalSeconds = quickCompleteHours * 3600 + quickCompleteMinutes * 60 + quickCompleteSeconds;
  const canSubmitQuickComplete = quickCompletePlanTarget !== null && quickCompletePlanTarget.status === "pending" && quickCompleteTotalSeconds > 0;
  const habitSearchKeyword = habitSearch.trim().toLowerCase();
  const moreFeaturesKeyword = moreFeaturesSearch.trim().toLowerCase();
  const filteredHabits = activeHabits.filter((habit) => {
    const matchesSearch =
      habitSearchKeyword.length === 0 ||
      habit.name.toLowerCase().includes(habitSearchKeyword) ||
      habit.description.toLowerCase().includes(habitSearchKeyword);
    return matchesSearch && matchesHabitFilter(habit, habitFilter, selectedDateKey);
  });
  const visibleMoreFeatureSections = MORE_FEATURE_SECTIONS.map((section) => ({
    ...section,
    cards: section.cards.filter((card) => matchesMoreFeatureCard(card, moreFeaturesKeyword)),
  })).filter((section) => section.cards.length > 0);
  const habitStats = summarizeHabitStats(state, activeHabits, habitStatsRange, selectedDateKey);
  const pointsMetrics = summarizePointsMetrics(state, today);
  const dailyPointOpportunities = buildDailyPointOpportunities(state, today);
  const achievementOverview = buildAchievementOverview(state);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    saveDashboardTabPreference(activeTab);
  }, [activeTab]);

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
    if (!habitModalOpen && !wishModalOpen && !planDeleteModalOpen && !checkInHabitTarget && !quickCompletePlanTarget && !planDetailPlanTarget) {
      return undefined;
    }
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        if (quickCompletePlanTarget) {
          closeQuickCompleteModal();
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
  }, [habitModalOpen, wishModalOpen, planDeleteModalOpen, checkInHabitTarget, planDetailPlanTarget, quickCompletePlanTarget]);

  function updatePlanDraft(field: keyof PlanDraft, value: string | boolean | PlanRepeatType | PlanTimeMode | PlanAttachmentDraft[]): void {
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

  function openWishModal(): void {
    setWishDraft(createInitialWishDraft());
    setWishModalOpen(true);
  }

  function closeWishModal(): void {
    setWishModalOpen(false);
    setWishDraft(createInitialWishDraft());
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
    setQuickCompleteDraft({
      planId: plan.id,
      mode: "duration",
      hours: "0",
      minutes: "0",
      seconds: "0",
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

  function updateHabitDraft(field: keyof HabitDraft, value: string | boolean): void {
    setHabitDraft((current) => ({ ...current, [field]: value }));
  }

  function applyMutation(result: { ok: boolean; nextState: AppState; message: string }, onSuccess?: () => void, successMessage?: string): void {
    if (result.ok) {
      setState(result.nextState);
      onSuccess?.();
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

  function openHelpCenter(): void {
    setScreen("help-center");
  }

  function openMoreFeatures(): void {
    setScreen("more-features");
    setMoreFeaturesSearch("");
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
    setState(resetAppState());
    setPlanDraft(createInitialPlanDraft(today));
    setBatchPlanDraft(createInitialBatchPlanDraft(today));
    setAiPlanComposerDraft(INITIAL_AI_PLAN_COMPOSER_DRAFT);
    setAiPlanSessions([]);
    setActiveAiPlanSessionId(null);
    setQuickCompleteDraft(INITIAL_QUICK_COMPLETE_DRAFT);
    setHabitDraft(INITIAL_HABIT_DRAFT);
    setWishDraft(createInitialWishDraft());
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
    setHabitCheckInDraft(INITIAL_HABIT_CHECKIN_DRAFT);
    setNotice("本地状态已重置。");
  }

  function openFutureFlow(message: string): void {
    setNotice(message);
  }

  function handleEditPlanFromDetail(_plan: StudyPlan): void {
    setPlanDraft(createPlanDraftFromPlan(_plan));
    setEditingPlanId(_plan.id);
    closePlanDetailModal();
    setScreen("plan-create");
    setActiveTab("plans");
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

  function handleDictationFromDetail(_plan: StudyPlan): void {
    openFutureFlow("听写功能仍在开发中。");
  }

  function handlePlayFromDetail(_plan: StudyPlan): void {
    openFutureFlow("播放功能仍在开发中。");
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
            minutes: resolvedMinutesForSave,
            stars: planDraft.useCustomPoints ? parsedPlanCustomPoints : undefined,
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
          minutes: resolvedMinutesForSave,
          stars: planDraft.useCustomPoints ? parsedPlanCustomPoints : undefined,
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

    setState((current) => ({
      ...current,
      plans: applyManagedPlanOrder(current.plans, planManagementDateKey, planManagementOrderIds),
      meta: {
        ...current.meta,
        lastUpdatedAt: new Date().toISOString(),
      },
    }));
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

  function handleConfirmDeleteManagedPlans(_scope: PlanDeleteScope): void {
    const targetIds = [...selectedManagedPlanIds];
    applyMutation(
      deletePlans(state, targetIds),
      () => {
        const nextOrderIds = createManagedPlanOrder(
          state.plans.filter((plan) => !targetIds.includes(plan.id)),
          planManagementDateKey,
        );
        setPlanManagementOrderIds(nextOrderIds);
        setSelectedManagedPlanIds([]);
        closePlanDeleteModal();
      },
      `已删除 ${targetIds.length} 个计划。`,
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

    const attachments: PlanCompletionAttachment[] = quickCompleteDraft.attachments.map((attachment) => ({
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
    }));

    applyMutation(
      completePlan(state, quickCompletePlanTarget.id, {
        mode: quickCompleteDraft.mode,
        durationSeconds: quickCompleteTotalSeconds,
        note: quickCompleteDraft.note,
        attachments,
      }),
      () => {
        closeQuickCompleteModal();
        setSelectedDateKey(today);
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

    applyMutation(
      createReward(state, {
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
      }),
      closeWishModal,
      `愿望添加成功，需要 ${parsedWishCost} 星才能兑换这个愿望`,
    );
  }

  function handleBackToHabitBoard(): void {
    setScreen("home");
    setActiveTab("habits");
  }

  function handleBackToHome(): void {
    setScreen("home");
  }

  function handleBackToPointsCenter(): void {
    setScreen("points-center");
  }

  function handleBackFromStudyTimer(): void {
    setScreen("home");
    setActiveTab("plans");
    setSelectedDateKey(today);
    setActiveTimerPlanId(null);
  }

  function handleAdoptPet(definitionId: string): void {
    applyMutation(adoptPet(state, definitionId), openPetCenter);
  }

  function handleSwitchPet(definitionId: string): void {
    applyMutation(switchActivePet(state, definitionId), openPetCenter);
  }

  function handlePetInteraction(actionId: PetInteractionAction["id"]): void {
    applyMutation(interactWithPet(state, actionId));
  }

  function handleHelpFeatureAction(action: "plans" | "habits" | "habit-stats" | "help-placeholder"): void {
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
    openFutureFlow("该帮助条目已有说明，但功能仍未完成。");
  }

  function handleMoreFeatureAction(card: MoreFeatureCard): void {
    if (card.id === "timer") {
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
    if (card.action === "pet-center") {
      openPetCenter();
      return;
    }
    if (card.action === "help-center") {
      openHelpCenter();
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

  function handleMetricCardAction(card: { id: string; title: string }): void {
    if (card.id === "stars") {
      openPointsCenter();
      return;
    }
    if (card.id === "habits") {
      openHabitManagement();
      return;
    }
    if (card.id === "pet") {
      openPetCenter();
      return;
    }
    if (card.id === "help") {
      openHelpCenter();
      return;
    }
    if (card.id === "more") {
      openMoreFeatures();
      return;
    }
    setScreen("home");
    setActiveTab("plans");
    setSelectedDateKey(today);
    openFutureFlow(`${card.title} 暂时会返回首页看板。`);
  }

  function handleRedeemReward(rewardId: string): void {
    applyMutation(redeemReward(state, rewardId));
  }

  function renderScreen(): JSX.Element {
    if (screen === "study-timer") {
      return <StudyTimerScreen plan={activeTimerPlan} onBack={handleBackFromStudyTimer} />;
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
          onEditWish={() => openFutureFlow("愿望编辑流程仍在开发中。")}
          onDeleteWish={() => openFutureFlow("愿望删除流程仍在开发中。")}
          onOpenRulesPage={() => openFutureFlow("完整积分规则页面仍在开发中。")}
        />
      );
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

    const planBoard = (
      <PlanBoard
        today={today}
        selectedDateKey={selectedDateKey}
        weekDates={weekDates}
        plans={state.plans}
        pendingPlans={pendingPlans}
        completedPlans={completedPlans}
        onSetSelectedDateKey={setSelectedDateKey}
        onJumpToToday={() => setSelectedDateKey(today)}
        onShiftSelectedDate={(offset) => setSelectedDateKey(shiftDateKey(selectedDateKey, offset))}
        onOpenAiPlanAssistant={handleOpenAiPlanAssistantFromHome}
        onOpenPlanManagement={handleOpenPlanManagementFromHome}
        onOpenPlanCreate={handleOpenPlanCreateFromHome}
        onOpenBatchPlanCreate={handleOpenBatchPlanCreateFromHome}
        onOpenQuickComplete={openQuickCompleteModal}
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
        activeTab={activeTab}
        rewardsPreview={rewardsPreview}
        recentActivity={recentActivity}
        planBoard={planBoard}
        habitBoard={habitBoard}
        onProfileClick={() => openFutureFlow("多档案切换仍在开发中。")}
        onReset={handleReset}
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
      <PlanDetailModal
        plan={planDetailPlanTarget}
        onClose={closePlanDetailModal}
        onEditPlan={handleEditPlanFromDetail}
        onDeleteRepeat={handleDeleteRepeatFromDetail}
        onOpenDictation={handleDictationFromDetail}
        onPlayRecord={handlePlayFromDetail}
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
      <WishModal
        open={wishModalOpen}
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
      {notice ? <div className="toast">{notice}</div> : null}
    </div>
  );
}

export default AppShell;
