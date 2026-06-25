# Performance Report

## Bundle Analysis

| Asset | Size | Gzipped |
|-------|------|---------|
| JavaScript | ~1097 KB | ~371 KB |
| CSS | ~12.8 KB | ~3.3 KB |
| HTML | 0.45 KB | 0.29 KB |

### Bundle Breakdown
- react-syntax-highlighter: ~600 KB (largest dependency)
- React + ReactDOM: ~140 KB
- react-markdown + remark-gfm: ~120 KB
- firebase: ~80 KB
- lucide-react: ~50 KB (tree-shakeable)
- Application code: ~100 KB

## Optimization Techniques Applied

### Memoization
| Component | Technique |
|-----------|-----------|
| MarkdownRenderer | `memo()` |
| CodeBlock | `memo()` |
| MessageActions | `memo()` |
| ResumeDashboard | `memo()` |
| ATSDashboard | `memo()` |
| InterviewFinalDashboard | `memo()` |
| CareerRoadmapDashboard | `memo()` |
| InterviewProgress | `memo()` |

### Hooks Usage
| Hook | Usage |
|------|-------|
| `useMemo` | ChatMessage (resume/ATS/interview/roadmap parsing) |
| `useMemo` | Dashboard analytics computation |
| `useCallback` | checkIfNearBottom scroll handler |
| `useRef` | AbortController, messagesEnd, isNearBottom (no re-renders) |

### Lazy State Initialization
- `useState(() => ...)` for localStorage reads (chats, sessionId, currentChatId)
- Avoids synchronous localStorage reads on every render

## Rendering Performance

### Streaming Optimization
- Text streamed in ~80 char chunks (not character by character)
- Only the streaming message component re-renders during streaming
- isNearBottomRef uses ref (no state update) to avoid scroll re-renders
- AbortController prevents orphaned streams

### Avoid Unnecessary Re-renders
- Sidebar chat list uses `key={chat.id}` for stable identity
- Dashboard stats computed once via `useMemo([user.uid])`
- Pie chart offsets precomputed (no render-time mutation)

## Recommendations for Further Optimization

1. **Code-split react-syntax-highlighter** — Lazy-load with `React.lazy()` since code blocks only appear in some responses (saves ~600KB initial load)
2. **Virtualize chat list** — For users with 100+ conversations, consider `react-window` for sidebar
3. **Web Worker for parsing** — Move `parseResumeResponse`, `parseATSResponse`, `parseRoadmapResponse` to a Web Worker for large responses
4. **Service Worker caching** — Add PWA support with offline capability
5. **Image optimization** — SVG logos are inline (good), no raster images to optimize
