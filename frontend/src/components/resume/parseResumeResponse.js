/**
 * Parses resume agent markdown response into structured data for the dashboard.
 * Gracefully falls back to empty sections if parsing fails.
 */

export function parseResumeResponse(text) {
    if (!text) return null;

    const result = {
        score: extractScore(text),
        categories: extractCategories(text),
        strengths: extractListSection(text, /(?:strengths?|strong\s*points?)[\s:]*/i),
        weaknesses: extractListSection(text, /(?:weaknesses?|areas?\s*for\s*improvement|weak\s*points?)[\s:]*/i),
        skills: extractSkills(text),
        improvements: extractImprovements(text),
        raw: text,
    };

    // Only show dashboard if we got at least a score or some structured data
    if (result.score === null && result.strengths.length === 0 && result.skills.length === 0) {
        return null;
    }

    return result;
}

function extractScore(text) {
    // Look for patterns like "78/100", "Score: 85", "score out of 100"
    const patterns = [
        /(\d{1,3})\s*\/\s*100/,
        /(?:score|rating)[:\s]*(\d{1,3})\s*(?:\/\s*100|out of 100)?/i,
        /(?:overall|ats|resume)\s*(?:score|rating)[:\s]*(\d{1,3})/i,
    ];

    for (const p of patterns) {
        const match = text.match(p);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num >= 0 && num <= 100) return num;
        }
    }
    return null;
}

function extractCategories(text) {
    const categories = [];
    const categoryPatterns = [{
            name: "ATS Compatibility",
            pattern: /ats\s*(?:compatibility|optimization|score)?[:\s]*(\d{1,3})/i
        },
        {
            name: "Formatting",
            pattern: /format(?:ting)?[:\s]*(\d{1,3})/i
        },
        {
            name: "Content",
            pattern: /content[:\s]*(\d{1,3})/i
        },
        {
            name: "Impact",
            pattern: /impact[:\s]*(\d{1,3})/i
        },
        {
            name: "Skills",
            pattern: /skills?\s*(?:section|score)?[:\s]*(\d{1,3})/i
        },
        {
            name: "Experience",
            pattern: /experience[:\s]*(\d{1,3})/i
        },
    ];

    for (const {
            name,
            pattern
        } of categoryPatterns) {
        const match = text.match(pattern);
        if (match) {
            const score = parseInt(match[1], 10);
            if (score >= 0 && score <= 100) {
                categories.push({
                    name,
                    score
                });
            }
        }
    }

    return categories;
}

function extractListSection(text, headerPattern) {
    const items = [];
    // Find section by header
    const sections = text.split(/\n#{1,4}\s+/);

    for (const section of sections) {
        if (headerPattern.test(section.substring(0, 100))) {
            // Extract bullet points
            const bullets = section.match(/[-*•✓✗]\s+(.+)/g);
            if (bullets) {
                for (const b of bullets) {
                    const cleaned = b.replace(/^[-*•✓✗]\s+/, "").replace(/\*\*/g, "").trim();
                    if (cleaned.length > 0 && cleaned.length < 200) {
                        items.push(cleaned);
                    }
                }
            }
            // Also extract numbered items
            const numbered = section.match(/\d+\.\s+(.+)/g);
            if (numbered) {
                for (const n of numbered) {
                    const cleaned = n.replace(/^\d+\.\s+/, "").replace(/\*\*/g, "").trim();
                    if (cleaned.length > 0 && cleaned.length < 200) {
                        items.push(cleaned);
                    }
                }
            }
            break;
        }
    }

    return items.slice(0, 10);
}

function extractSkills(text) {
    const skillCategories = [];
    const skillSection = text.match(/(?:skills?\s*(?:found|inventory|identified|extracted|section))[\s\S]*?(?=\n#{1,3}\s|\n---|\n\*\*\*|$)/i);

    if (!skillSection) {
        // Try to find any skills list
        const bullets = text.match(/(?:technical\s*skills?|programming|frameworks?|tools?)[\s\S]*?(?=\n#{1,3}\s|$)/i);
        if (bullets) {
            const items = bullets[0].match(/[-*•]\s+(.+)/g);
            if (items) {
                skillCategories.push({
                    category: "Technical",
                    skills: items.map(i => i.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim()).slice(0, 15),
                });
            }
        }
        return skillCategories;
    }

    // Try to find subcategories within the skills section
    const subSections = skillSection[0].split(/\n[-*•]\s*\*\*([^*]+)\*\*/);
    if (subSections.length > 1) {
        for (let i = 1; i < subSections.length; i += 2) {
            const category = subSections[i].replace(/[:\s]+$/, "").trim();
            const content = subSections[i + 1] || "";
            const skills = content.split(/[,;]/).map(s => s.replace(/[-*•]\s*/, "").trim()).filter(s => s.length > 0 && s.length < 40);
            if (skills.length > 0) {
                skillCategories.push({
                    category,
                    skills: skills.slice(0, 10)
                });
            }
        }
    }

    if (skillCategories.length === 0) {
        // Fallback: just get all bullets
        const items = skillSection[0].match(/[-*•]\s+(.+)/g);
        if (items) {
            skillCategories.push({
                category: "Skills Found",
                skills: items.map(i => i.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim()).filter(s => s.length < 40).slice(0, 15),
            });
        }
    }

    return skillCategories;
}

function extractImprovements(text) {
    const improvements = [];
    const section = text.match(/(?:suggest(?:ed)?\s*improvement|recommendation|action\s*items?)[\s\S]*?(?=\n#{1,2}\s|$)/i);

    if (!section) return improvements;

    const items = section[0].match(/(?:\d+\.\s+|[-*•]\s+)(.+)/g);
    if (!items) return improvements;

    for (const item of items.slice(0, 8)) {
        const cleaned = item.replace(/^(?:\d+\.\s+|[-*•]\s+)/, "").replace(/\*\*/g, "").trim();
        if (cleaned.length > 0) {
            // Try to determine priority
            let priority = "medium";
            if (/critical|must|essential|urgent|important/i.test(cleaned)) priority = "high";
            if (/consider|optional|nice|could|minor/i.test(cleaned)) priority = "low";

            improvements.push({
                text: cleaned,
                priority
            });
        }
    }

    return improvements;
}