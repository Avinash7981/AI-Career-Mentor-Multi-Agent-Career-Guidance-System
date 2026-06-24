console.log("SERVER STARTED");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const crypto = require("crypto");

// ADK imports
const {
    Runner,
    InMemorySessionService
} = require("@google/adk");
const {
    rootAgent
} = require("./agents");
const sessionManager = require("./sessions/sessionManager");

const app = express();

const upload = multer({
    dest: "uploads/",
});

app.use(cors());
app.use(express.json());

// ADK Runner setup
const sessionService = new InMemorySessionService();
const runner = new Runner({
    appName: "ai-career-mentor",
    agent: rootAgent,
    sessionService: sessionService,
});

/**
 * Helper: Ensure an ADK session exists for the given userId + sessionId.
 * Creates one if it doesn't exist, seeding it with our sessionManager state.
 */
async function ensureAdkSession(userId, sessionId) {
    let session = await sessionService.getSession({
        appName: "ai-career-mentor",
        userId,
        sessionId,
    });

    if (!session) {
        // Get current context from our sessionManager
        const state = sessionManager.getState(sessionId);
        session = await sessionService.createSession({
            appName: "ai-career-mentor",
            userId,
            sessionId,
            state: state,
        });
    }

    return session;
}

/**
 * Helper: Run the orchestrator agent and collect the final response.
 * Returns { reply, agent } where agent is the name of the responding agent.
 */
async function runAgent(userId, sessionId, messageText) {
    await ensureAdkSession(userId, sessionId);

    const newMessage = {
        role: "user",
        parts: [{
            text: messageText
        }],
    };

    let lastEvent = null;

    for await (const event of runner.runAsync({
        userId,
        sessionId,
        newMessage,
    })) {
        // Collect events; the last non-partial event with content is the response
        if (event.content && event.content.parts && event.content.parts.length > 0) {
            lastEvent = event;
        }
    }

    if (!lastEvent) {
        return {
            reply: "I'm sorry, I couldn't generate a response.",
            agent: "orchestrator_agent"
        };
    }

    // Extract text from the response parts
    const reply = lastEvent.content.parts
        .filter((part) => part.text && !part.thought)
        .map((part) => part.text)
        .join("\n");

    // The author field tells us which agent produced the final response
    const agent = lastEvent.author || "orchestrator_agent";

    return {
        reply,
        agent
    };
}

// ============================================================
// POST /chat - Unified chat endpoint using multi-agent system
// ============================================================
app.post("/chat", async (req, res) => {
    try {
        const {
            message,
            sessionId: clientSessionId
        } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        // Use client-provided sessionId or generate one
        const sessionId = clientSessionId || crypto.randomUUID();
        const userId = "default-user";

        // Inject session context into the message if resume data exists
        const state = sessionManager.getState(sessionId);
        let enrichedMessage = message;

        if (state.resumeText || state.skills.length > 0) {
            const contextBlock = buildContextBlock(state);
            enrichedMessage = contextBlock + "\n\nUser message: " + message;
        }

        const {
            reply,
            agent
        } = await runAgent(userId, sessionId, enrichedMessage);

        console.log("========== AGENT RESPONSE ==========");
        console.log("Agent:", agent);
        console.log("Reply:", reply.substring(0, 200) + "...");
        console.log("====================================");

        res.json({
            reply,
            agent,
            sessionId
        });
    } catch (error) {
        console.error("Agent Error:", error);
        res.status(500).json({
            error: true,
            agent: "orchestrator_agent",
            errorType: "PROCESSING_FAILED",
            message: "Something went wrong. Please try again.",
            fallback: true,
        });
    }
});

