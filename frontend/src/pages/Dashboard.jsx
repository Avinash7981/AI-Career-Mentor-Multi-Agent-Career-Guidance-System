import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquare, FileText, Target, Mic, Map, Clock, Plus, TrendingUp, BarChart3, Star, Activity } from "lucide-react";

function getStorageKey(uid) {
  return `careerChats_${uid}`;
}

function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span className="dash-stat-num">{count}</span>;
}

function MiniBarChart({ data, label }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">{label}</h3>
      <div className="mini-bar-chart">
        {data.map((d, i) => (
          <div key={i} className="mini-bar-col" title={`${d.label}: ${d.value}`}>
            <div className="mini-bar" style={{ height: `${(d.value / max) * 100}%` }} />
            <span className="mini-bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPieChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const visibleSegments = segments.filter(s => s.value > 0);

  // Precompute offsets
  const segmentsWithOffset = [];
  let cumOffset = 0;
  for (const seg of visibleSegments) {
    const pct = (seg.value / total) * 100;
    segmentsWithOffset.push({ ...seg, pct, offset: cumOffset });
    cumOffset += pct;
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Agent Usage</h3>
      <div className="mini-pie-container">
        <svg viewBox="0 0 100 100" className="mini-pie-svg">
          {segmentsWithOffset.map((seg, i) => (
            <circle key={i} cx="50" cy="50" r="40" fill="none"
              stroke={seg.color} strokeWidth="20"
              strokeDasharray={`${seg.pct * 2.51} ${251.2 - seg.pct * 2.51}`}
              strokeDashoffset={`${-seg.offset * 2.51}`}
              transform="rotate(-90 50 50)" />
          ))}
        </svg>
        <div className="mini-pie-legend">
          {visibleSegments.map((seg, i) => (
            <div key={i} className="pie-legend-item">
              <span className="pie-dot" style={{ background: seg.color }} />
              <span>{seg.label} ({seg.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const analytics = useMemo(() => {
    const chats = JSON.parse(localStorage.getItem(getStorageKey(user.uid)) || "[]");
    let totalMessages = 0, resumeReviews = 0, atsReports = 0, interviews = 0, roadmaps = 0;
    const agentCounts = {};
    const dailyMessages = {};
    let longestChat = { title: "", count: 0 };

    for (const chat of chats) {
      const msgs = chat.messages || [];
      totalMessages += msgs.length;
      if (msgs.length > longestChat.count) longestChat = { title: chat.title, count: msgs.length };

      for (const msg of msgs) {
        if (msg.type === "bot") {
          if (msg.agent === "resume_agent") resumeReviews++;
          if (msg.atsAnalysis) atsReports++;
          if (msg.agent === "interview_agent") interviews++;
          if (msg.agent === "career_agent") roadmaps++;
          if (msg.agent) agentCounts[msg.agent] = (agentCounts[msg.agent] || 0) + 1;
        }
        // Daily activity
        if (msg.timestamp) {
          const day = new Date(msg.timestamp).toLocaleDateString("en-US", { weekday: "short" });
          dailyMessages[day] = (dailyMessages[day] || 0) + 1;
        }
      }
    }

    // Find favorite agent
    const favoriteAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];
    const agentLabels = { resume_agent: "Resume Expert", career_agent: "Career Coach", interview_agent: "Interview Coach", orchestrator_agent: "Orchestrator" };

    // Average conversation length
    const avgLength = chats.length > 0 ? Math.round(totalMessages / chats.length) : 0;

    // Weekly activity for bar chart
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = days.map(d => ({ label: d, value: dailyMessages[d] || 0 }));

    // Most active day
    const mostActiveDay = weeklyData.sort((a, b) => b.value - a.value)[0];

    // Agent pie segments
    const pieSegments = [
      { label: "Resume", value: agentCounts["resume_agent"] || 0, color: "#3b82f6" },
      { label: "Career", value: agentCounts["career_agent"] || 0, color: "#10b981" },
      { label: "Interview", value: agentCounts["interview_agent"] || 0, color: "#8b5cf6" },
      { label: "General", value: agentCounts["orchestrator_agent"] || 0, color: "#71717a" },
    ];

    // Feature usage for bar chart
    const featureData = [
      { label: "Resume", value: resumeReviews },
      { label: "ATS", value: atsReports },
      { label: "Interview", value: interviews },
      { label: "Roadmap", value: roadmaps },
    ];

    // Recent activity
    const recentActivity = [];
    for (const chat of chats.slice(0, 10)) {
      const lastMsg = [...(chat.messages || [])].reverse().find(m => m.type === "bot");
      if (lastMsg) {
        recentActivity.push({
          title: chat.title,
          agent: lastMsg.agent,
          time: lastMsg.timestamp ? new Date(lastMsg.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "",
        });
      }
    }

    return {
      totalChats: chats.length, totalMessages, resumeReviews, atsReports, interviews, roadmaps,
      favoriteAgent: favoriteAgent ? agentLabels[favoriteAgent[0]] || favoriteAgent[0] : "None yet",
      avgLength, longestChat, mostActiveDay, weeklyData: days.map(d => ({ label: d, value: dailyMessages[d] || 0 })),
      pieSegments, featureData, recentActivity: recentActivity.slice(0, 5),
    };
  }, [user.uid]);

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div className="dash-greeting">
          <h1>Welcome back, {user.displayName || user.email?.split("@")[0]}</h1>
          <p>Your AI career coaching workspace</p>
        </div>
        <button className="dash-new-chat" onClick={() => navigate("/chat")}>
          <Plus size={16} /> New Chat
        </button>
      </div>

      {/* Stats Grid */}
      <div className="dash-stats">
        <div className="dash-stat-card">
          <MessageSquare size={18} className="dash-stat-icon" />
          <AnimatedCounter target={analytics.totalChats} />
          <span className="dash-stat-label">Conversations</span>
        </div>
        <div className="dash-stat-card">
          <Activity size={18} className="dash-stat-icon" style={{ color: "#60a5fa" }} />
          <AnimatedCounter target={analytics.totalMessages} />
          <span className="dash-stat-label">Total Messages</span>
        </div>
        <div className="dash-stat-card">
          <FileText size={18} className="dash-stat-icon" style={{ color: "#3b82f6" }} />
          <AnimatedCounter target={analytics.resumeReviews} />
          <span className="dash-stat-label">Resume Reviews</span>
        </div>
        <div className="dash-stat-card">
          <Target size={18} className="dash-stat-icon" style={{ color: "#ef4444" }} />
          <AnimatedCounter target={analytics.atsReports} />
          <span className="dash-stat-label">ATS Reports</span>
        </div>
        <div className="dash-stat-card">
          <Mic size={18} className="dash-stat-icon" style={{ color: "#8b5cf6" }} />
          <AnimatedCounter target={analytics.interviews} />
          <span className="dash-stat-label">Interviews</span>
        </div>
        <div className="dash-stat-card">
          <Map size={18} className="dash-stat-icon" style={{ color: "#10b981" }} />
          <AnimatedCounter target={analytics.roadmaps} />
          <span className="dash-stat-label">Roadmaps</span>
        </div>
      </div>

      {/* Insights */}
      <div className="dash-insights">
        <div className="dash-insight-card">
          <Star size={14} /> Favorite Agent: <strong>{analytics.favoriteAgent}</strong>
        </div>
        <div className="dash-insight-card">
          <BarChart3 size={14} /> Avg Conversation: <strong>{analytics.avgLength} messages</strong>
        </div>
        <div className="dash-insight-card">
          <TrendingUp size={14} /> Most Active: <strong>{analytics.mostActiveDay?.label || "N/A"}</strong>
        </div>
        <div className="dash-insight-card">
          <MessageSquare size={14} /> Longest Chat: <strong>{analytics.longestChat.title || "N/A"} ({analytics.longestChat.count})</strong>
        </div>
      </div>

      {/* Charts */}
      <div className="dash-charts">
        <MiniBarChart data={analytics.weeklyData} label="Weekly Activity" />
        <MiniPieChart segments={analytics.pieSegments} />
        <MiniBarChart data={analytics.featureData} label="Feature Usage" />
      </div>

      {/* Recent Activity */}
      <div className="dash-section">
        <h2>Recent Activity</h2>
        {analytics.recentActivity.length === 0 ? (
          <p className="dash-empty">No activity yet. Start a conversation!</p>
        ) : (
          <div className="dash-recent">
            {analytics.recentActivity.map((item, i) => (
              <div key={i} className="dash-recent-card" onClick={() => navigate("/chat")}>
                <MessageSquare size={14} />
                <span className="dash-recent-title">{item.title}</span>
                <span className="dash-recent-meta"><Clock size={11} /> {item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dash-section">
        <h2>Quick Actions</h2>
        <div className="dash-actions">
          <button className="dash-action" onClick={() => navigate("/chat")}><FileText size={18} /> Resume Review</button>
          <button className="dash-action" onClick={() => navigate("/chat")}><Target size={18} /> ATS Analysis</button>
          <button className="dash-action" onClick={() => navigate("/chat")}><Mic size={18} /> Mock Interview</button>
          <button className="dash-action" onClick={() => navigate("/chat")}><Map size={18} /> Career Roadmap</button>
        </div>
      </div>
    </div>
  );
}
