import type { SyncAccountSession, SyncAccountSettings } from "../../persistence/sync-storage.js";

interface SyncAccountModalProps {
  open: boolean;
  settings: SyncAccountSettings;
  password: string;
  session: SyncAccountSession | null;
  deviceId: string;
  pendingOpsCount: number;
  isBusy: boolean;
  statusMessage: string;
  onClose: () => void;
  onUpdateSettings: (field: keyof SyncAccountSettings, value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onRefreshSession: () => void;
  onPush: () => void;
  onPull: () => void;
  onBidirectionalSync: () => void;
  onSignOut: () => void;
}

function formatExpiry(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return "未知";
  }
  return new Date(parsed).toLocaleString();
}

export function SyncAccountModal({
  open,
  settings,
  password,
  session,
  deviceId,
  pendingOpsCount,
  isBusy,
  statusMessage,
  onClose,
  onUpdateSettings,
  onPasswordChange,
  onSignIn,
  onSignUp,
  onRefreshSession,
  onPush,
  onPull,
  onBidirectionalSync,
  onSignOut,
}: SyncAccountModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="跨设备同步设置">
      <article className="modal-card sync-modal-card">
        <header className="modal-head">
          <div>
            <h2>跨设备同步</h2>
            <p>使用 Supabase 账号把本地学习数据同步到其他设备。</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sync-status-strip">
          <div>
            <strong>设备 ID</strong>
            <small>{deviceId}</small>
          </div>
          <div>
            <strong>待同步操作</strong>
            <small>{pendingOpsCount}</small>
          </div>
        </div>

        <div className="field-block">
          <span>Supabase URL</span>
          <input
            type="text"
            value={settings.supabaseUrl}
            onChange={(event) => onUpdateSettings("supabaseUrl", event.target.value)}
            placeholder="https://xxxx.supabase.co"
          />
        </div>

        <div className="field-block">
          <span>Anon Key</span>
          <textarea
            value={settings.supabaseAnonKey}
            onChange={(event) => onUpdateSettings("supabaseAnonKey", event.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            rows={3}
          />
        </div>

        <div className="sync-auth-grid">
          <div className="field-block">
            <span>邮箱</span>
            <input
              type="email"
              value={settings.email}
              onChange={(event) => onUpdateSettings("email", event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field-block">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="登录或注册密码"
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="sync-auth-actions">
          <button type="button" className="modal-submit modal-submit-primary" disabled={isBusy} onClick={onSignIn}>
            登录
          </button>
          <button type="button" className="modal-cancel" disabled={isBusy} onClick={onSignUp}>
            注册
          </button>
          <button type="button" className="modal-cancel" disabled={isBusy || !session} onClick={onRefreshSession}>
            刷新会话
          </button>
          <button type="button" className="modal-cancel" disabled={isBusy || !session} onClick={onSignOut}>
            退出
          </button>
        </div>

        <section className="sync-session-card">
          <h3>会话状态</h3>
          {session ? (
            <>
              <p>账号：{session.email}</p>
              <p>用户 ID：{session.userId}</p>
              <p>过期时间：{formatExpiry(session.expiresAt)}</p>
            </>
          ) : (
            <p>当前未登录。</p>
          )}
        </section>

        <div className="sync-run-actions">
          <button type="button" className="modal-submit modal-submit-primary" disabled={isBusy || !session} onClick={onBidirectionalSync}>
            双向同步
          </button>
          <button type="button" className="modal-cancel" disabled={isBusy || !session} onClick={onPush}>
            上传本地到云端
          </button>
          <button type="button" className="modal-cancel" disabled={isBusy || !session} onClick={onPull}>
            下载云端到本地
          </button>
        </div>

        <p className="sync-status-message">{statusMessage}</p>
      </article>
    </div>
  );
}
