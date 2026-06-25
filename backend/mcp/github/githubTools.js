/**
 * GitHub MCP Tool definitions.
 * These are registered on the MCP server and callable by ADK agents.
 */
const {
    getProfile,
    getRepos,
    getLanguages,
    getReadme
} = require("./githubClient");

/**
 * Analyze a GitHub user's full profile and portfolio.
 */
async function analyzeGitHubProfile({
    username
}) {
    const profile = await getProfile(username);
    const repos = await getRepos(username, 50);
    const languages = await getLanguages(username);

    const publicRepos = repos.filter(r => !r.fork);
    const stars = publicRepos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const forks = publicRepos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
    const topics = [...new Set(publicRepos.flatMap(r => r.topics || []))];

    // Check README quality for top repos
    const topRepos = publicRepos.slice(0, 5);
    const readmeResults = [];
    for (const repo of topRepos) {
        const readme = await getReadme(username, repo.name);
        readmeResults.push({
            repo: repo.name,
            hasReadme: readme.exists,
            readmeSize: readme.size
        });
    }

    const readmeScore = readmeResults.filter(r => r.hasReadme && r.readmeSize > 200).length;
    const diversityScore = Math.min(languages.length * 15, 100);
    const projectScore = Math.min(publicRepos.length * 10, 100);
    const communityScore = Math.min((stars + forks) * 5, 100);
    const overallScore = Math.round((readmeScore * 20 + diversityScore + projectScore + communityScore) / 4);

    return JSON.stringify({
        username: profile.login,
        name: profile.name,
        bio: profile.bio,
        publicRepos: publicRepos.length,
        followers: profile.followers,
        following: profile.following,
        totalStars: stars,
        totalForks: forks,
        topLanguages: languages.slice(0, 8),
        topics: topics.slice(0, 20),
        portfolioScore: overallScore,
        scores: {
            projectDiversity: diversityScore,
            projectCount: projectScore,
            communityEngagement: communityScore,
            readmeQuality: readmeScore * 20,
        },
        topRepositories: publicRepos.slice(0, 8).map(r => ({
            name: r.name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            forks: r.forks_count,
            topics: r.topics,
            updatedAt: r.updated_at,
        })),
        readmeAnalysis: readmeResults,
        recommendations: generateRecommendations(publicRepos, languages, readmeResults, topics),
    });
}

/**
 * Fetch just the repositories list with stats.
 */
async function listRepositories({
    username,
    limit
}) {
    const repos = await getRepos(username, limit || 30);
    const publicRepos = repos.filter(r => !r.fork);

    return JSON.stringify({
        total: publicRepos.length,
        repositories: publicRepos.map(r => ({
            name: r.name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            forks: r.forks_count,
            topics: r.topics || [],
            updatedAt: r.updated_at,
        })),
    });
}

/**
 * Get language statistics for a user.
 */
async function getLanguageStats({
    username
}) {
    const languages = await getLanguages(username);
    const total = languages.reduce((s, l) => s + l.repos, 0);

    return JSON.stringify({
        totalRepos: total,
        languages: languages.map(l => ({
            ...l,
            percentage: Math.round((l.repos / total) * 100),
        })),
    });
}

function generateRecommendations(repos, languages, readmes, topics) {
    const recs = [];
    if (repos.length < 5) recs.push("Add more public projects (aim for 8-10 quality repos)");
    if (languages.length < 3) recs.push("Diversify your tech stack — showcase 3+ languages");
    const missingReadmes = readmes.filter(r => !r.hasReadme || r.readmeSize < 200);
    if (missingReadmes.length > 0) recs.push(`Improve READMEs for: ${missingReadmes.map(r => r.repo).join(", ")}`);
    if (topics.length < 5) recs.push("Add topics/tags to your repositories for better discoverability");
    if (repos.every(r => !r.description)) recs.push("Add descriptions to your repositories");
    if (recs.length === 0) recs.push("Your GitHub profile looks solid! Consider contributing to open source.");
    return recs;
}

module.exports = {
    analyzeGitHubProfile,
    listRepositories,
    getLanguageStats
};