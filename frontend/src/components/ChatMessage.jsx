import AgentBadge from "./AgentBadge";
import MarkdownRenderer from "./MarkdownRenderer";
import { User } from "lucide-react";

export default function ChatMessage({ msg }) {
  const isBot = msg.type === "bot";

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
              <MarkdownRenderer content={msg.text || ""} />
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
