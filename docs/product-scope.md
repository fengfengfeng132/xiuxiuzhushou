# Product Scope

## V1 Goal

Build a local offline dashboard for one family account that can:

- Track study plans.
- Track habit check-ins.
- Track reward redemption.
- Track electronic-pet adoption and interaction.
- Switch between multiple local child profiles.
- Persist state in `localStorage`.

## In Scope

- One local household workspace with multiple local profiles.
- Home dashboard modeled after the reference app's first screen.
- Plan creation.
- Structured plan creation with date, category, recurrence, timing, points, and attachments.
- Structured batch plan creation from formatted text input with live preview.
- AI-assisted plan creation from natural language or uploaded images, converting results into homepage study plans.
- A dedicated points and achievements center with balance summary, earning guidance, and a reward wishlist.
- A dedicated electronic-pet center with star-cost adoption, active-pet interaction, growth tiers, and local pet switching.
- A dedicated usage-help center with quick-start guidance, feature walkthrough cards, and direct links into implemented modules.
- A dedicated other-features hub with grouped feature cards, local search, service contact info, and app metadata.
- A dedicated achievements detail page with summary metrics and achievement-state guidance.
- A dedicated points-history page with range filters, summary stats, and grouped transaction records.
- A modal-based wish-creation flow with icon selection, cost rules, and multiple redemption modes.
- A star-rules explainer flow with a lightweight popover and a full canonical rules page.
- Historical plan cards on the homepage with completed-state detail and a plan-detail modal.
- Modal edit, delete, and redeem flows for wishlist items, including balance-aware confirmation states.
- Plan completion with star rewards.
- Habit completion with per-day limits.
- Reward redemption with insufficient-balance protection.
- Recent activity feed.
- Week-based date switching on the dashboard.
- Dashboard summary cards for key learning metrics and entry points.
- Dedicated `添加学习计划` page instead of an inline modal.
- Dedicated `批量添加学习计划` page instead of an inline modal.
- Dedicated `AI 智能创建` workspace instead of an inline modal.
- Dedicated `我的积分和成就` page from the homepage `积分成就` entry.
- Dedicated `成就系统` page from the points center.
- Dedicated `积分历史` page from the points center.
- Modal `添加我的愿望` flow from the points center wishlist area.
- Anchored `如何获得？` rules popover and dedicated `星星积分规则` page from the points center.

## Out of Scope

- Multi-user sync.
- Membership, payments, and cloud APIs.
- Production-ready external AI provider integration details. The user flow is now in scope, but provider strategy and reliability guarantees can be staged.
- Import and export.
- Large page routing trees.
- Attachment upload persistence beyond the local browser unless a later slice explicitly implements it.
- Attachment upload inside batch add. The reference page explicitly says batch add does not support attachments.

## Product Invariants

- Star balance is derived from transactions, never stored separately.
- Reward redemption must fail when balance is insufficient.
- Habit check-in must stop at the configured daily limit.
- Invalid or corrupted browser storage must fall back to a clean default state.
- The active profile must be explicit and user-switchable from the top-right profile control.
- Homepage tabs must preserve which primary board is active: `学习计划` or `行为习惯`.
- A saved plan must always have a category, a title, and a recurrence type.
- AI-generated plans must still resolve into the same structured plan model used by manual creation.
- Star balance displayed in the points center must remain consistent with the underlying transaction ledger.
- Electronic-pet adoption must fail when the current star balance is insufficient.
