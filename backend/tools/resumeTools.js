/**
 * Resume Agent FunctionTools
 * Tools for parsing and analyzing resumes, updating session state.
 */
const {
    FunctionTool
} = require("@google/adk");
const sessionManager = require("../sessions/sessionManager");

/**
 * parseResumeTool - Accepts raw resume text, stores it in session state
 * for inter-agent sharing.
 */
const parseResumeTool = new FunctionTool({
    name: "parse_resume",
    description: "Parse raw resume text to extract and store it in session state. " +
        "Call this when a resume has been uploaded and its text content is available. " +
        "Stores the text for other agents to reference.",
    parameters: {
        type: "object",
        properties: {
            resumeText: {
                type: "string",
                description: "The raw text content extracted from a PDF resume",
            },
            sessionId: {
                type: "string",
                description: "The session ID to store parsed data in",
            },
        },
        required: ["resumeText", "sessionId"],
    },
    execute: async (args) => {
        const {
            resumeText,
            sessionId
        } = args;

        if (sessionId) {
            sessionManager.updateState(sessionId, {
                resumeText
            });
        }

        return JSON.stringify({
            success: true,
            message: "Resume text parsed and stored in session context.",
            textLength: resumeText.length,
            preview: resumeText.substring(0, 200),
        });
    },
});

/**
 * analyzeResumeTool - Stores resume analysis results (score, skills, experience)
 * in session state for inter-agent sharing.
 */
const analyzeResumeTool = new FunctionTool({
    name: "analyze_resume",
    description: "Store resume analysis results including score, skills, and experience level " +
        "in session state. Use after the resume has been analyzed to persist results " +
        "for other agents.",
    parameters: {
        type: "object",
        properties: {
            sessionId: {
                type: "string",
                description: "The session ID to update with analysis results",
            },
            score: {
                type: "number",
                description: "Resume score out of 100",
            },
            skills: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "List of technical and soft skills found in the resume",
            },
            experience: {
                type: "string",
                description: "Experience level (e.g., 'entry-level', '2 years', 'senior')",
            },
        },
        required: ["sessionId"],
    },
    execute: async (args) => {
        const {
            sessionId,
            score,
            skills,
            experience
        } = args;

        const updates = {};
        if (score !== undefined) updates.resumeScore = score;
        if (skills && skills.length > 0) updates.skills = skills;
        if (experience) updates.experience = experience;

        if (sessionId && Object.keys(updates).length > 0) {
            sessionManager.updateState(sessionId, updates);
        }

        return JSON.stringify({
            success: true,
            message: "Resume analysis results stored in session context.",
            storedFields: Object.keys(updates),
        });
    },
});

module.exports = {
    parseResumeTool,
    analyzeResumeTool
};