import type { CSSProperties, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  PET_RECYCLE_REFUND_STARS,
  PET_CATALOG,
  PET_INTERACTION_ACTIONS,
  PET_LEVEL_TIERS,
  type OwnedPet,
  type PetDefinition,
  type PetLevelTier,
} from "../../domain/model.js";
import { buildPetStatusCopy, createPetNeedCards } from "../app-helpers.js";
import { getPetArtSrc } from "./pet-art.js";

interface AnimatedPetVideoConfig {
  idle: string[];
  feed?: string[];
}

const ANIMATED_PET_VIDEO_CONFIG_BY_ID: Partial<Record<string, AnimatedPetVideoConfig>> = {
  pet_corgi: { idle: ["/assets/corgi.mp4", "/assets/corgi.webm"] },
  pet_fox: {
    idle: ["/assets/fox.mp4", "/assets/fox.webm"],
    feed: ["/assets/fox-feed.mp4", "/assets/fox-feed.webm"],
  },
};

interface PetCenterScreenProps {
  starBalance: number;
  ownedPets: OwnedPet[];
  ownedPetIds: Set<string>;
  activePetCompanion: OwnedPet | null;
  activePetDefinition: PetDefinition | null;
  activePetLevel: PetLevelTier | null;
  onBack: () => void;
  onAdoptPet: (definitionId: string) => void;
  onSwitchPet: (definitionId: string) => void;
  onRecyclePet: (definitionId: string) => void;
  onInteract: (actionId: "feed" | "bathe" | "park" | "sleep") => void;
}

function getAnimatedPetVideoConfig(definitionId: string): AnimatedPetVideoConfig | null {
  return ANIMATED_PET_VIDEO_CONFIG_BY_ID[definitionId] ?? null;
}

function isFullRangeStageVideo(definitionId: string): boolean {
  return definitionId === "pet_fox";
}

interface PetFigureRenderOptions {
  loopOverride?: boolean;
  onVideoEnded?: () => void;
  videoKey?: string;
  videoSourcesOverride?: string[] | null;
}

interface PetFigureMediaProps extends PetFigureRenderOptions {
  definition: PetDefinition;
  variant: "card" | "stage" | "roster";
}

