# 04 - TODOs (Prioritized)

## Priority 1 — Required for Hackathon

- [ ] Live test all 3 agent routing paths with real API key
- [ ] Verify functionResponse text extraction works in production
- [ ] Write hackathon README.md with architecture diagram
- [ ] Deploy backend (Render/Railway)
- [ ] Deploy frontend (Vercel/Netlify)

## Priority 2 — Polish

- [ ] Add loading spinner per-agent (show which agent is thinking)
- [ ] Add "typing" indicator with agent name
- [ ] Handle network timeout gracefully in frontend
- [ ] Add retry button on failed messages
- [ ] Store sessionId per-chat (currently shared across all chats)

## Priority 3 — Nice to Have

- [ ] Add unit tests for extractSkills/extractScore/extractCareerGoals
- [ ] Add integration tests with mocked Gemini responses
- [ ] Add rate limiting to endpoints
- [ ] Add request logging middleware
- [ ] Support multiple file formats (DOCX, TXT) beyond PDF
- [ ] Add conversation export feature
- [ ] Add dark/light theme toggle
