# Verification

## Blocking Scenarios

These scenarios must pass before work is considered done:

1. Default state is valid and satisfies domain invariants.
2. Adding a plan survives a JSON round trip.
3. Habit check-in increases completions and star balance exactly once per action.
4. Reward redemption deducts stars and increments redemption count.
5. Pet recycle removes the owned pet and refunds stars correctly.
6. Reward redemption fails cleanly when balance is insufficient.

## Evidence Output

`npm run verify` must write these files to `artifacts/evidence/latest/`:

- `verdict.json`
- `scenario-results.json`
- `state-default.json`
- `state-after-add-plan.json`
- `state-after-habit.json`
- `state-after-pet-recycle.json`
- `state-after-redeem.json`
- `summary.txt`

## Failure Policy

- Any structural guardrail failure is blocking.
- Any invariant failure is blocking.
- Any missing evidence file is blocking.
