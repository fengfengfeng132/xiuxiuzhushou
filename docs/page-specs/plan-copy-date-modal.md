# Plan Copy To Date Modal Spec

## Source

- Derived from the `复制到指定日期` modal screenshot provided by the user on 2026-03-21.
- This modal is opened from the batch action bar on the plan-management page.

## Modal Goal

Let the user copy one or more selected plans from the currently managed date to a different target date.

## Entry Point

- User selects one or more plans in `docs/page-specs/plan-management-page.md`.
- User clicks `复制到...`.

## Modal Structure

### 1. Header

- Title: `复制到指定日期`
- Top-right close affordance.

### 2. Description

- The modal explains how many selected plans will be copied.
- It references both the current source date and the target date.

### 3. Date Input

- A date field at the top of the form showing the currently chosen target date.
- The screenshot example shows a selected value such as `今天 (周五)`.

### 4. Calendar Picker

- Inline or popover calendar view for selecting the target day.
- Month navigation controls are visible.
- Day grid is standard monthly calendar layout.
- The selected day is visually highlighted.

Requirement:
- The modal must support choosing a date different from the current source date.

### 5. Footer Actions

- `取消`
- `确认复制`

Requirement:
- Confirming should create new plan instances on the selected target date.

## Interaction Notes

- This is a modal flow.
- The source date comes from the current plan-management workspace.
- The modal should support copying multiple selected plans in one operation.

## States Required

- modal closed
- modal open
- target date unchanged
- target date changed
- one-plan copy
- multi-plan copy

## Known Unknowns

- The success feedback after copy has not been shown yet.
- Conflict handling when the target date already has similar plans has not been shown yet.
