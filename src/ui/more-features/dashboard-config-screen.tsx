import { useState } from "react";
import type { CSSProperties, DragEvent, JSX } from "react";
import type { DashboardDisplayMode, DashboardModuleId } from "../../persistence/storage.js";
import type { DashboardModuleDefinition } from "../app-types.js";

interface DashboardConfigScreenProps {
  displayMode: DashboardDisplayMode;
  visibleCount: number;
  totalCount: number;
  moduleItems: Array<DashboardModuleDefinition & { order: number; visible: boolean }>;
  isDirty: boolean;
  onBack: () => void;
  onChangeDisplayMode: (mode: DashboardDisplayMode) => void;
  onToggleModule: (moduleId: DashboardModuleId) => void;
  onMoveModule: (draggedId: DashboardModuleId, targetId: DashboardModuleId) => void;
  onRestoreDefaults: () => void;
  onSave: () => void;
}

const DISPLAY_MODE_OPTIONS: Array<{
  id: DashboardDisplayMode;
  title: string;
  description: string;
  helper: string;
}> = [
  {
    id: "plans-only",
    title: "仅学习计划",
    description: "回到原来的主页样式，不显示 Tab。",
    helper: "适合想要直接查看学习计划的首页布局。",
  },
  {
    id: "tabs",
    title: "Tab 形式",
    description: "默认方式，可在首页切换学习计划和行为习惯。",
    helper: "保留首页顶部分栏，适合频繁查看习惯进度。",
  },
];

function DashboardConfigRow({
  item,
  isDragging,
  isDropTarget,
  onDragStartModule,
  onDragEndModule,
  onDragEnterModule,
  onDragLeaveModule,
  onToggleModule,
  onMoveModule,
}: {
  item: DashboardConfigScreenProps["moduleItems"][number];
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStartModule: (moduleId: DashboardModuleId) => void;
  onDragEndModule: () => void;
  onDragEnterModule: (moduleId: DashboardModuleId) => void;
  onDragLeaveModule: (moduleId: DashboardModuleId) => void;
  onToggleModule: (moduleId: DashboardModuleId) => void;
  onMoveModule: (draggedId: DashboardModuleId, targetId: DashboardModuleId) => void;
}): JSX.Element {
  function handleDragStart(event: DragEvent<HTMLButtonElement>): void {
    const rowElement = event.currentTarget.closest(".dashboard-config-row");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
    if (rowElement instanceof HTMLElement) {
      const bounds = rowElement.getBoundingClientRect();
      event.dataTransfer.setDragImage(rowElement, Math.min(48, bounds.width * 0.18), Math.min(22, bounds.height * 0.5));
    }
    onDragStartModule(item.id);
  }

  function handleDragEnd(): void {
    onDragEndModule();
  }

  function handleDrop(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain") as DashboardModuleId;
    if (!draggedId) {
      return;
    }
    onDragEndModule();
    onMoveModule(draggedId, item.id);
  }

  return (
    <article
      className={`dashboard-config-row${item.visible ? " is-visible" : ""}${isDragging ? " is-dragging" : ""}${isDropTarget ? " is-drop-target" : ""}`}
      style={{ "--dashboard-config-accent": item.accent } as CSSProperties}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={() => onDragEnterModule(item.id)}
      onDragLeave={() => onDragLeaveModule(item.id)}
      onDrop={handleDrop}
    >
      <button
        type="button"
        className="dashboard-config-handle"
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        aria-label={`拖动调整 ${item.title} 的顺序`}
      >
        <span className="dashboard-config-grip" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} />
          ))}
        </span>
      </button>

      <div className="dashboard-config-icon">{item.icon}</div>

      <div className="dashboard-config-row-copy">
        <strong>{item.title}</strong>
        <small>{item.visible ? `显示中 · 排序 ${item.order}` : "已隐藏"}</small>
      </div>

      <div className="dashboard-config-toggle-group">
        <span>{item.visible ? "显示" : "隐藏"}</span>
        <button
          type="button"
          className={`dashboard-config-switch${item.visible ? " is-active" : ""}`}
          onClick={() => onToggleModule(item.id)}
          aria-pressed={item.visible}
          aria-label={`${item.visible ? "隐藏" : "显示"} ${item.title}`}
        >
          <span />
        </button>
      </div>
    </article>
  );
}

export function DashboardConfigScreen({
  displayMode,
  visibleCount,
  totalCount,
  moduleItems,
  isDirty,
  onBack,
  onChangeDisplayMode,
  onToggleModule,
  onMoveModule,
  onRestoreDefaults,
  onSave,
}: DashboardConfigScreenProps): JSX.Element {
  const [draggingModuleId, setDraggingModuleId] = useState<DashboardModuleId | null>(null);
  const [dropTargetModuleId, setDropTargetModuleId] = useState<DashboardModuleId | null>(null);

  return (
    <div className="dashboard-config-page">
      <header className="dashboard-config-hero">
        <button type="button" className="dashboard-config-back-button" onClick={onBack} aria-label="返回其他功能">
          ←
        </button>
        <div className="dashboard-config-hero-copy">
          <h1>仪表盘配置</h1>
          <p>自定义首页顶部模块的显示方式和排序。</p>
        </div>
      </header>

      <section className="dashboard-config-intro-card">
        <p>选择要在仪表盘上显示的统计项和功能模块。拖拽可调整显示顺序，“其他”按钮将始终显示在最后。</p>
        <strong>
          当前显示: <span>{visibleCount}</span>/{totalCount}
        </strong>
      </section>

      <section className="dashboard-config-display-card">
        <div className="dashboard-config-display-head">
          <div className="dashboard-config-display-icon">◫</div>
          <div>
            <h2>主页展示方式</h2>
            <p>可以选择首页默认显示学习计划，或使用学习计划/行为习惯 Tab 切换。</p>
          </div>
        </div>

        <div className="dashboard-config-display-options">
          {DISPLAY_MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`dashboard-config-display-option${displayMode === option.id ? " is-active" : ""}`}
              onClick={() => onChangeDisplayMode(option.id)}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
              <small>{option.helper}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard-config-list">
        {moduleItems.map((item) => (
          <DashboardConfigRow
            key={item.id}
            item={item}
            isDragging={draggingModuleId === item.id}
            isDropTarget={dropTargetModuleId === item.id && draggingModuleId !== item.id}
            onDragStartModule={(moduleId) => {
              setDraggingModuleId(moduleId);
              setDropTargetModuleId(moduleId);
            }}
            onDragEndModule={() => {
              setDraggingModuleId(null);
              setDropTargetModuleId(null);
            }}
            onDragEnterModule={setDropTargetModuleId}
            onDragLeaveModule={(moduleId) => {
              setDropTargetModuleId((current) => (current === moduleId ? draggingModuleId : current));
            }}
            onToggleModule={onToggleModule}
            onMoveModule={onMoveModule}
          />
        ))}
      </div>

      <div className="dashboard-config-footer">
        <button type="button" className="dashboard-config-footer-button is-secondary" onClick={onRestoreDefaults}>
          恢复默认
        </button>
        <button type="button" className="dashboard-config-footer-button is-primary" onClick={onSave}>
          {isDirty ? "保存配置" : "配置已保存"}
        </button>
      </div>
    </div>
  );
}
