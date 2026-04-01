import type { ChangeEvent, FormEvent, RefObject } from "react";
import { AI_PLAN_PROMPT_EXAMPLES } from "../app-content.js";
import type { AiPlanAttachmentDraft, AiPlanComposerDraft, AiPlanSession } from "../app-types.js";

interface AiPlanAssistantScreenProps {
  draft: AiPlanComposerDraft;
  sessions: AiPlanSession[];
  activeSessionId: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onClear: () => void;
  onStartNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onApplyPromptExample: (prompt: string) => void;
  onUpdateDraft: (field: keyof AiPlanComposerDraft, value: string | AiPlanAttachmentDraft[]) => void;
  onSelectFiles: (files: FileList | null) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}

function formatSessionTime(isoDate: string): string {
  const date = new Date(isoDate);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function AiPlanAssistantScreen({
  draft,
  sessions,
  activeSessionId,
  fileInputRef,
  onBack,
  onClear,
  onStartNewSession,
  onSelectSession,
  onSubmit,
  onApplyPromptExample,
  onUpdateDraft,
  onSelectFiles,
  onRemoveAttachment,
}: AiPlanAssistantScreenProps) {
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const activeMessages = activeSession?.messages ?? [];

  return (
    <div className="ai-plan-page">
      <header className="ai-plan-hero">
        <div className="ai-plan-topbar">
          <button type="button" className="ai-plan-top-button" onClick={onBack}>
            ← 返回
          </button>
          <h1>AI 智能创建</h1>
          <button type="button" className="ai-plan-top-button" onClick={onClear}>
            清空
          </button>
        </div>
      </header>

      <section className="ai-plan-shell">
        <div className="ai-plan-notice">
          <strong>AI 功能体验期，如遇识别不准确请反馈。</strong>
        </div>

        <div className="ai-plan-layout">
          <aside className="ai-plan-sidebar">
            <div className="ai-plan-sidebar-head">
              <h2>会话历史</h2>
              <button type="button" className="ai-plan-new-session" onClick={onStartNewSession}>
                ＋ 新会话
              </button>
            </div>

            {sessions.length === 0 ? (
              <p className="ai-plan-sidebar-empty">暂无会话记录</p>
            ) : (
              <div className="ai-plan-session-list">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className={`ai-plan-session-item${session.id === activeSessionId ? " is-active" : ""}`}
                    onClick={() => onSelectSession(session.id)}
                  >
                    <strong>{session.title}</strong>
                    <small>{formatSessionTime(session.updatedAt)}</small>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="ai-plan-chat-panel">
            {activeMessages.length === 0 ? (
              <div className="ai-plan-empty-state">
                <div className="ai-plan-empty-icon" aria-hidden="true">
                  ✧
                </div>
                <h2>AI 学习计划助手</h2>
                <p>告诉我你的学习计划，或上传图片，我会帮你智能创建任务</p>

                <div className="ai-plan-example-row">
                  {AI_PLAN_PROMPT_EXAMPLES.map((prompt) => (
                    <button key={prompt} type="button" className="ai-plan-example-chip" onClick={() => onApplyPromptExample(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>

                <button type="button" className="ai-plan-upload-button" onClick={() => fileInputRef.current?.click()}>
                  上传图片
                </button>
              </div>
            ) : (
              <div className="ai-plan-message-list">
                {activeMessages.map((message) => (
                  <article key={message.id} className={`ai-plan-message ai-plan-message-${message.role}`}>
                    <div className="ai-plan-message-bubble">
                      <p>{message.content}</p>
                      {message.attachments.length > 0 ? (
                        <div className="ai-plan-message-attachments">
                          {message.attachments.map((attachment) => (
                            <span key={attachment.id} className="ai-plan-message-attachment">
                              {attachment.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <form className="ai-plan-composer" onSubmit={onSubmit}>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={(event: ChangeEvent<HTMLInputElement>) => onSelectFiles(event.target.files)}
              />

              {draft.attachments.length > 0 ? (
                <div className="ai-plan-composer-attachments">
                  {draft.attachments.map((attachment) => (
                    <div key={attachment.id} className="ai-plan-composer-attachment">
                      <span>{attachment.name}</span>
                      <button type="button" onClick={() => onRemoveAttachment(attachment.id)}>
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="ai-plan-composer-row">
                <button type="button" className="ai-plan-composer-icon" onClick={() => fileInputRef.current?.click()}>
                  ↑
                </button>
                <input
                  type="text"
                  className="ai-plan-composer-input"
                  placeholder="描述你的学习计划，可上传图片..."
                  value={draft.prompt}
                  onChange={(event) => onUpdateDraft("prompt", event.target.value)}
                />
                <button type="submit" className="ai-plan-send-button">
                  ➤
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
