# Home Dashboard Spec

## Source

- Derived from the first homepage screenshot provided by the user on 2026-03-20.
- Expanded with populated historical-plan and current-day plan screenshots provided on 2026-03-20.
- User-specified overrides:
  - replace the original top-left product name with `绣绣助手`
  - the top-right `玉兔` control represents switching between different users

## Page Goal

Provide a single-screen family dashboard where the active child's plans, habits, progress metrics, and entry actions can be reviewed without leaving the homepage.

## Layout Zones

### 1. Header

- Large blue gradient background spanning full width.
- Top-left product title: `绣绣助手`.
- A short secondary sentence below the title describing streak and total completed plans.
- Top-right profile switcher with avatar chip, display name, and dropdown affordance.

### 2. Summary Card Row

- White rounded cards floating below the blue header.
- Cards are compact, evenly spaced, and read as a quick-status strip.
- Current screenshot shows these card themes:
  - 当天学习时间
  - 运动户外时间
  - 当天任务量
  - 当天完成率
  - 积分成就
  - 行为习惯
  - 待办事项
  - 电子宠物
  - 使用帮助
  - 其他入口占位

Assumption:
- Some cards are metrics, some are entry shortcuts. Exact click behavior is not fully known yet.
- `积分成就` leads to the dedicated points center documented in `docs/page-specs/points-achievements.md`.
- `行为习惯` can open the dedicated management page documented in `docs/page-specs/habit-management-page.md`.

### 3. Primary Tab Area

Additional entry note:
- `电子宠物` summary entry opens the dedicated pet center documented in `docs/page-specs/pet-adoption-page.md` and `docs/page-specs/pet-interaction-page.md`.
- `使用帮助` summary entry opens the dedicated help center documented in `docs/page-specs/usage-help-page.md`.
- `其他` summary entry opens the dedicated navigation hub documented in `docs/page-specs/other-features-page.md`.

- Two tabs:
  - `学习计划`
  - `行为习惯`
- `学习计划` is active in the screenshot.
- Tabs sit on top of the main content container and visually merge into it.

### 4. Main Board Header

- Large white rounded panel.
- Top-right action group with three buttons:
  - `AI创建`
  - `批量添加`
  - `添加计划`

Assumption:
- Button order and visual emphasis should match the reference, but only `添加计划` must be functional in the first coded slice.
- `添加计划` leads to a dedicated full-page creation screen documented in `docs/page-specs/add-learning-plan.md`.
- `批量添加` leads to a dedicated full-page batch creation screen documented in `docs/page-specs/batch-add-learning-plans.md`.
- `AI创建` leads to a dedicated conversation workspace documented in `docs/page-specs/ai-plan-assistant.md`.

### 5. Week Navigator

- Week label on the left, e.g. `2026年3月第12周`.
- Control group on the right with:
  - preview/overview toggle
  - previous day button
  - `今天` shortcut
  - next day button
  - calendar button
- Large horizontal list of seven day cards below.
- Selected day uses a strong blue state.
- Future or secondary selected days can use a lighter blue state.
- Day cards may show small colored dots indicating the number of plans or completions on that day.

### 6. Plan Section

- Section heading: `我的计划`.
- Right-side controls shown in the populated screenshot:
  - `分享`
  - `全部科目`
  - `默认排序`
  - `布局`
  - `管理`
- Large content area below the heading.
- If no plan exists for the selected day, show a friendly empty state with icon and text.

### 6a. Pending Points Review Strip

- When at least one plan completion is waiting for points review, show a highlighted strip between the week navigator and plan list.
- Strip copy:
  - title: `待审定积分任务`
  - summary: `有 N 个任务的积分需要审定`
- Strip actions:
  - `逐个审定`: opens the review modal for one pending item
  - `一键通过`: approves all pending points reviews in one action

### 7. Populated Plan Card State

- Historical or non-empty days render a vertical list of large plan cards.
- Each card includes:
  - left colored category rail with icon and subject label
  - plan title
  - repeat label such as `每天` or `仅当天`
  - status badge such as `已完成` or `已调整`
  - completion window, e.g. `20:35 - 20:40`
  - first-session minutes
  - second-session minutes when present
  - total minutes
  - plan content preview
  - duration or fixed time-range line
  - star reward amount

