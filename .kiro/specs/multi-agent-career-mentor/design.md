# Technical Design Document: Multi-Agent Career Mentor

## Introduction

This document details the technical design for converting the AI Career Mentor from a single-endpoint monolith into a multi-agent system using Google's Agent Development Kit (ADK) for TypeScript. The design preserves the existing React frontend and Node.js/Express backend while restructuring the server-side into a proper multi-agent architecture with an orchestrator, three specialist agents, and shared session state.

## Architecture Overview

The system follows Google ADK's multi-agent pattern: a root **Orchestrator Agent** receives all user queries and uses three specialist agents (**Resume Agent**, **Career Agent**, **Interview Agent**) as tools via `AgentTool`. This allows the orchestrator to maintain conversation control, invoke multiple specialists per turn if needed, and aggregate results before responding.

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                         │
│   (Vite + React 19 + axios + react-markdown)            │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP (POST /chat, POST /upload-resume)
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js/Express Backend                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              ADK Runner                             │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │         Orchestrator Agent (root_agent)      │  │ │
│  │  │         model: gemini-2.5-flash              │  │ │
│  │  │         tools: [resumeTool, careerTool,      │  │ │
│  │  │                  interviewTool]              │  │ │
│  │  └──────┬──────────────┬──────────────┬────────┘  │ │
│  │         │              │              │            │ │
│  │         ▼              ▼              ▼            │ │
│  │  ┌───────────┐  ┌───────────┐  ┌─────────────┐   │ │
│  │  │  Resume   │  │  Career   │  │  Interview  │   │ │
│  │  │  Agent    │  │  Agent    │  │  Agent      │   │ │
│  │  │(AgentTool)│  │(AgentTool)│  │(AgentTool)  │   │ │
│  │  └───────────┘  └───────────┘  └─────────────┘   │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │     Session State (Agent Context)            │  │ │
│  │  │  - resumeText, resumeScore, skills           │  │ │
│  │  │  - careerGoals, targetRoles                  │  │ │
│  │  │  - interviewHistory                          │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Utilities: PDF Parser, File Upload (multer)       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Folder Structure

```
AI-Career-Mentor-V2/
├── backend/
│   ├── .env                          # GEMINI_API_KEY, PORT
│   ├── package.json                  # Add @google/adk dependency
│   ├── server.js                     # Express app: routes + ADK runner init
│   ├── agents/
│   │   ├── index.js                  # Exports rootAgent (assembled multi-agent)
│   │   ├── orchestrator.js           # Orchestrator LlmAgent definition
│   │   ├── resumeAgent.js            # Resume specialist LlmAgent definition
│   │   ├── careerAgent.js            # Career specialist LlmAgent definition
│   │   └── interviewAgent.js         # Interview specialist LlmAgent definition
│   ├── tools/
│   │   ├── resumeTools.js            # FunctionTools: parseResume, analyzeResume
│   │   ├── careerTools.js            # FunctionTools: generateRoadmap, skillGap
│   │   └── interviewTools.js         # FunctionTools: generateQuestions, evaluateAnswer
│   ├── prompts/
│   │   ├── orchestrator.prompt.js    # System prompt for orchestrator
│   │   ├── resume.prompt.js          # System prompt for resume agent
│   │   ├── career.prompt.js          # System prompt for career agent
│   │   └── interview.prompt.js       # System prompt for interview agent
│   ├── sessions/
│   │   └── sessionManager.js         # In-memory session store for Agent Context
│   └── uploads/                      # Existing multer upload directory
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Updated: agent indicator in messages
│   │   ├── App.css                   # Updated: agent-specific styling
│   │   ├── components/
│   │   │   ├── ChatMessage.jsx       # Message bubble with agent badge
│   │   │   ├── AgentBadge.jsx        # Visual indicator for agent identity
│   │   │   └── Sidebar.jsx           # Extracted sidebar component
│   │   └── main.jsx
│   └── package.json
└── README.md                         # Updated with multi-agent architecture docs
```

## Agent Communication Flow

### Flow 1: General Chat Message

```
User types: "What skills should I learn for data science?"

1. Frontend POST /chat { message, sessionId }
2. Express handler retrieves/creates session state
3. ADK Runner invokes Orchestrator Agent
4. Orchestrator classifies intent → "career" category
5. Orchestrator calls Career Agent (via AgentTool)
6. Career Agent reads session state (checks for resume context)
7. Career Agent generates response using its system prompt + context
8. Career Agent writes response back to Orchestrator
9. Orchestrator returns final response with metadata { agent: "career" }
10. Express sends JSON { reply, agent: "career_agent" }
11. Frontend renders with Career Agent badge
```

