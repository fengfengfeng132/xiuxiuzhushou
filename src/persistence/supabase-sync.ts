import { deserializeState, serializeState, type AppState } from "../domain/model.js";
import type { SyncAccountSession } from "./sync-storage.js";

export const APP_SYNC_STATE_TABLE = "app_sync_state";

export interface SupabaseSyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface SupabaseSignUpResult {
  session: SyncAccountSession | null;
  needsEmailConfirmation: boolean;
}

export interface RemoteSyncSnapshot {
  state: AppState;
  updatedAt: string;
}

export interface RemoteSyncFetchResult {
  session: SyncAccountSession;
  snapshot: RemoteSyncSnapshot | null;
}

export interface RemoteSyncPushResult {
  session: SyncAccountSession;
  remoteUpdatedAt: string;
}

interface SupabaseAuthResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string;
  };
}

function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, "");
}

function assertConfig(config: SupabaseSyncConfig): void {
  if (!normalizeBaseUrl(config.supabaseUrl)) {
    throw new Error("请先填写 Supabase 项目 URL。");
  }
  if (!config.supabaseAnonKey.trim()) {
    throw new Error("请先填写 Supabase anon key。");
  }
}

function buildSession(payload: SupabaseAuthResponse, fallbackEmail: string): SyncAccountSession {
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  const refreshToken = typeof payload.refresh_token === "string" ? payload.refresh_token : "";
  const tokenType = typeof payload.token_type === "string" ? payload.token_type : "bearer";
  const expiresIn = Number(payload.expires_in);
  const userId = typeof payload.user?.id === "string" ? payload.user.id : "";
  const email = typeof payload.user?.email === "string" && payload.user.email ? payload.user.email : fallbackEmail;

  if (!accessToken || !refreshToken || !userId || !email || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("认证成功但返回数据不完整，请检查 Supabase Auth 配置。");
  }

  return {
    accessToken,
    refreshToken,
    tokenType,
    expiresAt: new Date(Date.now() + Math.round(expiresIn) * 1000).toISOString(),
    userId,
    email,
  };
}

async function parseSupabaseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const messageCandidates = [payload.msg, payload.message, payload.error_description, payload.error, payload.hint, payload.details];
    const message = messageCandidates.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0);
    if (typeof message === "string") {
      return message;
    }
  } catch {
    // ignore
  }
  return `请求失败（${response.status} ${response.statusText}）`;
}

async function requestSupabaseAuth(
  config: SupabaseSyncConfig,
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<SupabaseAuthResponse> {
  assertConfig(config);
  const baseUrl = normalizeBaseUrl(config.supabaseUrl);
  const anonKey = config.supabaseAnonKey.trim();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response));
  }

  return (await response.json()) as SupabaseAuthResponse;
}

async function ensureFreshSession(config: SupabaseSyncConfig, session: SyncAccountSession): Promise<SyncAccountSession> {
  const expiresAt = Date.parse(session.expiresAt);
  if (Number.isFinite(expiresAt) && expiresAt > Date.now() + 30_000) {
    return session;
  }

  return refreshSupabaseSession(config, session);
}

function buildRestHeaders(config: SupabaseSyncConfig, session: SyncAccountSession): Record<string, string> {
  return {
    apikey: config.supabaseAnonKey.trim(),
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function signInSupabaseWithPassword(
  config: SupabaseSyncConfig,
  email: string,
  password: string,
): Promise<SyncAccountSession> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error("请先填写登录邮箱。");
  }
  if (!password.trim()) {
    throw new Error("请先填写登录密码。");
  }

  const payload = await requestSupabaseAuth(config, "/auth/v1/token?grant_type=password", {
    email: normalizedEmail,
    password,
  });
  return buildSession(payload, normalizedEmail);
}

export async function signUpSupabaseWithPassword(
  config: SupabaseSyncConfig,
  email: string,
  password: string,
): Promise<SupabaseSignUpResult> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error("请先填写注册邮箱。");
  }
  if (!password.trim()) {
    throw new Error("请先填写注册密码。");
  }

  const payload = await requestSupabaseAuth(config, "/auth/v1/signup", {
    email: normalizedEmail,
    password,
  });

  if (typeof payload.access_token === "string" && typeof payload.refresh_token === "string") {
    return {
      session: buildSession(payload, normalizedEmail),
      needsEmailConfirmation: false,
    };
  }

  return {
    session: null,
    needsEmailConfirmation: true,
  };
}

export async function refreshSupabaseSession(config: SupabaseSyncConfig, session: SyncAccountSession): Promise<SyncAccountSession> {
  const payload = await requestSupabaseAuth(config, "/auth/v1/token?grant_type=refresh_token", {
    refresh_token: session.refreshToken,
  });
  return buildSession(payload, session.email);
}

export async function fetchRemoteSyncSnapshot(
  config: SupabaseSyncConfig,
  session: SyncAccountSession,
): Promise<RemoteSyncFetchResult> {
  assertConfig(config);
  const nextSession = await ensureFreshSession(config, session);
  const baseUrl = normalizeBaseUrl(config.supabaseUrl);
  const query = new URLSearchParams({
    select: "state_json,updated_at",
    user_id: `eq.${nextSession.userId}`,
    limit: "1",
  });
  const response = await fetch(`${baseUrl}/rest/v1/${APP_SYNC_STATE_TABLE}?${query.toString()}`, {
    method: "GET",
    headers: buildRestHeaders(config, nextSession),
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response));
  }

  const rows = (await response.json()) as Array<{ state_json?: unknown; updated_at?: string }>;
  if (!Array.isArray(rows) || rows.length === 0 || rows[0].state_json === undefined) {
    return { session: nextSession, snapshot: null };
  }

  const stateRaw = rows[0].state_json;
  const state = deserializeState(typeof stateRaw === "string" ? stateRaw : JSON.stringify(stateRaw));
  return {
    session: nextSession,
    snapshot: {
      state,
      updatedAt: typeof rows[0].updated_at === "string" ? rows[0].updated_at : "",
    },
  };
}

export async function pushRemoteSyncSnapshot(
  config: SupabaseSyncConfig,
  session: SyncAccountSession,
  state: AppState,
  syncedAt: string = new Date().toISOString(),
): Promise<RemoteSyncPushResult> {
  assertConfig(config);
  const nextSession = await ensureFreshSession(config, session);
  const baseUrl = normalizeBaseUrl(config.supabaseUrl);

  const snapshot = deserializeState(serializeState(state));
  snapshot.sync.pendingOps = [];
  snapshot.sync.lastSyncedAt = syncedAt;

  const response = await fetch(`${baseUrl}/rest/v1/${APP_SYNC_STATE_TABLE}?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...buildRestHeaders(config, nextSession),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        user_id: nextSession.userId,
        state_json: JSON.parse(serializeState(snapshot)),
        updated_at: syncedAt,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response));
  }

  return {
    session: nextSession,
    remoteUpdatedAt: syncedAt,
  };
}
