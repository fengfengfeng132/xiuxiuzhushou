# Star Rules Popover Spec

## Source

- Derived from the `如何获得？` popover screenshot provided on 2026-03-20.
- This popover is opened from the top summary card in `我的积分和成就`.

## Entry

- Opened by clicking `如何获得？` on the points center summary card.
- This is a lightweight anchored floating panel, not a full modal.

## Goal

Give the user a short, scannable explanation of the main ways to earn stars, then provide a direct link to the full rules page.

## Layout

- Anchored to the top-right `如何获得？` trigger.
- White floating panel with soft shadow.
- Title:
  - `星星获取规则`

## Rule Preview Items

Visible preview rows:
- `完成任务`
  - note: complete one learning task
  - reward: `1 星`
- `时间奖励`
  - note: `学习30分钟 +1 星，60分钟 +2 星`
  - reward summary: `+1~2 星`
- `全勤奖励`
  - note: complete all tasks for the day
  - reward summary: `+可配置 星`
- `连续打卡`
  - note: streak-based reward after continuous check-ins
  - reward summary: `+10 星`

Requirement:
- This popover is a summary, not the full source of truth.
- Each item should be consistent with the full rules page.

## Footer

- Small reminder line noting extra bonuses for morning study and weekend study.
- Primary footer button:
  - `查看完整规则`

Requirement:
- Clicking the footer button navigates to the dedicated `星星积分规则` page.

## Interaction Notes

- Clicking outside should close the popover.
- Reopening the popover should not reset any actual balance state, only visibility.

## States Required

- closed
- open

## Known Unknowns

- keyboard/focus behavior
- whether the popover should also close when the user navigates to another points subpage
