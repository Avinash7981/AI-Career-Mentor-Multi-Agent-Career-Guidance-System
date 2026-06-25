/**
 * Parses ATS analysis markdown response into structured data.
 */

export function parseATSResponse(text) {
    if (!text) return null;

    const result = {
        overallScore: extractOverallScore(text),
        categoryScores: extractCategoryScores(text),
        keywordsFound: extractList(text, /keywords?\s*found/i),
        missingKeywords: extractList(text, /missing\s*keywords?/i),
        technicalMatch: extractList(text, /technical\s*skills?\s*match/i),
        missingTechnical: extractList(text, /missing\s*technical/i),
        strengths: extractList(text, /strengths?/i),
        weaknesses: extractList(text, /weaknesses?/i),
        highPriority: extractList(text, /high\s*priority/i),
        mediumPriority: extractList(text, /medium\s*priority/i),
        lowPriority: extractList(text, /low\s*priority/i),
        missingSections: extractList(text, /missing\s*sections?/i),
        rewrites: extractRewrites(text),
        raw: text,
    };

    if (result.overallScore === null && result.keywordsFound.length === 0) {
        return null;
    }

    return result;
}

function extractOverallScore(text) {
    const match = text.match(/(?:overall|ats)\s*(?:match\s*)?score[:\s]*(\d{1,3})\s*\/\s*100/i);
    if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 0 && num <= 100) return num;
    }
    const alt = text.match(/(\d{1,3})\s*\/\s*100/);
    if (alt) {
        const num = parseInt(alt[1], 10);
        if (num >= 0 && num <= 100) return num;
    }
    return null;
}

function extractCategoryScores(text) {
    const categories = [];
    const patterns = [{
            name: "ATS Compatibility",
            pattern: /ats\s*compatibility[:\s]*(\d{1,3})/i
        },
        {
            name: "Skills Match",
            pattern: /skills?\s*match[:\s]*(\d{1,3})/i
        },
        {
            name: "Experience Match",
            pattern: /experience\s*match[:\s]*(\d{1,3})/i
        },
        {
            name: "Education Match",
            pattern: /education\s*match[:\s]*(\d{1,3})/i
        },
        {
            name: "Projects Match",
            pattern: /projects?\s*match[:\s]*(\d{1,3})/i
        },
    ];

    for (const {
            name,
            pattern
        } of patterns) {
        const match = text.match(pattern);
        if (match) {
            const score = parseInt(match[1], 10);
            if (score >= 0 && score <= 100) categories.push({
                name,
                score
            });
        }
    }
    return categories;
}

function extractList(text, headerPattern) {
    const items = [];
    const sections = text.split(/\n#{1,4}\s+/);
    for (const section of sections) {
        if (headerPattern.test(section.substring(0, 80))) {
            const bullets = section.match(/[-*•]\s+(.+)/g);
            if (bullets) {
                for (const b of bullets) {
                    const cleaned = b.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim();
                    if (cleaned.length > 0 && cleaned.length < 200) items.push(cleaned);
                }
            }
            const numbered = section.match(/\d+\.\s+(.+)/g);
            if (numbered) {
                for (const n of numbered) {
                    const cleaned = n.replace(/^\d+\.\s+/, "").replace(/\*\*/g, "").trim();
                    if (cleaned.length > 0 && cleaned.length < 200) items.push(cleaned);
                }
            }
            break;
        }
    }
    return items.slice(0, 15);
}

function extractRewrites(text) {
    const rewrites = [];
    const pattern = /\*\*Current:\*\*\s*(.+?)[\n\r]+\*\*Improved:\*\*\s*(.+)/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        rewrites.push({
            current: match[1].trim(),
            improved: match[2].trim(),
        });
    }
    return rewrites.slice(0, 10);
}