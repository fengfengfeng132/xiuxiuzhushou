# Achievement System Spec

## Source

- Derived from the `成就系统` screenshot provided on 2026-03-20.
- This page is opened from `我的积分和成就` by clicking the `成就系统` entry card.

## Entry

- Entered from the points center `我的积分和成就`.
- This is a dedicated page, not a modal.

## Page Goal

Show the active profile's achievement progress, unlocked counts, and achievement-reward totals, while giving the user a clear empty-state explanation when no achievements are unlocked yet.

## Header

- Orange-to-red gradient hero area.
- Back button on the left.
- Title: `成就系统`
- Subtitle encouraging the user to complete challenges and unlock badges.
- Settings icon on the top right.

Requirement:
- The settings entry exists visually, but its destination is still unspecified.

## Summary Card

- Large white card below the header.
- Three headline metrics are centered in one row:
  - `已解锁`
  - `总成就`
  - `奖励星星`

Visible empty-state values in the screenshot:
- `0`
- `0`
- `0 星`

Requirement:
- These summary numbers must be derived from the same achievement data model as the rest of the page.

## Main Content State

### Empty State

- Large white content panel.
- Trophy icon in the center.
- Title:
  - `暂无成就数据`
- Supporting text tells the user to continue completing study tasks to unlock more achievements.

Requirement:
- Empty state should be the default when no achievement records exist.

## Achievement Tips Panel

- Large light-blue info panel at the bottom.
- Title:
  - `成就小贴士`
- Visible tip themes:
  - complete study tasks to unlock task achievements
  - keep a streak to unlock streak achievements
  - accumulate study time to unlock duration achievements
  - achievement reward stars are added automatically to balance

Requirement:
- This panel is instructional, not interactive.
- It should still render even when there are no achievements yet.

## Interaction Notes

- `返回` goes back to the points center.
- The settings icon likely opens achievement settings or filters, but no follow-up screen is shown yet.

## States Required

- no achievements
- some achievements unlocked
- summary metrics updated

## Validation

Blocking:
- summary counts inconsistent with the rendered achievement dataset

Non-blocking:
- zero achievements

## Known Unknowns

- populated achievement list layout
- meaning of `总成就` in non-empty state
- settings page behavior
- category/grouping structure once achievements exist
