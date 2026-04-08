import {
  assignSyncDeviceId,
  createInitialState,
  deserializeState,
  evaluateInvariants,
  serializeState,
  type AppState,
} from "../domain/model.js";

export const STORAGE_KEY = "xiuxiuzhushou_v2_state";
export const DASHBOARD_TAB_KEY = "xiuxiuzhushou_dashboard_tab";
export const SYNC_DEVICE_KEY = "xiuxiuzhushou_sync_device_v1";
export type DashboardTab = "plans" | "habits";

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

export function loadAppState(): AppState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const deviceId = loadOrCreateSyncDeviceId();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return assignSyncDeviceId(createInitialState(), deviceId);
    }

    const parsed = deserializeState(raw);
    const stateWithDevice = assignSyncDeviceId(parsed, deviceId);
    const violations = evaluateInvariants(stateWithDevice);
    if (violations.length > 0) {
      return assignSyncDeviceId(createInitialState(), deviceId);
    }

    if (stateWithDevice !== parsed) {
      window.localStorage.setItem(STORAGE_KEY, serializeState(stateWithDevice));
    }
    return stateWithDevice;
  } catch {
    return assignSyncDeviceId(createInitialState(), loadOrCreateSyncDeviceId());
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, serializeState(state));
}

export function resetAppState(now: string = new Date().toISOString()): AppState {
  const nextState = assignSyncDeviceId(createInitialState(now), loadOrCreateSyncDeviceId());
  saveAppState(nextState);
  return nextState;
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
