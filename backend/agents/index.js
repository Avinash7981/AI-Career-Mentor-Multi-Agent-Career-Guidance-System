/**
 * Agent entry point - exports the root agent for use by the ADK Runner.
 *
 * The orchestrator is the single entry point. It internally routes
 * to specialist agents (resume, career, interview) via AgentTool.
 */
const {
    orchestratorAgent
} = require("./orchestrator");

// ADK convention: the root agent is the top-level export
const rootAgent = orchestratorAgent;

module.exports = {
    rootAgent
};