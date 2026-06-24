import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentBadge from "./AgentBadge";

export default function ChatMessage({ msg }) {
  return (
    <div className={`message ${msg.type}`}>
      {msg.type === "bot" && msg.agent && <AgentBadge agent={msg.agent} />}
      {msg.type === "bot" ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
      ) : (
        msg.text
      )}
    </div>
  );
}