// ============================================================
// POST /upload-resume - Resume upload, parsed then sent to agents
// ============================================================
app.post("/upload-resume", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No file uploaded"
            });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        const resumeText = pdfData.text;

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Use client-provided sessionId or generate one
        const sessionId = req.body.sessionId || crypto.randomUUID();
        const userId = "default-user";

        // Store resume text in our session manager immediately
        sessionManager.updateState(sessionId, {
            resumeText
        });

        // Send to orchestrator for analysis by resume agent
        const analysisPrompt =
            "I just uploaded my resume. Please analyze it thoroughly.\n\n" +
            "Resume content:\n" + resumeText;

        const {
            reply,
            agent
        } = await runAgent(userId, sessionId, analysisPrompt);

        console.log("========== RESUME ANALYSIS ==========");
        console.log("Agent:", agent);
        console.log("Analysis length:", reply.length);
        console.log("=====================================");

        res.json({
            analysis: reply,
            agent,
            sessionId
        });
    } catch (error) {
        console.error("Resume upload error:", error);
        res.status(500).json({
            error: true,
            agent: "resume_agent",
            errorType: "ANALYSIS_FAILED",
            message: "Resume analysis failed. Please try uploading again.",
            fallback: true,
        });
    }
});

// ============================================================
// POST /analyze-resume - Legacy endpoint (preserved for backward compat)
// ============================================================
app.post("/analyze-resume", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No file uploaded"
            });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        const resumeText = pdfData.text;

        fs.unlinkSync(req.file.path);

        // Use client-provided sessionId or generate one
        const sessionId = req.body.sessionId || crypto.randomUUID();
        const userId = "default-user";

        // Store resume text in session
        sessionManager.updateState(sessionId, {
            resumeText
        });

        // Route through agent system
        const analysisPrompt =
            "Analyze this resume and provide a score out of 100, strengths, " +
            "weaknesses, skills found, and suggested improvements.\n\n" +
            "Resume:\n" + resumeText;

        const {
            reply,
            agent
        } = await runAgent(userId, sessionId, analysisPrompt);

        res.json({
            analysis: reply,
            agent,
            sessionId
        });
    } catch (error) {
        console.error("Resume analysis error:", error);
        res.status(500).json({
            error: "Resume analysis failed"
        });
    }
});

// ============================================================
// POST /career-plan - Legacy endpoint (preserved for backward compat)
// ============================================================
app.post("/career-plan", async (req, res) => {
    try {
        const {
            resumeText,
            sessionId: clientSessionId
        } = req.body;

        const sessionId = clientSessionId || crypto.randomUUID();
        const userId = "default-user";

        // Store resume text if provided
        if (resumeText) {
            sessionManager.updateState(sessionId, {
                resumeText
            });
        }

        // Route through agent system (career agent will handle this)
        const careerPrompt =
            "Generate a comprehensive career plan based on my background. " +
            "Include career paths, recommended skills, a learning roadmap, " +
            "internship recommendations, and personalized career advice.\n\n" +
            (resumeText ? "Resume:\n" + resumeText : "");

        const {
            reply,
            agent
        } = await runAgent(userId, sessionId, careerPrompt);

        res.json({
            careerPlan: reply,
            agent,
            sessionId
        });
    } catch (error) {
        console.error("Career plan error:", error);
        res.status(500).json({
            error: "Career plan generation failed"
        });
    }
});

// ============================================================
// Helper: Build context block from session state
// ============================================================
function buildContextBlock(state) {
    const parts = ["[Session Context]"];

    if (state.skills && state.skills.length > 0) {
        parts.push("Skills: " + state.skills.join(", "));
    }
    if (state.experience) {
        parts.push("Experience: " + state.experience);
    }
    if (state.resumeScore) {
        parts.push("Resume Score: " + state.resumeScore + "/100");
    }
    if (state.careerGoals && state.careerGoals.length > 0) {
        parts.push("Career Goals: " + state.careerGoals.join(", "));
    }
    if (state.targetRoles && state.targetRoles.length > 0) {
        parts.push("Target Roles: " + state.targetRoles.join(", "));
    }

    return parts.join("\n");
}

// ============================================================
// Server startup
// ============================================================
app.listen(process.env.PORT, () => {
    console.log(`Multi-Agent Career Mentor running on port ${process.env.PORT}`);
});

// Periodic session cleanup
setInterval(() => {
    sessionManager.cleanup();
}, 300000); // Every 5 minutes