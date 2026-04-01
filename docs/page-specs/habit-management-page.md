# Habit Management Page Spec

## Source

- Derived from the `行为习惯管理` screenshots provided by the user on 2026-03-21.
- Reached from the homepage `行为习惯` area rather than replacing the full app shell permanently.

## Page Goal

Provide a dedicated management surface for creating, selecting, and maintaining local behavior habits before the user starts or adjusts daily check-ins.

## Entry Points

- Homepage summary card `行为习惯`.
- Homepage `行为习惯` tab CTA `习惯管理`.
- Homepage empty-state CTA `创建习惯`.

## Layout Zones

### 1. Header

- Large blue gradient header strip consistent with the homepage brand.
- Back affordance on the left.
- Page title: `行为习惯管理`.
- Subtitle explains the page is for creating and managing habits.

### 2. Top Action Bar

- Right-aligned action buttons:
  - `新建习惯`
  - `导入其他用户习惯`
  - `添加默认习惯`

Requirements:
- `新建习惯` is the primary visual action.
- The other two actions may remain partial or placeholder until their downstream flows are fully known.

### 3. Empty State

- Centered white rounded card with shadow.
- Circular icon above the title.
- Primary title: `还没有行为习惯`.
- Supporting copy encourages the user to create the first habit and earn stars.
- Center CTA button:
  - `创建第一个习惯`

Requirements:
- Empty state should feel like the default starting point for a new child profile.
- The CTA and top-right `新建习惯` action should both open the same creation modal.

### 4. Populated State

- A slim rounded selection bar appears above the list.
- Left side shows selected-count context:
  - `已选择 0 / N`
- Right side exposes three actions:
  - `全选`
  - `清空选择`
  - `批量删除`
- Habits render as full-width rounded rows rather than large cards.

Row structure:
- left checkbox
- icon chip
- habit title
- compact tags such as `每日一次` and `+1 积分`
- right-side icon actions for edit, delete, and drag-sort/reorder affordance

Requirements:
- The selection bar remains visible even when nothing is currently selected.
- `批量删除` should be visually destructive.
- The row layout should read as a management list, not as a homepage check-in card.

## Interaction Notes

- Clicking back returns to the homepage shell and keeps the `行为习惯` tab active.
- Clicking `新建习惯` opens the modal documented in `docs/page-specs/habit-create-modal.md`.
- Clicking `创建第一个习惯` opens the same modal.
- Clicking `导入其他用户习惯` opens a future flow that is still unspecified.
- Clicking `添加默认习惯` may seed local default habits if no dedicated picker exists yet.
- Clicking the row delete action removes that habit from active surfaces.
- Clicking `批量删除` removes every currently selected habit from active surfaces.
- Edit and drag-sort affordances are confirmed visually, but their downstream behavior is still only partially known.

## States Required

- empty page
- populated page with zero selected rows
- populated page with one or more selected rows
- primary button idle/hover/pressed
- destructive button idle/hover/pressed
- back navigation

## Known Unknowns

- The exact edit-habit form has not been shown yet.
- The exact import flow for `导入其他用户习惯` is still unknown.
- The exact default-habit picker for `添加默认习惯` is still unknown.
- Drag sorting is visually confirmed, but the save/apply behavior has not been shown.
