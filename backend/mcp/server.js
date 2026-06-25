#!/usr/bin/env node

/**
 * MCP Server for AI Career Mentor.
 * Exposes GitHub analysis and Profile optimization tools via MCP protocol.
 * Connected by ADK agents via StdioTransport.
 */
const {
    Server
} = require("@modelcontextprotocol/sdk/server/index.js");
const {
    StdioServerTransport
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
    CallToolRequestSchema,
    ListToolsRequestSchema
} = require("@modelcontextprotocol/sdk/types.js");
const {
    analyzeGitHubProfile,
    listRepositories,
    getLanguageStats
} = require("./github/githubTools");
const {
    analyzeProfile
} = require("./profile/profileAnalyzer");

const server = new Server({
    name: "career-mentor-mcp",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [{
                name: "analyze_github_profile",
                description: "Analyze a GitHub user's profile, repositories, languages, README quality, and portfolio completeness. Returns scores and recommendations.",
                inputSchema: {
                    type: "object",
                    properties: {
                        username: {
                            type: "string",
                            description: "GitHub username to analyze"
                        },
                    },
                    required: ["username"],
                },
            },
            {
                name: "list_github_repositories",
                description: "List public repositories for a GitHub user with stats (stars, forks, language, topics).",
                inputSchema: {
                    type: "object",
                    properties: {
                        username: {
                            type: "string",
                            description: "GitHub username"
                        },
                        limit: {
                            type: "number",
                            description: "Max repos to return (default 30)"
                        },
                    },
                    required: ["username"],
                },
            },
            {
                name: "get_github_languages",
                description: "Get programming language statistics for a GitHub user's repositories.",
                inputSchema: {
                    type: "object",
                    properties: {
                        username: {
                            type: "string",
                            description: "GitHub username"
                        },
                    },
                    required: ["username"],
                },
            },
            {
                name: "analyze_professional_profile",
                description: "Analyze a professional profile (LinkedIn, Naukri, Indeed, portfolio) for recruiter readiness, ATS optimization, and generate improvement suggestions.",
                inputSchema: {
                    type: "object",
                    properties: {
                        profileText: {
                            type: "string",
                            description: "The full text of the professional profile to analyze"
                        },
                        platform: {
                            type: "string",
                            description: "Platform: linkedin, naukri, indeed, portfolio, resume_summary"
                        },
                    },
                    required: ["profileText"],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {
        name,
        arguments: args
    } = request.params;

    try {
        let result;
        switch (name) {
            case "analyze_github_profile":
                result = await analyzeGitHubProfile(args);
                break;
            case "list_github_repositories":
                result = await listRepositories(args);
                break;
            case "get_github_languages":
                result = await getLanguageStats(args);
                break;
            case "analyze_professional_profile":
                result = await analyzeProfile(args);
                break;
            default:
                return {
                    content: [{
                        type: "text",
                        text: `Unknown tool: ${name}`
                    }], isError: true
                };
        }

        return {
            content: [{
                type: "text",
                text: result
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error: ${error.message}`
            }],
            isError: true,
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);