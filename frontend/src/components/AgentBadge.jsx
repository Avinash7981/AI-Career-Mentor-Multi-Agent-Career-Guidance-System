import { FileText, Briefcase, GraduationCap, Bot } from "lucide-react";

const agentConfig = {
  resume_agent: {
    icon: FileText,
    label: "Resume Agent",
    color: "#3b82f6",
  },
  career_agent: {
    icon: Briefcase,
    label: "Career Agent",
    color: "#22c55e",
  },
  interview_agent: {
    icon: GraduationCap,
    label: "Interview Agent",
    color: "#a855f7",
  },
  orchestrator_agent: {
    icon: Bot,
    label: "AI Mentor",
    color: "#9ca3af",
  },
};

export default function AgentBadge({ agent }) {
  const config = agentConfig[agent] || agentConfig.orchestrator_agent;
  const Icon = config.icon;

  return (
    <div className="agent-badge" style={{ color: config.color }}>
      <Icon size={14} />
      <span>{config.label}</span>
    </div>
  );
}
