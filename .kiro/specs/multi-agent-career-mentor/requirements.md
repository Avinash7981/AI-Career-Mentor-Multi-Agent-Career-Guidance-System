# Requirements Document

## Introduction

This document specifies requirements for converting the existing single-endpoint AI Career Mentor application into a multi-agent architecture. The system will feature three specialist agents (Resume Agent, Career Agent, Interview Agent) coordinated by an Orchestrator Agent that routes user queries to the appropriate specialist. The existing tech stack (React frontend, Node.js/Express backend, Google Gemini API) is preserved while restructuring the backend into discrete agent modules with inter-agent communication capabilities. This is designed for the Kaggle AI Agents hackathon to demonstrate clear multi-agent design patterns.

## Glossary

- **Orchestrator_Agent**: The central routing agent that receives all user messages and determines which Specialist Agent should handle the request
- **Resume_Agent**: A specialist agent focused on resume analysis, scoring, ATS optimization, and improvement suggestions
- **Career_Agent**: A specialist agent focused on career path planning, skill gap analysis, learning roadmaps, and job market insights
- **Interview_Agent**: A specialist agent focused on mock interviews, behavioral and technical question generation, and answer feedback
- **Agent_Context**: Shared state data that can be passed between agents, including resume analysis results, identified skills, and career goals
- **Agent_Router**: The classification logic within the Orchestrator Agent that maps user intent to the correct Specialist Agent
- **System_Prompt**: The specialized instruction text that defines an agent's persona, capabilities, and response format
- **Agent_Response**: The structured output returned by a Specialist Agent containing the response text and metadata about agent identity
- **Conversation_Session**: A user's active chat session containing message history and accumulated Agent Context
- **Frontend_App**: The React-based user interface that sends messages and displays agent responses
- **Backend_Server**: The Node.js/Express application hosting the agent modules and API endpoints
- **Gemini_API**: The Google Generative AI service (Gemini 2.5 Flash) used for natural language processing by all agents

## Requirements

### Requirement 1: Orchestrator Agent Query Routing

**User Story:** As a user, I want my messages automatically routed to the right specialist agent, so that I get expert-level responses without manually selecting which agent to talk to.

#### Acceptance Criteria

1. WHEN a user message is received, THE Orchestrator_Agent SHALL classify the user intent and route the message to the appropriate Specialist Agent (Resume_Agent, Career_Agent, or Interview_Agent)
2. WHEN the user intent is ambiguous or does not clearly map to a single Specialist Agent, THE Orchestrator_Agent SHALL respond directly with a clarifying question or general career guidance
3. WHEN the Orchestrator_Agent routes a message, THE Agent_Response SHALL include metadata identifying which Specialist Agent handled the request
4. THE Orchestrator_Agent SHALL use Gemini_API with a dedicated System_Prompt that instructs it to classify user queries into agent categories
5. WHEN the user message contains keywords related to resume content, formatting, ATS, or resume scoring, THE Agent_Router SHALL route to the Resume_Agent
6. WHEN the user message contains keywords related to career paths, skill gaps, roadmaps, or job market, THE Agent_Router SHALL route to the Career_Agent
7. WHEN the user message contains keywords related to interviews, mock questions, behavioral questions, or answer feedback, THE Agent_Router SHALL route to the Interview_Agent

### Requirement 2: Resume Agent Specialization

**User Story:** As a user, I want a dedicated resume specialist agent, so that I get detailed analysis, scoring, and ATS optimization advice for my resume.

#### Acceptance Criteria

1. WHEN a PDF resume file is uploaded, THE Resume_Agent SHALL parse the file and produce a structured analysis containing a score out of 100, strengths, weaknesses, skills found, and suggested improvements
2. WHEN the Resume_Agent completes a resume analysis, THE Resume_Agent SHALL store the extracted resume text and analysis results in the Agent_Context for use by other agents
3. WHEN a user asks a follow-up question about their resume, THE Resume_Agent SHALL reference the stored resume analysis from Agent_Context
4. THE Resume_Agent SHALL use a dedicated System_Prompt that establishes expertise in resume writing, ATS systems, and hiring practices
5. WHEN the Resume_Agent identifies missing skills or formatting issues, THE Resume_Agent SHALL provide specific actionable suggestions with examples

### Requirement 3: Career Agent Specialization

**User Story:** As a user, I want a dedicated career planning agent, so that I get personalized career paths, skill roadmaps, and job market insights based on my background.

#### Acceptance Criteria

1. WHEN the Career_Agent receives a career planning request and resume data exists in the Agent_Context, THE Career_Agent SHALL use the stored resume analysis to personalize career recommendations
2. WHEN the Career_Agent receives a career planning request without resume data in the Agent_Context, THE Career_Agent SHALL ask the user to upload a resume or provide background information
3. THE Career_Agent SHALL use a dedicated System_Prompt that establishes expertise in career counseling, industry trends, and professional development
4. WHEN the user asks about career paths, THE Career_Agent SHALL provide at least three suitable career paths with reasoning based on the user's skills and experience
5. WHEN the user asks about skill gaps, THE Career_Agent SHALL generate a prioritized learning roadmap with timeline estimates
6. WHEN the Career_Agent generates recommendations, THE Career_Agent SHALL store identified career goals in the Agent_Context for reference by other agents

