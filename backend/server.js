console.log("SERVER STARTED");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    GoogleGenerativeAI,
} = require("@google/generative-ai");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const app = express();

const upload = multer({
    dest: "uploads/",
});

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

app.post("/chat", async(req, res) => {
    try {
        const { message } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",

            systemInstruction: `
You are an AI Career Mentor.

Always respond using proper GitHub Markdown.

Formatting Rules:

- Start every response with ## heading
- Use ### for sub-headings
- Use - for bullet points
- Use numbered lists when needed
- Use tables when useful
- Use code blocks with triple backticks
- Use inline code with backticks
- Keep formatting clean and readable
- Never use plain text titles
- Never use "o" style bullets
- Format responses similar to ChatGPT

Example:

## What is React?

### Definition

React is a JavaScript library for building user interfaces.

### Features

- Component Based
- Virtual DOM
- JSX
- Reusable UI
`,
        });

        const result = await model.generateContent(
            message
        );

        const reply = result.response.text();

        console.log("========== GEMINI ==========");
        console.log(reply);
        console.log("============================");

        res.json({ reply });
    } catch (error) {
        console.error("Gemini Error:", error);

        res.status(500).json({
            error: "Something went wrong",
        });
    }
});
app.post("/analyze-resume", upload.single("resume"), async(req, res) => {
    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);

        const resumeText = pdfData.text;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
Analyze this resume and provide:

# Resume Score
Score out of 100

# Strengths
List strengths

# Weaknesses
List weaknesses

# Skills Found
List technical skills

# Suggested Improvements
Give actionable suggestions

Resume:
${resumeText}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        fs.unlinkSync(req.file.path);

        res.json({
            analysis: response.text(),
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Resume analysis failed",
        });
    }
});
app.post("/career-plan", async(req, res) => {
    try {
        const { resumeText } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
You are an expert Career Guidance AI Agent.

Analyze the student's resume and provide:

# Career Paths
Suggest 5 suitable career paths.

# Recommended Skills
List important missing skills.

# Learning Roadmap
Create a step-by-step roadmap for the next 6 months.

# Internship Recommendations
Suggest internship domains.

# Final Career Advice
Give personalized guidance.

Resume:
${resumeText}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({
            careerPlan: response.text(),
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Career plan generation failed",
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(
        `Server running on port ${process.env.PORT}`
    );
});

setInterval(() => {
    console.log("alive...");
}, 5000);