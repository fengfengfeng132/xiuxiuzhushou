import { useEffect, useState } from "react";
import type { StudyPlan } from "../../domain/model.js";

type TimerMode = "elapsed" | "countdown" | "pomodoro";
type TimerPhase = "idle" | "running" | "paused" | "finished";

const COUNTDOWN_PRESETS = [10 * 60, 15 * 60, 25 * 60, 45 * 60];
const POMODORO_WORK_SECONDS = 25 * 60;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function splitClock(totalSeconds: number): [string, string, string] {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [pad(hours), pad(minutes), pad(seconds)];
}

function formatDuration(totalSeconds: number): string {
  const [hours, minutes, seconds] = splitClock(totalSeconds);
  return `${hours}:${minutes}:${seconds}`;
}

function getModeTitle(mode: TimerMode): string {
  if (mode === "countdown") {
    return "倒计时";
  }
  if (mode === "pomodoro") {
    return "番茄钟";
  }
  return "正计时";
}

function getHelperCopy(mode: TimerMode): string {
  if (mode === "countdown") {
    return "倒计时会朝目标时长推进，到点后自动进入提醒状态。";
  }
  if (mode === "pomodoro") {
    return "番茄钟使用 25 分钟专注轮次，并记录已完成的轮数。";
  }
  return "正计时适合自由安排的学习过程，记录真实专注时长。";
}

function getPhaseLabel(phase: TimerPhase): string {
  if (phase === "running") {
    return "进行中";
  }
  if (phase === "paused") {
    return "已暂停";
  }
  if (phase === "finished") {
    return "已结束";
  }
  return "未开始";
}

function getPrimaryActionLabel(mode: TimerMode, phase: TimerPhase): string {
  if (phase === "running") {
    return "暂停";
  }
  if (phase === "paused") {
    return "继续";
  }
  if (phase === "finished") {
    return mode === "pomodoro" ? "下一轮番茄" : "重新开始";
  }
  return "开始学习";
}

interface StudyTimerScreenProps {
  plan: StudyPlan | null;
  onBack: () => void;
  onComplete: (planId: string, durationSeconds: number) => void;
}

