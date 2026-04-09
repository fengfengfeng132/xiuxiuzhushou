import type { KeyboardEvent } from "react";
import type { LocalProfileSummary } from "../../persistence/storage.js";

interface ProfileSwitcherModalProps {
  open: boolean;
  activeProfileId: string | null;
  profiles: LocalProfileSummary[];
  draftName: string;
  maxProfiles: number;
  canCreateMoreProfiles: boolean;
  onClose: () => void;
  onUpdateDraftName: (value: string) => void;
  onSubmitName: () => void;
  onSwitchProfile: (profileId: string) => void;
  onLogout: () => void;
  onOpenSyncSettings: () => void;
}

export function ProfileSwitcherModal({
  open,
  activeProfileId,
  profiles,
  draftName,
  maxProfiles,
  canCreateMoreProfiles,
  onClose,
  onUpdateDraftName,
  onSubmitName,
  onSwitchProfile,
  onLogout,
  onOpenSyncSettings,
}: ProfileSwitcherModalProps) {
  if (!open) {
    return null;
  }

  const activeProfile = activeProfileId ? profiles.find((profile) => profile.id === activeProfileId) ?? null : null;
  const remainingProfiles = Math.max(0, maxProfiles - profiles.length);

  function handleNameInputEnter(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    if (!canCreateMoreProfiles || draftName.trim().length === 0) {
      return;
    }
    onSubmitName();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="用户登录与档案切换">
      <article className="modal-card profile-switcher-modal-card">
        <header className="modal-head">
          <div>
            <h2>用户登录与档案切换</h2>
            <p>登录后可创建最多 5 个本地档案，并在它们之间快速切换。</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <section className="profile-switcher-status">
          <strong>{activeProfile ? `当前档案：${activeProfile.name}` : "当前未登录"}</strong>
          <small>{activeProfile ? "可创建新档案或切换到其他档案。" : "请输入名字后点击登录创建档案。"}</small>
        </section>

        <section className="profile-switcher-create">
          <div className="field-block">
            <span>{activeProfile ? "新档案名称" : "登录名称"}</span>
            <div className="profile-switcher-create-row">
              <input
                type="text"
                value={draftName}
                placeholder={activeProfile ? "例如：二宝" : "例如：真真"}
                onChange={(event) => onUpdateDraftName(event.target.value)}
                onKeyDown={handleNameInputEnter}
                maxLength={16}
              />
              <button
                type="button"
                className="modal-submit modal-submit-primary"
                disabled={!canCreateMoreProfiles || draftName.trim().length === 0}
                onClick={onSubmitName}
              >
                {activeProfile ? "创建并切换" : "登录"}
              </button>
            </div>
          </div>
          <p className="profile-switcher-limit">
            {canCreateMoreProfiles ? `还可创建 ${remainingProfiles} 个档案（最多 ${maxProfiles} 个）。` : `已达到最多 ${maxProfiles} 个档案。`}
          </p>
        </section>

        <section className="profile-switcher-list-wrap">
          <h3>本地档案</h3>
          {profiles.length > 0 ? (
            <ul className="profile-switcher-list">
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                return (
                  <li key={profile.id} className={`profile-switcher-item${isActive ? " is-active" : ""}`}>
                    <div className="profile-switcher-info">
                      <span className="profile-switcher-avatar">{profile.name.slice(0, 1)}</span>
                      <div className="profile-switcher-meta">
                        <strong>{profile.name}</strong>
                        <small>{isActive ? "当前档案" : "本地档案"}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={isActive ? "modal-cancel" : "modal-submit modal-submit-primary"}
                      disabled={isActive}
                      onClick={() => onSwitchProfile(profile.id)}
                    >
                      {isActive ? "当前使用中" : "切换"}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="profile-switcher-empty">还没有档案，先登录创建一个吧。</p>
          )}
        </section>

        <div className="profile-switcher-footer">
          <button type="button" className="modal-cancel" onClick={onOpenSyncSettings}>
            跨设备同步
          </button>
          <button type="button" className="modal-cancel" disabled={!activeProfile} onClick={onLogout}>
            退出登录
          </button>
        </div>
      </article>
    </div>
  );
}
