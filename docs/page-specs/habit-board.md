# Habit Board Spec

## Source

- Derived from the `行为习惯` tab screenshots provided by the user on 2026-03-21.
- This board lives inside the homepage shell and is reached by switching the main tab.

## Board Goal

Provide a habit-focused dashboard surface inside the homepage, allowing the user to review current habit state, filter visible habits, browse by week/day, and enter dedicated management when needed.

## Entry Point

- User clicks the `行为习惯` tab in `docs/page-specs/home-dashboard.md`.

## Empty State

- The main white rounded board remains inside the homepage shell.
- Centered empty-state icon appears near the middle of the board.
- Primary empty-state title: `还没有行为习惯`.
- Secondary helper text explains the user should create habits first, then start checking in.
- A blue primary button appears under the copy:
  - `创建习惯`

Requirement:
- The empty state must feel like a first-class product state, not an error.
- The CTA should remain visually prominent and centered within the board.

## Populated State

### 1. Section Header

- Left side title uses an accent bar + text:
  - `我的行为习惯`
- Right side actions:
  - `数据统计`
  - `习惯管理`

### 2. Week And Date Strip

- A rounded inner panel sits inside the board.
- The top row shows the current week label.
- Right-side controls include:
  - `可补打卡`
  - `今天`
  - previous-day button
  - next-day button
  - calendar button
- The next row is a 7-day strip showing weekday and month/day.
- The selected day uses a strong blue filled state.
- Each date cell may show a small completion dot.

### 3. Search And Filters

- A full-width search field appears below the date strip.
- Right side of the same row includes reset and layout-toggle controls.
- A chip row appears under the search field.

Visible filters from the screenshot:
- `全部`
- `加分`
- `扣分`
- `已完成`
- `待完成`
- `每日多次`
- `每周多次`

### 4. Habit Cards

- Habits render as rounded cards inside the same board.
- The card shows:
  - icon chip
  - habit title
  - compact tags such as `每日一次` and `+1 积分`
  - a status indicator
  - a bottom/right `打卡` action

Requirements:
- The populated board should still feel lighter than the management page.
- Check-in cards are for doing habits, not editing them.
- Search, filter, and view toggles can be local UI state; they do not imply cloud sync or server-backed search.

## Layout Notes

- The homepage header, summary cards, and tab shell remain visible.
- Only the main board content changes when switching from `学习计划` to `行为习惯`.
- The habits board uses the same large white rounded container style as the plan board.

## Interaction Notes

- Switching to `行为习惯` should not navigate away from the homepage shell.
- Clicking `习惯管理` should open the dedicated management page documented in `docs/page-specs/habit-management-page.md`.
- Clicking `数据统计` should open the dedicated page documented in `docs/page-specs/habit-statistics-page.md`.
- Clicking `打卡` should open the modal documented in `docs/page-specs/habit-checkin-modal.md`.
- Confirming that modal should then record a local habit completion against the selected date.
- Clicking `今天` resets the selected date to the current local day.

## States Required

- tab inactive
- tab active
- empty habits state
- populated board state
- search/filter empty-result state
- create/manage CTA idle/hover/pressed
- check-in CTA idle/hover/pressed

## Known Unknowns

- The downstream `数据统计` page has not been shown yet.
- The meaning of `可补打卡` is confirmed as an entry/control, but its exact rule text is still unknown.
- The alternate list-layout state is implied by the toggle, but no screenshot shows it active yet.
