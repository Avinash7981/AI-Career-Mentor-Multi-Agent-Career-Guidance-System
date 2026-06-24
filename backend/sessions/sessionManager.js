/**
 * SessionManager - In-memory session store for Agent Context.
 * Maintains shared state between agents within a conversation session.
 * Each session tracks resume data, career goals, and interview history
 * so that specialist agents can build on each other's findings.
 */
class SessionManager {
    constructor() {
        this.sessions = new Map();
        // Default TTL: 1 hour (configurable via SESSION_TTL_MS env var)
        this.ttlMs = parseInt(process.env.SESSION_TTL_MS) || 3600000;
    }

    /**
     * Get an existing session or create a new one with empty state.
     * @param {string} sessionId - Unique session identifier
     * @returns {object} Session object with id, createdAt, lastAccessedAt, and state
     */
    getOrCreate(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                id: sessionId,
                createdAt: Date.now(),
                lastAccessedAt: Date.now(),
                state: {
                    resumeText: null,
                    resumeScore: null,
                    skills: [],
                    experience: null,
                    careerGoals: [],
                    recommendedSkills: [],
                    targetRoles: [],
                    interviewHistory: [],
                },
            });
        }

        const session = this.sessions.get(sessionId);
        session.lastAccessedAt = Date.now();
        return session;
    }

    /**
     * Update specific fields in a session's state.
     * @param {string} sessionId - Unique session identifier
     * @param {object} updates - Key-value pairs to merge into session state
     * @returns {object} Updated session object
     */
    updateState(sessionId, updates) {
        const session = this.getOrCreate(sessionId);
        session.state = {
            ...session.state,
            ...updates
        };
        session.lastAccessedAt = Date.now();
        return session;
    }

    /**
     * Get the current state for a session.
     * @param {string} sessionId - Unique session identifier
     * @returns {object} The session's state object
     */
    getState(sessionId) {
        return this.getOrCreate(sessionId).state;
    }

    /**
     * Remove expired sessions (called periodically).
     * Sessions that haven't been accessed within TTL are removed.
     */
    cleanup() {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now - session.lastAccessedAt > this.ttlMs) {
                this.sessions.delete(id);
            }
        }
    }
}

// Export a singleton instance
module.exports = new SessionManager();