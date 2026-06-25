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
 * Helper: Detect if an error is a Gemini API quota/rate-limit error.
 * Returns a user-friendly message if it is, or null if it's not a quota issue.
 */
function getQuotaErrorMessage(error) {
    const msg = error.message || "";
    const status = error.status || error.statusCode || error.code || "";

    // Check for 429 status code
    if (status === 429 || status === "429") {
        return "⚠️ AI service quota exceeded. Please try again later or switch to a different model.";
    }

    // Check for quota-related keywords in error message
    const quotaPatterns = [
        /429/i,
        /quota/i,
        /rate.?limit/i,
        /resource.?exhausted/i,
        /too many requests/i,
        /RESOURCE_EXHAUSTED/i,
    ];

    for (const pattern of quotaPatterns) {
        if (pattern.test(msg) || pattern.test(String(status))) {
            return "⚠️ AI service quota exceeded. Please try again later or switch to a different model.";
        }
    }

    // Check nested error structures (Google API errors)
    if (error.errorDetails) {
        const details = JSON.stringify(error.errorDetails);
        if (/quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(details)) {
            return "⚠️ AI service quota exceeded. Please try again later or switch to a different model.";
        }
    }

    return null;
}

/**
 * Helper: Build structured error response, detecting quota errors specifically.
 */
function buildErrorResponse(error, defaultAgent) {
    const quotaMsg = getQuotaErrorMessage(error);

    if (quotaMsg) {
        console.error("[QUOTA ERROR]", error.message || error);
        return {
            statusCode: 429,
            body: {
                error: true,
                agent: defaultAgent,
                errorType: "QUOTA_EXCEEDED",
                message: quotaMsg,
                fallback: true,
            }
        };
    }

    console.error("[ERROR]", error.message || error);
    return {
        statusCode: 500,
        body: {
            error: true,
            agent: defaultAgent,
            errorType: "PROCESSING_FAILED",
            message: "Something went wrong. Please try again.",
            fallback: true,
        }
    };
}

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
 * After response, updates sessionManager state based on which agent responded.
 */
async function runAgent(userId, sessionId, messageText) {
    await ensureAdkSession(userId, sessionId);

    const newMessage = {
        role: "user",
        parts: [{
            text: messageText
        }],
    };

    let lastTextEvent = null;
    let routedAgent = "orchestrator_agent";
    let functionResponseText = null;

    for await (const event of runner.runAsync({
        userId,
        sessionId,
        newMessage,
    })) {
        // Log every event to track routing
        if (event.author && event.author !== "user") {
            const partTypes = (event.content && event.content.parts) ?
                event.content.parts.map(p => {
                    if (p.functionCall) return `functionCall:${p.functionCall.name}`;
                    if (p.functionResponse) return `functionResponse:${p.functionResponse.name}`;
                    if (p.text) return `text(${p.text.substring(0, 50)}...)`;
                    if (p.thought) return "thought";
                    return "unknown";
                }).join(", ") :
                "no-parts";
            console.log(`[EVENT] author=${event.author} | parts=[${partTypes}]`);
        }

        // Process parts
        if (event.content && event.content.parts) {
            for (const part of event.content.parts) {
                if (part.functionCall) {
                    console.log(`[ROUTING] -> ${part.functionCall.name}`);
                    routedAgent = part.functionCall.name;
                }
                if (part.functionResponse) {
                    console.log(`[ROUTING] <- ${part.functionResponse.name} responded`);
                    // Extract text from functionResponse — this is where specialist output lives
                    const resp = part.functionResponse.response;
                    if (resp) {
                        // Response can be a string or an object with output/text/result
                        if (typeof resp === "string") {
                            functionResponseText = resp;
                        } else if (resp.output) {
                            functionResponseText = resp.output;
                        } else if (resp.result) {
                            functionResponseText = typeof resp.result === "string" ? resp.result : JSON.stringify(resp.result);
                        } else if (resp.text) {
                            functionResponseText = resp.text;
                        } else {
                            // Try to stringify
                            functionResponseText = JSON.stringify(resp);
                        }
                        console.log(`[ROUTING] <- text extracted (${functionResponseText ? functionResponseText.length : 0} chars)`);
                    }
                }
                // Track text events (orchestrator's final summarization)
                if (part.text && !part.thought) {
                    lastTextEvent = event;
                }
            }
        }
    }

    // Determine the final reply text
    let reply = null;

    // Priority 1: If there's a direct text event (orchestrator summarized the response)
    if (lastTextEvent) {
        reply = lastTextEvent.content.parts
            .filter((part) => part.text && !part.thought)
            .map((part) => part.text)
            .join("\n");
    }

    // Priority 2: If no text event but we got a functionResponse, use that
    if (!reply && functionResponseText) {
        reply = functionResponseText;
    }

    // Fallback
    if (!reply) {
        return {
            reply: "I'm sorry, I couldn't generate a response.",
            agent: "orchestrator_agent"
        };
    }

    // Use the routed agent name (from function call) or fallback to event author
    const agent = routedAgent !== "orchestrator_agent" ? routedAgent : "orchestrator_agent";

    console.log(`[RESULT] Final agent: ${agent}, reply length: ${reply.length}`);

    // Task 7.2: Update session state based on which agent responded
    updateSessionFromResponse(sessionId, agent, reply);

    return {
        reply,
        agent
    };
}

