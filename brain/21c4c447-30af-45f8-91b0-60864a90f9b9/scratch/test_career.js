require("dotenv").config({ path: "/Users/macbookairm4/AI-Career-Mentor-V2/backend/.env" });
const { Runner, InMemorySessionService } = require("@google/adk");
const { careerAgent } = require("/Users/macbookairm4/AI-Career-Mentor-V2/backend/agents/careerAgent");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    const modelName = "gemini-2.5-flash";
    careerAgent.model = modelName;
    
    const sessionService = new InMemorySessionService();
    const runner = new Runner({
        appName: `ai-career-mentor-${modelName}`,
        agent: careerAgent,
        sessionService: sessionService,
    });

    const userId = "test-user";
    const sessionId = "test-session-" + Date.now();
    
    await sessionService.createSession({
        appName: `ai-career-mentor-${modelName}`,
        userId,
        sessionId,
        state: {},
    });

    const newMessage = {
        role: "user",
        parts: [{ text: "I want to be a software engineer. What skills do I need? Keep it short: 1 sentence." }],
    };

    while (true) {
        try {
            console.log(`Running agent...`);
            let gotError429 = false;
            let retryDelaySec = 10;
            let successText = "";

            for await (const event of runner.runAsync({
                userId,
                sessionId,
                newMessage,
            })) {
                if (event.errorCode) {
                    console.log("Runner event error:", event.errorCode, event.errorMessage);
                    if (String(event.errorCode) === "429" || event.errorMessage.includes("quota") || event.errorMessage.includes("Limit")) {
                        gotError429 = true;
                        // Parse retry delay from message e.g. "Please retry in 14.198126644s."
                        const match = event.errorMessage.match(/retry in ([\d\.]+)s/);
                        if (match) {
                            retryDelaySec = Math.ceil(parseFloat(match[1])) + 2;
                        } else {
                            retryDelaySec = 30; // default backup
                        }
                    }
                } else if (event.content && event.content.parts) {
                    const text = event.content.parts.map(p => p.text || "").join("");
                    if (text) {
                        successText += text;
                    }
                }
            }

            if (gotError429) {
                console.log(`Hit 429 quota error. Sleeping for ${retryDelaySec} seconds before retrying...`);
                await sleep(retryDelaySec * 1000);
                continue;
            }

            console.log("Agent response:", successText);
            break; // Success!
        } catch (err) {
            console.error("Caught exception:", err);
            break;
        }
    }
}

runTest();
