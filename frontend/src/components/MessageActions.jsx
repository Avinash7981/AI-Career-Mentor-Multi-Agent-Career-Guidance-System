import { useState, memo } from "react";
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Download } from "lucide-react";

function MessageActions({ text, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // null, 'up', 'down'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "response.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="msg-actions">
      <button
        className="msg-action-btn"
        onClick={handleCopy}
        aria-label="Copy message"
        title="Copy"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      {onRegenerate && (
        <button
          className="msg-action-btn"
          onClick={onRegenerate}
          aria-label="Regenerate response"
          title="Regenerate"
        >
          <RefreshCw size={13} />
        </button>
      )}
      <button
        className={`msg-action-btn ${liked === "up" ? "active-like" : ""}`}
        onClick={() => setLiked(liked === "up" ? null : "up")}
        aria-label="Like"
        title="Like"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        className={`msg-action-btn ${liked === "down" ? "active-dislike" : ""}`}
        onClick={() => setLiked(liked === "down" ? null : "down")}
        aria-label="Dislike"
        title="Dislike"
      >
        <ThumbsDown size={13} />
      </button>
      <button
        className="msg-action-btn"
        onClick={handleDownload}
        aria-label="Download as markdown"
        title="Download"
      >
        <Download size={13} />
      </button>
    </div>
  );
}

export default memo(MessageActions);
