import type { ReactNode } from "react";
import type { ActivityEntry, Reward } from "../../domain/model.js";
import type { DashboardDisplayMode, DashboardTab, LocalProfileSummary } from "../../persistence/storage.js";
import type { MetricCard } from "../app-types.js";
import { formatActivityKind } from "../app-helpers.js";
import { RewardPreviewPanel } from "../points/reward-preview-panel.js";
import { ProfileQuickMenu } from "./profile-quick-menu.js";

interface HomeScreenProps {
  profileName: string;
  heroSummary: string;
  starBalance: number;
  metricCards: MetricCard[];
  displayMode: DashboardDisplayMode;
  activeTab: DashboardTab;
  rewardsPreview: Reward[];
  recentActivity: ActivityEntry[];
  planBoard: ReactNode;
  habitBoard: ReactNode;
  profileMenuOpen: boolean;
  profiles: LocalProfileSummary[];
  activeProfileId: string | null;
  onProfileClick: () => void;
  onSwitchProfile: (profileId: string) => void;
  onOpenAddProfile: () => void;
  onOpenProfileManagement: () => void;
  onOpenSyncAccount: () => void;
  onLogoutProfile: () => void;
  onMetricCardAction: (card: MetricCard) => void;
  onTabChange: (tab: DashboardTab) => void;
  onOpenPointsCenter: () => void;
  onRedeemReward: (rewardId: string) => void;
}

// HomeScreen 只负责首页组合，具体功能实现留在各自模块中。
export function HomeScreen({
  profileName,
  heroSummary,
  starBalance,
  metricCards,
  displayMode,
  activeTab,
  rewardsPreview,
  recentActivity,
  planBoard,
  habitBoard,
  profileMenuOpen,
  profiles,
  activeProfileId,
  onProfileClick,
  onSwitchProfile,
  onOpenAddProfile,
  onOpenProfileManagement,
  onOpenSyncAccount,
  onLogoutProfile,
  onMetricCardAction,
  onTabChange,
  onOpenPointsCenter,
  onRedeemReward,
}: HomeScreenProps) {
  const usesTabs = displayMode === "tabs";
  const activeBoard = usesTabs ? (activeTab === "plans" ? planBoard : habitBoard) : planBoard;

  return (
    <>
      <header className="hero-panel">
        <div className="hero-copy">
          <p className="hero-kicker">本地优先学习助手</p>
          <h1>绣绣助手</h1>
          <p className="hero-summary">{heroSummary}</p>
        </div>
        <div className="hero-side">
          <div className="profile-menu-anchor">
            <button type="button" className="profile-chip" onClick={onProfileClick}>
              <span className="profile-avatar">{profileName.slice(0, 1)}</span>
              <span className="profile-meta">
                <strong>{profileName}</strong>
                <small>本地档案</small>
              </span>
              <span className="profile-chip-arrow">{profileMenuOpen ? "▴" : "▾"}</span>
            </button>
            <ProfileQuickMenu
              open={profileMenuOpen}
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSwitchProfile={onSwitchProfile}
              onOpenAddProfile={onOpenAddProfile}
              onOpenProfileManagement={onOpenProfileManagement}
              onOpenSyncAccount={onOpenSyncAccount}
              onLogout={onLogoutProfile}
            />
          </div>
          <div className="balance-chip">
            <span>星星余额</span>
            <strong>{starBalance}</strong>
            <small>默认本地保存，可在档案中开启同步</small>
          </div>
        </div>
      </header>

      <section className="metric-strip">
        {metricCards.map((card) => (
          <button key={card.id} type="button" className={`metric-card tone-${card.tone}`} onClick={() => onMetricCardAction(card)}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </button>
        ))}
      </section>

      <section className="home-panel">
        {usesTabs ? (
          <div className="tab-bar" role="tablist" aria-label="主页标签页">
            <button type="button" className={`tab-button${activeTab === "plans" ? " is-active" : ""}`} onClick={() => onTabChange("plans")}>
              学习计划
            </button>
            <button type="button" className={`tab-button${activeTab === "habits" ? " is-active" : ""}`} onClick={() => onTabChange("habits")}>
              行为习惯
            </button>
          </div>
        ) : null}
        <div className="surface-card">{activeBoard}</div>
      </section>

      <section className="dashboard-extras">
        <RewardPreviewPanel
          rewards={rewardsPreview}
          starBalance={starBalance}
          onOpenPointsCenter={onOpenPointsCenter}
          onRedeemReward={onRedeemReward}
        />
        <article className="extra-panel">
          <div className="extra-head">
            <div>
              <p className="eyebrow">动态</p>
              <h2>最近动态</h2>
            </div>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((entry) => (
                <div key={entry.id} className="activity-row">
                  <div>
                    <strong>{entry.message}</strong>
                    <small>{formatActivityKind(entry.kind)}</small>
                  </div>
                  <span>{entry.createdAt.replace("T", " ").slice(0, 16)}</span>
                </div>
              ))
            ) : (
              <div className="activity-row">
                <div>
                  <strong>暂时还没有动态</strong>
                  <small>系统</small>
                </div>
                <span>--</span>
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
