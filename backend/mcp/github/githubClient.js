/**
 * GitHub REST API client.
 * Uses GITHUB_TOKEN if available (5000 req/hr), falls back to public API (60 req/hr).
 */

const GITHUB_API = "https://api.github.com";

function getHeaders() {
    const headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AI-Career-Mentor-MCP",
    };
    if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
}

async function fetchGitHub(path) {
    const url = `${GITHUB_API}${path}`;
    const res = await fetch(url, {
        headers: getHeaders()
    });
    if (!res.ok) {
        throw new Error(`GitHub API ${res.status}: ${res.statusText} (${path})`);
    }
    return res.json();
}

async function getProfile(username) {
    return fetchGitHub(`/users/${username}`);
}

async function getRepos(username, perPage = 30) {
    return fetchGitHub(`/users/${username}/repos?sort=updated&per_page=${perPage}`);
}

async function getLanguages(username) {
    const repos = await getRepos(username, 100);
    const langMap = {};
    for (const repo of repos) {
        if (repo.language) {
            langMap[repo.language] = (langMap[repo.language] || 0) + 1;
        }
    }
    // Sort by count
    return Object.entries(langMap)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, count]) => ({
            language: lang,
            repos: count
        }));
}

async function getReadme(username, repo) {
    try {
        const data = await fetchGitHub(`/repos/${username}/${repo}/readme`);
        // Content is base64 encoded
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return {
            exists: true,
            size: content.length,
            content: content.substring(0, 500)
        };
    } catch {
        return {
            exists: false,
            size: 0,
            content: ""
        };
    }
}

module.exports = {
    getProfile,
    getRepos,
    getLanguages,
    getReadme
};