import type { LocalProfileSummary } from "../../persistence/storage.js";

interface ProfileQuickMenuProps {
  open: boolean;
  profiles: LocalProfileSummary[];
  activeProfileId: string | null;
  onSwitchProfile: (profileId: string) => void;
  onOpenAddProfile: () => void;
  onOpenProfileManagement: () => void;
  onOpenSyncAccount: () => void;
  onLogout: () => void;
}

export function ProfileQuickMenu({
  open,
  profiles,
  activeProfileId,
  onSwitchProfile,
  onOpenAddProfile,
  onOpenProfileManagement,
  onOpenSyncAccount,
  onLogout,
}: ProfileQuickMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="profile-quick-menu">
      <div className="profile-quick-menu-head">
        <strong>切换用户</strong>
      </div>
      <div className="profile-quick-menu-list">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          return (
            <button key={profile.id} type="button" className="profile-quick-menu-user" onClick={() => onSwitchProfile(profile.id)}>
              <span
                className="profile-quick-menu-avatar"
                style={profile.avatarImage ? { backgroundImage: `url(${profile.avatarImage})` } : { backgroundColor: profile.avatarColor }}
              >
                {!profile.avatarImage ? profile.name.slice(0, 1) : null}
              </span>
              <span>{profile.name}</span>
              {isActive ? <span className="profile-quick-menu-check">✓</span> : null}
            </button>
          );
        })}
      </div>
      <div className="profile-quick-menu-foot">
        <button type="button" onClick={onOpenAddProfile}>
          添加新用户
        </button>
        <button type="button" onClick={onOpenProfileManagement}>
          管理用户
        </button>
        <button type="button" onClick={onOpenSyncAccount}>
          跨设备同步
        </button>
        <button type="button" className="is-danger" onClick={onLogout}>
          退出登录
        </button>
      </div>
    </div>
  );
}