### Requirement 4: Interview Agent Specialization

**User Story:** As a user, I want a dedicated interview preparation agent, so that I can practice mock interviews and get feedback on my answers.

#### Acceptance Criteria

1. WHEN the user requests mock interview practice, THE Interview_Agent SHALL generate role-appropriate interview questions based on available Agent_Context (resume skills, target career path)
2. WHEN the user provides an answer to a mock interview question, THE Interview_Agent SHALL provide detailed feedback including strengths, areas for improvement, and a sample strong answer
3. THE Interview_Agent SHALL use a dedicated System_Prompt that establishes expertise in interviewing, hiring processes, and behavioral assessment
4. WHEN the user requests technical interview questions, THE Interview_Agent SHALL generate questions relevant to the technical skills found in the Agent_Context
5. WHEN the user requests behavioral interview questions, THE Interview_Agent SHALL generate questions using the STAR method framework and provide guidance on structuring answers
6. WHEN the Interview_Agent is invoked without prior context, THE Interview_Agent SHALL ask the user about the target role and company type before generating questions

### Requirement 5: Inter-Agent Communication

**User Story:** As a user, I want the agents to share context about me, so that each specialist builds on what the others already know rather than asking me to repeat information.

#### Acceptance Criteria

1. THE Backend_Server SHALL maintain an Agent_Context object per Conversation_Session that stores data shared between agents
2. WHEN the Resume_Agent completes analysis, THE Backend_Server SHALL update the Agent_Context with extracted skills, experience level, and resume score
3. WHEN the Career_Agent identifies career goals, THE Backend_Server SHALL update the Agent_Context with target roles and recommended skills
4. WHEN a Specialist Agent is invoked, THE Backend_Server SHALL pass the relevant Agent_Context data as part of the prompt to Gemini_API
5. WHEN the user starts a new Conversation_Session, THE Backend_Server SHALL initialize an empty Agent_Context
6. THE Agent_Context SHALL persist across messages within the same Conversation_Session

### Requirement 6: Backend Agent Module Architecture

**User Story:** As a developer, I want each agent implemented as a separate module, so that the codebase demonstrates clear multi-agent separation of concerns for the hackathon.

#### Acceptance Criteria

1. THE Backend_Server SHALL organize agent logic into separate module files: one for Orchestrator_Agent, one for Resume_Agent, one for Career_Agent, and one for Interview_Agent
2. THE Backend_Server SHALL expose a single unified POST /chat endpoint that receives all user messages and delegates to the Orchestrator_Agent
3. THE Backend_Server SHALL expose a POST /upload-resume endpoint that accepts PDF files and delegates processing to the Resume_Agent
4. WHEN a new agent module is added, THE Backend_Server SHALL allow registration without modifying existing agent modules
5. THE Backend_Server SHALL preserve the existing Express and Gemini_API dependencies without introducing additional frameworks
6. WHEN any agent encounters an error during processing, THE Backend_Server SHALL return a structured error response identifying the failing agent and error type

### Requirement 7: Frontend Agent Awareness

**User Story:** As a user, I want the UI to show which agent is responding, so that I understand the multi-agent system and can direct my questions appropriately.

#### Acceptance Criteria

1. WHEN an Agent_Response is received, THE Frontend_App SHALL display a visual indicator showing which Specialist Agent generated the response
2. THE Frontend_App SHALL display distinct visual styling (icon or label) for each agent type: Resume_Agent, Career_Agent, and Interview_Agent
3. WHEN the user uploads a resume via drag-and-drop or file picker, THE Frontend_App SHALL send the file to the POST /upload-resume endpoint and display the Resume_Agent response
4. THE Frontend_App SHALL maintain the existing chat interface layout with sidebar navigation and message area
5. WHEN the user clicks a sidebar action button (AI Career Plan, Resume Review, Internship Guidance), THE Frontend_App SHALL send an appropriate message that the Orchestrator_Agent will route to the correct Specialist Agent
6. THE Frontend_App SHALL continue storing conversation history in localStorage with the addition of agent identity metadata per message

### Requirement 8: Agent System Prompt Management

**User Story:** As a developer, I want each agent's system prompt clearly defined and configurable, so that agent behavior can be tuned independently and the multi-agent design is visible.

#### Acceptance Criteria

1. THE Backend_Server SHALL define each agent's System_Prompt in a dedicated configuration location separate from the routing logic
2. THE Orchestrator_Agent System_Prompt SHALL instruct the model to classify user intent into categories: resume, career, interview, or general
3. THE Resume_Agent System_Prompt SHALL establish the agent as an expert resume reviewer with knowledge of ATS systems, hiring practices, and resume formatting standards
4. THE Career_Agent System_Prompt SHALL establish the agent as an expert career counselor with knowledge of industry trends, skill development, and job markets
5. THE Interview_Agent System_Prompt SHALL establish the agent as an expert interviewer with knowledge of behavioral and technical interview techniques
6. WHEN a System_Prompt is modified, THE Backend_Server SHALL apply the updated prompt on the next request without requiring a server restart
