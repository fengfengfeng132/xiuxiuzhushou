import { useState } from "react";
import type { LocalProfileSummary } from "../../persistence/storage.js";

interface ProfileManagementScreenProps {
  profiles: LocalProfileSummary[];
  activeProfileId: string | null;
  accountEmail: string;
  search: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
  onOpenAddProfile: () => void;
  onOpenSyncAccount: () => void;
  onSwitchProfile: (profileId: string) => void;
  onRenameProfile: (profileId: string, profileName: string) => void;
  onClearProfileData: (profileId: string, profileName: string) => void;
  onDeleteProfile: (profileId: string, profileName: string) => void;
  onResetLocalData: () => void;
}

function formatCreatedAt(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return "--";
  }
  const date = new Date(parsed);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}/${month}/${day} ${hour}:${minute}`;
}

export function ProfileManagementScreen({
  profiles,
  activeProfileId,
  accountEmail,
  search,
  onSearchChange,
  onBack,
  onOpenAddProfile,
  onOpenSyncAccount,
  onSwitchProfile,
  onRenameProfile,
  onClearProfileData,
  onDeleteProfile,
  onResetLocalData,
}: ProfileManagementScreenProps) {
  const [openActionProfileId, setOpenActionProfileId] = useState<string | null>(null);
  const normalizedKeyword = search.trim().toLowerCase();
  const filteredProfiles =
    normalizedKeyword.length === 0
      ? profiles
      : profiles.filter((profile) => profile.name.toLowerCase().includes(normalizedKeyword) || accountEmail.toLowerCase().includes(normalizedKeyword));

  return (
    <div className="profile-management-page">
      <header className="profile-management-hero">
        <button type="button" className="profile-management-back-button" onClick={onBack} aria-label="返回上一页">
          ←
        </button>
        <div className="profile-management-hero-copy">
          <h1>档案管理</h1>
          <p>管理学习档案和用户账户</p>
        </div>
        <div className="profile-management-hero-actions">
          <button type="button" className="profile-management-sync-button" onClick={onOpenSyncAccount}>
            同步设置
          </button>
          <button type="button" className="profile-management-add-button" onClick={onOpenAddProfile}>
            添加档案
          </button>
        </div>
      </header>

      <section className="profile-management-search-card">
        <label className="profile-management-search-field" aria-label="搜索档案">
          <span>⌕</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="搜索档案名称或邮箱..." />
        </label>
        <p>{profiles.length} 个档案 | 1 个账户</p>
      </section>

      <section className="profile-management-table">
        <div className="profile-management-table-head">
          <span>档案信息</span>
          <span>账户邮箱</span>
          <span>类型</span>
          <span>创建时间</span>
          <span>操作</span>
        </div>
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const typeLabel = isActive ? "主要档案" : "次要档案";
            return (
              <article key={profile.id} className="profile-management-row">
                <div className="profile-management-info-cell">
                  <span
                    className="profile-management-avatar"
                    style={profile.avatarImage ? { backgroundImage: `url(${profile.avatarImage})` } : { backgroundColor: profile.avatarColor }}
                  >
                    {!profile.avatarImage ? profile.name.slice(0, 1) : null}
                  </span>
                  <div>
                    <strong>{profile.name}</strong>
                    <small>{isActive ? "默认档案" : "可切换档案"}</small>
                  </div>
                </div>
                <span className="profile-management-cell">{accountEmail || "未设置邮箱"}</span>
                <span className="profile-management-cell">{typeLabel}</span>
                <span className="profile-management-cell">{formatCreatedAt(profile.createdAt)}</span>
                <div className="profile-management-actions-cell">
                  <button
                    type="button"
                    className="profile-management-action-toggle"
                    onClick={() => setOpenActionProfileId((current) => (current === profile.id ? null : profile.id))}
                    aria-label="打开档案操作菜单"
                  >
                    ⋯
                  </button>
                  {openActionProfileId === profile.id ? (
                    <div className="profile-management-action-menu">
                      <button
                        type="button"
                        onClick={() => {
                          const nextName = window.prompt("请输入新的档案名称：", profile.name);
                          setOpenActionProfileId(null);
                          if (!nextName) {
                            return;
                          }
                          onRenameProfile(profile.id, nextName);
                        }}
                      >
                        编辑档案
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenActionProfileId(null);
                          onClearProfileData(profile.id, profile.name);
                        }}
                      >
                        清空数据
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => {
                          setOpenActionProfileId(null);
                          onDeleteProfile(profile.id, profile.name);
                        }}
                      >
                        删除档案
                      </button>
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionProfileId(null);
                            onSwitchProfile(profile.id);
                          }}
                        >
                          切换到此档案
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <article className="profile-management-empty-row">
            <p>未找到匹配的档案，请调整搜索词。</p>
          </article>
        )}
      </section>

      <section className="profile-management-danger-zone">
        <div className="profile-management-danger-copy">
          <h2>危险操作</h2>
          <p>重置会清空当前本地档案学习数据并恢复默认状态，请谨慎操作。</p>
        </div>
        <button type="button" className="profile-management-reset-button" onClick={onResetLocalData}>
          重置本地数据
        </button>
      </section>
    </div>
  );
}
