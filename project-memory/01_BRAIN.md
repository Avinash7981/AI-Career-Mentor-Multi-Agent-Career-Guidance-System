# 01 - Project Brain

## Purpose

Multi-agent AI Career Mentor that helps users with resume analysis, career planning, and interview preparation. Built for the Kaggle AI Agents hackathon to demonstrate orchestrator + specialist agent architecture.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.6 |
| Build Tool | Vite | 8.0.16 |
| HTTP Client | Axios | 1.18.0 |
| Markdown | react-markdown + remark-gfm | 10.1.0 |
| Icons | lucide-react | 1.21.0 |
| File Upload | react-dropzone | 15.0.0 |
| Backend | Express | 5.2.1 |
| AI Framework | @google/adk | 1.3.0 |
| AI Model | Gemini 2.5 Flash | via ADK |
| PDF Parsing | pdf-parse | 1.1.1 |
| File Upload | multer | 2.2.0 |
| Module System | CommonJS (backend) / ESM (frontend) |

## Folder Structure

```
AI-Career-Mentor-V2/
├── backend/
│   ├── server.js                 # Express app + ADK Runner + all endpoints
│   ├── agents/
│   │   ├── index.js              # Exports rootAgent (orchestrator)
│   │   ├── orchestrator.js       # LlmAgent with 3 AgentTools
│   │   ├── resumeAgent.js        # Resume specialist LlmAgent
│   │   ├── careerAgent.js        # Career specialist LlmAgent
│   │   └── interviewAgent.js     # Interview specialist LlmAgent
│   ├── tools/
│   │   ├── resumeTools.js        # parse_resume, analyze_resume
│   │   ├── careerTools.js        # generate_roadmap, skill_gap_analysis
│   │   └── interviewTools.js     # generate_interview_questions, evaluate_interview_answer
│   ├── prompts/
│   │   ├── orchestrator.prompt.js
│   │   ├── resume.prompt.js
│   │   ├── career.prompt.js
│   │   └── interview.prompt.js
│   ├── sessions/
│   │   └── sessionManager.js     # In-memory session state store
│   ├── uploads/                  # Temp PDF storage (cleaned after parse)
│   ├── .env                      # GEMINI_API_KEY, PORT=3001
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app with sidebar + chat
│   │   ├── App.css               # All styling
│   │   ├── components/
│   │   │   ├── AgentBadge.jsx    # Color-coded agent identity badge
│   │   │   └── ChatMessage.jsx   # Message bubble with badge + markdown
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── vite.config.js
│   └── package.json
└── .kiro/specs/multi-agent-career-mentor/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Agent Architecture

- **Orchestrator Agent** (root) — classifies intent, MUST call specialist tools
- **Resume Agent** — ATS optimization, scoring, skill extraction
- **Career Agent** — career paths, skill gaps, roadmaps, internships
- **Interview Agent** — mock interviews, STAR method, answer feedback

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /chat | Unified chat — routes through orchestrator |
| POST | /upload-resume | PDF upload → parse → resume agent analysis |
| POST | /analyze-resume | Legacy compat — same as upload-resume |
| POST | /career-plan | Legacy compat — career agent via orchestrator |

All return `{ reply/analysis/careerPlan, agent, sessionId }`.

## Current Implementation Status

- All 8 tasks COMPLETE
- Routing FIX applied (orchestrator must use tools)
- Response extraction FIX applied (functionResponse parsing)
- Quota error handling added
- Frontend lint clean, build passes

## Important Constraints

- Backend uses CommonJS (`type: "commonjs"`)
- Frontend uses ESM (`type: "module"`)
- Session state is in-memory only (no database)
- Single GEMINI_API_KEY for all agents
- No authentication — single user assumed
- ADK FunctionTool uses `{ name, description, parameters, execute }` pattern
- AgentTool takes `{ agent: LlmAgent }`