function getVideoMimeTypeFromPath(path: string): string | undefined {
  if (path.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (path.endsWith(".webm")) {
    return "video/webm";
  }
  return undefined;
}

function PetFigureMedia({
  definition,
  variant,
  loopOverride,
  onVideoEnded,
  videoKey,
  videoSourcesOverride,
}: PetFigureMediaProps): ReactElement {
  const videoConfig = getAnimatedPetVideoConfig(definition.id);
  const videoSources = videoSourcesOverride ?? videoConfig?.idle ?? null;
  const imageSrc = getPetArtSrc(definition.id);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackProbeTimerRef = useRef<number | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const canUseVideo = Boolean(videoConfig && videoSources && videoSources.length > 0 && !videoFailed);

  const tryPlayVideo = () => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }
    videoElement.setAttribute("playsinline", "true");
    videoElement.setAttribute("webkit-playsinline", "true");
    videoElement.playsInline = true;
    videoElement.defaultMuted = true;
    videoElement.muted = true;
    const playResult = videoElement.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult
        .then(() => setPlaybackBlocked(false))
        .catch(() => setPlaybackBlocked(true));
    }

    if (playbackProbeTimerRef.current !== null) {
      window.clearTimeout(playbackProbeTimerRef.current);
    }
    playbackProbeTimerRef.current = window.setTimeout(() => {
      const probeTarget = videoRef.current;
      setPlaybackBlocked(Boolean(probeTarget && probeTarget.paused));
    }, 260);
  };

  const resolvedVideoSources = videoSources ?? [];
  const videoSourceKey = resolvedVideoSources.join("|");
  const shouldLoop = loopOverride ?? true;

  useEffect(() => {
    setVideoFailed(false);
    setPlaybackBlocked(false);
    if (playbackProbeTimerRef.current !== null) {
      window.clearTimeout(playbackProbeTimerRef.current);
      playbackProbeTimerRef.current = null;
    }
  }, [videoSourceKey]);

  useEffect(() => {
    if (!canUseVideo) {
      return;
    }
    tryPlayVideo();
  }, [canUseVideo, videoSourceKey, shouldLoop]);

  useEffect(() => {
    if (!playbackBlocked || typeof window === "undefined") {
      return;
    }
    const unlockPlayback = () => {
      tryPlayVideo();
    };
    window.addEventListener("pointerdown", unlockPlayback, { passive: true });
    window.addEventListener("touchend", unlockPlayback, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlockPlayback);
      window.removeEventListener("touchend", unlockPlayback);
    };
  }, [playbackBlocked, videoSourceKey]);

  useEffect(() => {
    if (!canUseVideo || typeof window === "undefined") {
      return;
    }
    const unlockPlayback = () => {
      const target = videoRef.current;
      if (target && target.paused) {
        tryPlayVideo();
      }
    };
    window.addEventListener("pointerdown", unlockPlayback, { passive: true });
    window.addEventListener("touchstart", unlockPlayback, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlockPlayback);
      window.removeEventListener("touchstart", unlockPlayback);
    };
  }, [canUseVideo, videoSourceKey]);

  useEffect(
    () => () => {
      if (playbackProbeTimerRef.current !== null) {
        window.clearTimeout(playbackProbeTimerRef.current);
      }
    },
    [],
  );

  if (canUseVideo) {
    const videoClassName = `pet-art-video pet-art-video-${variant}${variant === "stage" && isFullRangeStageVideo(definition.id) ? " pet-art-video-stage-full-range" : ""}`;
    return (
      <video
        ref={videoRef}
        key={videoKey ?? `${definition.id}-${variant}-${resolvedVideoSources.join("|")}`}
        className={videoClassName}
        poster={imageSrc ?? undefined}
        autoPlay
        loop={shouldLoop}
        muted
        playsInline
        aria-hidden="true"
        preload="auto"
        onCanPlay={tryPlayVideo}
        onLoadedData={tryPlayVideo}
        onPlaying={() => setPlaybackBlocked(false)}
        onEnded={onVideoEnded}
        onError={() => setVideoFailed(true)}
      >
        {resolvedVideoSources.map((sourcePath) => (
          <source key={sourcePath} src={sourcePath} type={getVideoMimeTypeFromPath(sourcePath)} />
        ))}
      </video>
    );
  }

  if (imageSrc) {
    return (
      <img
        className={`pet-art-image pet-art-image-${variant}`}
        src={imageSrc}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <span className={`pet-art-fallback pet-art-fallback-${variant}`} aria-hidden="true">
      {definition.emoji}
    </span>
  );
}

