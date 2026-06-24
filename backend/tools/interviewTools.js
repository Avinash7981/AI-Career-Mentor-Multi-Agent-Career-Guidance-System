/**
 * Interview Agent FunctionTools
 * Tools for generating interview questions and evaluating answers.
 */
const {
    FunctionTool
} = require("@google/adk");
const sessionManager = require("../sessions/sessionManager");

/**
 * generateQuestionsTool - Records generated interview questions in session history.
 */
const generateQuestionsTool = new FunctionTool({
    name: "generate_interview_questions",
    description: "Record generated interview questions in session history. " +
        "Use after generating questions to track what was asked and avoid repetition.",
    parameters: {
        type: "object",
        properties: {
            sessionId: {
                type: "string",
                description: "The session ID to update",
            },
            questionType: {
                type: "string",
                description: "Type of questions: behavioral, technical, situational, or mixed",
            },
            targetRole: {
                type: "string",
                description: "The role questions are generated for",
            },
            questions: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "The generated interview questions",
            },
        },
        required: ["sessionId"],
    },
    execute: async (args) => {
        const {
            sessionId,
            questionType,
            targetRole,
            questions
        } = args;

        const state = sessionManager.getState(sessionId);

        if (questions && questions.length > 0) {
            const firstTarget =
                state.targetRoles && state.targetRoles.length > 0 ?
                state.targetRoles[0] :
                "general";

            const historyEntry = {
                timestamp: Date.now(),
                type: questionType || "mixed",
                targetRole: targetRole || firstTarget,
                questions: questions,
            };

            const updatedHistory = [].concat(state.interviewHistory || [], [historyEntry]);
            sessionManager.updateState(sessionId, {
                interviewHistory: updatedHistory
            });
        }

        return JSON.stringify({
            success: true,
            message: "Interview questions recorded.",
            context: {
                skills: state.skills,
                careerGoals: state.careerGoals,
                experience: state.experience,
            },
            questionCount: questions ? questions.length : 0,
        });
    },
});

/**
 * evaluateAnswerTool - Records evaluation of a user's interview answer.
 */
const evaluateAnswerTool = new FunctionTool({
    name: "evaluate_interview_answer",
    description: "Record evaluation of a user's interview answer including score, " +
        "strengths, and areas for improvement in session history.",
    parameters: {
        type: "object",
        properties: {
            sessionId: {
                type: "string",
                description: "The session ID to update with evaluation",
            },
            question: {
                type: "string",
                description: "The interview question that was asked",
            },
            userAnswer: {
                type: "string",
                description: "The user's answer to evaluate",
            },
            score: {
                type: "number",
                description: "Score for the answer (1-10)",
            },
            strengths: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Strengths identified in the answer",
            },
            improvements: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Areas for improvement",
            },
        },
        required: ["sessionId"],
    },
    execute: async (args) => {
        const {
            sessionId,
            question,
            userAnswer,
            score,
            strengths,
            improvements
        } = args;

        const state = sessionManager.getState(sessionId);

        const evaluation = {
            timestamp: Date.now(),
            question: question || "unknown",
            answerPreview: userAnswer ? userAnswer.substring(0, 100) : "",
            score: score || null,
            strengths: strengths || [],
            improvements: improvements || [],
        };

        const updatedHistory = [].concat(state.interviewHistory || [], [evaluation]);
        sessionManager.updateState(sessionId, {
            interviewHistory: updatedHistory
        });

        return JSON.stringify({
            success: true,
            message: "Answer evaluation recorded.",
            evaluation: evaluation,
        });
    },
});

module.exports = {
    generateQuestionsTool,
    evaluateAnswerTool
};