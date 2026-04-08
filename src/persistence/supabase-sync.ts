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

export interface SupabaseInitializationCheckItem {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface SupabaseInitializationCheckResult {
  session: SyncAccountSession | null;
  checks: SupabaseInitializationCheckItem[];
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

function buildAnonHeaders(config: SupabaseSyncConfig): Record<string, string> {
  const anonKey = config.supabaseAnonKey.trim();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

export async function runSupabaseInitializationCheck(
  config: SupabaseSyncConfig,
  session: SyncAccountSession | null,
): Promise<SupabaseInitializationCheckResult> {
  const checks: SupabaseInitializationCheckItem[] = [];
  let nextSession: SyncAccountSession | null = session;
  const trimmedUrl = normalizeBaseUrl(config.supabaseUrl);
  const trimmedAnonKey = config.supabaseAnonKey.trim();

  if (!trimmedUrl) {
    checks.push({
      id: "config-url",
      label: "Supabase URL",
      status: "fail",
      message: "未填写 Supabase URL。",
    });
    return { session: nextSession, checks };
  }

  checks.push({
    id: "config-url",
    label: "Supabase URL",
    status: "pass",
    message: "URL 已填写。",
  });

  if (!trimmedAnonKey) {
    checks.push({
      id: "config-anon-key",
      label: "Anon Key",
      status: "fail",
      message: "未填写 anon key。",
    });
    return { session: nextSession, checks };
  }

  checks.push({
    id: "config-anon-key",
    label: "Anon Key",
    status: "pass",
    message: "anon key 已填写。",
  });

  let authSettingsPayload: Record<string, unknown> | null = null;
  try {
    const authSettingsResponse = await fetch(`${trimmedUrl}/auth/v1/settings`, {
      method: "GET",
      headers: buildAnonHeaders(config),
    });
    if (!authSettingsResponse.ok) {
      checks.push({
        id: "auth-settings",
        label: "项目连通性",
        status: "fail",
        message: await parseSupabaseError(authSettingsResponse),
      });
      return { session: nextSession, checks };
    }

    authSettingsPayload = (await authSettingsResponse.json()) as Record<string, unknown>;
    checks.push({
      id: "auth-settings",
      label: "项目连通性",
      status: "pass",
      message: "Supabase 项目可访问。",
    });
  } catch (error) {
    checks.push({
      id: "auth-settings",
      label: "项目连通性",
      status: "fail",
      message: error instanceof Error ? error.message : "请求 Supabase 失败。",
    });
    return { session: nextSession, checks };
  }

  const signupsDisabled = authSettingsPayload?.disable_signup === true;
  checks.push({
    id: "auth-signup",
    label: "注册策略",
    status: signupsDisabled ? "warn" : "pass",
    message: signupsDisabled ? "项目已禁用邮箱注册，请使用已有账号登录。" : "邮箱注册可用。",
  });

  if (!nextSession) {
    checks.push({
      id: "session",
      label: "登录会话",
      status: "warn",
      message: "当前未登录，已跳过云表权限检查。",
    });
    return { session: nextSession, checks };
  }

  try {
    nextSession = await ensureFreshSession(config, nextSession);
    checks.push({
      id: "session",
      label: "登录会话",
      status: "pass",
      message: `已登录 ${nextSession.email}`,
    });
  } catch (error) {
    checks.push({
      id: "session",
      label: "登录会话",
      status: "fail",
      message: error instanceof Error ? error.message : "会话刷新失败。",
    });
    return { session: null, checks };
  }

  try {
    const query = new URLSearchParams({
      select: "user_id,updated_at",
      user_id: `eq.${nextSession.userId}`,
      limit: "1",
    });
    const tableResponse = await fetch(`${trimmedUrl}/rest/v1/${APP_SYNC_STATE_TABLE}?${query.toString()}`, {
      method: "GET",
      headers: buildRestHeaders(config, nextSession),
    });
    if (!tableResponse.ok) {
      checks.push({
        id: "sync-table",
        label: "同步表权限",
        status: "fail",
        message: await parseSupabaseError(tableResponse),
      });
      return { session: nextSession, checks };
    }

    checks.push({
      id: "sync-table",
      label: "同步表权限",
      status: "pass",
      message: `${APP_SYNC_STATE_TABLE} 可读，RLS 通过。`,
    });
  } catch (error) {
    checks.push({
      id: "sync-table",
      label: "同步表权限",
      status: "fail",
      message: error instanceof Error ? error.message : "检查同步表失败。",
    });
  }

  return { session: nextSession, checks };
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
