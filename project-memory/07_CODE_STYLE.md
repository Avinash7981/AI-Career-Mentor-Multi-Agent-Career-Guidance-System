# 07 - Code Style

## General

- No TypeScript — pure JavaScript throughout
- Backend: CommonJS (`require`/`module.exports`)
- Frontend: ESM (`import`/`export`)
- Indentation: 2 spaces
- Semicolons: Yes (backend), Yes (frontend)
- Quotes: Double quotes (backend), Double quotes (frontend)

## React (Frontend)

- Functional components only — no class components
- Named exports for components (`export default function AgentBadge`)
- One component per file
- Components in `src/components/` directory
- State via `useState` with lazy initializers for localStorage hydration
- No useEffect for synchronous initialization
- Props destructured in function signature

## Backend

- Express route handlers as `async (req, res) => { ... }`
- Error handling via try/catch with `buildErrorResponse()`
- Agent files export a single named constant (e.g., `{ resumeAgent }`)
- Tool files export named tool constants
- Prompt files export a single string constant
- Console logging with prefixes: `[EVENT]`, `[ROUTING]`, `[RESULT]`, `[Context]`

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files (components) | PascalCase.jsx | AgentBadge.jsx |
| Files (backend modules) | camelCase.js | resumeAgent.js |
| Files (prompts) | kebab.prompt.js | resume.prompt.js |
| React components | PascalCase | ChatMessage |
| Functions | camelCase | handleSend |
| Constants | camelCase | orchestratorPrompt |
| ADK agent names | snake_case | resume_agent |
| ADK tool names | snake_case | parse_resume |
| CSS classes | kebab-case | agent-badge |

## Project Structure Rules

- No duplicate code — extract into helpers or components
- Prompts live in `prompts/` directory, not inline in agents
- Tools live in `tools/` directory, not inline in agents
- Session logic in `sessions/` directory
- Frontend components in `src/components/`
- No unused imports (enforced by ESLint)
