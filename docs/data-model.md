# Data Model

## Reference Status

- This file reflects the homepage and `添加学习计划` screenshots available as of 2026-03-20.
- Fields marked `assumption` are inferred from visible UI and may tighten after more screenshots arrive.

## Profile

- `id`
- `name`
- `avatar`
- `role`

Purpose:
- Drives the top-right local user switcher.

## Study Plan

Required fields:
- `id`
- `profileId`
- `startDate`
- `category`
- `title`
- `repeatType`

Optional fields:
- `content`
- `categoryBadge`
- `statusLabel`
- `timeMode`
- `timeRangeStart`
- `timeRangeEnd`
- `durationMinutes`
- `dateEnd`
- `createdAt`
- `completedWindow`
- `sessionMinutes`
- `totalMinutes`
- `customPointsEnabled`
- `customPoints`
- `attachments`
- `completionRecords`

Derived fields:
- `occurrenceRuleSummary`
- `visibleDates`
- `status`
- `updatedAt`

## Enumerations

### `repeatType`

Known from UI:
- `仅当天`

Expected future variants:
- daily-like repeat
- weekly-like repeat

Note:
- The screenshots show explanatory text for one-time tasks and repeat tasks, so the domain should be designed for more than one repeat type even if only one is implemented first.

### `timeMode`

Known from UI:
- `timeRange`
- `duration`

### `attachment`

Fields:
- `id`
- `name`
- `mimeType`
- `size`
- `source`

Assumption:
- In early V1, attachments can be UI-level placeholders and do not need durable binary persistence yet.

## Validation Rules

- `startDate` defaults to today when not explicitly changed.
- `category` is required.
- `title` is required and limited to 100 characters.
- `content` is optional and limited to 1000 characters.
- `repeatType` is required.
- When `timeMode = duration`, `durationMinutes` must exist and be positive.
- When `timeMode = timeRange`, both `timeRangeStart` and `timeRangeEnd` must exist.
- When `customPointsEnabled = false`, scoring falls back to the system rule.

## Study Plan Completion Record

Purpose:
- Represents one completion segment or recorded study session for a plan.

Fields:
- `id`
- `dateKey`
- `startTime`
- `endTime`
- `minutes`
- `note`
- `attachments`

Rules:
- One plan can have multiple completion records on the same date.
- `totalMinutes` on the plan card/detail view is derived from the completion record set when not stored directly.

## Study Plan Board Card

Purpose:
- Represents the homepage card view for one plan on one selected date.

Fields:
- `planId`
- `dateKey`
- `boardVariant`
- `categoryColor`
- `categoryIcon`
- `categoryLabel`
- `title`
- `repeatLabel`
- `subtitle`
- `durationLabel`
- `rewardLabel`
- `statusLabel`
- `completionSummary`
- `primaryActions`

Enumerations:
- `boardVariant`: `today-active` | `history-completed`

Rules:
- `today-active` cards expose `quickComplete` and `startTimer` in `primaryActions`.
- `history-completed` cards expose completion metrics instead of the active action stack.
- The same underlying `Study Plan` may render differently depending on selected date and completion state.

## Quick Completion Draft

Purpose:
- Represents the temporary modal state while the user is finishing a plan from the homepage.

Fields:
- `planId`
- `mode`
- `hours`
- `minutes`
- `seconds`
- `totalMinutes`
- `note`
- `attachments`
- `startedAt`
- `endedAt`

Enumerations:
- `mode`: `durationInput` | `actualTime`

Rules:
- `durationInput` is the confirmed mode from the screenshots.
- `actualTime` must remain modeled even though its exact form is not fully visible yet.
- Attachments here belong to the completion event and should map into a `Study Plan Completion Record`.

## Study Timer Session

Purpose:
- Represents the dedicated timer workspace opened from a current-day plan card.

Fields:
- `id`
- `planId`
- `mode`
- `status`
- `hours`
- `minutes`
- `seconds`
- `targetDurationMinutes`
- `soundEnabled`
- `pomodoroIndex`
- `completedPomodoros`
- `recordingCount`
- `startedAt`
- `pausedAt`
- `completedAt`

Enumerations:
- `mode`: `elapsed` | `countdown` | `pomodoro`
- `status`: `idle` | `running` | `paused` | `completed`

Rules:
- `elapsed` starts from zero and does not require a target duration.
- `countdown` requires `targetDurationMinutes`.
- `pomodoro` defaults to a 25-minute work block and tracks pomodoro progress metadata.
- The timer page renders one active `Study Timer Session` at a time.

