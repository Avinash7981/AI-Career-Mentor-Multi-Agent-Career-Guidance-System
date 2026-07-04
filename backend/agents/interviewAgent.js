/**
 * Interview Agent - Specialist in mock interviews, question generation,
 * behavioral/technical interview prep, and answer feedback.
 */
const {
    LlmAgent
} = require("@google/adk");
const {
    interviewPrompt
} = require("../prompts/interview.prompt");
const {
    generateQuestionsTool,
    evaluateAnswerTool
} = require("../tools/interviewTools");

const interviewAgent = new LlmAgent({
    name: "interview_agent",
    model: "gemini-3.1-flash-lite",
    description: "Specialist in mock interviews, interview preparation, behavioral and " +
        "technical question generation, and answer feedback. Route here for " +
        "questions about interview prep, mock interviews, STAR method, " +
        "behavioral questions, or when the user wants answer feedback.",
    instruction: interviewPrompt,
    tools: [generateQuestionsTool, evaluateAnswerTool],
});

module.exports = {
    interviewAgent
};