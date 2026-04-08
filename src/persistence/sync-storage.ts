export const SYNC_SETTINGS_STORAGE_KEY = "xiuxiuzhushou_sync_settings_v1";
export const SYNC_SESSION_STORAGE_KEY = "xiuxiuzhushou_sync_session_v1";

export interface SyncAccountSettings {
  email: string;
}

export interface SyncAccountSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  userId: string;
  email: string;
}

export function createInitialSyncAccountSettings(): SyncAccountSettings {
  return {
    email: "",
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeSession(value: unknown): SyncAccountSession | null {
  if (!isObject(value)) {
    return null;
  }

  const accessToken = normalizeString(value.accessToken);
  const refreshToken = normalizeString(value.refreshToken);
  const tokenType = normalizeString(value.tokenType);
  const expiresAt = normalizeString(value.expiresAt);
  const userId = normalizeString(value.userId);
  const email = normalizeString(value.email);

  if (!accessToken || !refreshToken || !tokenType || !expiresAt || !userId || !email) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    tokenType,
    expiresAt,
    userId,
    email,
  };
}

export function loadSyncAccountSettings(): SyncAccountSettings {
  if (typeof window === "undefined") {
    return createInitialSyncAccountSettings();
  }

  try {
    const raw = window.localStorage.getItem(SYNC_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return createInitialSyncAccountSettings();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)) {
      return createInitialSyncAccountSettings();
    }

    return {
      email: normalizeString(parsed.email),
    };
  } catch {
    return createInitialSyncAccountSettings();
  }
}

export function saveSyncAccountSettings(settings: SyncAccountSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SYNC_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      email: normalizeString(settings.email),
    }),
  );
}

export function loadSyncAccountSession(): SyncAccountSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SYNC_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSyncAccountSession(session: SyncAccountSession | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SYNC_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SYNC_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSyncAccountStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SYNC_SETTINGS_STORAGE_KEY);
  window.localStorage.removeItem(SYNC_SESSION_STORAGE_KEY);
}
