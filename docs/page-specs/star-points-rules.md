# Star Points Rules Page Spec

## Source

- Derived from the `星星积分规则` screenshot provided on 2026-03-20.
- This page is opened from the `如何获得？` popover by clicking `查看完整规则`.

## Entry

- Entered from the points center rules popover.
- This is a dedicated page, not a modal.

## Page Goal

Provide the canonical explanation of how stars are earned, multiplied, streaked, tied to achievements, and spent on wishlist rewards.

## Header

- Green gradient hero area.
- Back button on the left.
- Title: `星星积分规则`
- Subtitle encouraging the user to understand earning rules and realize wishes.

## Section 1: 快速总结

- White summary card below the hero.
- Title: `快速总结`
- One compact sentence explains the overall rule system:
  - complete tasks to earn base stars
  - gain time rewards
  - gain full-attendance rewards
  - exchange stars for wishes

Requirement:
- This section is explanatory and concise.

## Section 2: 基础获得方式

- White panel with section title: `基础获得方式`
- Includes multiple rule cards.

### Rule Card: 完成学习任务

- Explains that each finished learning task grants a base star reward.
- Visible label on the right:
  - `基础 1 星`
- Includes small examples for different task types.

### Rule Card: 学习时长奖励

- Explains duration-based bonus.
- Visible reward label:
  - `+1~2 星`
- Visible thresholds:
  - `学习 30 分钟 +1 星`
  - `学习 60 分钟 +2 星`

### Rule Card: 每日全勤奖励

- Explains reward for completing all tasks of the day.
- Visible reward label:
  - `+可配置 星`
- Includes note that the exact amount can be configured.

Requirement:
- These cards define base earning rules and should match any popover summaries and add-plan scoring guidance.

## Section 3: 加成奖励

- White panel with section title: `加成奖励`
- Contains additive or multiplicative rule cards.

### Rule Card: 早起学习加成

- Condition:
  - morning study around `6:00-8:00`
- Multiplier:
  - `x1.2`
- Includes an example calculation.

### Rule Card: 周末学习加成

- Condition:
  - Saturday/Sunday study
- Multiplier:
  - `x1.5`
- Includes an example calculation.

### Rule Card: 多重加成叠加

- Explains that morning and weekend multipliers can stack.
- Includes a worked example.

Requirement:
- Multiplier examples should be illustrative and consistent with the canonical scoring model.

## Section 4: 连续打卡奖励

- White panel with section title: `连续打卡奖励`
- Visible streak reward tiles:
  - `连续 7 天 -> 10 星`
  - `连续 30 天 -> 50 星`
  - `连续 100 天 -> 200 星`
  - `连续 365 天 -> 1000 星`
- Includes a reminder that the streak requires completing at least one task per day.

Requirement:
- Streak tiers should be modeled as structured reward thresholds.

## Section 5: 成就系统

- White panel with section title: `成就系统`
- Explains that unlocking achievements can also grant additional stars.
- Visible example achievement categories:
  - `任务达人`
  - `学霸之路`
  - `进步之星`
  - `坚持不懈`
- Includes an action:
  - `查看所有成就`

Requirement:
- This section is a bridge into the achievement system.

## Section 6: 如何使用星星

- White panel with section title: `如何使用星星`
- Large yellow information block describing wishlist redemption guidance.
- Visible reward-price guidance:
  - small wishes: `5-20 星`
  - medium wishes: `20-50 星`
  - large wishes: `50-200 星`
  - super wishes: `200+ 星`
- Visible CTA:
  - `前往愿望清单`

Requirement:
- This section connects earning rules with actual spending behavior in the wishlist module.

## Section 7: 获得星星的小技巧

- Light-blue tips panel near the bottom.
- Visible themes:
  - study early to gain bonus
  - use timer to get duration rewards
  - finish all tasks to get full-attendance rewards
  - study on weekends for higher multiplier
  - keep the streak for bigger rewards

Requirement:
- This section is informational and non-blocking.

## Interaction Notes

- `返回` goes back to the previous points-related surface.
- `查看所有成就` should navigate into the achievement system.
- `前往愿望清单` should navigate back to the points center's wishlist section or open the wishlist view directly.

## States Required

- default rules page
- rule cards present
- streak tiers visible
- CTA navigation available

## Validation

Blocking:
- mismatch between canonical rules page and actual scoring rules used by the app

Non-blocking:
- viewing the page without any current transactions or achievements

## Known Unknowns

- whether `前往愿望清单` scrolls within the points center or navigates to a fresh page state
- whether `查看所有成就` lands on the existing achievement page directly or on an intermediate list