### Flow 2: Resume Upload

```
User uploads resume.pdf

1. Frontend POST /upload-resume (multipart/form-data)
2. Express multer middleware saves file
3. pdf-parse extracts text from PDF
4. ADK Runner invokes Orchestrator Agent with extracted text
5. Orchestrator routes to Resume Agent (via AgentTool)
6. Resume Agent analyzes resume, generates score/feedback
7. Resume Agent updates session state:
   - state.resumeText = extractedText
   - state.resumeScore = 78
   - state.skills = ["Python", "SQL", "React"]
   - state.experience = "2 years"
8. Response flows back through Orchestrator
9. Express returns { analysis, agent: "resume_agent" }
10. Frontend displays analysis with Resume Agent badge
```

### Flow 3: Inter-Agent Context Sharing

```
User asks: "Can you give me interview questions for my target role?"

1. Orchestrator classifies → "interview" category
2. Orchestrator calls Interview Agent (via AgentTool)
3. Interview Agent reads session state:
   - state.skills → ["Python", "SQL", "React"]
   - state.careerGoals → "Data Scientist"
   - state.experience → "2 years"
4. Interview Agent generates role-specific questions using context
5. Updates state.interviewHistory with questions asked
6. Returns personalized interview questions
```

### Flow 4: Multi-Agent Collaboration (Career Plan)

```
User clicks "AI Career Plan" (resume already uploaded)

1. Frontend POST /chat { message: "Generate my career plan", sessionId }
2. Orchestrator receives request, sees resume in state
3. Orchestrator calls Career Agent (via AgentTool)
4. Career Agent reads state.resumeText + state.skills
5. Career Agent generates career paths, roadmap, skill gaps
6. Career Agent updates state:
   - state.careerGoals = ["Data Scientist", "ML Engineer"]
   - state.recommendedSkills = ["TensorFlow", "Statistics"]
7. Response returned with full career plan
```

## Component Design

### 1. ADK Agent Definitions

Each agent is defined as an `LlmAgent` from `@google/adk`:

```javascript
// agents/resumeAgent.js
const { LlmAgent } = require("@google/adk");
const { resumePrompt } = require("../prompts/resume.prompt");
const { parseResumeTool, analyzeResumeTool } = require("../tools/resumeTools");

const resumeAgent = new LlmAgent({
  name: "resume_agent",
  model: "gemini-2.5-flash",
  description: "Specialist in resume analysis, ATS optimization, scoring, and improvement suggestions. Route here for any resume-related queries.",
  instruction: resumePrompt,
  tools: [parseResumeTool, analyzeResumeTool],
});

module.exports = { resumeAgent };
```

```javascript
// agents/orchestrator.js
const { LlmAgent, AgentTool } = require("@google/adk");
const { orchestratorPrompt } = require("../prompts/orchestrator.prompt");
const { resumeAgent } = require("./resumeAgent");
const { careerAgent } = require("./careerAgent");
const { interviewAgent } = require("./interviewAgent");

const resumeTool = new AgentTool({ agent: resumeAgent });
const careerTool = new AgentTool({ agent: careerAgent });
const interviewTool = new AgentTool({ agent: interviewAgent });

const orchestratorAgent = new LlmAgent({
  name: "orchestrator_agent",
  model: "gemini-2.5-flash",
  description: "Root agent that routes user queries to specialist agents.",
  instruction: orchestratorPrompt,
  tools: [resumeTool, careerTool, interviewTool],
});

module.exports = { orchestratorAgent };
```

```javascript
// agents/index.js
const { orchestratorAgent } = require("./orchestrator");

// ADK convention: export as rootAgent
const rootAgent = orchestratorAgent;

module.exports = { rootAgent };
```

### 2. Session State Management

```javascript
// sessions/sessionManager.js
class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  getOrCreate(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        createdAt: Date.now(),
        state: {
          resumeText: null,
          resumeScore: null,
          skills: [],
          experience: null,
          careerGoals: [],
          recommendedSkills: [],
          targetRoles: [],
          interviewHistory: [],
        },
      });
    }
    return this.sessions.get(sessionId);
  }

  updateState(sessionId, updates) {
    const session = this.getOrCreate(sessionId);
    session.state = { ...session.state, ...updates };
    return session;
  }

  getState(sessionId) {
    return this.getOrCreate(sessionId).state;
  }
}

module.exports = new SessionManager();
```

