import { useMemo } from "react";
import AgentBadge from "./AgentBadge";
import MarkdownRenderer from "./MarkdownRenderer";
import MessageActions from "./MessageActions";
import ResumeDashboard from "./resume/ResumeDashboard";
import { parseResumeResponse } from "./resume/parseResumeResponse";
import ATSDashboard from "./ats/ATSDashboard";
import { parseATSResponse } from "./ats/parseATSResponse";
import { User } from "lucide-react";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatFullTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return d.toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ChatMessage({ msg, onRegenerate }) {
  const isBot = msg.type === "bot";

  const resumeData = useMemo(() => {
    if (!isBot || msg.agent !== "resume_agent" || msg.streaming) return null;
    if (msg.agents && msg.agents.length > 1) return null;
    // Check if this is an ATS analysis (contains "Keywords Found" or "ATS Match")
    if (msg.text && /(?:missing\s*keywords|keywords?\s*found|ats\s*match\s*score)/i.test(msg.text)) return null;
    return parseResumeResponse(msg.text);
  }, [isBot, msg.agent, msg.agents, msg.text, msg.streaming]);

  const atsData = useMemo(() => {
    if (!isBot || msg.streaming) return null;
    if (msg.atsAnalysis) return parseATSResponse(msg.text); // Explicit flag
    // Auto-detect ATS analysis by content pattern
    if (msg.agent === "resume_agent" && msg.text && /(?:missing\s*keywords|keywords?\s*found|ats\s*match\s*score)/i.test(msg.text)) {
      return parseATSResponse(msg.text);
    }
    return null;
  }, [isBot, msg.agent, msg.text, msg.streaming, msg.atsAnalysis]);

  return (
    <div className={`chat-msg ${msg.type} msg-animate`}>
      <div className="msg-avatar">
        {isBot ? (
          <div className="avatar-bot">AI</div>
        ) : (
          <div className="avatar-user"><User size={14} /></div>
        )}
      </div>
      <div className="msg-content">
        {isBot && msg.agents && msg.agents.length > 1 ? (
          <div className="multi-agent-badges">
            {msg.agents.map((a) => <AgentBadge key={a} agent={a} />)}
          </div>
        ) : (
          isBot && msg.agent && <AgentBadge agent={msg.agent} />
        )}
        <div className="msg-text">
          {isBot ? (
            <>
              {atsData ? (
                <ATSDashboard data={atsData} />
              ) : resumeData ? (
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
        {/* Timestamp */}
        {msg.timestamp && (
          <span className="msg-timestamp" title={formatFullTime(msg.timestamp)}>
            {formatTime(msg.timestamp)}
          </span>
        )}
        {/* Actions (bot messages only, not during streaming) */}
        {isBot && !msg.streaming && msg.text && (
          <MessageActions text={msg.text} onRegenerate={onRegenerate} />
        )}
      </div>
    </div>
  );
}
