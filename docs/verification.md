# Verification

## Blocking Scenarios

These scenarios must pass before work is considered done:

1. Default state is valid and satisfies domain invariants.
2. Adding a plan survives a JSON round trip.
3. Approval-required plan completions do not award stars until review approval.
4. Habit check-in increases completions and star balance exactly once per action.
5. Reward redemption deducts stars and increments redemption count.
6. Wish edit and delete update the same wish identity and remove it cleanly.
7. Pet recycle removes the owned pet and refunds stars correctly.
8. Reward redemption fails cleanly when balance is insufficient.

## Evidence Output

`npm run verify` must write these files to `artifacts/evidence/latest/`:

- `verdict.json`
- `scenario-results.json`
- `state-default.json`
- `state-after-add-plan.json`
- `state-after-plan-review.json`
- `state-after-habit.json`
- `state-after-pet-recycle.json`
- `state-after-reward-manage.json`
- `state-after-redeem.json`
- `summary.txt`

## Failure Policy

- Any structural guardrail failure is blocking.
- Any invariant failure is blocking.
- Any missing evidence file is blocking.