## Habit

Purpose:
- Represents one behavior habit shown in the `行为习惯` tab.

Fields:
- `id`
- `profileId`
- `name`
- `description`
- `frequency`
- `targetCount`
- `points`
- `approvalRequired`
- `icon`
- `color`
- `createdAt`
- `status`
- `completions`

Enumerations:
- `frequency`: `dailyOnce` | `dailyMultiple` | `weeklyMultiple`
- `status`: `active` | `archived`

Rules:
- `dailyOnce` implies one allowed completion per day.
- `dailyMultiple` implies multiple allowed completions per day up to `targetCount`.
- `weeklyMultiple` implies multiple allowed completions per week up to `targetCount`.
- `points` may be positive or negative, but must remain within the visible `-100` to `100` range.
- `approvalRequired = true` records that downstream reward issuance needs a later review step even if the review UI is not yet implemented.

## Habit Board State

Purpose:
- Represents the homepage `行为习惯` tab state for the active profile.

Fields:
- `profileId`
- `habitIds`
- `isEmpty`
- `selectedDate`
- `searchQuery`
- `activeFilter`
- `layoutMode`

Rules:
- `isEmpty = true` drives the `还没有行为习惯` empty state and `创建习惯` CTA.
- `selectedDate` drives the week strip and date-scoped check-in behavior.
- `searchQuery` and `activeFilter` are local board state and do not imply server-backed search.
- `layoutMode` reflects the visible grid/list toggle in the board toolbar.

## Habit Management Workspace

Purpose:
- Represents the dedicated habit-management page state outside the homepage shell.

Fields:
- `profileId`
- `habitIds`
- `isEmpty`
- `selectedHabitIds`
- `canImportFromOtherProfiles`
- `canSeedDefaults`

Rules:
- `isEmpty = true` drives the centered empty-state card and `创建第一个习惯` CTA.
- `habitIds` can be empty even when the homepage shell itself still exists.
- `selectedHabitIds` controls the populated-state selection bar and batch-delete affordance.

## Habit Creation Draft

Purpose:
- Represents the temporary modal state while the user is creating a habit.

Fields:
- `name`
- `description`
- `frequency`
- `targetCount`
- `points`
- `approvalRequired`
- `icon`
- `color`

Rules:
- `name` is required.
- `frequency` must be one of the visible modal options.
- `points` must be an integer in the `-100` to `100` range.
- `icon` and `color` are required selections.

## Habit Check-In Draft

Purpose:
- Represents the temporary modal state while the user is confirming one habit completion.

Fields:
- `habitId`
- `note`
- `useCustomPoints`
- `customPoints`

Rules:
- `note` is optional.
- When `useCustomPoints = false`, the resolved score falls back to the habit's configured default points.
- When `useCustomPoints = true`, `customPoints` must be an integer in the `-1000` to `1000` range.
- This draft affects only the current check-in and does not permanently change the habit definition.

## Habit Statistics Workspace

Purpose:
- Represents the dedicated analytics page opened from the homepage habit board.

Fields:
- `rangePreset`
- `referenceDate`
- `checkInCount`
- `totalPoints`
- `habitCount`
- `averagePoints`
- `rows`

Enumerations:
- `rangePreset`: `week` | `month` | `history`

Rules:
- `referenceDate` anchors the visible `本周` and `本月` calculations.
- `rows` may be empty, which drives the `暂无打卡记录` state.
- `totalPoints` should reflect habit check-in scoring rather than unrelated reward redemption or plan completion transactions.

## Pet Definition

Purpose:
- Represents one adoptable electronic-pet template shown in the pet center.

Fields:
- `id`
- `name`
- `species`
- `description`
- `emoji` or local visual token
- `accent`
- `accentSoft`
- `badge`
- `cost`

Rules:
- Pet definitions are local reference data rather than user-created content in V1.
- `cost` is the star amount required when the pet is not already owned.

## Owned Pet Companion

Purpose:
- Represents one locally adopted electronic pet for the active profile.

Fields:
- `definitionId`
- `profileId`
- `adoptedAt`
- `intimacy`
- `satiety`
- `cleanliness`
- `mood`
- `lastInteractionId`
- `lastInteractionAt`

