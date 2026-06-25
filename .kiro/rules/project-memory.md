# Project Memory Rule

## Mandatory Behavior

1. **Always read `project-memory/` files first** before modifying any code in this repository.
2. **Continue from the latest session** documented in `project-memory/08_SESSION.md`.
3. **Never rebuild completed features** — check `project-memory/03_PROGRESS.md` before implementing anything.
4. **Preserve existing architecture** as documented in `project-memory/02_ARCHITECTURE.md`.
5. **Update `project-memory/08_SESSION.md`** whenever work ends — record date, work completed, files modified, blockers, and next task.
6. **Keep `01_BRAIN.md`, `03_PROGRESS.md`, and `05_BUGS.md` synchronized** after making changes that affect project state, completion status, or introduce/fix bugs.

## Reading Order

When starting a new session: `00_READ_FIRST.md` → `01_BRAIN.md` → `02_ARCHITECTURE.md` → `03_PROGRESS.md` → `08_SESSION.md`

## When to Update Memory Files

| Event | Files to Update |
|-------|----------------|
| Task completed | 03_PROGRESS.md, 08_SESSION.md |
| Bug found | 05_BUGS.md |
| Bug fixed | 05_BUGS.md, 08_SESSION.md |
| Architecture changed | 01_BRAIN.md, 02_ARCHITECTURE.md |
| Decision made | 06_DECISIONS.md |
| Work session ends | 08_SESSION.md (always) |
