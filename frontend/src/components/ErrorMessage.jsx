import { AlertTriangle, WifiOff, Clock, RefreshCw } from "lucide-react";

const errorTypes = {
  quota: {
    icon: Clock,
    title: "Rate limit reached",
    message: "The AI service quota has been exceeded. Please try again in a few minutes.",
    color: "#f59e0b",
  },
  network: {
    icon: WifiOff,
    title: "Connection lost",
    message: "Unable to reach the server. Check your internet connection.",
    color: "#ef4444",
  },
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    message: "The AI service is temporarily unavailable. Please try again.",
    color: "#ef4444",
  },
};

function getErrorType(errorText) {
  if (!errorText) return "generic";
  const lower = errorText.toLowerCase();
  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("429")) return "quota";
  if (lower.includes("network") || lower.includes("connection")) return "network";
  return "generic";
}

export default function ErrorMessage({ text, onRetry }) {
  const type = getErrorType(text);
  const config = errorTypes[type];
  const Icon = config.icon;

  return (
    <div className="error-message" style={{ borderColor: config.color }}>
      <div className="error-icon" style={{ color: config.color }}>
        <Icon size={20} />
      </div>
      <div className="error-content">
        <span className="error-title">{config.title}</span>
        <span className="error-text">{config.message}</span>
      </div>
      {onRetry && (
        <button className="error-retry" onClick={onRetry}>
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
