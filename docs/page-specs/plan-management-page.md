# Plan Management Page Spec

## Source

- Derived from the `管理` page screenshots provided by the user on 2026-03-21.
- This page is entered from the `我的计划` section on the homepage.

## Page Goal

Provide a focused management workspace where the user can reorder plans for a selected date, select one or more plans, and perform batch operations such as copy, share, or delete.

## Entry Point

- User clicks `管理` on the right side of the `我的计划` section in `docs/page-specs/home-dashboard.md`.

## Layout Zones

### 1. Top Header

- Large blue gradient header.
- Left action: `取消`
- Center title: `计划管理`
- Centered date-navigation group with:
  - `今天`
  - previous-day button
  - selected date chip
  - next-day button
- Right action: `保存`

Requirement:
- Date navigation changes the date currently being managed.
- Reordered state should not be considered final until the user saves.

### 2. Selection Bar

- A top white rounded bar under the header.
- Default state shows a leading checkbox and `全选`.
- Selected state shows:
  - selected count, for example `已选择 1 个`
  - batch actions on the right

### 3. Batch Action Group

- Visible after one or more plans are selected.
- Confirmed actions:
  - `复制到...`
  - `分享计划`
  - `删除选中`

Known unknown:
- The downstream sharing surface has not been shown yet.

### 4. Usage Instructions Panel

- Blue helper box under the selection bar.
- Explains how to:
  - change date
  - drag handles to sort
  - apply order to visible tasks
  - use multi-select
  - copy non-today tasks to today
  - share plans as a template
  - save after finishing edits

Requirement:
- This panel is informational and should remain visible in management mode.

### 5. Plan List

- Vertical list of white rounded cards.
- Each card includes:
  - checkbox on the left
  - category badge
  - repeat badge such as `每天`
  - plan title
  - drag handle on the right

Requirement:
- Cards should support drag-and-drop ordering through the handle.
- Selection and drag affordances must coexist without conflict.

## Interaction Notes

- This is a dedicated page, not a modal.
- The page is scoped to a selected date, but destructive actions may still apply across all dates for recurring tasks.
- The selected count should update immediately as checkboxes change.
- `保存` should commit the new ordering and any management-side changes.

## States Required

- no selection
- one or more plans selected
- all selected
- different managed date selected
- reordered-but-unsaved
- saving

## Known Unknowns

- The success surface after `保存` has not been shown yet.
- The share-plan flow after `分享计划` has not been shown yet.
- The drag result while multiple items are selected has not been shown yet.
