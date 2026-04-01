# Plan Delete Selected Modal Spec

## Source

- Derived from the `删除任务` modal screenshot provided by the user on 2026-03-21.
- This modal is opened from the batch action bar on the plan-management page.

## Modal Goal

Let the user delete selected plans with an explicit choice between deleting only the current managed date or deleting the entire recurring task across all dates.

## Entry Point

- User selects one or more plans in `docs/page-specs/plan-management-page.md`.
- User clicks `删除选中`.

## Modal Structure

### 1. Header

- Title: `删除任务`
- Top-right close affordance.

### 2. Context Text

- The modal states how many selected tasks are affected.
- It clarifies that the selected item is a recurring task spanning dates.

### 3. Delete Scope Options

- Section label asks the user to choose a delete scope.
- Confirmed scope actions:
  - `仅删除 今天 (周五)`
  - `删除所有重复任务（所有日期）`

Requirement:
- The two delete options must be clearly differentiated by severity.
- The all-dates option uses strong destructive styling.

### 4. Warning Copy

- A caution note appears under the destructive option.
- The note explains that deleting all recurring tasks will remove historical records for future dates and cannot be undone.

### 5. Footer Action

- Secondary action: `取消`

Assumption:
- The scope buttons themselves may act as the primary destructive actions instead of a separate confirm button.

## Interaction Notes

- This is a modal flow.
- Delete scope must be explicit because recurring tasks span multiple dates.
- The page should preserve a strong destructive affordance for all-dates deletion.

## States Required

- modal closed
- modal open
- current-date-only delete path
- all-occurrences delete path

## Known Unknowns

- The exact success feedback after deletion has not been shown yet.
- The multi-select delete copy for more than one recurring task has not been shown yet.
