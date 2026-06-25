import { FileText, Briefcase, GraduationCap, BarChart3 } from "lucide-react";

const quickActions = [
  {
    icon: FileText,
    title: "Resume Review",
    description: "Get expert feedback on your resume",
    prompt: "I'd like a comprehensive resume review. Analyze my resume for ATS optimization, formatting, and content improvements.",
    color: "#3b82f6",
  },
  {
    icon: Briefcase,
    title: "Career Roadmap",
    description: "Plan your career path forward",
    prompt: "Generate a comprehensive career plan for me. Include career paths, recommended skills, a learning roadmap, and internship recommendations.",
    color: "#10b981",
  },
  {
    icon: GraduationCap,
    title: "Interview Practice",
    description: "Prepare with mock interviews",
    prompt: "I want to practice for interviews. Give me mock interview questions and help me prepare my answers using the STAR method.",
    color: "#8b5cf6",
  },
  {
    icon: BarChart3,
    title: "Skill Gap Analysis",
    description: "Identify skills you need to learn",
    prompt: "Perform a skill gap analysis for me. Identify what skills I'm missing for my target career and create a prioritized learning plan.",
    color: "#f59e0b",
  },
];

export default function WelcomeScreen({ onSelectAction }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-header">
        <div className="welcome-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#logo-gradient)" />
            <path d="M14 32V20l10-6 10 6v12l-10 6-10-6z" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="24" cy="24" r="4" fill="#fff" />
            <path d="M24 16v4M24 28v4M18 21l3.5 2M26.5 25l3.5 2M18 27l3.5-2M26.5 23l3.5-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>AI Career Mentor</h1>
        <p className="welcome-subtitle">
          Your intelligent career assistant powered by specialized AI agents
        </p>
      </div>
      <div className="quick-actions">
        {quickActions.map((action) => (
          <button
            key={action.title}
            className="quick-action-card"
            onClick={() => onSelectAction(action.prompt)}
          >
            <div className="qa-icon" style={{ color: action.color, background: `${action.color}15` }}>
              <action.icon size={20} />
            </div>
            <div className="qa-text">
              <span className="qa-title">{action.title}</span>
              <span className="qa-desc">{action.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
