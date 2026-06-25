# Manual Test Plan — AI Career Mentor V2

## Prerequisites

- Backend running: `cd backend && node server.js`
- Frontend running: `cd frontend && npm run dev`
- Valid `.env` in backend: `GEMINI_API_KEY`, `PORT=3001`
- Valid `.env` in frontend: `VITE_FIREBASE_*` variables
- Optional: `GITHUB_TOKEN` in backend `.env` for MCP GitHub tools

---

## 1. Authentication

### 1.1 Login Page Renders

- **Objective:** Verify login page loads correctly
- **Steps:**
  1. Open `http://localhost:5173/login`
  2. Observe the page
- **Expected Result:** Logo, title "AI Career Mentor", Google button, email/password form, and register toggle are visible
- [ ] Pass / Fail

### 1.2 Google Login

- **Objective:** Sign in with Google
- **Steps:**
  1. Click "Continue with Google"
  2. Complete Google auth popup
- **Expected Result:** Redirected to Dashboard (`/`)
- [ ] Pass / Fail

### 1.3 Email Registration

- **Objective:** Create account with email
- **Steps:**
  1. Click "Register" toggle
  2. Enter email + password (6+ chars)
  3. Click "Create Account"
- **Expected Result:** Redirected to Dashboard
- [ ] Pass / Fail

### 1.4 Email Login

- **Objective:** Sign in with existing credentials
- **Steps:**
  1. Enter registered email + password
  2. Click "Sign In"
- **Expected Result:** Redirected to Dashboard
- [ ] Pass / Fail

### 1.5 Protected Route Redirect

- **Objective:** Verify unauthenticated access is blocked
- **Steps:**
  1. Log out
  2. Navigate to `/chat` directly
- **Expected Result:** Redirected to `/login`
- [ ] Pass / Fail

### 1.6 Logout

- **Objective:** Sign out successfully
- **Steps:**
  1. Click "Sign Out" in sidebar footer
- **Expected Result:** Redirected to `/login`, session cleared
- [ ] Pass / Fail

### 1.7 Persistent Session

- **Objective:** Verify session survives page refresh
- **Steps:**
  1. Log in
  2. Refresh the page
- **Expected Result:** Still authenticated, no redirect to login
- [ ] Pass / Fail

---

## 2. Dashboard

### 2.1 Dashboard Loads

- **Objective:** Verify analytics dashboard renders
- **Steps:**
  1. Navigate to `/`
- **Expected Result:** Greeting, stat cards, charts, recent activity, quick actions visible
- [ ] Pass / Fail

### 2.2 Stat Cards

- **Objective:** Verify counters animate
- **Steps:**
  1. Observe stat cards after page load
- **Expected Result:** Numbers animate from 0 to their values
- [ ] Pass / Fail

### 2.3 Quick Actions Navigate

- **Objective:** Quick action buttons navigate to chat
- **Steps:**
  1. Click any quick action (Resume Review, ATS, etc.)
- **Expected Result:** Navigates to `/chat`
- [ ] Pass / Fail

---

## 3. Chat — Basic

### 3.1 Welcome Screen

- **Objective:** Empty chat shows welcome screen
- **Steps:**
  1. Navigate to `/chat` with no existing chats
- **Expected Result:** Logo, title, 8 quick action cards displayed
- [ ] Pass / Fail

### 3.2 Send Message

- **Objective:** User can send a message
- **Steps:**
  1. Type "Hello" in input
  2. Press Enter (or click Send)
- **Expected Result:** User message appears, loading indicator shows, bot responds
- [ ] Pass / Fail

### 3.3 Shift+Enter for Newline

- **Objective:** Shift+Enter doesn't send
- **Steps:**
  1. Type text
  2. Press Shift+Enter
- **Expected Result:** New line inserted, message not sent
- [ ] Pass / Fail

### 3.4 Empty Input Blocked

- **Objective:** Cannot send empty message
- **Steps:**
  1. Leave input empty
  2. Click Send
- **Expected Result:** Nothing happens, button is disabled
- [ ] Pass / Fail

---

## 4. Streaming

### 4.1 Progressive Text Rendering

- **Objective:** Response appears word-by-word
- **Steps:**
  1. Send any message
  2. Watch the response
- **Expected Result:** Text appears progressively, not all at once
- [ ] Pass / Fail

### 4.2 Blinking Cursor

