/**
 * Parses career roadmap markdown into structured data.
 */

export function parseRoadmapResponse(text) {
    if (!text) return null;

    const result = {
        timeline: extractTimeline(text),
        skills: extractSkillsWithMeta(text),
        courses: extractCourses(text),
        projects: extractProjects(text),
        milestones: extractMilestones(text),
        raw: text,
    };

    // Only render as dashboard if we have meaningful structure
    if (result.timeline.length === 0 && result.skills.length === 0 && result.milestones.length === 0) {
        return null;
    }

    return result;
}

function extractTimeline(text) {
    const entries = [];
    // Match month/week headers with content
    const monthPattern = /(?:month|week)\s*(\d+)[:\s]*(.+?)(?=\n(?:#{1,3}\s|month|week\s*\d|$))/gis;
    let match;
    while ((match = monthPattern.exec(text)) !== null) {
        const period = match[0].substring(0, match[0].indexOf("\n") || 50).trim();
        const content = match[0];
        const items = [];
        const bullets = content.match(/[-*•]\s+(.+)/g);
        if (bullets) {
            bullets.forEach(b => {
                const cleaned = b.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim();
                if (cleaned.length > 0) items.push(cleaned);
            });
        }
        entries.push({
            period: period.split("\n")[0],
            items: items.slice(0, 6)
        });
    }

    // Fallback: look for numbered phases
    if (entries.length === 0) {
        const phases = text.match(/(?:phase|step)\s*\d+[:\s]*(.+?)(?=\nphase|\nstep|\n#{1,3}|$)/gis);
        if (phases) {
            phases.forEach(p => {
                const title = p.split("\n")[0].trim();
                const bullets = p.match(/[-*•]\s+(.+)/g) || [];
                entries.push({
                    period: title,
                    items: bullets.map(b => b.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim()).slice(0, 5),
                });
            });
        }
    }

    return entries.slice(0, 12);
}

function extractSkillsWithMeta(text) {
    const skills = [];
    const section = text.match(/(?:required\s*skills?|skill\s*gap|skills?\s*to\s*learn)[\s\S]*?(?=\n#{1,2}\s|$)/i);
    if (!section) return skills;

    const bullets = section[0].match(/[-*•]\s+(.+)/g);
    if (!bullets) return skills;

    for (const b of bullets.slice(0, 12)) {
        const cleaned = b.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim();
        if (!cleaned) continue;

        let priority = "medium";
        if (/essential|must|critical|high/i.test(cleaned)) priority = "high";
        if (/optional|nice|bonus|low/i.test(cleaned)) priority = "low";

        // Try to extract hours
        const hoursMatch = cleaned.match(/(\d+)\s*(?:hours?|hrs?)/i);
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : null;

        skills.push({
            name: cleaned.split(/[-–(]/)[0].trim(),
            priority,
            hours
        });
    }

    return skills;
}

function extractCourses(text) {
    const courses = [];
    const section = text.match(/(?:courses?|resources?|learning)[\s\S]*?(?=\n#{1,2}\s|$)/i);
    if (!section) return courses;

    const bullets = section[0].match(/[-*•]\s+(.+)/g);
    if (!bullets) return bullets;

    for (const b of bullets.slice(0, 10)) {
        const cleaned = b.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim();
        if (!cleaned) continue;
        const isFree = /free|youtube|docs|documentation/i.test(cleaned);
        courses.push({
            name: cleaned.split(/[-–(]/)[0].trim(),
            type: isFree ? "free" : "paid",
            full: cleaned
        });
    }

    return courses;
}

function extractProjects(text) {
    const projects = [];
    const section = text.match(/(?:projects?|practice|portfolio)[\s\S]*?(?=\n#{1,2}\s|$)/i);
    if (!section) return projects;

    const bullets = section[0].match(/[-*•]\s+(.+)/g) || [];
    const numbered = section[0].match(/\d+\.\s+(.+)/g) || [];
    const all = [...bullets, ...numbered];

    for (const b of all.slice(0, 8)) {
        const cleaned = b.replace(/^(?:[-*•]\s+|\d+\.\s+)/, "").replace(/\*\*/g, "").trim();
        if (!cleaned) continue;
        let difficulty = "intermediate";
        if (/beginner|simple|basic|easy/i.test(cleaned)) difficulty = "beginner";
        if (/advanced|complex|hard/i.test(cleaned)) difficulty = "advanced";

        projects.push({
            name: cleaned.split(/[-–(]/)[0].trim(),
            difficulty,
            full: cleaned
        });
    }

    return projects;
}

function extractMilestones(text) {
    const milestones = [];
    const section = text.match(/(?:milestones?|checkpoints?|goals?)[\s\S]*?(?=\n#{1,2}\s|$)/i);
    if (!section) {
        // Try to build from timeline
        return milestones;
    }

    const bullets = section[0].match(/[-*•]\s+(.+)/g) || [];
    const numbered = section[0].match(/\d+\.\s+(.+)/g) || [];
    const all = [...bullets, ...numbered];
    const total = all.length || 1;

    all.slice(0, 8).forEach((b, i) => {
        const cleaned = b.replace(/^(?:[-*•]\s+|\d+\.\s+)/, "").replace(/\*\*/g, "").trim();
        milestones.push({
            text: cleaned,
            progress: Math.round(((i + 1) / total) * 100)
        });
    });

    return milestones;
}