/**
 * Task 7.2: Parse agent response and update session state accordingly.
 * Each agent type contributes different data to the shared context.
 */
function updateSessionFromResponse(sessionId, agent, reply) {
    try {
        if (agent === "resume_agent") {
            // Extract skills from response (look for skills lists)
            const skills = extractSkills(reply);
            const score = extractScore(reply);
            const experience = extractExperience(reply);

            const updates = {};
            if (skills.length > 0) updates.skills = skills;
            if (score !== null) updates.resumeScore = score;
            if (experience) updates.experience = experience;

            if (Object.keys(updates).length > 0) {
                sessionManager.updateState(sessionId, updates);
                console.log("[Context] Resume Agent updated state:", Object.keys(updates));
            }
        } else if (agent === "career_agent") {
            // Extract career goals and recommended skills
            const careerGoals = extractCareerGoals(reply);
            const recommendedSkills = extractRecommendedSkills(reply);
            const targetRoles = extractTargetRoles(reply);

            const updates = {};
            if (careerGoals.length > 0) updates.careerGoals = careerGoals;
            if (recommendedSkills.length > 0) updates.recommendedSkills = recommendedSkills;
            if (targetRoles.length > 0) updates.targetRoles = targetRoles;

            if (Object.keys(updates).length > 0) {
                sessionManager.updateState(sessionId, updates);
                console.log("[Context] Career Agent updated state:", Object.keys(updates));
            }
        } else if (agent === "interview_agent") {
            // Append to interview history
            const state = sessionManager.getState(sessionId);
            const historyEntry = {
                timestamp: Date.now(),
                responsePreview: reply.substring(0, 200),
            };
            const updatedHistory = [].concat(state.interviewHistory || [], [historyEntry]);
            sessionManager.updateState(sessionId, {
                interviewHistory: updatedHistory
            });
            console.log("[Context] Interview Agent appended to history");
        }
    } catch (err) {
        // Non-critical: don't break the response if parsing fails
        console.warn("[Context] Failed to update state from response:", err.message);
    }
}

/**
 * Extract technical skills from agent response text.
 */
