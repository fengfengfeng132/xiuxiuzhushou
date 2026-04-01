# Habit Check-In Modal Spec

## Source

- Derived from the `习惯打卡` modal screenshots provided by the user on 2026-03-21.
- Opened from the blue `打卡` button on populated habit cards in the homepage `行为习惯` board.

## Modal Goal

Let the user confirm one habit completion, optionally leave a short note, and optionally adjust the points granted for this single check-in.

## Modal Layout

### 1. Header

- Title: `习惯打卡`
- Subtitle explains this records the habit completion and references the once-per-day rule.
- Close icon button at the top right.

### 2. Habit Context

- The selected habit name appears near the top of the body as a plain text label, for example:
  - `早起`

### 3. Optional Note

- Field label: `备注（可选）`
- Multiline textarea placeholder similar to:
  - `记录一下今天的感受或成果...`

Requirement:
- The note is optional and should not block confirmation.

### 4. Per-Check-In Point Adjustment

- Checkbox row:
  - `调整本次积分`
- When unchecked:
  - the modal uses the habit's default configured point value
- When checked:
  - a numeric input appears
  - label: `积分数值（-1000 到 1000）`

Requirement:
- This adjustment applies only to the current check-in, not the habit's permanent default point rule.

### 5. Points Summary Card

- A warm tinted summary strip appears above the footer.
- Left side describes the resulting score outcome, such as:
  - `获得积分`
- Right side shows the resolved point value with a star icon, for example:
  - `+1`

Requirement:
- The summary should update immediately when the temporary point-adjustment field changes.

### 6. Footer Actions

- Primary action: `确认打卡`
- Secondary action: `取消`

Requirements:
- `确认打卡` stays disabled until the temporary point value is valid when adjustment is enabled.
- `取消` and the top-right close button dismiss without saving.

## Interaction Notes

- Clicking the homepage habit card `打卡` button opens this modal instead of recording immediately.
- Confirming the modal records one local completion for the selected date.
- The optional note can be stored in local activity/history text even if a dedicated completion-detail page does not exist yet.
- If point adjustment is enabled, the confirmed score uses the modal value rather than the habit default for this single action.

## Validation Rules

- Note is optional.
- When `调整本次积分` is off, the resolved points come from the habit default.
- When `调整本次积分` is on, the value must be an integer between `-1000` and `1000`.

## States Required

- modal closed
- modal open
- point-adjustment off
- point-adjustment on
- confirm enabled
- confirm disabled

## Known Unknowns

- The dedicated review UI for parent-approved habits after check-in has not been shown yet.
- No screenshot shows an attachment uploader or richer completion evidence for habits.
