import type { ChangeEvent } from "react";

interface AddProfileModalProps {
  open: boolean;
  profileName: string;
  avatarColor: string;
  avatarImage: string | null;
  colorOptions: string[];
  profileCount: number;
  maxProfiles: number;
  canSubmit: boolean;
  onClose: () => void;
  onUpdateProfileName: (value: string) => void;
  onSelectColor: (value: string) => void;
  onSelectImage: (file: File | null) => void;
  onSubmit: () => void;
}

export function AddProfileModal({
  open,
  profileName,
  avatarColor,
  avatarImage,
  colorOptions,
  profileCount,
  maxProfiles,
  canSubmit,
  onClose,
  onUpdateProfileName,
  onSelectColor,
  onSelectImage,
  onSubmit,
}: AddProfileModalProps) {
  if (!open) {
    return null;
  }

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    onSelectImage(file);
    event.target.value = "";
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="添加新用户">
      <article className="modal-card add-profile-modal-card">
        <header className="add-profile-modal-head">
          <div>
            <h2>添加新用户</h2>
            <p>为当前账号添加一个新的用户档案，最多支持5个用户</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="field-block">
          <span>用户名</span>
          <input
            value={profileName}
            onChange={(event) => onUpdateProfileName(event.target.value)}
            placeholder="例如：大宝、二宝"
            maxLength={16}
          />
        </div>

        <section className="add-profile-image-section">
          <h3>自定义头像（可选）</h3>
          <div className="add-profile-image-row">
            <span
              className="add-profile-image-preview"
              style={avatarImage ? { backgroundImage: `url(${avatarImage})` } : { backgroundColor: avatarColor }}
            />
            <label className="modal-cancel add-profile-image-picker">
              选择图片
              <input type="file" accept="image/*" onChange={handleImageSelect} />
            </label>
          </div>
          <p>最大 1MB，会自动裁成圆形头像</p>
        </section>

        <section className="add-profile-color-section">
          <h3>选择头像颜色（未上传图片时使用）</h3>
          <div className="add-profile-color-row">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={`add-profile-color-dot${avatarColor === color ? " is-active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => onSelectColor(color)}
                aria-label={`头像颜色 ${color}`}
              />
            ))}
          </div>
          <p>提示：每个账号最多可以创建5个用户（{profileCount}/{maxProfiles}）</p>
        </section>

        <footer className="add-profile-modal-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            取消
          </button>
          <button type="button" className="modal-submit modal-submit-primary" disabled={!canSubmit} onClick={onSubmit}>
            添加
          </button>
        </footer>
      </article>
    </div>
  );
}
