/**
 * Resume Agent - Specialist in resume analysis, ATS optimization,
 * scoring, and improvement suggestions.
 */
const {
    LlmAgent
} = require("@google/adk");
const {
    resumePrompt
} = require("../prompts/resume.prompt");
const {
    parseResumeTool,
    analyzeResumeTool
} = require("../tools/resumeTools");

const resumeAgent = new LlmAgent({
    name: "resume_agent",
    model: "gemini-3.1-flash-lite",
    description: "Specialist in resume analysis, ATS optimization, scoring, and improvement " +
        "suggestions. Route here for any questions about resume content, formatting, " +
        "resume scoring, ATS keywords, or when a resume has been uploaded for review.",
    instruction: resumePrompt,
    tools: [parseResumeTool, analyzeResumeTool],
});

module.exports = {
    resumeAgent
};