Requirement:
- Cards should support different subject/category colors.
- The plan list must handle multiple completed cards on the same day.
- Clicking a card opens the detail modal documented in `docs/page-specs/plan-detail-modal.md`.

### 8. Today Active Plan Card State

- When the selected date is today and plans are still pending, the board renders action-oriented cards instead of completed-history cards.
- The current-day card keeps the same left-side category rail and icon treatment as historical cards.
- Each active card includes:
  - left colored category rail with icon and subject label
  - plan title
  - repeat badge such as `姣忓ぉ`
  - plan content preview
  - duration line such as `10鍒嗛挓`
  - star reward amount
  - right-side action stack
- The right-side action stack contains:
  - `蹇€熷畬鎴?`
  - `寮€濮嬭鏃?`

Requirement:
- Current-day cards must support multiple pending plans in the same vertical board.
- `蹇€熷畬鎴?` and `寮€濮嬭鏃?` are first-class board actions and should not require opening the detail modal first.
- The today board should visually distinguish active plans from already completed historical cards.

### 9. Habit Board Empty State

- Switching to the `行为习惯` tab keeps the homepage shell but replaces the main board content.
- The current screenshot confirms an empty state with:
  - centered habit/check icon
  - title `还没有行为习惯`
  - helper copy encouraging the user to create habits first
  - primary CTA button `创建习惯`

Requirement:
- The empty-state board should remain visually consistent with the learning-plan board shell.
- The detailed habit-board behavior is documented in `docs/page-specs/habit-board.md`.

## Visual Direction

- Bright, child-friendly, soft-corner interface.
- Blue is the dominant structural color.
- Main surfaces are white with soft shadows.
- Information density is high, but groups are clearly boxed.

## Interaction Notes

- Changing profile should refresh all homepage content.
- Switching tabs should keep the user on the same homepage shell.
- Changing date should only refresh date-scoped board content.
- Summary cards should remain visible regardless of which main tab is active.
- The plan board must support both empty and populated historical states.
- Clicking an existing plan card opens a detail modal rather than navigating away immediately.
- The plan board must also support a current-day active state with direct actions on each card.
- Clicking the `行为习惯` tab switches the main board to the content documented in `docs/page-specs/habit-board.md`.
- Clicking the `行为习惯` summary entry can navigate to the dedicated management page documented in `docs/page-specs/habit-management-page.md`.
- Clicking `蹇€熷畬鎴?` should resolve the task from the board context.
- Clicking `寮€濮嬭鏃?` should enter the task-timing flow from the board context.

- Clicking `管理` opens the page documented in `docs/page-specs/plan-management-page.md`.
- Clicking `快速完成` opens the modal documented in `docs/page-specs/quick-complete-modal.md`.
- Clicking `开始计时` opens the page documented in `docs/page-specs/study-timer-page.md`.
- Clicking `逐个审定` opens the points-review modal with approve/adjust/reject actions and result preview.
- Clicking `一键通过` should pass all pending review records.

## States Required

Additional interaction note:
- The homepage summary strip must support a dedicated `电子宠物` entry that opens the local pet center without leaving the local-first shell architecture.
- The homepage summary strip must support a dedicated `使用帮助` entry that opens a static but navigable help manual for the current product slice.
- The homepage summary strip must support a dedicated `其他` entry that opens a grouped navigation hub for secondary modules and system tools.

- default dashboard state
- no plans for selected date
- populated historical plan list
- populated current-day active plan list
- empty habit board
- selected day
- today shortcut state
- active/inactive tab
- card action buttons idle/hover/pressed
- profile menu closed/open

## Known Unknowns

- The exact dropdown structure for user switching is not visible yet.
- Only the empty state of the `行为习惯` tab has been provided so far; populated states are still unknown.
- Some top summary cards may open secondary modules not yet in scope.
- The post-submit result of `快速完成` and the running/completed states of the timer page have not been shown yet.