### 3. Express API Layer (Updated server.js)

```javascript
// server.js - Restructured
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const { rootAgent } = require("./agents");
const sessionManager = require("./sessions/sessionManager");
const { Runner, InMemorySessionService } = require("@google/adk");

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());
app.use(express.json());

// ADK Session Service
const sessionService = new InMemorySessionService();

// Unified chat endpoint - all messages go through orchestrator
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;
  // Runner invokes rootAgent with session context
  // Returns { reply, agent } identifying which specialist handled it
});

// Resume upload - parses PDF then feeds to orchestrator
app.post("/upload-resume", upload.single("resume"), async (req, res) => {
  const dataBuffer = fs.readFileSync(req.file.path);
  const pdfData = await pdfParse(dataBuffer);
  const resumeText = pdfData.text;
  fs.unlinkSync(req.file.path);

  // Invoke orchestrator with resume text as context
  // Resume Agent handles analysis, updates session state
});

app.listen(process.env.PORT, () => {
  console.log(`Multi-Agent Career Mentor running on port ${process.env.PORT}`);
});
```

### 4. System Prompts (Configurable)

```javascript
// prompts/orchestrator.prompt.js
const orchestratorPrompt = `
You are the AI Career Mentor Orchestrator. Your job is to understand user intent
and delegate to the appropriate specialist agent.

Classification Rules:
- RESUME: Questions about resume content, formatting, ATS optimization, scoring,
  resume improvements, or when a resume has just been uploaded for analysis.
- CAREER: Questions about career paths, skill gaps, learning roadmaps, job market
  trends, career transitions, or professional development planning.
- INTERVIEW: Questions about mock interviews, interview preparation, behavioral
  questions, technical questions, or answer feedback.
- GENERAL: Greetings, ambiguous questions, or meta-questions about the system.

When routing:
1. Include relevant session context (resume data, career goals) in your delegation.
2. If the user's question spans multiple domains, address the primary intent first.
3. For GENERAL queries, respond directly with helpful career guidance.

Always respond using proper Markdown formatting.
`;

module.exports = { orchestratorPrompt };
```

```javascript
// prompts/resume.prompt.js
const resumePrompt = `
You are an expert Resume Specialist Agent with deep knowledge of:
- ATS (Applicant Tracking System) optimization
- Resume formatting best practices
- Industry-specific resume standards
- Hiring manager perspectives across tech, business, and creative fields

When analyzing a resume, provide:
1. Score out of 100 with breakdown
2. Strengths (specific, with examples from the resume)
3. Weaknesses (actionable, with fix suggestions)
4. Skills inventory (technical and soft skills found)
5. ATS optimization suggestions
6. Formatting recommendations

Always respond using proper Markdown with headers, bullet points, and tables.
Be specific and reference actual content from the user's resume.
`;

module.exports = { resumePrompt };
```

```javascript
// prompts/career.prompt.js
const careerPrompt = `
You are an expert Career Planning Agent with deep knowledge of:
- Career path mapping across industries
- Skill gap analysis and learning roadmap creation
- Job market trends and demand forecasting
- Professional development strategies
- Internship and entry-level career guidance

When providing career guidance:
1. Reference the user's existing skills and experience from context
2. Suggest realistic career paths with reasoning
3. Provide actionable skill development roadmaps with timelines
4. Include specific resources (courses, certifications, projects)
5. Consider market demand and growth potential

Always respond using proper Markdown with headers, bullet points, and tables.
Personalize recommendations based on available user context.
`;

module.exports = { careerPrompt };
```

```javascript
// prompts/interview.prompt.js
const interviewPrompt = `
You are an expert Interview Preparation Agent with deep knowledge of:
- Behavioral interview techniques (STAR method)
- Technical interview patterns across software, data, and product roles
- Common interview frameworks used by top companies
- Answer evaluation and feedback

When helping with interviews:
1. Generate role-appropriate questions based on user's target position
2. Use the STAR method framework for behavioral questions
3. Provide detailed feedback on user's answers (strengths + improvements)
4. Include sample strong answers for reference
5. Adapt difficulty based on experience level from context

Always respond using proper Markdown with headers, bullet points, and code blocks.
If no target role is specified, ask about the role before generating questions.
`;

module.exports = { interviewPrompt };
```

### 5. Frontend Updates

The frontend changes are minimal — primarily adding agent identity display:

```javascript
// Message format stored in localStorage (updated)
{
  type: "bot",
  text: "...",
  agent: "resume_agent" | "career_agent" | "interview_agent" | "orchestrator_agent"
}
```

