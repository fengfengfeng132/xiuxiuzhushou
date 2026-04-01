# Redeem Wish Confirm Modal Spec

## Source

- Derived from the `确认兑换愿望` modal screenshot provided on 2026-03-20.

## Entry

- Opened from a wish card in `我的积分和成就` by clicking `兑换`.
- This is a floating confirmation modal.

## Goal

Let the user review the selected wish, compare its cost against the current star balance, and confirm or block redemption.

## Layout

- Green header treatment with gift icon.
- Title: `确认兑换愿望`
- Close icon on the top right.

## Body

- Confirmation question:
  - `你确定要兑换这个愿望吗？`
- Wish summary card showing:
  - icon
  - title
  - semantic category
  - required stars
- Balance card showing:
  - `我的星星余额`
  - current star balance

## Affordability State

### Insufficient Balance

- Orange warning box inside the balance card.
- Message indicates:
  - `星星不足`
  - how many more stars are needed
- Primary action becomes disabled or visually blocked.
- Button label reflects the blocked state, e.g. `星星不足`.

### Sufficient Balance

- The primary action should allow redemption.
- Successful redemption should reduce star balance and update the wish according to its redemption mode.

## Footer Actions

- Left secondary button: `取消`
- Right primary action:
  - blocked when balance is insufficient
  - confirm redemption when balance is sufficient

## Behavior

- Affordability is determined by current balance versus wish cost.
- The check must happen at modal render time and again at confirm time.
- On success:
  - create a spend transaction
  - update the wish based on its redemption mode
  - refresh the points center

## Validation

Blocking:
- confirming redemption with insufficient balance
- confirming redemption for a depleted single-use or limited-use wish

Non-blocking:
- opening the modal for review only
