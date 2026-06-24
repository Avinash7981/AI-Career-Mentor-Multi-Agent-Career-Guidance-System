/**
 * Career Agent FunctionTools
 * Tools for generating career roadmaps and identifying skill gaps.
 */
const {
    FunctionTool
} = require("@google/adk");
const sessionManager = require("../sessions/sessionManager");

/**
 * generateRoadmapTool - Stores career goals, recommended skills, and target
 * roles in session state.
 */
const generateRoadmapTool = new FunctionTool({
    name: "generate_roadmap",
    description: "Store career roadmap data (goals, recommended skills, target roles) in session state. " +
        "Use when generating a career plan to persist recommendations for other agents.",
    parameters: {
        type: "object",
        properties: {
            sessionId: {
                type: "string",
                description: "The session ID to update with career goals",
            },
            careerGoals: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Career paths recommended for the user",
            },
            recommendedSkills: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Skills the user should learn",
            },
            targetRoles: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Specific job roles to target",
            },
        },
        required: ["sessionId"],
    },
    execute: async (args) => {
        const {
            sessionId,
            careerGoals,
            recommendedSkills,
            targetRoles
        } = args;

        const updates = {};
        if (careerGoals && careerGoals.length > 0) updates.careerGoals = careerGoals;
        if (recommendedSkills && recommendedSkills.length > 0)
            updates.recommendedSkills = recommendedSkills;
        if (targetRoles && targetRoles.length > 0) updates.targetRoles = targetRoles;

        if (sessionId && Object.keys(updates).length > 0) {
            sessionManager.updateState(sessionId, updates);
        }

        return JSON.stringify({
            success: true,
            message: "Career roadmap data stored in session context.",
            storedFields: Object.keys(updates),
        });
    },
});

/**
 * skillGapTool - Identifies missing skills and merges them into session state.
 */
const skillGapTool = new FunctionTool({
    name: "skill_gap_analysis",
    description: "Perform skill gap analysis by recording missing skills for a target role. " +
        "Merges new missing skills into the session's recommended skills list.",
    parameters: {
        type: "object",
        properties: {
            sessionId: {
                type: "string",
                description: "The session ID to read current skills from and update",
            },
            targetRole: {
                type: "string",
                description: "The target role to analyze skill gaps for",
            },
            missingSkills: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Skills identified as missing for the target role",
            },
        },
        required: ["sessionId"],
    },
    execute: async (args) => {
        const {
            sessionId,
            targetRole,
            missingSkills
        } = args;

        const state = sessionManager.getState(sessionId);

        if (missingSkills && missingSkills.length > 0) {
            const existingRecommended = state.recommendedSkills || [];
            const merged = [...new Set([...existingRecommended, ...missingSkills])];
            sessionManager.updateState(sessionId, {
                recommendedSkills: merged
            });
        }

        return JSON.stringify({
            success: true,
            message: "Skill gap analysis complete.",
            currentSkills: state.skills,
            targetRole: targetRole || "not specified",
            missingSkills: missingSkills || [],
        });
    },
});

module.exports = {
    generateRoadmapTool,
    skillGapTool
};