Rules:
- `definitionId` must map to a valid `Pet Definition`.
- `satiety`, `cleanliness`, and `mood` stay within `0` to `100`.
- `intimacy` is non-negative and drives the visible level ladder.
- A profile owns at most one companion per pet definition.

## Pet Center Workspace

Purpose:
- Represents the dedicated electronic-pet area opened from the homepage summary strip.

Fields:
- `activePetDefinitionId`
- `companions`
- `starBalance`
- `visibleCatalogIds`
- `levelTiers`

Rules:
- When `companions` is empty, the page renders the adoption grid state.
- When `activePetDefinitionId` exists, the page renders the interaction workspace for that pet.
- `activePetDefinitionId` must always reference one owned companion when not null.

## Pet Interaction Action

Purpose:
- Represents one visible interaction card such as `喂食` or `去公园`.

Fields:
- `id`
- `title`
- `badge`
- `description`
- `intimacyDelta`
- `satietyDelta`
- `cleanlinessDelta`
- `moodDelta`

Rules:
- Actions update only the local companion state in V1.
- Interaction actions do not spend stars by default unless a later screenshot confirms a consumption rule.

## Plan Management Workspace

Purpose:
- Represents the dedicated management page for plans on a selected date.

Fields:
- `managedDate`
- `visiblePlanIds`
- `selectedPlanIds`
- `allSelected`
- `hasUnsavedOrder`
- `sortMode`

Rules:
- `selectedPlanIds` controls whether the batch action bar is visible.
- `hasUnsavedOrder` becomes true after drag sorting until the user saves.

## Plan Copy Draft

Purpose:
- Represents the copy-to-date modal state for selected plans.

Fields:
- `sourceDate`
- `targetDate`
- `selectedPlanIds`

Rules:
- One or more selected plans may be copied in a single operation.
- `targetDate` is required before confirmation.

## Plan Delete Selection Draft

Purpose:
- Represents the delete-scope modal state for selected plans in management mode.

Fields:
- `selectedPlanIds`
- `managedDate`
- `deleteScope`

Enumerations:
- `deleteScope`: `currentDateOnly` | `allOccurrences`

Rules:
- `allOccurrences` is destructive across the recurring task, not just the currently managed date.
- The chosen scope should be explicit before delete is executed.

## System Points Rule

Visible in the screenshot:
- base reward: `1`
- duration bonus examples:
  - `30分钟 +1 星`
  - `60分钟 +2 星`
- morning bonus:
  - `6:00-8:00 x1.2 倍`
- weekend bonus:
  - `x1.5 倍`

Note:
- These rules are currently product requirements from the UI copy, not yet implemented behavior.

## Batch Plan Import Draft

Purpose:
- Represents the temporary batch-add workspace before plans are saved.

Fields:
- `rawText`
- `startDate`
- `repeatType`
- `defaultDurationMinutes`
- `customPointsEnabled`
- `customPoints`
- `approvalRequired`
- `previewItems`

## Batch Preview Item

Fields:
- `id`
- `category`
- `title`
- `startDate`
- `repeatType`
- `durationMinutes`
- `customPointsEnabled`
- `customPoints`
- `approvalRequired`
- `parseWarnings`

Rules:
- One parsed task line becomes one preview item.
- Shared defaults apply unless a future slice adds per-item overrides.

## AI Conversation Session

Purpose:
- Stores one AI-assisted planning conversation for the `AI 智能创建` workspace.

Fields:
- `id`
- `profileId`
- `title`
- `createdAt`
- `updatedAt`
- `messages`
- `attachments`
- `generatedPlanDrafts`

## AI Conversation Message

Fields:
- `id`
- `sessionId`
- `role`
- `text`
- `createdAt`
- `status`

Enumerations:
- `role`: `user` | `assistant` | `system`
- `status`: `pending` | `done` | `error`

## AI Generated Plan Draft

Purpose:
- Temporary structured output produced by AI before or during conversion into saved homepage plans.

Fields:
- `id`
- `sessionId`
- `sourceMessageId`
- `title`
- `category`
- `content`
- `startDate`
- `repeatType`
- `durationMinutes`
- `timeRangeStart`
- `timeRangeEnd`
- `confidence`
- `warnings`
- `accepted`

Rules:
- AI output must map back to the same core study-plan schema used by manual and batch creation.
- Drafts may exist before final save if confirmation is required.

## Star Wallet Summary

Purpose:
- Represents the balance and summary metrics shown at the top of `我的积分和成就`.

