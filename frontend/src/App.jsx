import "./App.css";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import {
  Plus,
  Send,
  Square,
  Paperclip,
  MessageSquare,
  Trash2,
  Search,
  X,
  Menu,
  ArrowDown,
} from "lucide-react";
import ChatMessage from "./components/ChatMessage";
import AgentBadge from "./components/AgentBadge";
import WelcomeScreen from "./components/WelcomeScreen";
import FileAttachment from "./components/FileAttachment";
import ErrorMessage from "./components/ErrorMessage";
import ATSInputModal from "./components/ats/ATSInputModal";

function generateId() {
  return crypto.randomUUID();
}

function getTimestamp() {
  return new Date().getTime();
}

function generateTitle(message) {
  const cleaned = message.replace(/[^\w\s]/g, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 30 ? words.substring(0, 30) + "..." : words || "New Chat";
}

function App() {
  const [chats, setChats] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("careerChats") || "null");
    if (saved && saved.length > 0) return saved;
    return [];
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("careerChats") || "null");
    return saved && saved.length > 0 ? saved[0].id : null;
  });
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingAgent, setStreamingAgent] = useState(null);
  const [streamingAgents, setStreamingAgents] = useState([]);
  const [streamingProgress, setStreamingProgress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    let stored = localStorage.getItem("sessionId");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("sessionId", stored);
    }
    return stored;
  });

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Smart auto-scroll: only scroll if user is near bottom
  const checkIfNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 100;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isNearBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom && (streaming || loading));
  }, [streaming, loading]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats, streamingText, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  const saveChats = (updatedChats) => {
    setChats(updatedChats);
    localStorage.setItem("careerChats", JSON.stringify(updatedChats));
  };

  const createNewChat = () => {
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", newSessionId);
    setSessionId(newSessionId);
    const newChat = { id: generateId(), title: "New Chat", messages: [] };
    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    setCurrentChatId(newChat.id);
    setShowSidebar(false);
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter((c) => c.id !== chatId);
    saveChats(updatedChats);
    if (currentChatId === chatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const filteredChats = searchQuery
    ? chats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  const handleSend = async (overrideMessage) => {
    const messageText = overrideMessage || input.trim();
    if (!messageText || loading) return;

    let chatId = currentChatId;
    let updatedChats = [...chats];

    if (!chatId) {
      const newChat = { id: generateId(), title: generateTitle(messageText), messages: [] };
      updatedChats = [newChat, ...updatedChats];
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    const now = getTimestamp();
    updatedChats = updatedChats.map((chat) => {
      if (chat.id === chatId) {
        const isFirstMessage = chat.messages.filter((m) => m.type === "user").length === 0;
        return {
          ...chat,
          title: isFirstMessage ? generateTitle(messageText) : chat.title,
          messages: [...chat.messages, { type: "user", text: messageText, timestamp: now }],
        };
      }
      return chat;
    });

    saveChats(updatedChats);
    if (!overrideMessage) setInput("");
    setLoading(true);
    setStreaming(true);
    setStreamingText("");
    setStreamingAgent(null);
    setStreamingAgents([]);
    setStreamingProgress("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("http://localhost:3001/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, sessionId }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";
      let detectedAgent = "orchestrator_agent";
      let allAgents = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "agent") {
              detectedAgent = event.agent;
              setStreamingAgent(event.agent);
              if (event.agents) { allAgents = event.agents; setStreamingAgents([...event.agents]); }
              else if (!allAgents.includes(event.agent)) { allAgents.push(event.agent); setStreamingAgents([...allAgents]); }
            } else if (event.type === "progress") {
              setStreamingProgress(event.status);
            } else if (event.type === "text") {
              accumulatedText += event.content;
              setStreamingText(accumulatedText);
              setStreamingProgress("");
            } else if (event.type === "done") {
              detectedAgent = event.agent || detectedAgent;
              if (event.agents) allAgents = event.agents;
            } else if (event.type === "error") {
              throw new Error(event.message || "Stream error");
            }
          } catch (parseErr) {
            if (parseErr.message !== "Stream error" && !parseErr.message.startsWith("HTTP")) continue;
            throw parseErr;
          }
        }
      }

      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, messages: [...chat.messages, {
            type: "bot", text: accumulatedText, agent: detectedAgent,
            agents: allAgents.length > 1 ? allAgents : undefined, timestamp: getTimestamp(),
          }] };
        }
        return chat;
      });
      saveChats(finalChats);

    } catch (error) {
      if (error.name === "AbortError") {
        // User stopped generation — save partial text if any
        const partialText = streamingText || "";
        if (partialText) {
          const finalChats = updatedChats.map((chat) => {
            if (chat.id === chatId) {
              return { ...chat, messages: [...chat.messages, {
                type: "bot", text: partialText + "\n\n*[Generation stopped]*",
                agent: streamingAgent || "orchestrator_agent", timestamp: getTimestamp(),
              }] };
            }
            return chat;
          });
          saveChats(finalChats);
        }
      } else {
        const errorMsg = error.message || "Connection failed";
        const finalChats = updatedChats.map((chat) => {
          if (chat.id === chatId) {
            return { ...chat, messages: [...chat.messages, { type: "error", text: errorMsg }] };
          }
          return chat;
        });
        saveChats(finalChats);
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamingText("");
      setStreamingAgent(null);
      setStreamingAgents([]);
      setStreamingProgress("");
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = (messageIndex) => {
    if (!currentChat || loading) return;
    // Find the user message before this bot message
    const prevMessages = currentChat.messages.slice(0, messageIndex);
    const lastUserMsg = [...prevMessages].reverse().find((m) => m.type === "user");
    if (lastUserMsg) {
      // Remove the bot message and regenerate
      const updatedMessages = currentChat.messages.filter((_, i) => i !== messageIndex);
      const updatedChats = chats.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages: updatedMessages } : chat
      );
      saveChats(updatedChats);
      handleSend(lastUserMsg.text);
    }
  };

  const handleATSSubmit = async ({ jobDescription, resumeFile }) => {
    setLoading(true);
    let chatId = currentChatId;
    let updatedChats = [...chats];
    if (!chatId) {
      const newChat = { id: generateId(), title: "ATS Analysis", messages: [] };
      updatedChats = [newChat, ...updatedChats];
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }
    // Add user message
    updatedChats = updatedChats.map((chat) => {
      if (chat.id === chatId) {
        return { ...chat,
          title: chat.messages.length === 0 ? "ATS Job Match" : chat.title,
          messages: [...chat.messages, { type: "user", text: "Analyze my resume against this job description for ATS compatibility.", timestamp: getTimestamp() }],
        };
      }
      return chat;
    });
    saveChats(updatedChats);

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("sessionId", sessionId);
      if (resumeFile) formData.append("resume", resumeFile);

      const response = await axios.post("http://localhost:3001/ats-analyze", formData);
      const analysis = response.data.analysis;
      const agent = response.data.agent || "resume_agent";

      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, messages: [...chat.messages, {
            type: "bot", text: analysis, agent, atsAnalysis: true, timestamp: getTimestamp(),
          }] };
        }
        return chat;
      });
      saveChats(finalChats);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "ATS analysis failed";
      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, messages: [...chat.messages, { type: "error", text: errorMsg }] };
        }
        return chat;
      });
      saveChats(finalChats);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setSelectedFile(file);
    setLoading(true);

    let chatId = currentChatId;
    let updatedChats = [...chats];
    if (!chatId) {
      const newChat = { id: generateId(), title: "Resume Review", messages: [] };
      updatedChats = [newChat, ...updatedChats];
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("sessionId", sessionId);
      const response = await axios.post("http://localhost:3001/upload-resume", formData);
      const analysis = response.data.analysis;
      const agent = response.data.agent || "resume_agent";
      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat,
            title: chat.messages.length === 0 ? "Resume Review" : chat.title,
            messages: [...chat.messages, { type: "bot", text: analysis, agent, timestamp: getTimestamp() }],
          };
        }
        return chat;
      });
      saveChats(finalChats);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Resume upload failed";
      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, messages: [...chat.messages, { type: "error", text: errorMsg }] };
        }
        return chat;
      });
      saveChats(finalChats);
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  const onDrop = (acceptedFiles) => { if (acceptedFiles.length > 0) handleFileUpload(acceptedFiles[0]); };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, accept: { "application/pdf": [".pdf"] } });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isEmptyChat = !currentChat || currentChat.messages.length === 0;

  return (
    <div className="app">
      {/* Mobile overlay */}
      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${showSidebar ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#sg)" />
            <path d="M14 32V20l10-6 10 6v12l-10 6-10-6z" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="24" cy="24" r="3" fill="#fff" />
            <defs><linearGradient id="sg" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
          </svg>
          <span className="sidebar-title">AI Career Mentor</span>
        </div>

        <button className="new-chat-btn" onClick={createNewChat}>
          <Plus size={16} /> New Chat
        </button>

        <div className="sidebar-search">
          {showSearch ? (
            <div className="search-input-wrap">
              <Search size={14} />
              <input type="text" placeholder="Search chats..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}><X size={14} /></button>
            </div>
          ) : (
            <button className="search-toggle" onClick={() => setShowSearch(true)}>
              <Search size={14} /><span>Search</span>
            </button>
          )}
        </div>

        <nav className="chat-list">
          {filteredChats.map((chat) => (
            <div key={chat.id} className={`chat-item ${chat.id === currentChatId ? "active" : ""}`}
              onClick={() => { setCurrentChatId(chat.id); setShowSidebar(false); }}>
              <MessageSquare size={14} />
              <span className="chat-item-title">{chat.title}</span>
              <button className="chat-delete" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                aria-label="Delete chat"><Trash2 size={12} /></button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setShowSidebar(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span>AI Career Mentor</span>
        </div>

        <div className="messages-container" ref={messagesContainerRef}
          onScroll={checkIfNearBottom} {...getRootProps()}>
          <input {...getInputProps()} />

          {isDragActive && (
            <div className="drop-overlay"><Paperclip size={32} /><span>Drop your resume here</span></div>
          )}

          {isEmptyChat ? (
            <WelcomeScreen onSelectAction={(prompt) => {
              if (prompt === "__ATS_ANALYZE__") { setShowATSModal(true); return; }
              handleSend(prompt);
            }} />
          ) : (
            <div className="messages-list">
              {currentChat.messages.map((msg, index) =>
                msg.type === "error" ? (
                  <ErrorMessage key={index} text={msg.text}
                    onRetry={() => { const u = currentChat.messages.filter((m) => m.type === "user").pop(); if (u) handleSend(u.text); }} />
                ) : (
                  <ChatMessage key={index} msg={msg}
                    onRegenerate={msg.type === "bot" ? () => handleRegenerate(index) : undefined} />
                )
              )}
              {streaming && streamingText && (
                <ChatMessage msg={{ type: "bot", text: streamingText, agent: streamingAgent,
                  agents: streamingAgents.length > 1 ? streamingAgents : undefined, streaming: true }} />
              )}
              {loading && !streamingText && (
                <div className="chat-msg bot msg-animate">
                  <div className="msg-avatar"><div className="avatar-bot">AI</div></div>
                  <div className="msg-content">
                    {streamingAgents.length > 0 && (
                      <div className="multi-agent-badges">
                        {streamingAgents.map((a) => <AgentBadge key={a} agent={a} />)}
                      </div>
                    )}
                    <div className="loading-indicator">
                      <div className="loading-dots"><span></span><span></span><span></span></div>
                      <span className="loading-text">{streamingProgress || "AI Career Mentor is thinking..."}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button className="scroll-bottom-btn" onClick={scrollToBottom} aria-label="Scroll to bottom">
              <ArrowDown size={16} /> New Response
            </button>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          {selectedFile && (
            <FileAttachment file={selectedFile} uploading={loading} onRemove={() => setSelectedFile(null)} />
          )}
          <div className="input-container">
            <label className="attach-btn" htmlFor="fileInput" aria-label="Attach file">
              <Paperclip size={18} />
              <input id="fileInput" type="file" accept=".pdf" hidden
                onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); }} disabled={loading} />
            </label>
            <textarea
              className="chat-textarea"
              placeholder="Ask about your career, resume, or interviews..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              aria-label="Message input"
            />
            {streaming ? (
              <button className="stop-btn" onClick={stopGenerating} aria-label="Stop generating">
                <Square size={14} /> Stop
              </button>
            ) : (
              <button className="send-btn" onClick={() => handleSend()}
                disabled={loading || !input.trim()} aria-label="Send message">
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ATS Modal */}
      {showATSModal && (
        <ATSInputModal
          onSubmit={handleATSSubmit}
          onClose={() => setShowATSModal(false)}
          hasResume={!!sessionManager_getResumeFromStorage()}
        />
      )}
    </div>
  );
}

function sessionManager_getResumeFromStorage() {
  // Check if we have a resume in the current session by looking at chat history
  const chats = JSON.parse(localStorage.getItem("careerChats") || "[]");
  return chats.some(c => c.messages && c.messages.some(m => m.agent === "resume_agent"));
}

export default App;
