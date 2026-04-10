import {
  assignSyncDeviceId,
  createInitialState,
  deserializeState,
  evaluateInvariants,
  serializeState,
  type AppState,
} from "../domain/model.js";

export const STORAGE_KEY = "xiuxiuzhushou_v2_state";
export const PROFILE_WORKSPACE_KEY = "xiuxiuzhushou_profile_workspace_v1";
export const DASHBOARD_TAB_KEY = "xiuxiuzhushou_dashboard_tab";
export const SYNC_DEVICE_KEY = "xiuxiuzhushou_sync_device_v1";
export const MAX_LOCAL_PROFILES = 5;
export type DashboardTab = "plans" | "habits";

interface StoredProfileEntry {
  id: string;
  name: string;
  createdAt: string;
  avatarColor: string;
  avatarImage: string | null;
  state: string;
}

interface StoredProfileWorkspace {
  version: 1;
  activeProfileId: string | null;
  profiles: StoredProfileEntry[];
}

export interface LocalProfileSummary {
  id: string;
  name: string;
  createdAt: string;
  avatarColor: string;
  avatarImage: string | null;
}

export interface LocalProfileWorkspace {
  activeProfileId: string | null;
  profiles: LocalProfileSummary[];
}

export interface LocalProfileStateResult {
  state: AppState;
  workspace: LocalProfileWorkspace;
}

export interface CreateLocalProfileOptions {
  avatarColor?: string;
  avatarImage?: string | null;
}

const PROFILE_AVATAR_COLORS = ["#64A187", "#4F8F74", "#9A844E", "#7FA08D", "#B86A6A", "#6F8F98", "#9A844E"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIsoTime(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value) {
    return fallback;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(normalized)) {
    return fallback;
  }
  return normalized;
}

function pickProfileAvatarColor(index: number): string {
  return PROFILE_AVATAR_COLORS[index % PROFILE_AVATAR_COLORS.length];
}

function normalizeAvatarImage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function createGuestState(now: string = new Date().toISOString()): AppState {
  const baseState = createInitialState(now);
  return {
    ...baseState,
    profile: {
      id: "profile_guest",
      name: "用户登录",
      role: "student",
    },
    plans: [],
    habits: [],
    rewards: [],
    pets: {
      activePetDefinitionId: null,
      companions: [],
    },
    starTransactions: [],
    activity: [
      {
        id: "activity_guest_notice",
        kind: "system",
        message: "请先登录并创建档案。",
        createdAt: now,
      },
    ],
    meta: {
      ...baseState.meta,
      lastUpdatedAt: now,
    },
  };
}

function createProfileState(profileId: string, profileName: string, now: string = new Date().toISOString()): AppState {
  const baseState = createInitialState(now);
  return {
    ...baseState,
    profile: {
      id: profileId,
      name: profileName,
      role: "student",
    },
  };
}

function createEmptyWorkspace(): StoredProfileWorkspace {
  return {
    version: 1,
    activeProfileId: null,
    profiles: [],
  };
}

function toWorkspaceSummary(workspace: StoredProfileWorkspace): LocalProfileWorkspace {
  return {
    activeProfileId: workspace.activeProfileId,
    profiles: workspace.profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      createdAt: profile.createdAt,
      avatarColor: profile.avatarColor,
      avatarImage: profile.avatarImage,
    })),
  };
}

