# Points And Achievements Spec

## Source

- Derived from two `我的积分和成就` screenshots provided on 2026-03-20.
- The screenshots cover:
  - empty wishlist state
  - populated wishlist state with one reusable wish
  - top summary state with and without the `今日还可获得` panel

## Entry

- Entered from the homepage summary-card row by clicking `积分成就`.
- This is a dedicated page, not a modal.

## Page Goal

Give the active profile one place to:

- review current star balance
- understand recent earning progress
- navigate to achievements and star history
- manage and redeem wishlist rewards

## Header

- Purple-to-pink gradient hero area.
- Back button on the left.
- Title: `我的积分和成就`
- Subtitle encouraging the user to finish tasks, earn stars, and redeem wishes.

## Top Summary Card

- Large white summary card below the header.
- Main metric:
  - current star balance, e.g. `19 星` or `12 星`
- Right-side helper link:
  - `如何获得?`

### How-To-Get Popover

- Clicking `如何获得?` opens the anchored panel documented in `docs/page-specs/star-rules-popover.md`.
- The popover previews the main earning rules and includes a `查看完整规则` action.

Requirement:
- The trigger should not navigate immediately; it opens the summary panel first.

### Summary Metrics

Visible metrics:
- `本周`
- `本月`
- `已消费` (visible in one screenshot)

Requirement:
- These values are balance-adjacent summaries derived from the same transaction system.

### Optional Daily Earning Panel

- In one screenshot, a blue-highlighted panel appears under the balance.
- Title:
  - `今日还可获得`
- It lists remaining earning opportunities for the day and the star counts tied to them.
- It ends with a stronger summary line such as:
  - `今天最多还能获得 7 星`

Requirement:
- This panel is conditional.
- It appears when there are still unfinished earning opportunities for the current day.

## Secondary Entry Cards

- Two large cards below the top summary:
  - `成就系统`
  - `积分历史`

Requirement:
- These are navigation tiles into deeper modules.
- `成就系统` leads to the dedicated page documented in `docs/page-specs/achievement-system.md`.
- `积分历史` leads to the dedicated page documented in `docs/page-specs/points-history.md`.

## Main Section: 我的愿望清单

- White rounded content panel.
- Section title:
  - `我的愿望清单`
- Controls on the right:
  - sort dropdown, defaulting to `默认排序`
  - primary action button: `添加愿望`

## Wishlist States

### Empty State

- Large soft panel with gift icon.
- Copy indicates there are no wishes yet.
- Primary button:
  - `添加第一个愿望`

Requirement:
- Empty state should feel actionable rather than broken.

### Populated State

- Wishes are grouped; visible group title:
  - `可重复愿望`
- Group chip shows count, e.g. `1个`
- Another screenshot shows grouping by redemption mode:
  - `单次愿望`
  - group count chip, e.g. `1个`

Requirement:
- Group labels may be derived from redemption mode.
- The UI should support multiple groups when different wish modes coexist.

### Wish Card Structure

Visible fields from the screenshot:
- icon
- category badge such as `玩具`
- title, e.g. `玩游戏15分钟`
- cost, e.g. `50 星`
- edit action
- delete action
- redeem button
- shortfall message, e.g. `差 38 星`

Additional observed variant:
- a compact single-wish card with:
  - icon
  - semantic category badge
  - title
  - cost only
  - green enabled `兑换` button when affordable

Requirement:
- The redeem button must reflect affordability.
- When balance is insufficient, shortage should be explicit.
- Editing opens the same modal shell as creation, but prefilled.
- Deleting opens the confirmation modal documented in `docs/page-specs/wish-delete-confirm.md`.
- Redeeming opens the confirmation modal documented in `docs/page-specs/wish-redeem-confirm.md`.

### Success Feedback

- After adding a wish, the product shows a bottom-right toast.
- Visible message pattern:
  - `愿望添加成功！`
  - `需要 10 星 才能兑换这个愿望`

Requirement:
- Toast copy should confirm success and remind the user of the required star cost.

## Interaction Notes

- `添加愿望` and `添加第一个愿望` open the modal documented in `docs/page-specs/add-wish-modal.md`.
- `成就系统` and `积分历史` are linked modules, not inline expansions in the current screenshot.
- The sort dropdown changes wishlist ordering only, not the overall points summary.
- `编辑` reopens the add-wish modal with existing values.
- `删除` is destructive and requires confirmation.
- `兑换` always performs a balance check before final confirmation.
- `如何获得?` opens the rules popover first, then can navigate to the full rules page.

## States Required

- empty wishlist
- populated wishlist
- affordable wish
- unaffordable wish
- daily earning panel visible
- daily earning panel hidden

## Validation

Blocking:
- redeeming a wish when balance is insufficient

Non-blocking:
- empty wishlist
- hidden daily earning panel

## Known Unknowns

- exact sort options
- `成就系统` detail layout
- `积分历史` detail layout
