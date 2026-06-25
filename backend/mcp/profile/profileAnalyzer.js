/**
 * Professional Profile Analyzer.
 * Analyzes LinkedIn/Naukri/Indeed/Portfolio profiles for optimization.
 * Returns structured scores and recommendations.
 */

async function analyzeProfile({
    profileText,
    platform
}) {
    const text = profileText || "";
    const plat = platform || "linkedin";

    // Analyze different sections
    const headlineScore = scoreHeadline(text);
    const summaryScore = scoreSummary(text);
    const experienceScore = scoreExperience(text);
    const projectsScore = scoreProjects(text);
    const skillsScore = scoreSkills(text);
    const communicationScore = scoreCommunication(text);

    const overallScore = Math.round(
        (headlineScore + summaryScore + experienceScore + projectsScore + skillsScore + communicationScore) / 6
    );

    const strengths = [];
    const weaknesses = [];

    if (headlineScore >= 70) strengths.push("Strong headline/title");
    else weaknesses.push("Headline needs improvement — add role + value proposition");

    if (summaryScore >= 70) strengths.push("Good about/summary section");
    else weaknesses.push("Summary is weak or missing — add a compelling 3-4 sentence summary");

    if (experienceScore >= 70) strengths.push("Experience well documented");
    else weaknesses.push("Experience section needs more detail — add achievements with metrics");

    if (projectsScore >= 70) strengths.push("Projects showcase technical ability");
    else weaknesses.push("Add more projects with impact descriptions");

    if (skillsScore >= 70) strengths.push("Skills section is comprehensive");
    else weaknesses.push("Add more relevant skills and keywords");

    if (communicationScore >= 70) strengths.push("Professional writing quality");
    else weaknesses.push("Improve writing — use action verbs, quantify achievements");

    return JSON.stringify({
        platform: plat,
        overallScore,
        scores: {
            headline: headlineScore,
            summary: summaryScore,
            experience: experienceScore,
            projects: projectsScore,
            skills: skillsScore,
            communication: communicationScore,
        },
        recruiterReadiness: overallScore >= 75 ? "Ready" : overallScore >= 50 ? "Needs Work" : "Not Ready",
        strengths,
        weaknesses,
        wordCount: text.split(/\s+/).length,
        keywordsFound: extractKeywords(text),
        suggestions: generateSuggestions(text, plat),
    });
}

function scoreHeadline(text) {
    const firstLine = text.split("\n")[0] || "";
    if (firstLine.length > 50 && /\||\•|,/.test(firstLine)) return 85;
    if (firstLine.length > 20) return 60;
    return 30;
}

function scoreSummary(text) {
    const lower = text.toLowerCase();
    if (/about|summary|professional\s*summary/i.test(text) && text.length > 200) return 80;
    if (text.length > 500) return 70;
    if (text.length > 100) return 50;
    return 25;
}

function scoreExperience(text) {
    const expMatches = text.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/gi) || [];
    if (expMatches.length >= 3) return 85;
    if (expMatches.length >= 1) return 60;
    if (/experience|worked|role|position/i.test(text)) return 40;
    return 20;
}

function scoreProjects(text) {
    const projIndicators = (text.match(/project|built|developed|created|implemented/gi) || []).length;
    if (projIndicators >= 5) return 85;
    if (projIndicators >= 2) return 60;
    if (projIndicators >= 1) return 40;
    return 20;
}

function scoreSkills(text) {
    const techKeywords = [
        "javascript", "python", "react", "node", "sql", "aws", "docker", "git",
        "typescript", "java", "machine learning", "ai", "api", "database",
    ];
    const found = techKeywords.filter(k => text.toLowerCase().includes(k));
    if (found.length >= 8) return 90;
    if (found.length >= 5) return 70;
    if (found.length >= 2) return 50;
    return 25;
}

function scoreCommunication(text) {
    const actionVerbs = ["led", "built", "designed", "managed", "developed", "increased", "reduced", "optimized", "achieved"];
    const found = actionVerbs.filter(v => text.toLowerCase().includes(v));
    const hasMetrics = /\d+%|\d+x|\$\d+|\d+\s*(users|customers|clients)/i.test(text);
    let score = 40;
    if (found.length >= 3) score += 25;
    if (hasMetrics) score += 25;
    if (text.length > 300) score += 10;
    return Math.min(score, 100);
}

function extractKeywords(text) {
    const keywords = [];
    const patterns = [
        "JavaScript", "Python", "React", "Node.js", "TypeScript", "SQL", "AWS",
        "Docker", "Kubernetes", "Git", "REST API", "GraphQL", "Machine Learning",
        "AI", "Data Science", "Agile", "Scrum", "CI/CD", "TensorFlow", "Next.js",
    ];
    for (const kw of patterns) {
        if (text.toLowerCase().includes(kw.toLowerCase())) keywords.push(kw);
    }
    return keywords;
}

function generateSuggestions(text, platform) {
    const suggestions = [];
    if (text.split("\n")[0].length < 30) suggestions.push("Make your headline longer and more descriptive (include role + specialization + value)");
    if (!/\d+%|\d+x/i.test(text)) suggestions.push("Add quantified achievements (increased X by Y%, reduced Z by W%)");
    if (text.split(/\s+/).length < 100) suggestions.push("Profile is too short — aim for 300+ words to appear in recruiter searches");
    if (!/certification|certified/i.test(text)) suggestions.push("Add relevant certifications to boost credibility");
    if (platform === "linkedin" && !/recommendation/i.test(text)) suggestions.push("Get 3+ LinkedIn recommendations from colleagues");
    return suggestions;
}

module.exports = {
    analyzeProfile
};