- **Objective:** Cursor visible during streaming
- **Steps:**
  1. Send a message
  2. Observe the streaming response
- **Expected Result:** Blinking cursor visible at end of text during streaming
- [ ] Pass / Fail

### 4.3 Cursor Disappears After Completion

- **Objective:** Cursor removed when streaming ends
- **Steps:**
  1. Wait for response to complete
- **Expected Result:** Cursor disappears, message is finalized
- [ ] Pass / Fail

### 4.4 Stop Generating

- **Objective:** Can cancel mid-stream
- **Steps:**
  1. Send a message
  2. Click "Stop" button (replaces Send during streaming)
- **Expected Result:** Streaming stops, partial text saved with "[Generation stopped]"
- [ ] Pass / Fail

### 4.5 Auto-Scroll

- **Objective:** Chat scrolls as new content arrives
- **Steps:**
  1. Send a message that produces a long response
  2. Stay at bottom
- **Expected Result:** View scrolls down automatically as text streams
- [ ] Pass / Fail

### 4.6 Smart Scroll (Don't Force)

- **Objective:** Scrolling up doesn't get overridden
- **Steps:**
  1. Send a message
  2. Immediately scroll up
- **Expected Result:** View stays where user scrolled, "New Response" button appears
- [ ] Pass / Fail

---

## 5. Career Agent

### 5.1 Career Question Routing

- **Objective:** Career questions go to career_agent
- **Steps:**
  1. Send: "What career paths are good for a Python developer?"
- **Expected Result:** Response has "Career Coach" badge
- [ ] Pass / Fail

### 5.2 Skill Gap Analysis

- **Objective:** Skill gap queries handled
- **Steps:**
  1. Send: "Perform a skill gap analysis for a frontend developer"
- **Expected Result:** Structured response with skills, roadmap suggestions
- [ ] Pass / Fail

---

## 6. Resume Analysis

### 6.1 Resume Upload (PDF)

- **Objective:** Upload and analyze a PDF resume
- **Steps:**
  1. Click paperclip icon
  2. Select a PDF file
- **Expected Result:** File uploads, "Resume Expert" badge appears, analysis displayed
- [ ] Pass / Fail

### 6.2 Resume Dashboard Renders

- **Objective:** Resume analysis shows interactive dashboard
- **Steps:**
  1. Upload a resume
  2. Observe the response
- **Expected Result:** Circular score, category bars, strengths/weaknesses chips, skills, improvements
- [ ] Pass / Fail

### 6.3 Drag and Drop Upload

- **Objective:** Drag file onto chat area
- **Steps:**
  1. Drag a PDF over the chat area
  2. Drop it
- **Expected Result:** Drop overlay appears, file is uploaded and analyzed
- [ ] Pass / Fail

---

## 7. ATS Analysis

### 7.1 ATS Modal Opens

- **Objective:** ATS quick action opens input modal
- **Steps:**
  1. Click "ATS Job Match" card on welcome screen
- **Expected Result:** Modal opens with job description textarea
- [ ] Pass / Fail

### 7.2 ATS Analysis Executes

- **Objective:** Submit job description for analysis
- **Steps:**
  1. Open ATS modal
  2. Paste a job description
  3. Click "Analyze ATS Match"
- **Expected Result:** Response shows ATS dashboard with score, keywords, improvements
- [ ] Pass / Fail

### 7.3 ATS Keywords Display

- **Objective:** Keywords shown as colored chips
- **Steps:**
  1. Complete ATS analysis
  2. Observe keyword section
- **Expected Result:** Green chips for found keywords, red chips for missing keywords
- [ ] Pass / Fail

---

## 8. Mock Interview

### 8.1 Interview Setup Modal

- **Objective:** Interview modal collects configuration
- **Steps:**
  1. Click "Mock Interview" card
- **Expected Result:** Modal with role input, experience level, type grid, question count
- [ ] Pass / Fail

### 8.2 Interview Begins

- **Objective:** Interview starts after configuration
- **Steps:**
  1. Fill role ("Frontend Developer"), select type, set 3 questions
  2. Click "Start Interview"
- **Expected Result:** First question appears, progress bar visible (Q1/3)
- [ ] Pass / Fail

### 8.3 Answer and Feedback Loop

- **Objective:** Answering triggers next question
- **Steps:**
  1. Type an answer and send
  2. Observe response
- **Expected Result:** Agent provides score + feedback + next question. Progress bar advances.
- [ ] Pass / Fail