Fields:
- `balance`
- `weekEarned`
- `monthEarned`
- `spentTotal`
- `dailyPotential`

## Daily Potential Entry

Fields:
- `id`
- `label`
- `stars`
- `remainingCount`

Purpose:
- Drives the optional `今日还可获得` panel.

## Wishlist Item

Purpose:
- Represents a redeemable wish in the points center.

Fields:
- `id`
- `profileId`
- `title`
- `description`
- `cost`
- `category`
- `semanticCategory`
- `repeatMode`
- `repeatConfig`
- `remainingLabel`
- `redeemedCount`
- `icon`
- `customImage`
- `shortfall`
- `approvalRequired`

Derived fields:
- `canRedeem`
- `displayGroup`
- `modeLabel`

Rules:
- `shortfall` is derived from current balance and cost.
- `canRedeem` is false when balance is insufficient.

## Wishlist Repeat Config

Purpose:
- Stores mode-specific redemption settings for a wishlist item.

Fields:
- `maxRedemptions`
- `resetPeriod`
- `redemptionsPerPeriod`

Enumerations:
- `resetPeriod`: `daily` | `weekly` | `monthly`

Rules:
- `single` mode does not require extra config.
- `multi` mode requires `maxRedemptions`.
- `cycle` mode requires both `resetPeriod` and `redemptionsPerPeriod`.
- `forever` mode does not require numeric limits.

## Wish Redemption Preview

Purpose:
- Drives the confirm-redeem modal.

Fields:
- `wishId`
- `cost`
- `currentBalance`
- `shortfall`
- `canRedeem`
- `blockedReason`

## Ui Toast Event

Purpose:
- Represents transient success feedback, such as after wish creation.

Fields:
- `id`
- `kind`
- `title`
- `message`
- `createdAt`

Enumerations:
- `kind`: `success` | `warning` | `error` | `info`

## Star Rule Definition

Purpose:
- Represents one canonical rule shown in the popover and full rules page.

Fields:
- `id`
- `title`
- `description`
- `kind`
- `baseReward`
- `multiplier`
- `examples`
- `ctaTarget`

Enumerations:
- `kind`: `base` | `bonus` | `streak` | `achievement` | `spend`

## Streak Reward Tier

Purpose:
- Represents one streak milestone in the rules page.

Fields:
- `days`
- `rewardStars`
- `label`

## Rule Summary Card

Purpose:
- Represents one preview row inside the `如何获得？` popover.

Fields:
- `id`
- `title`
- `subtitle`
- `rewardLabel`
- `icon`

## Achievement Summary Entry

Purpose:
- Represents the summary tiles that lead to `成就系统` and `积分历史`.

Fields:
- `id`
- `kind`
- `title`
- `subtitle`
- `icon`

## Achievement Overview

Purpose:
- Drives the top summary metrics in the dedicated `成就系统` page.

Fields:
- `unlockedCount`
- `totalCount`
- `rewardStars`

## Achievement Item

Purpose:
- Represents one achievement definition or earned badge.

Fields:
- `id`
- `title`
- `description`
- `category`
- `rewardStars`
- `status`
- `progressCurrent`
- `progressTarget`
- `unlockedAt`

Enumerations:
- `status`: `locked` | `unlocked`

Rules:
- `Achievement Overview` values are derived from the achievement item collection.
- Reward stars granted by achievements should also reconcile with the star wallet summary.

## Star Transaction Record

Purpose:
- Represents one row in the `积分历史` ledger.

Fields:
- `id`
- `profileId`
- `title`
- `category`
- `amount`
- `kind`
- `statusLabel`
- `createdAt`

Enumerations:
- `kind`: `gain` | `spend`

Rules:
- Positive `amount` values correspond to `gain`.
- Negative `amount` values correspond to `spend`.
- Electronic-pet adoption should appear here as a negative local transaction.

## Star History Filter

Purpose:
- Represents the current view state for `积分历史`.

Fields:
- `rangePreset`
- `customStartDate`
- `customEndDate`
- `recordType`

Enumerations:
- `rangePreset`: `all` | `7d` | `30d` | `90d` | `custom`
- `recordType`: `all` | `gain` | `spend`

## Star History Summary

Purpose:
- Drives the four summary cards in `积分历史`.

Fields:
- `earned`
- `spent`
- `net`
- `recordCount`

## Star History Group

Purpose:
- Represents one date bucket in the record list.

Fields:
- `dateKey`
- `title`
- `summaryAmount`
- `records`
