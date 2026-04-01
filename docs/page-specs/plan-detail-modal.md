# Plan Detail Modal Spec

## Source

- Derived from the study-plan detail modal screenshot provided on 2026-03-20.
- The modal is shown after clicking an existing historical study-plan card from the homepage.

## Entry

- Opened from a study-plan card in the homepage `学习计划` board.
- This is a floating detail modal.

## Goal

Let the user inspect one existing plan in detail, including its schedule, rewards, completion records, attachments, and follow-up actions.

## Header

- Large plan title at the top, e.g. `阳光小达人1课`
- Category badge under or beside the title, e.g. `技能`
- Close icon on the top right
- Leading icon panel on the left that matches the plan's category color/icon

## Body

### 1. 计划内容

- Shows the content or display title of the plan
- Right-side quick actions visible in the screenshot:
  - `听写`
  - `播放`

Requirement:
- These actions appear when the plan has media or voice-study relevance.
- The modal layout should allow these quick actions even if the early implementation uses placeholder behavior.

### 2. 重复类型

- Displays a label such as `每天`

### 3. 计划日期

- Displays a start date and end date range, e.g.:
  - `2026-03-18 -> 2026-06-28`

Requirement:
- Repeating plans should show their active range.

### 4. 积分奖励

- Shows at least:
  - base star reward, e.g. `1 星`
  - `自定义积分` badge when custom points are enabled

Requirement:
- Reward display should reflect the saved plan data, not a recomputed guess.

### 5. 创建时间

- Displays exact creation timestamp, e.g.:
  - `2026/03/18 08:00`

### 6. 完成记录与备注

- Large highlighted panel showing:
  - record date
  - completion note heading such as `学习含记录`
  - one or more session ranges
  - per-session minute totals
  - cumulative minute total
  - attachments section

Visible examples from the screenshot:
- `20:38 - 20:39 -> 0分钟`
- `20:35 - 20:40 -> 5分钟`
- audio attachment card such as `record... 165.4 KB`

Requirement:
- Completion records must support multiple sessions for the same plan.
- Attachments should be shown as concrete saved artifacts when they exist.

## Footer Actions

- Left destructive-secondary action:
  - `删除重复任务`
- Right primary action:
  - `编辑计划`

Requirement:
- `删除重复任务` is specifically scoped to repeating plans.
- `编辑计划` should open the same plan-editing flow used for plan modification.

## Interaction Notes

- Clicking outside or the close icon closes the modal.
- The modal is read-heavy and should preserve scroll if the record content grows.

## States Required

- repeating plan with detail records
- plan with attachments
- plan without attachments
- plan with multiple completion sessions

## Known Unknowns

- exact edit flow destination from the modal
- delete-repeat confirmation step
- whether `听写` and `播放` are always present or only for specific task types
