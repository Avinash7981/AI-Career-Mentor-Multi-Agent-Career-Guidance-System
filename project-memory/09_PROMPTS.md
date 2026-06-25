# 09 - Standard Prompts

## Session Start Prompt

```
Read all files in project-memory/ before doing anything.
Continue from where the last session left off (see 08_SESSION.md).
Check 04_TODOS.md for the next task.
Check 05_BUGS.md for known issues.
Do not rebuild or re-implement anything already completed.
```

## Quick Context Prompt

```
This is the AI Career Mentor V2 project — a multi-agent system using Google ADK.
Stack: React 19 + Vite (frontend), Express 5 + @google/adk 1.3 (backend), Gemini 2.5 Flash.
Architecture: Orchestrator agent routes to 3 specialists (Resume, Career, Interview) via AgentTool.
All implementation tasks are complete. See project-memory/ for full context.
```

## Bug Fix Prompt

```
Read project-memory/05_BUGS.md first.
The issue is: [describe issue].
Investigate the root cause by reading the relevant files.
Do not modify unrelated code.
After fixing, update 05_BUGS.md with the resolution.
```

## Feature Addition Prompt

```
Read project-memory/ files first.
Check 02_ARCHITECTURE.md to understand the system.
Check 07_CODE_STYLE.md for conventions.
The feature to add is: [describe feature].
After implementation, update 03_PROGRESS.md and 08_SESSION.md.
```
