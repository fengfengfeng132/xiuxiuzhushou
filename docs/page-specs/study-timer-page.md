# Study Timer Page Spec

## Source

- Derived from the `开始计时` screenshots provided by the user on 2026-03-20.
- This page is entered from the current-day active plan card on the homepage board.

## Page Goal

Provide a distraction-free full-page timer workspace for one study plan, supporting three timing strategies:
- `正计时`
- `倒计时`
- `番茄`

## Entry Point

- User clicks `开始计时` on a current-day plan card in `docs/page-specs/home-dashboard.md`.

## Layout Zones

### 1. Top Header

- Large blue gradient hero background.
- Top-left `返回` action.
- Centered plan context:
  - category badge such as `技能`
  - large plan title
  - smaller content/summary line

### 2. Main Timer Panel

- Large centered white card floating under the header.
- Minimal, focus-oriented layout.
- The top of the card contains:
  - timer mode switcher
  - `音效` toggle/action button on the right

### 3. Mode Switcher

- Three switch options:
  - `正计时`
  - `倒计时`
  - `番茄`
- Only one mode is active at a time.

Requirement:
- The current mode changes the supporting labels, helper copy, and timer defaults.

### 4. Timer Display

- Large three-block digital timer display:
  - `小时`
  - `分钟`
  - `秒`
- The blocks use strong color accents and sit at the center of the page.
- A small state row under the timer indicates `未开始` in the provided screenshots.

### 5. Primary Action

- Large bottom-center button: `开始学习`

Requirement:
- This is the primary call to action for all three timer modes in the pre-start state.

### 6. Bottom Helper Panel

- Soft informational panel pinned near the bottom of the main timer card.
- Content changes by mode.

Confirmed helper copy intent:
- `正计时`: free-form elapsed-time mode for flexible study duration
- `倒计时`: count down from a target duration with reminder behavior
- `番茄`: 25-minute work block, 5-minute break, and long break after every 4 pomodoros

### 7. Bottom Recording Drawer Trigger

- A floating bottom chip shows `学习录音 (0)` with a collapse/expand affordance.

Assumption:
- This is a compact entry into a recording drawer or panel, but the expanded state has not been shown yet.

## Mode Details

### A. 正计时

- Large heading: `正计时`
- Timer starts at `00:00:00`
- Helper copy indicates flexible free timing

Requirement:
- Suitable for open-ended study sessions with no predefined target duration.

### B. 倒计时

- Large heading: `倒计时`
- A visible target-duration chip appears above the timer, for example `目标时长: 00:10:00`
- The target chip includes a `切换默认时长` action
- Default screenshot state shows `00:10:00`

Requirement:
- Countdown mode must preserve and surface a configurable target duration.

### C. 番茄

- Large heading: `番茄钟`
- A labeled chip above the timer indicates `工作时间`
- The page shows progress metadata such as:
  - `第 1 个番茄钟`
  - `已完成 0 个`
- The visible timer default is `25:00`
- A small duration pill shows `时长: 25:00`

Requirement:
- Pomodoro mode must track session index and completed pomodoro count.
- The product rule shown in helper text is:
  - 25-minute work period
  - 5-minute short break
  - 15-minute long break after every 4 pomodoros

## Interaction Notes

- This is a dedicated page, not a modal.
- It is optimized for a single active study task.
- Switching timer mode should preserve plan context while updating timer behavior.
- `音效` is a page-level toggle or control rather than a separate settings page.

## States Required

- page entered from today's plan card
- `正计时` selected
- `倒计时` selected
- `番茄` selected
- pre-start state
- running state
- paused state
- finished state
- sound enabled/disabled
- recording drawer collapsed/expanded

## Known Unknowns

- The running, paused, and completed timer states are not shown yet.
- The UI for `切换默认时长` is not shown yet.
- The expanded `学习录音` drawer is not shown yet.
- The post-timer completion surface is not shown yet.
