export default function LoadingIndicator() {
  return (
    <div className="chat-msg bot">
      <div className="msg-avatar">
        <div className="avatar-bot">AI</div>
      </div>
      <div className="msg-content">
        <div className="loading-indicator">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="loading-text">Thinking...</span>
        </div>
      </div>
    </div>
  );
}
