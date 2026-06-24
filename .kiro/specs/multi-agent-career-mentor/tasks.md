# Implementation Plan: Multi-Agent Career Mentor

## Overview

Convert the existing single-endpoint AI Career Mentor into a multi-agent system using Google ADK. The backend is restructured into agents/, tools/, prompts/, and sessions/ directories while preserving existing API endpoints. The frontend receives minor updates to display agent identity badges on messages.

## Tasks

- [ ] 1. Set up backend directory structure and install dependencies
  - [ ] 1.1 Create backend module directories and install @google/adk
    - Create `backend/agents/`, `backend/tools/`, `backend/prompts/`, `backend/sessions/` directories
    - Run `npm install @google/adk` in the backend directory
    - Verify package.json includes the new dependency
    - _Requirements: 6.1, 6.5_

  - [ ] 1.2 Create the SessionManager class
    - Create `backend/sessions/sessionManager.js`
    - Implement `SessionManager` class with `getOrCreate(sessionId)`, `updateState(sessionId, updates)`, and `getState(sessionId)` methods
    - Session state schema: `{ resumeText, resumeScore, skills, experience, careerGoals, recommendedSkills, targetRoles, interviewHistory }`
    - Export a singleton instance
    - _Requirements: 5.1, 5.5, 5.6_

  - [ ] 1.3 Create all agent system prompt files
    - Create `backend/prompts/orchestrator.prompt.js` with intent classification instructions (resume, career, interview, general categories)
    - Create `backend/prompts/resume.prompt.js` with resume analysis expertise prompt
    - Create `backend/prompts/career.prompt.js` with career counseling expertise prompt
    - Create `backend/prompts/interview.prompt.js` with interview preparation expertise prompt
    - Each file exports a single prompt string constant
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 2. Implement specialist agents
  - [ ] 2.1 Implement the Resume Agent
    - Create `backend/agents/resumeAgent.js`
    - Define `resumeAgent` as an `LlmAgent` with name `"resume_agent"`, model `"gemini-2.5-flash"`, and the resume system prompt
    - Set description to guide orchestrator routing for resume-related queries
    - Add tools for resume parsing and analysis (from `../tools/resumeTools`)
    - _Requirements: 2.1, 2.4, 6.1_

  - [ ] 2.2 Implement the Career Agent
    - Create `backend/agents/careerAgent.js`
    - Define `careerAgent` as an `LlmAgent` with name `"career_agent"`, model `"gemini-2.5-flash"`, and the career system prompt
    - Set description to guide orchestrator routing for career-related queries
    - Add tools for roadmap and skill gap analysis (from `../tools/careerTools`)
    - _Requirements: 3.3, 6.1_

  - [ ] 2.3 Implement the Interview Agent
    - Create `backend/agents/interviewAgent.js`
    - Define `interviewAgent` as an `LlmAgent` with name `"interview_agent"`, model `"gemini-2.5-flash"`, and the interview system prompt
    - Set description to guide orchestrator routing for interview-related queries
    - Add tools for question generation and answer evaluation (from `../tools/interviewTools`)
    - _Requirements: 4.3, 6.1_

  - [ ] 2.4 Create agent FunctionTool definitions
    - Create `backend/tools/resumeTools.js` with `parseResumeTool` (accepts resume text, returns structured analysis) and `analyzeResumeTool` (scores resume, identifies strengths/weaknesses)
    - Create `backend/tools/careerTools.js` with `generateRoadmapTool` (creates learning roadmap) and `skillGapTool` (identifies missing skills)
    - Create `backend/tools/interviewTools.js` with `generateQuestionsTool` (creates role-specific questions) and `evaluateAnswerTool` (provides feedback on user answers)
    - Each tool updates session state via SessionManager
    - _Requirements: 2.1, 2.2, 3.1, 3.5, 4.1, 4.2, 5.2, 5.3_

- [ ] 3. Implement the Orchestrator Agent and assemble the multi-agent system
  - [ ] 3.1 Implement the Orchestrator Agent with AgentTool wiring
    - Create `backend/agents/orchestrator.js`
    - Import all three specialist agents and wrap each with `AgentTool`
    - Define `orchestratorAgent` as an `LlmAgent` with name `"orchestrator_agent"`, model `"gemini-2.5-flash"`, orchestrator system prompt, and the three AgentTool instances
    - _Requirements: 1.1, 1.4, 6.1_

  - [ ] 3.2 Create the root agent entry point
    - Create `backend/agents/index.js`
    - Import `orchestratorAgent` and export it as `rootAgent`
    - This is the single entry point for the ADK Runner
    - _Requirements: 6.4_

