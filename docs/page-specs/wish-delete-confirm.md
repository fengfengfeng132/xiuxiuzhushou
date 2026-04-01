# Delete Wish Confirm Modal Spec

## Source

- Derived from the `删除愿望` confirmation modal screenshot provided on 2026-03-20.

## Entry

- Opened from a wish card in `我的积分和成就` by clicking the delete action.
- This is a floating confirmation modal.

## Goal

Prevent accidental deletion of a wish and make the irreversible consequence explicit.

## Layout

- Red destructive header treatment with trash icon.
- Title: `删除愿望`
- Close icon on the top right.

## Body

- Confirmation question:
  - `你确定要删除这个愿望吗？`
- Large warning panel stating:
  - this action cannot be undone
  - the wish will be permanently removed from the wishlist
- Wish summary card showing:
  - icon
  - title
  - required stars

## Footer Actions

- Left secondary button: `取消`
- Right destructive button: `确认删除`

## Behavior

- `取消` closes the modal without mutation.
- `确认删除` removes the wish from the wishlist.
- After successful deletion, the wishlist should refresh immediately.

## Validation

Blocking:
- deleting a wish that no longer exists

Non-blocking:
- deleting a wish that has never been redeemed
