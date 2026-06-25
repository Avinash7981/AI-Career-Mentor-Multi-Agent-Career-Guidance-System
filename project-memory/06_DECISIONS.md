# 06 - Architectural Decisions

## DEC-001: Google ADK over raw Gemini API
- **Decision:** Use @google/adk (Agent Development Kit) instead of raw @google/generative-ai
- **Why:** ADK provides LlmAgent, AgentTool, Runner, and session management out of the box. Demonstrates proper multi-agent patterns for hackathon judges.
- **Tradeoff:** Heavier dependency (492 packages), less control over raw API calls

## DEC-002: AgentTool pattern for specialist delegation
- **Decision:** Wrap each specialist agent as an AgentTool on the orchestrator rather than using RoutedAgent or SequentialAgent
- **Why:** AgentTool gives the orchestrator full control — it can invoke multiple specialists per turn, aggregate results, and maintain conversation context. RoutedAgent only routes once.
- **Tradeoff:** Orchestrator must be explicitly instructed to use tools (caused BUG-001)

## DEC-003: In-memory session state (no database)
- **Decision:** Use a simple Map-based SessionManager instead of database persistence
- **Why:** Sufficient for hackathon demo, zero setup, fast. Sessions expire after 1 hour.
- **Tradeoff:** State lost on server restart, not suitable for production

## DEC-004: Dual session systems (SessionManager + ADK InMemorySessionService)
- **Decision:** Maintain our own SessionManager alongside ADK's session service
- **Why:** Our SessionManager holds structured domain data (skills, goals, scores). ADK's service holds conversation history. They serve different purposes.
- **Tradeoff:** Potential state drift between the two (ISSUE-002)

## DEC-005: Context injection via message enrichment
- **Decision:** Prepend session context to user messages rather than modifying agent instructions dynamically
- **Why:** Simpler, no need to rebuild agents per-request. Context block is visible in conversation history for debugging.
- **Tradeoff:** Increases token usage, context may be ignored by model

## DEC-006: Response parsing with regex extraction
- **Decision:** Parse agent responses with regex to extract skills/scores/goals rather than requiring structured JSON output
- **Why:** Agents produce natural markdown. Forcing JSON output would break the user-facing formatting. Regex extraction is best-effort and fault-tolerant.
- **Tradeoff:** Extraction accuracy depends on response formatting

## DEC-007: Preserve legacy endpoints
- **Decision:** Keep /analyze-resume and /career-plan alongside new /chat and /upload-resume
- **Why:** Frontend backward compatibility. Existing code references these endpoints.
- **Tradeoff:** Duplicate endpoints, slight maintenance burden

## DEC-008: Lazy useState initializers over useEffect
- **Decision:** Use `useState(() => localStorage.getItem(...))` instead of useEffect for initial state
- **Why:** Eliminates lint warnings, runs synchronously during initial render, no flash of empty state
- **Tradeoff:** None — strictly better for localStorage hydration
