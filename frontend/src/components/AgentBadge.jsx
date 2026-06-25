import { FileText, Briefcase, GraduationCap, Bot } from "lucide-react";

const agentConfig = {
  resume_agent: {
    icon: FileText,
    label: "Resume Expert",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.1)",
  },
  career_agent: {
    icon: Briefcase,
    label: "Career Coach",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  interview_agent: {
    icon: GraduationCap,
    label: "Interview Coach",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.1)",
  },
  orchestrator_agent: {
    icon: Bot,
    label: "AI Orchestrator",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.1)",
  },
};

export default function AgentBadge({ agent }) {
  const config = agentConfig[agent] || agentConfig.orchestrator_agent;
  const Icon = config.icon;

  return (
    <div className="agent-badge" style={{ color: config.color, background: config.bg }}>
      <Icon size={12} />
      <span>{config.label}</span>
    </div>
  );
}
