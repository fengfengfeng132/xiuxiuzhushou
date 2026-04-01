# Architecture

## Layers

### Domain

- Files: `src/domain/model.ts`, `src/domain/*.ts`
- Responsibility: `src/domain/model.ts` is the public barrel; focused domain modules under `src/domain/` hold state shape, pure commands, invariant checks, and summary helpers.
- Allowed imports: TypeScript standard library only.

### Persistence

- File: `src/persistence/storage.ts`
- Responsibility: `localStorage` load, save, reset, and corruption fallback.
- Allowed imports: `src/domain/model.ts`.

### UI

- Files: `src/App.tsx`, `src/ui/*.ts(x)`, `src/main.tsx`, `src/styles.css`, `src/styles/*.css`
- Responsibility: `src/App.tsx` stays a thin entry; `src/ui/` owns rendering, forms, event wiring, and local user feedback; `src/styles.css` is the stylesheet entry that imports focused style modules.
- Allowed imports: React, `src/domain/model.ts`, `src/persistence/storage.ts`, and other UI/style modules.

## Guardrail Rules

- Domain code must not import React, browser globals, or persistence code.
- Persistence code must not import UI code.
- UI code should call domain commands instead of mutating state inline.
- Feature-specific UI work should usually happen in `src/ui/*`, not in `src/App.tsx`.
- Verification scripts are the enforcement layer for these rules.
