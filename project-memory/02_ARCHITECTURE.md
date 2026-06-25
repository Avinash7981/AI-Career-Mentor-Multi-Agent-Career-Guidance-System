# 02 - Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                         │
│  App.jsx → ChatMessage → AgentBadge                     │
│  sessionId stored in localStorage                        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js/Express Backend (server.js)          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         ADK Runner + InMemorySessionService         │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │      Orchestrator Agent (root_agent)         │  │ │
│  │  │      instruction: MUST call tools            │  │ │
│  │  │      tools: [resumeTool, careerTool,         │  │ │
│  │  │              interviewTool]                   │  │ │
│  │  └──────┬──────────────┬──────────────┬────────┘  │ │
│  │         │              │              │            │ │
│  │    AgentTool      AgentTool      AgentTool         │ │
│  │         │              │              │            │ │
│  │         ▼              ▼              ▼            │ │
│  │  ┌───────────┐  ┌───────────┐  ┌─────────────┐   │ │
│  │  │  Resume   │  │  Career   │  │  Interview  │   │ │
│  │  │  Agent    │  │  Agent    │  │  Agent      │   │ │
│  │  └───────────┘  └───────────┘  └─────────────┘   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │     SessionManager (in-memory Map)                  │ │
│  │  { resumeText, skills, score, careerGoals, ... }   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Frontend

- **App.jsx** — Main component, manages chats/sessions/file uploads
- **AgentBadge.jsx** — Visual badge per agent (blue/green/purple/gray)
- **ChatMessage.jsx** — Renders message with badge + ReactMarkdown
- State initialized via lazy `useState(() => ...)` from localStorage
- `sessionId` (UUID) stored in localStorage, sent with every API call
- Sidebar buttons send routable natural-language messages through POST /chat

## Backend

- **server.js** — Express app, ADK Runner, all endpoints, response extraction
- **agents/** — LlmAgent definitions + AgentTool wiring
- **tools/** — FunctionTools that update sessionManager state
- **prompts/** — System prompts (separate files, hot-reloadable)
- **sessions/** — In-memory SessionManager singleton

## Request Flow

```
1. User types message in frontend
2. Frontend POST /chat { message, sessionId }
3. server.js reads session state from SessionManager
4. If state exists, buildContextBlock() prepends context to message
5. runAgent() creates ADK session, invokes Runner
6. Runner calls orchestrator LlmAgent
7. Orchestrator's instruction forces it to call one of 3 AgentTools
8. AgentTool creates sub-Runner, invokes specialist agent
9. Specialist generates response (text)
10. Response flows back as functionResponse event
11. runAgent() extracts text from functionResponse OR lastTextEvent
12. updateSessionFromResponse() parses reply, updates SessionManager
13. Response returned: { reply, agent, sessionId }
14. Frontend renders with ChatMessage + AgentBadge
```

## Response Extraction Priority

```
Priority 1: lastTextEvent (orchestrator emits final text summarizing)
Priority 2: functionResponseText (specialist text inside functionResponse)
Priority 3: Fallback error message
```

## Session Flow

- Frontend generates UUID sessionId on first load
- Stored in localStorage, sent with every request
- Backend SessionManager maintains state per sessionId
- ADK InMemorySessionService manages conversation history
- New Chat button → new sessionId → fresh context
- Sessions expire after 1 hour (cleanup every 5 minutes)

## Inter-Agent Context

After each agent response, `updateSessionFromResponse()` extracts:
- **Resume Agent** → skills[], resumeScore, experience
- **Career Agent** → careerGoals[], recommendedSkills[], targetRoles[]
- **Interview Agent** → interviewHistory[]

This data is prepended to subsequent messages via `buildContextBlock()`.
