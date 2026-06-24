/**
 * Career Agent - Specialist in career path planning, skill gap analysis,
 * learning roadmaps, and job market insights.
 */
const {
    LlmAgent
} = require("@google/adk");
const {
    careerPrompt
} = require("../prompts/career.prompt");
const {
    generateRoadmapTool,
    skillGapTool
} = require("../tools/careerTools");

const careerAgent = new LlmAgent({
    name: "career_agent",
    model: "gemini-2.5-flash",
    description: "Specialist in career path planning, skill gap analysis, learning roadmaps, " +
        "and job market insights. Route here for questions about career paths, " +
        "skill gaps, learning plans, job market trends, career transitions, " +
        "or internship recommendations.",
    instruction: careerPrompt,
    tools: [generateRoadmapTool, skillGapTool],
});

module.exports = {
    careerAgent
};