### 8.4 Final Interview Report

- **Objective:** Report generated after all questions
- **Steps:**
  1. Complete all interview questions
- **Expected Result:** Final dashboard with overall score, category bars, hiring recommendation
- [ ] Pass / Fail

---

## 9. Career Roadmap

### 9.1 Roadmap Setup Modal

- **Objective:** Roadmap modal collects career info
- **Steps:**
  1. Click "Career Roadmap" card
- **Expected Result:** Modal with dream role, education, skills, experience, timeline, target company
- [ ] Pass / Fail

### 9.2 Roadmap Generates

- **Objective:** Roadmap produced after submission
- **Steps:**
  1. Fill in dream role + skills + timeline
  2. Click "Generate Roadmap"
- **Expected Result:** Response appears with timeline, skills, courses, projects, milestones
- [ ] Pass / Fail

### 9.3 Roadmap Dashboard Renders

- **Objective:** Interactive timeline dashboard
- **Steps:**
  1. Complete roadmap generation
- **Expected Result:** Timeline cards with dot markers, skill cards, course list, project grid, milestone bars
- [ ] Pass / Fail

---

## 10. GitHub MCP Analysis

### 10.1 GitHub Quick Action

- **Objective:** GitHub analysis card works
- **Steps:**
  1. Click "GitHub Analysis" card
- **Expected Result:** Input pre-filled with "Analyze my GitHub profile. My username is "
- [ ] Pass / Fail

### 10.2 GitHub Profile Analyzed

- **Objective:** GitHub username analyzed via MCP
- **Steps:**
  1. Complete the prompt with a real username (e.g., "octocat")
  2. Send
- **Expected Result:** Response includes portfolio score, top languages, repositories, recommendations
- [ ] Pass / Fail

### 10.3 Profile Optimizer

- **Objective:** Professional profile analysis
- **Steps:**
  1. Click "Profile Optimizer" card
  2. Complete with profile text
  3. Send
- **Expected Result:** Response with profile scores, strengths, weaknesses, suggestions
- [ ] Pass / Fail

---

## 11. Chat History

### 11.1 Auto-Generated Title

- **Objective:** Chat title generated from first message
- **Steps:**
  1. Start new chat, send "How to learn React"
  2. Check sidebar
- **Expected Result:** Chat title is "How to learn React" (first 4 words)
- [ ] Pass / Fail

### 11.2 Rename Chat

- **Objective:** Inline rename works
- **Steps:**
  1. Hover a chat in sidebar
  2. Click edit (pencil) icon
  3. Type new name, press Enter
- **Expected Result:** Title updated
- [ ] Pass / Fail

### 11.3 Pin Chat

- **Objective:** Pinned chats sort to top
- **Steps:**
  1. Hover a chat
  2. Click pin icon
- **Expected Result:** Chat moves to top with blue left border
- [ ] Pass / Fail

### 11.4 Delete Chat

- **Objective:** Chat deletion
- **Steps:**
  1. Hover a chat
  2. Click trash icon
- **Expected Result:** Chat removed from list
- [ ] Pass / Fail

### 11.5 Search Chats

- **Objective:** Filter chats by title
- **Steps:**
  1. Click "Search" in sidebar
  2. Type a partial title
- **Expected Result:** Only matching chats shown
- [ ] Pass / Fail

### 11.6 Persistence After Refresh

- **Objective:** Chats survive page reload
- **Steps:**
  1. Create chats with messages
  2. Refresh the page
- **Expected Result:** All chats and messages still present
- [ ] Pass / Fail

---

## 12. Settings

### 12.1 Profile Display

- **Objective:** User info shown correctly
- **Steps:**
  1. Navigate to `/settings`
- **Expected Result:** Avatar (or initial), name, email, join date displayed
- [ ] Pass / Fail

### 12.2 Export Data

- **Objective:** Download user data as JSON
- **Steps:**
  1. Click "Export All Data"
- **Expected Result:** JSON file downloaded with chat history
- [ ] Pass / Fail

### 12.3 Sign Out From Settings

- **Objective:** Logout button works
- **Steps:**
  1. Click "Sign Out"
- **Expected Result:** Redirected to login page
- [ ] Pass / Fail

---

## 13. Message Actions

### 13.1 Actions Appear on Hover

- **Objective:** Action buttons visible on hover
- **Steps:**
  1. Hover over a bot message
