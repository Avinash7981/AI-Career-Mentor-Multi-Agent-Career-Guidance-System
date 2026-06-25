import "./App.css";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import {
  Plus,
  Send,
  Paperclip,
  MessageSquare,
  Trash2,
  Search,
  X,
} from "lucide-react";
import ChatMessage from "./components/ChatMessage";
import WelcomeScreen from "./components/WelcomeScreen";
import LoadingIndicator from "./components/LoadingIndicator";
import FileAttachment from "./components/FileAttachment";
import ErrorMessage from "./components/ErrorMessage";

function generateId() {
  return crypto.randomUUID();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    let stored = localStorage.getItem("sessionId");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("sessionId", stored);
    }
    return stored;
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, loading]);

  const saveChats = (updatedChats) => {
    setChats(updatedChats);
    localStorage.setItem("careerChats", JSON.stringify(updatedChats));
  };

  const createNewChat = () => {
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", newSessionId);
    setSessionId(newSessionId);

    const newChat = {
      id: generateId(),
      title: "New Chat",
      messages: [],
    };

    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter((c) => c.id !== chatId);
    saveChats(updatedChats);
    if (currentChatId === chatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const filteredChats = searchQuery
    ? chats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  const handleSend = async (overrideMessage) => {
    const messageText = overrideMessage || input.trim();
    if (!messageText) return;

    // Create chat if none exists
    let chatId = currentChatId;
    let updatedChats = [...chats];

    if (!chatId) {
      const newChat = {
        id: generateId(),
        title: generateTitle(messageText),
        messages: [],
      };
      updatedChats = [newChat, ...updatedChats];
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    // Update title if it's the first message
    updatedChats = updatedChats.map((chat) => {
      if (chat.id === chatId) {
        const isFirstMessage = chat.messages.filter((m) => m.type === "user").length === 0;
        return {
          ...chat,
          title: isFirstMessage ? generateTitle(messageText) : chat.title,
          messages: [...chat.messages, { type: "user", text: messageText }],
        };
      }
      return chat;
    });

    saveChats(updatedChats);
    if (!overrideMessage) setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3001/chat", {
        message: messageText,
        sessionId,
      });

      const botReply = response.data.reply;
      const agent = response.data.agent || "orchestrator_agent";

      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, { type: "bot", text: botReply, agent }],
          };
        }
        return chat;
      });

      saveChats(finalChats);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Connection failed";
      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, { type: "error", text: errorMsg }],
          };
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

    // Ensure a chat exists
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
          return {
            ...chat,
            title: chat.messages.length === 0 ? "Resume Review" : chat.title,
            messages: [...chat.messages, { type: "bot", text: analysis, agent }],
          };
        }
        return chat;
      });

      saveChats(finalChats);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Resume upload failed";
      const finalChats = updatedChats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, { type: "error", text: errorMsg }],
          };
        }
        return chat;
      });
      saveChats(finalChats);
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "application/pdf": [".pdf"] },
  });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmptyChat = !currentChat || currentChat.messages.length === 0;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
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
          <Plus size={16} />
          New Chat
        </button>

        <div className="sidebar-search">
          {showSearch ? (
            <div className="search-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button className="search-toggle" onClick={() => setShowSearch(true)}>
              <Search size={14} />
              <span>Search</span>
            </button>
          )}
        </div>

        <nav className="chat-list">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === currentChatId ? "active" : ""}`}
              onClick={() => setCurrentChatId(chat.id)}
            >
              <MessageSquare size={14} />
              <span className="chat-item-title">{chat.title}</span>
              <button
                className="chat-delete"
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                aria-label="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="messages-container" {...getRootProps()}>
          <input {...getInputProps()} />

          {isDragActive && (
            <div className="drop-overlay">
              <Paperclip size={32} />
              <span>Drop your resume here</span>
            </div>
          )}

          {isEmptyChat ? (
            <WelcomeScreen onSelectAction={(prompt) => handleSend(prompt)} />
          ) : (
            <div className="messages-list">
              {currentChat.messages.map((msg, index) =>
                msg.type === "error" ? (
                  <ErrorMessage
                    key={index}
                    text={msg.text}
                    onRetry={() => {
                      const lastUserMsg = currentChat.messages
                        .filter((m) => m.type === "user")
                        .pop();
                      if (lastUserMsg) handleSend(lastUserMsg.text);
                    }}
                  />
                ) : (
                  <ChatMessage key={index} msg={msg} />
                )
              )}
              {loading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          {selectedFile && (
            <FileAttachment
              file={selectedFile}
              uploading={loading}
              onRemove={() => setSelectedFile(null)}
            />
          )}
          <div className="input-container">
            <label className="attach-btn" htmlFor="fileInput" aria-label="Attach file">
              <Paperclip size={18} />
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                hidden
                onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); }}
                disabled={loading}
              />
            </label>
            <textarea
              ref={inputRef}
              className="chat-textarea"
              placeholder="Ask about your career, resume, or interviews..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
