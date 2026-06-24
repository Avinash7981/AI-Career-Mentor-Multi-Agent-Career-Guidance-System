import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState("");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
            text: "Hi Avinash 👋 Upload your resume, internship certificates or ask me about your career.",
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
    const newChat = {
      id: Date.now(),
      title: `Chat ${chats.length + 1}`,
      messages: [
        {
          type: "bot",
          text: "New conversation started 🚀",
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
          {
            type: "user",
            text: userMessage,
          },
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
      }
    );

    const botReply = response.data.reply;

    const finalChats = updatedChats.map(
      (chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                type: "bot",
                text: botReply,
              },
            ],
          };
        }

        return chat;
      }
    );
 saveChats(finalChats);
 setLoading(false);
  } catch (error) {
    console.log(error);

    const finalChats = updatedChats.map(
      (chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                type: "bot",
                text: "❌ Backend connection failed",
              },
            ],
          };
        }

        return chat;
      }
    );

    saveChats(finalChats);
    setLoading(false);
  }
};
const generateCareerPlan = async () => {
  if (!selectedFile) {
    alert("Upload resume first");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("resume", selectedFile);

    const resumeResponse =
      await axios.post(
        "http://localhost:3001/analyze-resume",
        formData
      );

    const resumeText =
      resumeResponse.data.analysis;

    const response = await axios.post(
      "http://localhost:3001/career-plan",
      {
        resumeText,
      }
    );

    const plan =
      response.data.careerPlan;

    const updatedChats = chats.map(
      (chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                type: "bot",
                text: plan,
              },
            ],
          };
        }

        return chat;
      }
    );

    saveChats(updatedChats);
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};

  const handleFileUpload = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  setSelectedFile(file);
  setShowUploadMenu(false);

  if (file.type === "application/pdf") {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", file);

      const response = await axios.post(
        "http://localhost:3001/analyze-resume",
        formData
      );

      const analysis = response.data.analysis;

      const updatedChats = chats.map((chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                type: "bot",
                text: analysis,
              },
            ],
          };
        };

        return chat;
      });

      setChats(updatedChats);
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
const {
  getRootProps,
  getInputProps,
  isDragActive,
} = useDropzone({
  onDrop,
  noClick: true,
});

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>🚀 AI Career Mentor</h2>

        <button
          className="new-chat"
          onClick={createNewChat}
        >
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
              onClick={() =>
                setCurrentChatId(chat.id)
              }
            >
              {chat.title}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
  className="menu-btn"
  onClick={generateCareerPlan}
>
  <Briefcase size={18} />
  AI Career Plan
</button>
          <button className="menu-btn">
            <FileText size={18} />
            Resume Review
          </button>

          <button className="menu-btn">
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

        <div
  className="chat-messages"
  {...getRootProps()}
>
  <input {...getInputProps()} />

  {isDragActive && (
    <div className="drop-overlay">
      Drop files here 📂
    </div>
  )}
          {currentChat?.messages.map(
  (msg, index) => (
    <div
      key={index}
      className={`message ${msg.type}`}
    >
      {msg.type === "bot" ? (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {msg.text}
  </ReactMarkdown>
) : (
  msg.text
)}
    </div>
  )
)}
{loading && (
  <div className="message bot">
    🤖 Thinking...
  </div>
)}
        </div>

        <div className="chat-input">{selectedFile && (
  <div className="file-preview">
    📄 {selectedFile.name}
  </div>
)}
          <div className="upload-wrapper">

  <button
  className="upload-btn"
  onClick={() => {
    console.log("PLUS CLICKED");
    setShowUploadMenu(!showUploadMenu);
  }}
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

        <input
          type="file"
          hidden
          onChange={handleFileUpload}
        />
      </label>

      <label>
        <Image size={16} />
        Upload Image

        <input
          type="file"
          hidden
          onChange={handleFileUpload}
        />
      </label>

      <label>
        <FolderOpen size={16} />
        Upload Any File

        <input
          type="file"
          hidden
          onChange={handleFileUpload}
        />
      </label>

    </div>
  )}

</div>

          <input
            type="text"
            placeholder="Ask about internships, resume, certificates..."
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" && handleSend()
            }
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
