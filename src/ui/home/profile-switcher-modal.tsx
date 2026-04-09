import { useEffect, useState, type KeyboardEvent } from "react";
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
  onDeleteProfile: (profileId: string, profileName: string) => void;
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
  onDeleteProfile,
  onLogout,
  onOpenSyncSettings,
}: ProfileSwitcherModalProps) {
  const [nameStepOpen, setNameStepOpen] = useState(false);
  const activeProfile = activeProfileId ? profiles.find((profile) => profile.id === activeProfileId) ?? null : null;
  const remainingProfiles = Math.max(0, maxProfiles - profiles.length);
  const triggerLabel = activeProfile ? "新建其他档案" : "注册";
  const submitLabel = activeProfile ? "创建并切换" : "完成注册并登录";
  const nameFieldLabel = activeProfile ? "新档案名称" : "用户名";
  const placeholder = activeProfile ? "例如：二宝" : "例如：真真";

  useEffect(() => {
    if (!open) {
      setNameStepOpen(false);
      return;
    }
    setNameStepOpen(false);
  }, [open, activeProfileId]);

  if (!open) {
    return null;
  }

  function handleNameInputEnter(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    if (!canCreateMoreProfiles || draftName.trim().length === 0) {
      return;
    }
    onSubmitName();
    setNameStepOpen(false);
  }

  function handleOpenNameStep(): void {
    if (!canCreateMoreProfiles) {
      return;
    }
    setNameStepOpen(true);
  }

  function handleCancelNameStep(): void {
    onUpdateDraftName("");
    setNameStepOpen(false);
  }

  function handleSubmitName(): void {
    if (!canCreateMoreProfiles || draftName.trim().length === 0) {
      return;
    }
    onSubmitName();
    setNameStepOpen(false);
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
          {nameStepOpen ? (
            <div className="field-block">
              <span>{nameFieldLabel}</span>
              <div className="profile-switcher-create-row">
                <input
                  type="text"
                  value={draftName}
                  placeholder={placeholder}
                  onChange={(event) => onUpdateDraftName(event.target.value)}
                  onKeyDown={handleNameInputEnter}
                  maxLength={16}
                />
                <button
                  type="button"
                  className="modal-submit modal-submit-primary"
                  disabled={!canCreateMoreProfiles || draftName.trim().length === 0}
                  onClick={handleSubmitName}
                >
                  {submitLabel}
                </button>
                <button type="button" className="modal-cancel" onClick={handleCancelNameStep}>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="modal-submit modal-submit-primary profile-switcher-trigger" disabled={!canCreateMoreProfiles} onClick={handleOpenNameStep}>
              {triggerLabel}
            </button>
          )}
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
                    <div className="profile-switcher-actions">
                      <button
                        type="button"
                        className={isActive ? "modal-cancel" : "modal-submit modal-submit-primary"}
                        disabled={isActive}
                        onClick={() => onSwitchProfile(profile.id)}
                      >
                        {isActive ? "当前使用中" : "切换"}
                      </button>
                      <button
                        type="button"
                        className="modal-cancel profile-switcher-delete-button"
                        onClick={() => onDeleteProfile(profile.id, profile.name)}
                      >
                        删除
                      </button>
                    </div>
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
