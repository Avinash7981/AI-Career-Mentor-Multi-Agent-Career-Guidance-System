# Known Limitations

## Authentication

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Firebase config is placeholder | Auth won't work until real config added | Add VITE_FIREBASE_* env vars |
| No email verification | Users can register with any email | Enable in Firebase Console |
| No password reset flow | Users can't recover accounts | Add forgot password page |
| No session refresh token handling | Long sessions may expire | Firebase handles automatically |

## Data Persistence

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| localStorage only (no cloud sync) | Data lost if browser storage cleared | Add Firestore in production |
| No cross-device sync | User sees different data per device | Requires cloud database |
| localStorage 5MB limit | Heavy users may hit limit | Implement data pruning |
| No backup/restore | Data not recoverable if lost | Export button exists in Settings |

## AI Agent System

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Gemini quota limits (429 errors) | Blocks usage during high demand | User sees friendly error + retry |
| No response caching | Same question costs tokens each time | Add client-side response cache |
| Response parsing is regex-based | May miss some markdown patterns | Falls back to raw markdown gracefully |
| Multi-agent routing depends on prompt | Orchestrator may route incorrectly | Prompt is heavily tuned |
| Session state is in-memory (backend) | Lost on server restart | Sufficient for demo |

## Streaming

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No reconnection on disconnect | Partial response shown | User can regenerate |
| AbortController doesn't cancel server-side | Server still processes after stop | Acceptable for demo |
| Text chunked at 80 chars | May split mid-word | Acceptable visual artifact |

## UI/UX

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No dark/light theme toggle | Always dark mode | Design decision (consistent) |
| Bundle size ~1.1MB (JS) | Slow initial load on 3G | Code-split syntax highlighter |
| Charts are SVG only (no interactivity) | Can't zoom/filter charts | Lightweight by design |
| No pagination for long chat history | Performance may degrade at 100+ chats | Add virtual scrolling |
| Welcome screen 6 cards on mobile | Scroll needed | Responsive grid handles it |

## Dashboards

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Resume/ATS/Roadmap dashboards depend on exact AI output format | May not parse correctly | Always falls back to MarkdownRenderer |
| Interview scoring depends on AI following instructions | May not produce structured scores | Falls back to markdown |
| No PDF export (button is placeholder in some dashboards) | Download MD works, PDF doesn't | Add html2pdf.js later |

## Deployment

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Not yet deployed | Can't access remotely | Deploy to Render + Vercel |
| CORS hardcoded to localhost:3001 | Won't work in production | Use env var for API URL |
| No HTTPS enforcement | Security concern in production | Hosting platforms add HTTPS |
| No rate limiting on backend | Vulnerable to abuse | Add express-rate-limit |

## Browser Support

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Requires crypto.randomUUID() | Not available in HTTP (non-HTTPS) | Deploy with HTTPS |
| ReadableStream for SSE | IE/old browsers not supported | Modern browsers only |
| CSS nested selectors not used | N/A - all flat CSS | Broad compatibility |
