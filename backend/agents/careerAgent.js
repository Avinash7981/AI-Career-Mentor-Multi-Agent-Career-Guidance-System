/**
 * Career Agent - Specialist in career path planning, skill gap analysis,
 * learning roadmaps, job market insights, and GitHub portfolio analysis.
 *
 * Includes MCP tools for GitHub analysis and professional profile optimization.
 */
const path = require("path");
const {
    LlmAgent,
    MCPToolset
} = require("@google/adk");
const {
    careerPrompt
} = require("../prompts/career.prompt");
const {
    generateRoadmapTool,
    skillGapTool
} = require("../tools/careerTools");

// MCP Toolset - connects to career-mentor-mcp server via stdio
const mcpToolset = new MCPToolset({
    type: "StdioConnectionParams",
    serverParams: {
        command: "node",
        args: [path.join(__dirname, "..", "mcp", "server.js")],
    },
});

const careerAgent = new LlmAgent({
    name: "career_agent",
    model: "gemini-2.5-flash",
    description: "Specialist in career path planning, skill gap analysis, learning roadmaps, " +
        "job market insights, GitHub portfolio analysis, and professional profile optimization. " +
        "Route here for questions about career paths, skill gaps, learning plans, job market trends, " +
        "career transitions, internship recommendations, GitHub profile review, or profile optimization.",
    instruction: careerPrompt,
    tools: [generateRoadmapTool, skillGapTool, mcpToolset],
});

module.exports = {
    careerAgent
};