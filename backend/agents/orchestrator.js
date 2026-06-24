/**
 * Orchestrator Agent - Root agent that classifies user intent and
 * delegates to the appropriate specialist agent via AgentTool.
 *
 * This is the central router of the multi-agent system. All user
 * messages flow through here and are dispatched to:
 * - resume_agent: Resume analysis, ATS, scoring
 * - career_agent: Career paths, skill gaps, roadmaps
 * - interview_agent: Mock interviews, question generation, feedback
 */
const {
    LlmAgent,
    AgentTool
} = require("@google/adk");
const {
    orchestratorPrompt
} = require("../prompts/orchestrator.prompt");
const {
    resumeAgent
} = require("./resumeAgent");
const {
    careerAgent
} = require("./careerAgent");
const {
    interviewAgent
} = require("./interviewAgent");

// Wrap each specialist agent as an AgentTool so the orchestrator
// can invoke them as tools during its reasoning loop.
const resumeTool = new AgentTool({
    agent: resumeAgent
});
const careerTool = new AgentTool({
    agent: careerAgent
});
const interviewTool = new AgentTool({
    agent: interviewAgent
});

const orchestratorAgent = new LlmAgent({
    name: "orchestrator_agent",
    model: "gemini-2.5-flash",
    description: "Root agent that routes user queries to specialist agents for " +
        "resume analysis, career planning, and interview preparation.",
    instruction: orchestratorPrompt,
    tools: [resumeTool, careerTool, interviewTool],
});

module.exports = {
    orchestratorAgent
};