function extractSkills(text) {
    const skills = [];
    // Look for common skill-list patterns in markdown
    const skillSection = text.match(/(?:skills?\s*(?:found|inventory|identified|extracted))[\s\S]*?(?=\n#|\n##|$)/i);
    if (skillSection) {
        // Extract bullet points
        const bullets = skillSection[0].match(/[-*]\s+(.+)/g);
        if (bullets) {
            bullets.forEach((b) => {
                const skill = b.replace(/^[-*]\s+/, "").replace(/\*\*/g, "").trim();
                if (skill.length > 0 && skill.length < 50) {
                    skills.push(skill);
                }
            });
        }
    }
    return skills.slice(0, 20); // Cap at 20 skills
}

/**
 * Extract resume score from agent response.
 */
function extractScore(text) {
    const scoreMatch = text.match(/(?:score|rating)[:\s]*(\d{1,3})\s*(?:\/\s*100|out of 100)/i);
    if (scoreMatch) {
        const num = parseInt(scoreMatch[1], 10);
        if (num >= 0 && num <= 100) return num;
    }
    // Try alternative pattern: "78/100"
    const altMatch = text.match(/(\d{1,3})\s*\/\s*100/);
    if (altMatch) {
        const num = parseInt(altMatch[1], 10);
        if (num >= 0 && num <= 100) return num;
    }
    return null;
}

/**
 * Extract experience level from agent response.
 */
function extractExperience(text) {
    const expMatch = text.match(/(?:experience|level)[:\s]*(.{3,40}?)(?:\n|$)/i);
    if (expMatch) {
        return expMatch[1].replace(/\*\*/g, "").trim();
    }
    return null;
}

/**
 * Extract career goals/paths from career agent response.
 */
function extractCareerGoals(text) {
    const goals = [];
    const section = text.match(/(?:career\s*paths?|recommended\s*paths?)[\s\S]*?(?=\n##|\n#[^#]|$)/i);
    if (section) {
        const items = section[0].match(/\d+\.\s+\*\*(.+?)\*\*/g);
        if (items) {
            items.forEach((item) => {
                const match = item.match(/\*\*(.+?)\*\*/);
                if (match) goals.push(match[1].trim());
            });
        }
        if (goals.length === 0) {
            const bullets = section[0].match(/[-*]\s+\*\*(.+?)\*\*/g);
            if (bullets) {
                bullets.forEach((b) => {
                    const match = b.match(/\*\*(.+?)\*\*/);
                    if (match) goals.push(match[1].trim());
                });
            }
        }
    }
    return goals.slice(0, 5);
}

/**
 * Extract recommended skills from career agent response.
 */
function extractRecommendedSkills(text) {
    const skills = [];
    const section = text.match(/(?:recommended\s*skills?|missing\s*skills?|skills?\s*to\s*learn)[\s\S]*?(?=\n##|\n#[^#]|$)/i);
    if (section) {
        const bullets = section[0].match(/[-*]\s+(.+)/g);
        if (bullets) {
            bullets.forEach((b) => {
                const skill = b.replace(/^[-*]\s+/, "").replace(/\*\*/g, "").split(/[-–:]/)[0].trim();
                if (skill.length > 0 && skill.length < 50) {
                    skills.push(skill);
                }
            });
        }
    }
    return skills.slice(0, 10);
}

/**
 * Extract target roles from career agent response.
 */
function extractTargetRoles(text) {
    const roles = [];
    const section = text.match(/(?:target\s*roles?|job\s*roles?|positions?)[\s\S]*?(?=\n##|\n#[^#]|$)/i);
    if (section) {
        const bullets = section[0].match(/[-*]\s+\*\*(.+?)\*\*/g);
        if (bullets) {
            bullets.forEach((b) => {
                const match = b.match(/\*\*(.+?)\*\*/);
                if (match) roles.push(match[1].trim());
            });
        }
    }
    return roles.slice(0, 5);
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
        console.error("Agent Error:", error.message || error);
        const errResp = buildErrorResponse(error, "orchestrator_agent");
        res.status(errResp.statusCode).json(errResp.body);
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
        console.error("Resume upload error:", error.message || error);
        const errResp = buildErrorResponse(error, "resume_agent");
        res.status(errResp.statusCode).json(errResp.body);
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
        console.error("Resume analysis error:", error.message || error);
        const errResp = buildErrorResponse(error, "resume_agent");
        res.status(errResp.statusCode).json(errResp.body);
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
        console.error("Career plan error:", error.message || error);
        const errResp = buildErrorResponse(error, "career_agent");
        res.status(errResp.statusCode).json(errResp.body);
    }
});

// ============================================================
// Helper: Build context block from session state (Task 7.1)
// Provides accumulated knowledge to agents for cross-agent awareness
// ============================================================
function buildContextBlock(state) {
    const parts = ["[Session Context - Shared between agents]"];

    if (state.resumeText) {
        // Include a truncated resume summary so career/interview agents have it
        const resumePreview = state.resumeText.substring(0, 500);
        parts.push("Resume Summary: " + resumePreview + (state.resumeText.length > 500 ? "..." : ""));
    }
    if (state.skills && state.skills.length > 0) {
        parts.push("Identified Skills: " + state.skills.join(", "));
    }
    if (state.experience) {
        parts.push("Experience Level: " + state.experience);
    }
    if (state.resumeScore) {
        parts.push("Resume Score: " + state.resumeScore + "/100");
    }
    if (state.careerGoals && state.careerGoals.length > 0) {
        parts.push("Career Goals: " + state.careerGoals.join(", "));
    }
    if (state.recommendedSkills && state.recommendedSkills.length > 0) {
        parts.push("Recommended Skills to Learn: " + state.recommendedSkills.join(", "));
    }
    if (state.targetRoles && state.targetRoles.length > 0) {
        parts.push("Target Roles: " + state.targetRoles.join(", "));
    }
    if (state.interviewHistory && state.interviewHistory.length > 0) {
        parts.push("Interview Sessions Completed: " + state.interviewHistory.length);
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