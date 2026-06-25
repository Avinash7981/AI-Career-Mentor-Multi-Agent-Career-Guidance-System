# 05 - Bugs

## Fixed Bugs

### BUG-001: Orchestrator never routes to specialist agents
- **Root Cause:** Orchestrator prompt said "delegate" but never explicitly told the LLM to CALL the tool functions by name. Gemini answered directly.
- **Fix:** Rewrote prompt with "MUST call one of them for EVERY message" and "CRITICAL: always use a tool call"
- **Commit:** f000b202
- **Status:** FIXED

### BUG-002: Frontend receives "I'm sorry, I couldn't generate a response"
- **Root Cause:** Specialist agent text was inside `functionResponse.response`, not in a top-level `text` part. Code only looked for `event.content.parts[].text`.
- **Fix:** Added extraction from `functionResponse.response` (string, .output, .result, or .text). Priority: text event > functionResponse > fallback.
- **Commit:** 65e976f7
- **Status:** FIXED

### BUG-003: ESLint error — setState in useEffect
- **Root Cause:** React 19 strict lint rule flags `setChats()` inside `useEffect` for localStorage hydration.
- **Fix:** Replaced with lazy `useState(() => ...)` initializers.
- **Commit:** fe05c653
- **Status:** FIXED

### BUG-004: Quota errors masked by generic error message
- **Root Cause:** Legacy endpoints used generic `res.status(500).json({error: "..."})` without checking for 429/quota patterns.
- **Fix:** All endpoints now use `buildErrorResponse()` which detects quota errors and returns specific message.
- **Commit:** 951253cf
- **Status:** FIXED

## Known Issues (Not Yet Fixed)

### ISSUE-001: sessionId shared across all chats
- **Description:** All chats share the same sessionId. Switching between chats doesn't switch agent context.
- **Impact:** Low — only affects multi-chat scenarios
- **Planned Fix:** Store sessionId per-chat in the chat object

### ISSUE-002: Session state not synced back to ADK
- **Description:** SessionManager updates state after responses, but ADK's InMemorySessionService has its own state copy that may drift.
- **Impact:** Medium — ADK session state may not reflect SessionManager updates across calls
- **Planned Fix:** Re-seed ADK session state from SessionManager on each call (already partially done in ensureAdkSession but only on creation)