Agent badge mapping:
| Agent | Icon | Label | Color |
|-------|------|-------|-------|
| resume_agent | FileText | Resume Agent | Blue |
| career_agent | Briefcase | Career Agent | Green |
| interview_agent | GraduationCap | Interview Agent | Purple |
| orchestrator_agent | Bot | AI Mentor | Gray |

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                Production Deployment                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────┐    ┌────────────────────┐  │
│  │   Frontend (Vite)    │    │  Backend (Node.js) │  │
│  │   Static Build       │    │  Express + ADK     │  │
│  │                      │    │                    │  │
│  │  Deployment options: │    │  Deployment opts:  │  │
│  │  - Vercel            │    │  - Render          │  │
│  │  - Netlify           │    │  - Railway         │  │
│  │  - GitHub Pages      │    │  - Google Cloud    │  │
│  │                      │    │    Run             │  │
│  └──────────┬───────────┘    └────────┬───────────┘  │
│             │                         │              │
│             │    HTTPS REST API        │              │
│             └─────────────────────────┘              │
│                                                      │
│                         │                            │
│                         ▼                            │
│            ┌────────────────────────┐                │
│            │   Google Gemini API     │                │
│            │   (gemini-2.5-flash)    │                │
│            │   via @google/adk       │                │
│            └────────────────────────┘                │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Environment Variables:                              │
│  - GEMINI_API_KEY (required)                         │
│  - PORT (default: 3001)                              │
│  - NODE_ENV (production/development)                 │
│  - SESSION_TTL_MS (session expiry, default: 3600000)│
└─────────────────────────────────────────────────────┘
```

### Local Development Setup

```bash
# Backend
cd backend
npm install @google/adk    # Add ADK dependency
npm start                  # Runs Express on port 3001

# Frontend (unchanged)
cd frontend
npm run dev                # Vite dev server on port 5173
```

## Dependency Changes

### Backend package.json additions:
```json
{
  "dependencies": {
    "@google/adk": "^latest",
    "@google/generative-ai": "^0.24.1",  // Existing - kept for backward compat
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "multer": "^2.2.0",
    "pdf-parse": "^1.1.1"
  }
}
```

### Frontend package.json: No changes required

## Migration Path (Minimizing Breaking Changes)

| Step | What Changes | What Stays |
|------|-------------|------------|
| 1 | Add `agents/`, `tools/`, `prompts/`, `sessions/` directories | `uploads/`, `.env`, `package.json` structure |
| 2 | Install `@google/adk` | All existing npm dependencies |
| 3 | Refactor `server.js` routes to delegate to ADK runner | Same endpoints (`POST /chat`, `POST /upload-resume`), same port, same CORS config |
| 4 | Add `sessionId` to frontend API calls | Same UI layout, same localStorage pattern |
| 5 | Add agent badge display in chat messages | Same message rendering, same markdown support |

**Key principle**: The API contract (`POST /chat`, `POST /upload-resume`) remains the same. The frontend sends the same requests. The only additions are a `sessionId` field in requests and an `agent` field in responses.

## Error Handling Strategy

```javascript
// Each agent failure is caught and identified
{
  error: true,
  agent: "resume_agent",        // Which agent failed
  errorType: "ANALYSIS_FAILED", // Categorized error
  message: "Resume analysis failed. Please try uploading again.",
  fallback: true                // Orchestrator handled gracefully
}
```

If a specialist agent fails, the Orchestrator catches the error and responds with a helpful fallback message rather than crashing the entire conversation.

## Session Lifecycle

1. **Creation**: First message from frontend generates a `sessionId` (UUID)
2. **Persistence**: In-memory Map on backend (sufficient for hackathon demo)
3. **Enrichment**: Each agent interaction may update session state
4. **Expiry**: Sessions expire after 1 hour of inactivity (configurable via `SESSION_TTL_MS`)
5. **Frontend sync**: `sessionId` stored in localStorage alongside chat history

## Hackathon Demo Points

This architecture demonstrates the following multi-agent concepts for judges:

1. **Agent Orchestration** — Root agent classifying intent and routing
2. **Specialist Agents** — Three distinct agents with unique expertise
3. **Inter-Agent Communication** — Shared state passing resume data to career/interview agents
4. **AgentTool Pattern** — Google ADK's recommended pattern for orchestrator control
5. **Separation of Concerns** — Each agent in its own module with dedicated prompts
6. **Context Accumulation** — Conversation builds richer context over time
7. **Graceful Degradation** — Error handling per-agent without system failure