- [ ] 4. Refactor server.js to use ADK Runner
  - [ ] 4.1 Refactor the POST /chat endpoint
    - Import `rootAgent` from `./agents` and `SessionManager` from `./sessions/sessionManager`
    - Import `Runner` and `InMemorySessionService` from `@google/adk`
    - Accept `sessionId` in the request body (generate one if not provided)
    - Create/retrieve session via SessionManager
    - Invoke ADK Runner with `rootAgent`, passing user message and session context
    - Return `{ reply, agent }` in the response where `agent` identifies which specialist handled the request
    - _Requirements: 1.1, 1.3, 5.4, 6.2_

  - [ ] 4.2 Refactor the POST /upload-resume endpoint
    - Keep existing multer + pdf-parse logic for file handling
    - After extracting resume text, invoke the ADK Runner with a resume analysis prompt
    - Update session state with extracted resume text and analysis results via SessionManager
    - Return `{ analysis, agent: "resume_agent" }` in the response
    - Clean up uploaded file after processing
    - _Requirements: 2.1, 2.2, 5.2, 6.3_

  - [ ] 4.3 Add error handling per agent
    - Wrap ADK Runner invocations in try/catch
    - On agent failure, return structured error: `{ error: true, agent, errorType, message, fallback: true }`
    - Orchestrator provides a fallback response if a specialist agent fails
    - _Requirements: 6.6_

- [ ] 5. Checkpoint - Verify backend multi-agent system
  - Ensure all agent modules load without errors
  - Ensure POST /chat and POST /upload-resume endpoints respond correctly
  - Ensure session state persists across messages within the same session
  - Ask the user if questions arise.

- [ ] 6. Update frontend for agent awareness
  - [ ] 6.1 Create the AgentBadge component
    - Create `frontend/src/components/AgentBadge.jsx`
    - Accept an `agent` prop (string: `"resume_agent"`, `"career_agent"`, `"interview_agent"`, `"orchestrator_agent"`)
    - Render an icon + label with distinct color per agent type:
      - resume_agent → FileText icon, "Resume Agent", blue
      - career_agent → Briefcase icon, "Career Agent", green
      - interview_agent → GraduationCap icon, "Interview Agent", purple
      - orchestrator_agent → Bot icon, "AI Mentor", gray
    - _Requirements: 7.1, 7.2_

  - [ ] 6.2 Create the ChatMessage component
    - Create `frontend/src/components/ChatMessage.jsx`
    - Extract message rendering logic from App.jsx into this component
    - Render `AgentBadge` above bot messages when `msg.agent` is present
    - Apply ReactMarkdown + remarkGfm for bot messages
    - _Requirements: 7.1, 7.4_

  - [ ] 6.3 Update App.jsx for session and agent tracking
    - Generate a `sessionId` (UUID) on first load, store in localStorage
    - Send `sessionId` in POST /chat and POST /upload-resume requests
    - Store `agent` field from API responses in message objects in state and localStorage
    - Update sidebar action buttons (AI Career Plan, Resume Review, Internship Guidance) to send appropriately-worded messages through the POST /chat endpoint so the Orchestrator routes them
    - Replace inline message rendering with the new `ChatMessage` component
    - _Requirements: 7.3, 7.5, 7.6_

  - [ ]* 6.4 Write unit tests for AgentBadge component
    - Test that correct icon and label render for each agent type
    - Test fallback rendering when agent prop is missing or unknown
    - _Requirements: 7.1, 7.2_

- [ ] 7. Add agent context sharing logic
  - [ ] 7.1 Implement context injection into agent prompts
    - Before invoking the ADK Runner, read session state and build a context block
    - Append relevant context (resume text, skills, career goals) to the user message or agent instruction
    - Ensure Resume Agent results are available to Career and Interview agents in subsequent messages
    - _Requirements: 5.4, 3.1, 4.1_

  - [ ] 7.2 Implement session state updates after agent responses
    - After Resume Agent responds: update state with `resumeText`, `resumeScore`, `skills`, `experience`
    - After Career Agent responds: update state with `careerGoals`, `recommendedSkills`, `targetRoles`
    - After Interview Agent responds: append to `interviewHistory`
    - _Requirements: 5.2, 5.3, 2.2, 3.6_

- [ ] 8. Final checkpoint - End-to-end verification
  - Ensure all tests pass
  - Verify orchestrator correctly routes resume, career, and interview queries
  - Verify agent badges appear correctly in the frontend
  - Verify session context persists and is shared between agents
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design uses `@google/adk` with `LlmAgent` and `AgentTool` classes — consult design.md for exact constructor signatures
- The existing `@google/generative-ai` package can be removed once ADK is fully integrated, but keeping it during migration avoids breakage
- Session state is in-memory only (sufficient for hackathon demo)
- Frontend changes are minimal — primarily adding agent identity display and sessionId tracking

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["4.1", "4.2"] },
    { "id": 5, "tasks": ["4.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "7.1", "7.2"] },
    { "id": 7, "tasks": ["6.4"] }
  ]
}
```
