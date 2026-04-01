# Quick Complete Modal Spec

## Source

- Derived from the `快速完成` modal screenshots provided by the user on 2026-03-20.
- This modal is entered from the current-day active plan card on the homepage board.

## Modal Goal

Let the user finish a study plan quickly without entering the full timer flow, while still recording duration, notes, and optional evidence attachments.

## Entry Point

- User clicks `快速完成` on a current-day plan card in `docs/page-specs/home-dashboard.md`.

## Modal Structure

### 1. Header

- Green completion-themed header area.
- Top-left completion icon.
- Title: `快速完成任务`.
- Secondary line shows the plan title, for example `阳光小达人1课`.
- Top-right close affordance.

### 2. Plan Summary Card

- The fuller screenshot shows a lightweight plan summary block below the header.
- Summary content includes:
  - category badge such as `技能`
  - visible date
  - plan title
  - content preview

Assumption:
- The modal may preserve this summary block near the top when scroll position allows.

### 3. Time Configuration Section

- Section label: `耗时设置`.
- Two mode tabs:
  - `输入时长`
  - `实际时间`
- `输入时长` is the confirmed active state in the provided screenshots.

### 4. Input Duration Mode

- Three separate numeric inputs:
  - `小时`
  - `分钟`
  - `秒`
- A computed total row below the inputs, e.g. `总计: 0分钟`.
- A quick-pick chip group labeled `常用时长`.
- Confirmed preset options:
  - `15分钟`
  - `30分钟`
  - `45分钟`
  - `1小时`
  - `1.5小时`
  - `2小时`

Requirement:
- Preset selection should update the computed total.
- Manual numeric edits should also update the computed total.

### 5. Actual Time Mode

- A second tab named `实际时间` exists.

Known unknown:
- The detailed fields for this mode are not shown yet.
- The repo should preserve the mode in the interaction model, but not invent its exact form before more screenshots arrive.

### 6. Note Field

- Label: `备注 (可选)`.
- Large textarea with helper placeholder text for study心得 or notes.

### 7. Note Attachment Area

- Label indicates note attachments are supported.
- Accepted types shown in copy: image, audio, video.
- Count limit shown in copy: at most 5 files.
- Size limit shown in copy: single file up to 50MB.
- Upload area supports click-to-upload and drag/drop affordances.

Requirement:
- Attachments here belong to the completion record, not the base plan definition.

### 8. Footer Actions

- Left action: `取消`
- Right primary action: `确认完成`

Requirement:
- `确认完成` should create a completion record and return the task to a completed state on the board.

## Interaction Notes

- This is a modal flow, not a dedicated page.
- The modal is optimized for same-day task completion.
- Duration entry, note text, and note attachments are all part of the quick-complete workflow.
- The current-day card action should open this modal directly.

## States Required

- modal closed
- modal open
- `输入时长` active
- `实际时间` active
- zero-duration state
- preset-selected state
- attachments empty
- attachments populated
- submit enabled/disabled

## Known Unknowns

- The exact field layout for `实际时间` has not been shown yet.
- The validation threshold for zero-duration confirmation is not visible yet.
- The post-submit success surface has not been shown yet.