// Pets module isolates the pet center so future work can extend care loops without reopening AppShell.
export function PetCenterScreen({
  starBalance,
  ownedPets,
  ownedPetIds,
  activePetCompanion,
  activePetDefinition,
  activePetLevel,
  onBack,
  onAdoptPet,
  onSwitchPet,
  onRecyclePet,
  onInteract,
}: PetCenterScreenProps) {
  const interactionCost = 1;
  const canInteract = starBalance >= interactionCost;
  const [feedPlaybackToken, setFeedPlaybackToken] = useState(0);
  const [isFeedVideoPlaying, setIsFeedVideoPlaying] = useState(false);
  const [isPetReacting, setIsPetReacting] = useState(false);
  const previousInteractionAtRef = useRef<string | null>(activePetCompanion?.lastInteractionAt ?? null);
  const activeInteractionAt = activePetCompanion?.lastInteractionAt ?? null;
  const activeInteractionId = activePetCompanion?.lastInteractionId ?? null;
  const interactionMotionClass = isPetReacting && activeInteractionId ? ` is-reacting is-reacting-${activeInteractionId}` : "";

  useEffect(() => {
    if (!activePetCompanion || !activePetDefinition) {
      previousInteractionAtRef.current = null;
      setIsFeedVideoPlaying(false);
      setIsPetReacting(false);
      return;
    }

    if (activeInteractionAt && activeInteractionAt !== previousInteractionAtRef.current) {
      setIsPetReacting(true);
      const hasFeedVideo = Boolean(getAnimatedPetVideoConfig(activePetDefinition.id)?.feed?.length);
      if (activeInteractionId === "feed" && hasFeedVideo) {
        setIsFeedVideoPlaying(true);
        setFeedPlaybackToken((current) => current + 1);
      } else {
        setIsFeedVideoPlaying(false);
      }
      previousInteractionAtRef.current = activeInteractionAt;
      const timer = window.setTimeout(() => setIsPetReacting(false), 760);
      return () => window.clearTimeout(timer);
    }

    previousInteractionAtRef.current = activeInteractionAt;
    return;
  }, [activeInteractionAt, activeInteractionId, activePetCompanion?.definitionId, activePetDefinition?.id]);

  if (!activePetCompanion || !activePetDefinition || !activePetLevel) {
    return (
      <div className="pet-page">
        <header className="pet-topbar">
          <button type="button" className="pet-back-button" onClick={onBack} aria-label="返回首页">
            ←
          </button>
          <div className="pet-topbar-copy">
            <h1>电子宠物中心</h1>
            <p>花星星领养一个学习小伙伴。</p>
          </div>
          <div className="pet-balance-pill">{starBalance} 颗星星</div>
        </header>

        <div className="pet-empty-shell">
          <section className="pet-empty-card">
            <h2>选择第一只宠物</h2>
            <p>每只宠物都有自己的风格和花费，领养后就能开始互动。</p>
          </section>

          <section className="pet-shop-grid">
            {PET_CATALOG.map((definition) => {
              const canAdopt = starBalance >= definition.cost;
              const cardStyle = {
                "--pet-accent": definition.accent,
                "--pet-accent-soft": definition.accentSoft,
              } as CSSProperties;
              const cardFigureClassName = `pet-card-figure${getAnimatedPetVideoConfig(definition.id) ? " pet-media-transparent" : ""}`;

              return (
                <article key={definition.id} className="pet-shop-card" style={cardStyle}>
                  <div className={cardFigureClassName} aria-hidden="true">
                    <PetFigureMedia definition={definition} variant="card" />
                  </div>
                  <div className="pet-card-copy">
                    <h3>{definition.name}</h3>
                    <p>{definition.description}</p>
                  </div>
                  <div className="pet-card-foot">
                    <span className="pet-card-cost">{definition.cost} 颗星星</span>
                    <button type="button" className="pet-card-button" onClick={() => onAdoptPet(definition.id)} disabled={!canAdopt}>
                      {canAdopt ? "领养" : "星星不足"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    );
  }

  const heroStyle = {
    "--pet-accent": activePetDefinition.accent,
    "--pet-accent-soft": activePetDefinition.accentSoft,
  } as CSSProperties;
  const activePetVideoConfig = getAnimatedPetVideoConfig(activePetDefinition.id);
  const stageVideoSources = isFeedVideoPlaying && activePetVideoConfig?.feed ? activePetVideoConfig.feed : activePetVideoConfig?.idle ?? null;
  const isStageFeedVideo = Boolean(isFeedVideoPlaying && activePetVideoConfig?.feed?.length);
  const stageVideoKey = isStageFeedVideo ? `feed-${activePetDefinition.id}-${feedPlaybackToken}` : `idle-${activePetDefinition.id}`;
  const needCards = createPetNeedCards(activePetCompanion);
  const statusCopy = buildPetStatusCopy(activePetCompanion, activePetDefinition);
  const stageFigureClassName = `pet-stage-figure${activePetVideoConfig ? " pet-media-transparent" : ""}${isFullRangeStageVideo(activePetDefinition.id) ? " pet-stage-figure-full-range" : ""}${interactionMotionClass}`;

  return (
    <div className="pet-page">
      <header className="pet-topbar">
        <button type="button" className="pet-back-button" onClick={onBack} aria-label="返回首页">
          ←
        </button>
        <div className="pet-topbar-copy">
          <h1>电子宠物中心</h1>
          <p>让陪伴宠物和你的学习节奏一起成长。</p>
        </div>
        <div className="pet-balance-pill">{starBalance} 颗星星</div>
      </header>

      <div className="pet-layout">
        <div className="pet-main-column">
          <section className="pet-showcase" style={heroStyle}>
            <div className="pet-showcase-head">
              <div>
                <span className="pet-level-chip">
                  等级 {activePetLevel.level} · {activePetLevel.title}
                </span>
                <h2>{activePetDefinition.name}</h2>
              </div>
              <span className="pet-species-chip">{activePetDefinition.species}</span>
            </div>
            <div className="pet-stage">
              <div className="pet-stage-frame">
                <div className={stageFigureClassName} aria-hidden="true">
                  <PetFigureMedia
                    definition={activePetDefinition}
                    variant="stage"
                    videoKey={stageVideoKey}
                    videoSourcesOverride={stageVideoSources}
                    loopOverride={!isStageFeedVideo}
                    onVideoEnded={isStageFeedVideo ? () => setIsFeedVideoPlaying(false) : undefined}
                  />
                </div>
                <p>{statusCopy}</p>
              </div>
            </div>
          </section>

          <section className="pet-need-grid">
            {needCards.map((card) => (
              <article key={card.id} className="pet-need-card">
                <div className="pet-need-head">
                  <span>
                    {card.icon} {card.title}
                  </span>
                  <strong>{card.value}/100</strong>
                </div>
                <p>{card.helper}</p>
                <div className="pet-need-track">
                  <span className="pet-need-fill" style={{ width: `${card.value}%` }} />
                </div>
              </article>
            ))}
          </section>

          <p className={`pet-interaction-note${canInteract ? "" : " is-warning"}`}>
            {canInteract ? `互动每次消耗 ${interactionCost} 星星。` : `星星不足，互动需要 ${interactionCost} 星星。`}
          </p>
          <section className="pet-action-grid">
            {PET_INTERACTION_ACTIONS.map((action) => {
              const actionStyle = {
                "--pet-action-accent": action.accent,
                "--pet-action-soft": action.accentSoft,
              } as CSSProperties;

              return (
                <button
                  key={action.id}
                  type="button"
                  className={`pet-action-card is-${action.id}${isPetReacting && activeInteractionId === action.id ? " is-triggered" : ""}`}
                  style={actionStyle}
                  onClick={() => onInteract(action.id)}
                  disabled={!canInteract}
                >
                  <span className="pet-action-badge">{action.badge}</span>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                  <span className="pet-action-cost">消耗 {interactionCost} 星星</span>
                </button>
              );
            })}
          </section>
        </div>

        <aside className="pet-side-column">
          <section className="pet-growth-card">
            <div className="pet-side-head">
              <h3>成长</h3>
              <span>{activePetCompanion.intimacy}</span>
            </div>
            <p>当前亲密度</p>
            <div className="pet-level-list">
              {PET_LEVEL_TIERS.map((tier) => {
                const isReached = activePetCompanion.intimacy >= tier.threshold;
                const isCurrent = activePetLevel.level === tier.level;
                return (
                  <article key={tier.level} className={`pet-level-row${isReached ? " is-reached" : ""}${isCurrent ? " is-current" : ""}`}>
                    <div>
                      <strong>
                        等级 {tier.level} · {tier.title}
                      </strong>
                      <p>{tier.description}</p>
                    </div>
                    <span>{tier.threshold}+</span>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="pet-roster-card">
            <div className="pet-side-head">
              <h3>宠物列表</h3>
              <span>
                {ownedPets.length}/{PET_CATALOG.length}
              </span>
            </div>
            <div className="pet-roster-list">
              {PET_CATALOG.map((definition) => {
                const isOwned = ownedPetIds.has(definition.id);
                const isActive = activePetDefinition.id === definition.id;
                const companion = ownedPets.find((item) => item.definitionId === definition.id);
                const canAdopt = starBalance >= definition.cost;
                const itemStyle = {
                  "--pet-accent": definition.accent,
                  "--pet-accent-soft": definition.accentSoft,
                } as CSSProperties;
                const rosterAvatarClassName = `pet-roster-avatar${getAnimatedPetVideoConfig(definition.id) ? " pet-media-transparent" : ""}`;

                return (
                  <article key={definition.id} className={`pet-roster-row${isActive ? " is-active" : ""}`} style={itemStyle}>
                    <div className={rosterAvatarClassName} aria-hidden="true">
                      <PetFigureMedia definition={definition} variant="roster" />
                    </div>
                    <div className="pet-roster-copy">
                      <strong>{definition.name}</strong>
                      <p>{isOwned ? `已领养，亲密度 ${companion?.intimacy ?? 0}` : definition.description}</p>
                    </div>
                    <div className="pet-roster-side">
                      <span className="pet-roster-cost">{isOwned ? "已拥有" : `-${definition.cost} 颗星星`}</span>
                      <div className="pet-roster-actions">
                        <button
                          type="button"
                          className="pet-roster-button"
                          onClick={() => {
                            if (isOwned) {
                              onSwitchPet(definition.id);
                              return;
                            }
                            onAdoptPet(definition.id);
                          }}
                          disabled={isActive || (!isOwned && !canAdopt)}
                        >
                          {isActive ? "当前陪伴" : isOwned ? "切换" : canAdopt ? "领养" : "星星不足"}
                        </button>
                        {isOwned ? (
                          <button type="button" className="pet-roster-recycle-button" onClick={() => onRecyclePet(definition.id)}>
                            回收 +{PET_RECYCLE_REFUND_STARS}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}