// StudyTimerScreen owns timer-specific state so future agents can extend this workflow without reopening AppShell.
export function StudyTimerScreen({ plan, onBack, onComplete }: StudyTimerScreenProps) {
  const [mode, setMode] = useState<TimerMode>("elapsed");
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownTargetSeconds, setCountdownTargetSeconds] = useState(COUNTDOWN_PRESETS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  const countdownSeconds = Math.max(countdownTargetSeconds - elapsedSeconds, 0);
  const pomodoroSeconds = Math.max(POMODORO_WORK_SECONDS - elapsedSeconds, 0);
  const displaySeconds = mode === "elapsed" ? elapsedSeconds : mode === "countdown" ? countdownSeconds : pomodoroSeconds;
  const canComplete = plan !== null && plan.status === "pending" && elapsedSeconds > 0;
  const [hours, minutes, seconds] = splitClock(displaySeconds);

  useEffect(() => {
    setMode("elapsed");
    setPhase("idle");
    setElapsedSeconds(0);
    setCountdownTargetSeconds(COUNTDOWN_PRESETS[0]);
    setSoundEnabled(true);
    setRecordingOpen(false);
    setCompletedPomodoros(0);
  }, [plan?.id]);

  useEffect(() => {
    if (phase !== "running") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    if (mode === "countdown" && countdownSeconds === 0) {
      setPhase("finished");
      return;
    }

    if (mode === "pomodoro" && pomodoroSeconds === 0) {
      setPhase("finished");
      setCompletedPomodoros((current) => current + 1);
    }
  }, [countdownSeconds, mode, phase, pomodoroSeconds]);

  function resetForMode(nextMode: TimerMode): void {
    setMode(nextMode);
    setPhase("idle");
    setElapsedSeconds(0);
    if (nextMode !== "pomodoro") {
      setCompletedPomodoros(0);
    }
  }

  function handleModeChange(nextMode: TimerMode): void {
    if (nextMode === mode) {
      return;
    }

    if (phase === "running" && !window.confirm("切换计时模式会重置当前专注记录，确定继续吗？")) {
      return;
    }

    resetForMode(nextMode);
  }

  function handlePrimaryAction(): void {
    if (phase === "running") {
      setPhase("paused");
      return;
    }

    if (phase === "finished") {
      setElapsedSeconds(0);
      setPhase("running");
      return;
    }

    setPhase("running");
  }

  function handleSecondaryAction(): void {
    setPhase("idle");
    setElapsedSeconds(0);
  }

  function handleCompleteAction(): void {
    if (!plan || !canComplete) {
      return;
    }
    onComplete(plan.id, Math.max(1, elapsedSeconds));
  }

  function handleCycleCountdownPreset(): void {
    const currentIndex = COUNTDOWN_PRESETS.findIndex((value) => value === countdownTargetSeconds);
    const nextIndex = currentIndex === -1 || currentIndex === COUNTDOWN_PRESETS.length - 1 ? 0 : currentIndex + 1;
    setCountdownTargetSeconds(COUNTDOWN_PRESETS[nextIndex]);
    setPhase("idle");
    setElapsedSeconds(0);
  }

  if (!plan) {
    return (
      <div className="timer-page timer-page-empty">
        <div className="timer-empty-card">
          <h1>当前没有可用计划</h1>
          <p>请先返回首页，选择一个待完成计划再进入计时页。</p>
          <button type="button" className="timer-primary-button" onClick={onBack}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-page">
      <header className="timer-hero">
        <button type="button" className="timer-back-button" onClick={onBack}>
          返回
        </button>
        <div className="timer-hero-copy">
          <span className="timer-subject-badge">{plan.subject}</span>
          <h1>{plan.title}</h1>
          <p>
            {plan.subject} · 计划时长 {plan.minutes} 分钟
          </p>
        </div>
      </header>

      <main className="timer-shell">
        <section className="timer-card">
          <div className="timer-card-head">
            <div className="timer-mode-switcher" role="tablist" aria-label="计时模式">
              <button type="button" className={`timer-mode-button${mode === "elapsed" ? " is-active" : ""}`} onClick={() => handleModeChange("elapsed")}>
                正计时
              </button>
              <button type="button" className={`timer-mode-button${mode === "countdown" ? " is-active" : ""}`} onClick={() => handleModeChange("countdown")}>
                倒计时
              </button>
              <button type="button" className={`timer-mode-button${mode === "pomodoro" ? " is-active" : ""}`} onClick={() => handleModeChange("pomodoro")}>
                番茄钟
              </button>
            </div>
            <button type="button" className={`timer-sound-button${soundEnabled ? " is-enabled" : ""}`} onClick={() => setSoundEnabled((current) => !current)}>
              {soundEnabled ? "提示音已开" : "提示音已关"}
            </button>
          </div>

          <div className="timer-center-copy">
            {mode === "countdown" ? (
              <div className="timer-chip-row">
                <span className="timer-info-chip">目标时长：{formatDuration(countdownTargetSeconds)}</span>
                <button type="button" className="timer-link-button" onClick={handleCycleCountdownPreset}>
                  切换预设
                </button>
              </div>
            ) : null}

            {mode === "pomodoro" ? (
              <>
                <div className="timer-chip-row">
                  <span className="timer-info-chip">专注轮次</span>
                </div>
                <p className="timer-meta-copy">
                  第 {completedPomodoros + 1} 轮番茄钟 · 已完成 {completedPomodoros} 轮
                </p>
                <span className="timer-duration-pill">标准时长：25:00</span>
              </>
            ) : null}

            <h2 className={`timer-mode-title timer-mode-title-${mode}`}>{getModeTitle(mode)}</h2>
          </div>

          <div className="timer-display-grid" aria-live="polite">
            <div className="timer-digit-card timer-digit-card-hours">
              <strong>{hours}</strong>
              <span>时</span>
            </div>
            <span className="timer-separator">:</span>
            <div className="timer-digit-card timer-digit-card-minutes">
              <strong>{minutes}</strong>
              <span>分</span>
            </div>
            <span className="timer-separator">:</span>
            <div className="timer-digit-card timer-digit-card-seconds">
              <strong>{seconds}</strong>
              <span>秒</span>
            </div>
          </div>

          <div className="timer-phase-row">
            <span className={`timer-phase-dot timer-phase-${phase}`} />
            <span>{getPhaseLabel(phase)}</span>
          </div>

          <div className="timer-action-row">
            <button type="button" className="timer-primary-button" onClick={handlePrimaryAction}>
              {getPrimaryActionLabel(mode, phase)}
            </button>
            <button type="button" className="timer-complete-button" onClick={handleCompleteAction} disabled={!canComplete}>
              完成
            </button>
            {phase !== "idle" ? (
              <button type="button" className="timer-secondary-button" onClick={handleSecondaryAction}>
                重置
              </button>
            ) : null}
          </div>

          <div className="timer-helper-panel">
            <p>{getHelperCopy(mode)}</p>
          </div>
        </section>
      </main>

      <div className={`timer-recording-drawer${recordingOpen ? " is-open" : ""}`}>
        <button type="button" className="timer-recording-trigger" onClick={() => setRecordingOpen((current) => !current)}>
          <span>学习记录抽屉（0）</span>
          <span>{recordingOpen ? "∨" : "∧"}</span>
        </button>
        {recordingOpen ? (
          <div className="timer-recording-panel">
            <strong>学习记录区域待完善</strong>
            <p>这里预留给后续的录音、回放和学习记录功能。</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

