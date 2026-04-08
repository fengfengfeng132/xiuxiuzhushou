# Plan Points Review Modal Spec

## Source

- Derived from two `积分审定` modal screenshots provided by the user on 2026-04-08.
- Triggered from the homepage pending-review strip (`逐个审定`).

## Goal

Allow a reviewer to decide whether a completed plan should grant points, adjust the points, or reject points.

## Header

- Left: icon + title `积分审定`
- Subtitle: `审定并发放任务积分`
- Right: current decision badge (`通过` / `调整` / `拒绝`) and close button.

## Content

### 1. Task Summary

- Subject badge
- Completion date/time
- Plan title
- Summary line with:
  - study duration
  - completion/session count

### 2. Review Actions

- Three mutually exclusive cards:
  - `通过` (default points)
  - `调整` (manual points)
  - `拒绝` (0 points)

### 3. Adjusted Points Input

- Visible only when `调整` is selected.
- Field label: `调整后积分数值`
- Value range: `-1000` to `1000`.

### 4. Review Note

- Label: `审定说明`
- Optional for `通过` / `拒绝`.
- Required for `调整`.
- Length counter up to 200 chars.

### 5. Result Preview

- Summary row: `发放积分：X ⭐`
- Value updates based on selected action.

## Footer

- Left button: `取消`
- Right button: `确认审定`
- Confirm button disabled when validation fails (e.g., `调整` with invalid value or missing reason).

## Expected Behavior

- Submitting `通过` grants normal plan reward.
- Submitting `调整` grants the manual value.
- Submitting `拒绝` grants 0 points.
- On success, the reviewed record leaves the pending queue.