- **Expected Result:** Copy, Regenerate, Like, Dislike, Download icons appear
- [ ] Pass / Fail

### 13.2 Copy Message

- **Objective:** Copy to clipboard
- **Steps:**
  1. Hover message, click Copy icon
- **Expected Result:** Content copied, check icon briefly shown
- [ ] Pass / Fail

### 13.3 Regenerate Response

- **Objective:** Re-send the query
- **Steps:**
  1. Hover message, click Regenerate icon
- **Expected Result:** Old response removed, new response generated
- [ ] Pass / Fail

### 13.4 Download Markdown

- **Objective:** Download response as .md
- **Steps:**
  1. Hover message, click Download icon
- **Expected Result:** `.md` file downloaded
- [ ] Pass / Fail

---

## 14. Markdown Rendering

### 14.1 Headings

- **Objective:** Markdown headings render correctly
- **Steps:**
  1. Get a response containing ## and ### headings
- **Expected Result:** Proper font sizes and weights
- [ ] Pass / Fail

### 14.2 Code Blocks

- **Objective:** Fenced code blocks highlighted
- **Steps:**
  1. Ask: "Show me a JavaScript example of array map"
- **Expected Result:** Code block with syntax highlighting, language badge, Copy button
- [ ] Pass / Fail

### 14.3 Tables

- **Objective:** Markdown tables render
- **Steps:**
  1. Ask: "Compare React vs Vue in a table"
- **Expected Result:** Bordered table with header styling, horizontal scroll on overflow
- [ ] Pass / Fail

### 14.4 Lists

- **Objective:** Bullet and numbered lists render
- **Steps:**
  1. Ask: "List 5 tips for resume writing"
- **Expected Result:** Proper indentation and bullet styling
- [ ] Pass / Fail

---

## 15. Error Handling

### 15.1 Network Error

- **Objective:** Graceful error on connection failure
- **Steps:**
  1. Stop the backend server
  2. Send a message from frontend
- **Expected Result:** Error message with icon appears, retry button available
- [ ] Pass / Fail

### 15.2 Quota Error (429)

- **Objective:** Quota exceeded shows specific message
- **Steps:**
  1. Trigger rate limit (rapid requests) or mock 429
- **Expected Result:** Message says "AI service quota exceeded" with clock icon
- [ ] Pass / Fail

---

## 16. Mobile Responsiveness

### 16.1 Sidebar Hidden on Mobile

- **Objective:** Sidebar collapses on small screens
- **Steps:**
  1. Resize browser to < 768px width
- **Expected Result:** Sidebar hidden, hamburger menu visible
- [ ] Pass / Fail

### 16.2 Hamburger Menu Opens Sidebar

- **Objective:** Mobile menu works
- **Steps:**
  1. On mobile view, tap hamburger icon
- **Expected Result:** Sidebar slides in from left with overlay backdrop
- [ ] Pass / Fail

### 16.3 Chat Full Width on Mobile

- **Objective:** Chat area uses full width
- **Steps:**
  1. On mobile view, observe chat area
- **Expected Result:** Messages and input fill the screen width
- [ ] Pass / Fail

### 16.4 Quick Actions Grid Responsive

- **Objective:** Cards stack on small screens
- **Steps:**
  1. View welcome screen on mobile
- **Expected Result:** Cards stack in single column
- [ ] Pass / Fail

---

## 17. Multi-Agent Orchestration

### 17.1 Single Agent Routing

- **Objective:** Simple queries go to one agent
- **Steps:**
  1. Send: "Review my resume"
- **Expected Result:** Single agent badge ("Resume Expert")
- [ ] Pass / Fail

### 17.2 Multi-Agent Query

- **Objective:** Complex queries invoke multiple agents
- **Steps:**
  1. Send: "Review my resume and suggest career paths"
- **Expected Result:** Multiple agent badges appear (Resume Expert + Career Coach)
- [ ] Pass / Fail

### 17.3 Progress Events During Multi-Agent

- **Objective:** Progress updates shown
- **Steps:**
  1. Send a multi-domain query
  2. Observe loading state
- **Expected Result:** Progress text changes (e.g., "Reviewing Resume..." → "Generating Career Advice...")
- [ ] Pass / Fail

---

## Sign-Off

| Tester | Date | Total Pass | Total Fail | Notes |
|--------|------|------------|------------|-------|
| | | /50 | | |

---

*Generated for Kaggle AI Agents Hackathon — AI Career Mentor V2*
