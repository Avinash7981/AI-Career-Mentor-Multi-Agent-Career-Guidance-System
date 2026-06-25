import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquare, FileText, Target, Mic, Map, Clock, Plus } from "lucide-react";

function getStorageKey(uid) {
  return `careerChats_${uid}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const chats = JSON.parse(localStorage.getItem(getStorageKey(user.uid)) || "[]");
    let resumeReports = 0, atsReports = 0, interviewReports = 0, roadmapReports = 0;
    const recentChats = chats.slice(0, 5);

    for (const chat of chats) {
      for (const msg of chat.messages || []) {
        if (msg.agent === "resume_agent" && msg.type === "bot") resumeReports++;
        if (msg.atsAnalysis) atsReports++;
        if (msg.agent === "interview_agent" && msg.type === "bot") interviewReports++;
        if (msg.agent === "career_agent" && msg.type === "bot") roadmapReports++;
      }
    }
    return { totalChats: chats.length, resumeReports, atsReports, interviewReports, roadmapReports, recentChats };
  }, [user.uid]);

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div className="dash-greeting">
          <h1>Welcome back, {user.displayName || user.email.split("@")[0]}</h1>
          <p>Your AI career coaching workspace</p>
        </div>
        <button className="dash-new-chat" onClick={() => navigate("/chat")}>
          <Plus size={16} /> New Chat
        </button>
      </div>

      <div className="dash-stats">
        <div className="dash-stat-card">
          <MessageSquare size={20} className="dash-stat-icon" />
          <span className="dash-stat-num">{stats.totalChats}</span>
          <span className="dash-stat-label">Conversations</span>
        </div>
        <div className="dash-stat-card">
          <FileText size={20} className="dash-stat-icon" style={{ color: "#3b82f6" }} />
          <span className="dash-stat-num">{stats.resumeReports}</span>
          <span className="dash-stat-label">Resume Reviews</span>
        </div>
        <div className="dash-stat-card">
          <Target size={20} className="dash-stat-icon" style={{ color: "#ef4444" }} />
          <span className="dash-stat-num">{stats.atsReports}</span>
          <span className="dash-stat-label">ATS Reports</span>
        </div>
        <div className="dash-stat-card">
          <Mic size={20} className="dash-stat-icon" style={{ color: "#8b5cf6" }} />
          <span className="dash-stat-num">{stats.interviewReports}</span>
          <span className="dash-stat-label">Interviews</span>
        </div>
        <div className="dash-stat-card">
          <Map size={20} className="dash-stat-icon" style={{ color: "#10b981" }} />
          <span className="dash-stat-num">{stats.roadmapReports}</span>
          <span className="dash-stat-label">Roadmaps</span>
        </div>
      </div>

      <div className="dash-section">
        <h2>Recent Conversations</h2>
        {stats.recentChats.length === 0 ? (
          <p className="dash-empty">No conversations yet. Start one!</p>
        ) : (
          <div className="dash-recent">
            {stats.recentChats.map((chat) => (
              <div key={chat.id} className="dash-recent-card" onClick={() => navigate("/chat")}>
                <MessageSquare size={14} />
                <span className="dash-recent-title">{chat.title}</span>
                <span className="dash-recent-meta">
                  <Clock size={11} /> {chat.messages.length} messages
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-section">
        <h2>Quick Actions</h2>
        <div className="dash-actions">
          <button className="dash-action" onClick={() => navigate("/chat")}>
            <FileText size={18} /> Resume Review
          </button>
          <button className="dash-action" onClick={() => navigate("/chat")}>
            <Target size={18} /> ATS Analysis
          </button>
          <button className="dash-action" onClick={() => navigate("/chat")}>
            <Mic size={18} /> Mock Interview
          </button>
          <button className="dash-action" onClick={() => navigate("/chat")}>
            <Map size={18} /> Career Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
