import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import {
  Plus,
  Briefcase,
  FileText,
  GraduationCap,
  Send,
  Bot,
  Image,
  FolderOpen,
} from "lucide-react";
import ChatMessage from "./components/ChatMessage";

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState("");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Load or create sessionId for backend agent context
    let storedSessionId = localStorage.getItem("sessionId");
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem("sessionId", storedSessionId);
    }
    setSessionId(storedSessionId);

    const savedChats =
      JSON.parse(localStorage.getItem("careerChats")) || [];

    if (savedChats.length > 0) {
      setChats(savedChats);
      setCurrentChatId(savedChats[0].id);
    } else {
      const firstChat = {
        id: Date.now(),
        title: "New Chat",
        messages: [
          {
            type: "bot",
            text: "Hi 👋 I'm your AI Career Mentor. Upload your resume, ask about career paths, or practice interviews!",
            agent: "orchestrator_agent",
          },
        ],
      };

      setChats([firstChat]);
      setCurrentChatId(firstChat.id);

      localStorage.setItem(
        "careerChats",
        JSON.stringify([firstChat])
      );
    }
  }, []);

  const saveChats = (updatedChats) => {
    setChats(updatedChats);
    localStorage.setItem(
      "careerChats",
      JSON.stringify(updatedChats)
    );
  };

  const createNewChat = () => {
    // New chat gets a fresh sessionId for agent context isolation
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", newSessionId);
    setSessionId(newSessionId);

    const newChat = {
      id: Date.now(),
      title: `Chat ${chats.length + 1}`,
      messages: [
        {
          type: "bot",
          text: "New conversation started 🚀",
          agent: "orchestrator_agent",
        },
      ],
    };

    const updatedChats = [newChat, ...chats];

    saveChats(updatedChats);
    setCurrentChatId(newChat.id);
  };

  const currentChat = chats.find(
    (chat) => chat.id === currentChatId
  );

  const handleSend = async () => {
    if (!input.trim() || !currentChat) return;

    const userMessage = input;

    const updatedChats = chats.map((chat) => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages: [
            ...chat.messages,
            { type: "user", text: userMessage },
          ],
        };
      }
      return chat;
    });

    saveChats(updatedChats);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/chat",
        {
          message: userMessage,
          sessionId,
        }
      );

      const botReply = response.data.reply;
      const agent = response.data.agent || "orchestrator_agent";

      const finalChats = updatedChats.map((chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              { type: "bot", text: botReply, agent },
            ],
          };
        }
        return chat;
      });

      saveChats(finalChats);
      setLoading(false);
    } catch (error) {
      console.log(error);

      const finalChats = updatedChats.map((chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              { type: "bot", text: "❌ Backend connection failed", agent: "orchestrator_agent" },
            ],
          };
        }
        return chat;
      });

      saveChats(finalChats);
      setLoading(false);
    }
  };

  /**
   * Sidebar action: sends a routable message through POST /chat
   * so the orchestrator delegates to the correct specialist agent.
   */
  const sendAgentMessage = async (message) => {
    if (!currentChat) return;

    const updatedChats = chats.map((chat) => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages: [
            ...chat.messages,
            { type: "user", text: message },
          ],
        };
      }
      return chat;
    });

    saveChats(updatedChats);
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/chat",
        { message, sessionId }
      );

      const botReply = response.data.reply;
      const agent = response.data.agent || "orchestrator_agent";

      const finalChats = updatedChats.map((chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              { type: "bot", text: botReply, agent },
            ],
          };
        }
        return chat;
      });

      saveChats(finalChats);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const generateCareerPlan = () => {
    sendAgentMessage(
      "Generate a comprehensive career plan for me based on my background. " +
      "Include career paths, recommended skills, a learning roadmap, and internship recommendations."
    );
  };

  const handleResumeReview = () => {
    if (!selectedFile) {
      sendAgentMessage(
        "I'd like a resume review. Can you help me improve my resume?"
      );
    } else {
      handleFileUpload({ target: { files: [selectedFile] } });
    }
  };

  const handleInternshipGuidance = () => {
    sendAgentMessage(
      "Can you give me internship guidance? What domains should I target and how should I prepare?"
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (!file) return;

    setSelectedFile(file);
    setShowUploadMenu(false);

    if (file.type === "application/pdf") {
      try {
        setLoading(true);

        const formData = new FormData();
        formData.append("resume", file);
        formData.append("sessionId", sessionId);

        const response = await axios.post(
          "http://localhost:3001/upload-resume",
          formData
        );

        const analysis = response.data.analysis;
        const agent = response.data.agent || "resume_agent";

        const updatedChats = chats.map((chat) => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [
                ...chat.messages,
                { type: "bot", text: analysis, agent },
              ],
            };
          }
          return chat;
        });

        saveChats(updatedChats);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const onDrop = (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setSelectedFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>🚀 AI Career Mentor</h2>

        <button className="new-chat" onClick={createNewChat}>
          <Plus size={18} />
          New Chat
        </button>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {chats.map((chat) => (
            <button
              key={chat.id}
              className="menu-btn"
              onClick={() => setCurrentChatId(chat.id)}
            >
              {chat.title}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <button className="menu-btn" onClick={generateCareerPlan}>
            <Briefcase size={18} />
            AI Career Plan
          </button>
          <button className="menu-btn" onClick={handleResumeReview}>
            <FileText size={18} />
            Resume Review
          </button>
          <button className="menu-btn" onClick={handleInternshipGuidance}>
            <GraduationCap size={18} />
            Internship Guidance
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-section">
        <div className="chat-header">
          <Bot size={22} />
          <h2>AI Career Mentor</h2>
        </div>

        <div className="chat-messages" {...getRootProps()}>
          <input {...getInputProps()} />

          {isDragActive && (
            <div className="drop-overlay">Drop files here 📂</div>
          )}

          {currentChat?.messages.map((msg, index) => (
            <ChatMessage key={index} msg={msg} />
          ))}

          {loading && (
            <div className="message bot">🤖 Thinking...</div>
          )}
        </div>

        <div className="chat-input">
          {selectedFile && (
            <div className="file-preview">📄 {selectedFile.name}</div>
          )}

          <div className="upload-wrapper">
            <button
              className="upload-btn"
              onClick={() => setShowUploadMenu(!showUploadMenu)}
            >
              <Plus size={20} />
            </button>

            {showUploadMenu && (
              <div className="upload-menu">
                <label htmlFor="resumeUpload">
                  <FileText size={16} />
                  Upload Resume
                </label>
                <input
                  id="resumeUpload"
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />

                <label>
                  <GraduationCap size={16} />
                  Upload Certificate
                  <input type="file" hidden onChange={handleFileUpload} />
                </label>

                <label>
                  <Image size={16} />
                  Upload Image
                  <input type="file" hidden onChange={handleFileUpload} />
                </label>

                <label>
                  <FolderOpen size={16} />
                  Upload Any File
                  <input type="file" hidden onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Ask about internships, resume, interviews..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button onClick={handleSend}>
            <Send />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
