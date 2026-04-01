import {
  createInitialState,
  deserializeState,
  evaluateInvariants,
  serializeState,
  type AppState,
} from "../domain/model.js";

export const STORAGE_KEY = "xiuxiuzhushou_v2_state";
export const DASHBOARD_TAB_KEY = "xiuxiuzhushou_dashboard_tab";
export type DashboardTab = "plans" | "habits";

export function loadAppState(): AppState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    const parsed = deserializeState(raw);
    const violations = evaluateInvariants(parsed);
    return violations.length > 0 ? createInitialState() : parsed;
  } catch {
    return createInitialState();
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, serializeState(state));
}

export function resetAppState(now: string = new Date().toISOString()): AppState {
  const nextState = createInitialState(now);
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
