# Xiuxiuzhushou Agent Guide

## Mission
- Rebuild `xiuxiuzhushou` as a local-first study assistant.
- Keep the codebase small, recoverable, and safe for long-running agent work.

## Start Here
- Read this file first.
- Read `harness/harness-tasks.json` and `harness/harness-progress.txt` before resuming work.
- Default recovery path:
  - Read `docs/architecture.md` and `docs/verification.md`.
  - Read only the relevant files in `docs/page-specs/` for the feature you are changing.
  - Read only the related shared docs among `docs/product-scope.md`, `docs/data-model.md`, and `docs/user-flows.md`.
- Expand to the full core-doc set only when the task is cross-cutting, changes shared invariants, or local context is insufficient.

## Repository Map
- `src/domain/model.ts`: public domain barrel for the rest of the app.
- `src/domain/*.ts`: pure business model modules, commands, invariants, and reference data.
- `src/persistence`: storage boundary for browser state.
- `src/App.tsx`: thin UI entry only.
- `src/ui`: UI state orchestration, page rendering, and local view helpers.
- `src/ui/timer`: dedicated study-timer workflow entered from plan cards.
- `src/styles.css`: stylesheet entry that imports focused style modules.
- `src/styles`: split CSS modules by feature area.
- `scripts/architecture-guardrails.ts`: structural checks.
- `scripts/closed-loop-testing.ts`: scenario checks and evidence output.
- `docs/`: scope, architecture, and verification rules.
- `docs/page-specs`: page-level reference specs derived from screenshots and user notes.
- `harness/`: execution memory for long-running work.

## Guardrails
- Keep business rules inside `src/domain/` and re-export the public surface from `src/domain/model.ts`.
- Do not import React, browser APIs, or persistence code into `src/domain`.
- Keep `src/App.tsx` thin; new UI work should usually land in `src/ui/*`.
- Treat `docs/verification.md` scenarios as blocking.
- Run `npm run check` before handing off work.
- For each completed update, commit and push to `origin` by default unless the user explicitly says not to push.

## Recovery Workflow
- Confirm current milestone in `harness/harness-tasks.json`.
- Read the latest entry in `harness/harness-progress.txt`.
- Run `npm run guardrails`.
- Run `npm run verify`.
- Run `npm run build`.

## Current Milestone
- V1 is a local dashboard for plans, habits, rewards, and star balance.
- Editing, richer history, and export/import remain follow-up work.