function createRandomProfileId(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return `profile_${window.crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeStoredEntry(value: unknown, index: number, fallbackTime: string): StoredProfileEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeString(value.id) || createRandomProfileId();
  const name = normalizeString(value.name) || `档案${index + 1}`;
  const createdAt = normalizeIsoTime(value.createdAt, fallbackTime);
  const avatarColor = normalizeHexColor(value.avatarColor, pickProfileAvatarColor(index));
  const avatarImage = normalizeAvatarImage(value.avatarImage);
  const fallbackState = createProfileState(id, name, fallbackTime);

  const parsedState =
    typeof value.state === "string"
      ? (() => {
          try {
            return deserializeState(value.state);
          } catch {
            return fallbackState;
          }
        })()
      : fallbackState;

  const normalizedState: AppState = {
    ...parsedState,
    profile: {
      ...parsedState.profile,
      id,
      name,
      role: "student",
    },
  };

  const safeState = evaluateInvariants(normalizedState).length === 0 ? normalizedState : fallbackState;
  return {
    id,
    name,
    createdAt,
    avatarColor,
    avatarImage,
    state: serializeState(safeState),
  };
}

function migrateLegacyState(fallbackTime: string): StoredProfileWorkspace {
  if (typeof window === "undefined") {
    return createEmptyWorkspace();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyWorkspace();
  }

  const fallbackState = createInitialState(fallbackTime);
  const parsedState = (() => {
    try {
      return deserializeState(raw);
    } catch {
      return fallbackState;
    }
  })();

  const id = normalizeString(parsedState.profile.id) || createRandomProfileId();
  const name = normalizeString(parsedState.profile.name) || "档案1";
  const normalizedState: AppState = {
    ...parsedState,
    profile: {
      ...parsedState.profile,
      id,
      name,
      role: "student",
    },
  };
  const safeState = evaluateInvariants(normalizedState).length === 0 ? normalizedState : createProfileState(id, name, fallbackTime);

  return {
    version: 1,
    activeProfileId: id,
    profiles: [
      {
        id,
        name,
        createdAt: normalizeIsoTime(parsedState.meta.lastUpdatedAt, fallbackTime),
        avatarColor: pickProfileAvatarColor(0),
        avatarImage: null,
        state: serializeState(safeState),
      },
    ],
  };
}

function normalizeWorkspace(value: unknown, fallbackTime: string): StoredProfileWorkspace {
  if (!isRecord(value)) {
    return createEmptyWorkspace();
  }

  const rawProfiles = Array.isArray(value.profiles) ? value.profiles : [];
  const profiles: StoredProfileEntry[] = [];
  const usedIds = new Set<string>();
  for (let index = 0; index < rawProfiles.length; index += 1) {
    const normalized = normalizeStoredEntry(rawProfiles[index], index, fallbackTime);
    if (!normalized || usedIds.has(normalized.id)) {
      continue;
    }
    usedIds.add(normalized.id);
    profiles.push(normalized);
    if (profiles.length >= MAX_LOCAL_PROFILES) {
      break;
    }
  }

  const requestedActiveProfileId = normalizeString(value.activeProfileId);
  const activeProfileId =
    requestedActiveProfileId.length > 0 && profiles.some((profile) => profile.id === requestedActiveProfileId)
      ? requestedActiveProfileId
      : null;

  return {
    version: 1,
    activeProfileId,
    profiles,
  };
}

function writeWorkspace(workspace: StoredProfileWorkspace): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PROFILE_WORKSPACE_KEY, JSON.stringify(workspace));
}

function readWorkspace(fallbackTime: string = new Date().toISOString()): StoredProfileWorkspace {
  if (typeof window === "undefined") {
    return createEmptyWorkspace();
  }

  const rawWorkspace = window.localStorage.getItem(PROFILE_WORKSPACE_KEY);
  if (!rawWorkspace) {
    const migrated = migrateLegacyState(fallbackTime);
    if (migrated.profiles.length > 0) {
      writeWorkspace(migrated);
    }
    return migrated;
  }

  const parsed = (() => {
    try {
      return JSON.parse(rawWorkspace) as unknown;
    } catch {
      return null;
    }
  })();

  if (parsed === null) {
    const migrated = migrateLegacyState(fallbackTime);
    if (migrated.profiles.length > 0) {
      writeWorkspace(migrated);
    }
    return migrated;
  }

  const normalized = normalizeWorkspace(parsed, fallbackTime);
  const normalizedRaw = JSON.stringify(normalized);
  if (normalizedRaw !== rawWorkspace) {
    writeWorkspace(normalized);
  }
  return normalized;
}

function resolveActiveProfile(workspace: StoredProfileWorkspace): StoredProfileEntry | null {
  if (!workspace.activeProfileId) {
    return null;
  }
  return workspace.profiles.find((profile) => profile.id === workspace.activeProfileId) ?? null;
}

function buildStateFromEntry(entry: StoredProfileEntry, deviceId: string, fallbackTime: string): AppState {
  const fallbackState = createProfileState(entry.id, entry.name, fallbackTime);
  const parsedState = (() => {
    try {
      return deserializeState(entry.state);
    } catch {
      return fallbackState;
    }
  })();
  const normalizedState: AppState = {
    ...parsedState,
    profile: {
      ...parsedState.profile,
      id: entry.id,
      name: entry.name,
      role: "student",
    },
  };
  const safeState = evaluateInvariants(normalizedState).length === 0 ? normalizedState : fallbackState;
  return assignSyncDeviceId(safeState, deviceId);
}

function createRandomDeviceId(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadOrCreateSyncDeviceId(): string {
  if (typeof window === "undefined") {
    return "device-server";
  }

  try {
    const existing = window.localStorage.getItem(SYNC_DEVICE_KEY);
    if (existing) {
      return existing;
    }

    const created = createRandomDeviceId();
    window.localStorage.setItem(SYNC_DEVICE_KEY, created);
    return created;
  } catch {
    return "device-browser-fallback";
  }
}

export function loadLocalProfileWorkspace(): LocalProfileWorkspace {
  if (typeof window === "undefined") {
    return {
      activeProfileId: null,
      profiles: [],
    };
  }
  return toWorkspaceSummary(readWorkspace());
}

export function loadAppState(): AppState {
  if (typeof window === "undefined") {
    return createGuestState();
  }

  const now = new Date().toISOString();
  const deviceId = loadOrCreateSyncDeviceId();
  const workspace = readWorkspace(now);
  const activeProfile = resolveActiveProfile(workspace);

  if (!activeProfile) {
    return assignSyncDeviceId(createGuestState(now), deviceId);
  }

  const state = buildStateFromEntry(activeProfile, deviceId, now);
  const serialized = serializeState(state);
  if (serialized !== activeProfile.state) {
    activeProfile.state = serialized;
    writeWorkspace(workspace);
  }
  window.localStorage.setItem(STORAGE_KEY, serialized);
  return state;
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  const workspace = readWorkspace(state.meta.lastUpdatedAt);
  const activeProfile = resolveActiveProfile(workspace);
  if (!activeProfile) {
    return;
  }

  const profileName = normalizeString(state.profile.name) || activeProfile.name;
  const normalizedState: AppState = {
    ...state,
    profile: {
      ...state.profile,
      id: activeProfile.id,
      name: profileName,
      role: "student",
    },
  };
  const serialized = serializeState(normalizedState);
  activeProfile.name = profileName;
  activeProfile.state = serialized;
  writeWorkspace(workspace);
  window.localStorage.setItem(STORAGE_KEY, serialized);
}

export function resetAppState(now: string = new Date().toISOString()): AppState {
  const deviceId = loadOrCreateSyncDeviceId();
  if (typeof window === "undefined") {
    return assignSyncDeviceId(createGuestState(now), deviceId);
  }

  const workspace = readWorkspace(now);
  const activeProfile = resolveActiveProfile(workspace);
  if (!activeProfile) {
    return assignSyncDeviceId(createGuestState(now), deviceId);
  }

  const nextState = assignSyncDeviceId(createProfileState(activeProfile.id, activeProfile.name, now), deviceId);
  const serialized = serializeState(nextState);
  activeProfile.state = serialized;
  writeWorkspace(workspace);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  return nextState;
}

export function createLocalProfile(
  profileName: string,
  now: string = new Date().toISOString(),
  options: CreateLocalProfileOptions = {},
): LocalProfileStateResult {
  const trimmedName = normalizeString(profileName);
  if (!trimmedName) {
    throw new Error("请先输入档案名称。");
  }

  if (typeof window === "undefined") {
    const fallbackState = createProfileState("profile_server", trimmedName, now);
    const fallbackColor = normalizeHexColor(options.avatarColor, pickProfileAvatarColor(0));
    const fallbackImage = normalizeAvatarImage(options.avatarImage);
    return {
      state: fallbackState,
      workspace: {
        activeProfileId: fallbackState.profile.id,
        profiles: [
          {
            id: fallbackState.profile.id,
            name: fallbackState.profile.name,
            createdAt: now,
            avatarColor: fallbackColor,
            avatarImage: fallbackImage,
          },
        ],
      },
    };
  }

  const workspace = readWorkspace(now);
  if (workspace.profiles.length >= MAX_LOCAL_PROFILES) {
    throw new Error(`最多只能创建 ${MAX_LOCAL_PROFILES} 个档案。`);
  }

  let profileId = createRandomProfileId();
  while (workspace.profiles.some((profile) => profile.id === profileId)) {
    profileId = createRandomProfileId();
  }

  const avatarColor = normalizeHexColor(options.avatarColor, pickProfileAvatarColor(workspace.profiles.length));
  const avatarImage = normalizeAvatarImage(options.avatarImage);
  const state = createProfileState(profileId, trimmedName, now);
  const serialized = serializeState(state);
  workspace.profiles.push({
    id: profileId,
    name: trimmedName,
    createdAt: now,
    avatarColor,
    avatarImage,
    state: serialized,
  });
  workspace.activeProfileId = profileId;
  writeWorkspace(workspace);
  window.localStorage.setItem(STORAGE_KEY, serialized);

  return {
    state: assignSyncDeviceId(state, loadOrCreateSyncDeviceId()),
    workspace: toWorkspaceSummary(workspace),
  };
}

export function switchLocalProfile(profileId: string, now: string = new Date().toISOString()): LocalProfileStateResult {
  const normalizedId = normalizeString(profileId);
  if (!normalizedId) {
    throw new Error("请选择要切换的档案。");
  }

  if (typeof window === "undefined") {
    throw new Error("当前环境不支持切换本地档案。");
  }

  const workspace = readWorkspace(now);
  const targetProfile = workspace.profiles.find((profile) => profile.id === normalizedId);
  if (!targetProfile) {
    throw new Error("未找到该档案，请刷新后重试。");
  }

  workspace.activeProfileId = targetProfile.id;
  const nextState = buildStateFromEntry(targetProfile, loadOrCreateSyncDeviceId(), now);
  targetProfile.state = serializeState(nextState);
  writeWorkspace(workspace);
  window.localStorage.setItem(STORAGE_KEY, targetProfile.state);

  return {
    state: nextState,
    workspace: toWorkspaceSummary(workspace),
  };
}

export function deleteLocalProfile(profileId: string, now: string = new Date().toISOString()): LocalProfileStateResult {
  const normalizedId = normalizeString(profileId);
  if (!normalizedId) {
    throw new Error("请选择要删除的档案。");
  }

  if (typeof window === "undefined") {
    throw new Error("当前环境不支持删除本地档案。");
  }

  const workspace = readWorkspace(now);
  const targetIndex = workspace.profiles.findIndex((profile) => profile.id === normalizedId);
  if (targetIndex < 0) {
    throw new Error("未找到该档案，请刷新后重试。");
  }

  const wasActive = workspace.activeProfileId === normalizedId;
  workspace.profiles.splice(targetIndex, 1);

  if (workspace.profiles.length === 0) {
    workspace.activeProfileId = null;
    writeWorkspace(workspace);
    const guestState = assignSyncDeviceId(createGuestState(now), loadOrCreateSyncDeviceId());
    window.localStorage.setItem(STORAGE_KEY, serializeState(guestState));
    return {
      state: guestState,
      workspace: toWorkspaceSummary(workspace),
    };
  }

  if (wasActive || !workspace.activeProfileId || !workspace.profiles.some((profile) => profile.id === workspace.activeProfileId)) {
    const fallbackIndex = Math.max(0, Math.min(targetIndex, workspace.profiles.length - 1));
    workspace.activeProfileId = workspace.profiles[fallbackIndex].id;
  }

  const activeProfile = resolveActiveProfile(workspace);
  if (!activeProfile) {
    throw new Error("档案状态异常，请重试。");
  }

  const nextState = buildStateFromEntry(activeProfile, loadOrCreateSyncDeviceId(), now);
  activeProfile.state = serializeState(nextState);
  writeWorkspace(workspace);
  window.localStorage.setItem(STORAGE_KEY, activeProfile.state);

  return {
    state: nextState,
    workspace: toWorkspaceSummary(workspace),
  };
}

export function clearLocalProfileData(profileId: string, now: string = new Date().toISOString()): LocalProfileStateResult {
  const normalizedId = normalizeString(profileId);
  if (!normalizedId) {
    throw new Error("请选择要清空的档案。");
  }

  if (typeof window === "undefined") {
    throw new Error("当前环境不支持清空本地档案数据。");
  }

  const workspace = readWorkspace(now);
  const targetProfile = workspace.profiles.find((profile) => profile.id === normalizedId);
  if (!targetProfile) {
    throw new Error("未找到该档案，请刷新后重试。");
  }

  const nextProfileState = createProfileState(targetProfile.id, targetProfile.name, now);
  targetProfile.state = serializeState(nextProfileState);

  const activeProfile = resolveActiveProfile(workspace);
  if (!activeProfile) {
    writeWorkspace(workspace);
    const guestState = assignSyncDeviceId(createGuestState(now), loadOrCreateSyncDeviceId());
    window.localStorage.setItem(STORAGE_KEY, serializeState(guestState));
    return {
      state: guestState,
      workspace: toWorkspaceSummary(workspace),
    };
  }

  const nextState = buildStateFromEntry(activeProfile, loadOrCreateSyncDeviceId(), now);
  activeProfile.state = serializeState(nextState);
  writeWorkspace(workspace);
  window.localStorage.setItem(STORAGE_KEY, activeProfile.state);

  return {
    state: nextState,
    workspace: toWorkspaceSummary(workspace),
  };
}

export function renameLocalProfile(profileId: string, profileName: string, now: string = new Date().toISOString()): LocalProfileStateResult {
  const normalizedId = normalizeString(profileId);
  if (!normalizedId) {
    throw new Error("请选择要编辑的档案。");
  }

  const normalizedName = normalizeString(profileName);
  if (!normalizedName) {
    throw new Error("档案名称不能为空。");
  }

  if (typeof window === "undefined") {
    throw new Error("当前环境不支持编辑本地档案。");
  }

  const workspace = readWorkspace(now);
  const targetProfile = workspace.profiles.find((profile) => profile.id === normalizedId);
  if (!targetProfile) {
    throw new Error("未找到该档案，请刷新后重试。");
  }

  targetProfile.name = normalizedName;
  const targetState = buildStateFromEntry(targetProfile, loadOrCreateSyncDeviceId(), now);
  targetProfile.state = serializeState(targetState);

  const activeProfile = resolveActiveProfile(workspace);
  if (!activeProfile) {
    writeWorkspace(workspace);
    const guestState = assignSyncDeviceId(createGuestState(now), loadOrCreateSyncDeviceId());
    window.localStorage.setItem(STORAGE_KEY, serializeState(guestState));
    return {
      state: guestState,
      workspace: toWorkspaceSummary(workspace),
    };
  }

  const nextState =
    activeProfile.id === targetProfile.id ? targetState : buildStateFromEntry(activeProfile, loadOrCreateSyncDeviceId(), now);
  activeProfile.state = serializeState(nextState);
  writeWorkspace(workspace);
  window.localStorage.setItem(STORAGE_KEY, activeProfile.state);

  return {
    state: nextState,
    workspace: toWorkspaceSummary(workspace),
  };
}

export function logoutLocalProfile(now: string = new Date().toISOString()): LocalProfileStateResult {
  if (typeof window === "undefined") {
    const fallbackState = createGuestState(now);
    return {
      state: fallbackState,
      workspace: {
        activeProfileId: null,
        profiles: [],
      },
    };
  }

  const workspace = readWorkspace(now);
  workspace.activeProfileId = null;
  writeWorkspace(workspace);

  const guestState = assignSyncDeviceId(createGuestState(now), loadOrCreateSyncDeviceId());
  window.localStorage.setItem(STORAGE_KEY, serializeState(guestState));
  return {
    state: guestState,
    workspace: toWorkspaceSummary(workspace),
  };
}

export function loadDashboardTabPreference(): DashboardTab {
  if (typeof window === "undefined") {
    return "plans";
  }

  const raw = window.localStorage.getItem(DASHBOARD_TAB_KEY);
  return raw === "habits" ? "habits" : "plans";
}

export function saveDashboardTabPreference(tab: DashboardTab): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DASHBOARD_TAB_KEY, tab);
}
