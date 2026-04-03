import { useEffect, useRef, useState } from "react";

interface DateJumpPopoverProps {
  valueDateKey: string;
  todayDateKey: string;
  onSelectDate: (dateKey: string) => void;
  buttonClassName?: string;
  buttonLabel?: string;
  buttonAriaLabel?: string;
}

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function DateJumpPopover({
  valueDateKey,
  todayDateKey,
  onSelectDate,
  buttonClassName = "icon-button",
  buttonLabel = "日历",
  buttonAriaLabel = "打开日历",
}: DateJumpPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draftDateKey, setDraftDateKey] = useState(valueDateKey);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftDateKey(valueDateKey);
  }, [open, valueDateKey]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSelectDate(nextDateKey: string): void {
    if (!isValidDateKey(nextDateKey)) {
      return;
    }
    onSelectDate(nextDateKey);
    setOpen(false);
  }

  return (
    <div className={`date-jump${open ? " is-open" : ""}`} ref={wrapRef}>
      <button type="button" className={buttonClassName} onClick={() => setOpen((current) => !current)} aria-label={buttonAriaLabel}>
        {buttonLabel}
      </button>
      {open ? (
        <div className="date-jump-popover" role="dialog" aria-label="选择日期">
          <p className="date-jump-title">跳转日期</p>
          <input
            className="date-jump-input"
            type="date"
            value={draftDateKey}
            onChange={(event) => {
              const nextDateKey = event.target.value;
              setDraftDateKey(nextDateKey);
              handleSelectDate(nextDateKey);
            }}
          />
          <div className="date-jump-actions">
            <button type="button" className="date-jump-action" onClick={() => handleSelectDate(todayDateKey)}>
              回到今天
            </button>
            <button type="button" className="date-jump-action is-quiet" onClick={() => setOpen(false)}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
