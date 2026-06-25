import { useMemo } from "react";
import AgentBadge from "./AgentBadge";
import MarkdownRenderer from "./MarkdownRenderer";
import ResumeDashboard from "./resume/ResumeDashboard";
import { parseResumeResponse } from "./resume/parseResumeResponse";
import { User } from "lucide-react";

export default function ChatMessage({ msg }) {
  const isBot = msg.type === "bot";

  // Only parse resume dashboard for completed resume_agent responses (not streaming)
  const resumeData = useMemo(() => {
    if (!isBot || msg.agent !== "resume_agent" || msg.streaming) return null;
    return parseResumeResponse(msg.text);
  }, [isBot, msg.agent, msg.text, msg.streaming]);

  return (
    <div className={`chat-msg ${msg.type}`}>
      <div className="msg-avatar">
        {isBot ? (
          <div className="avatar-bot">AI</div>
        ) : (
          <div className="avatar-user"><User size={14} /></div>
        )}
      </div>
      <div className="msg-content">
        {isBot && msg.agent && <AgentBadge agent={msg.agent} />}
        <div className="msg-text">
          {isBot ? (
            <>
              {resumeData ? (
                <ResumeDashboard data={resumeData} />
              ) : (
                <MarkdownRenderer content={msg.text || ""} />
              )}
              {msg.streaming && <span className="streaming-cursor" />}
            </>
          ) : (
            <p>{msg.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
