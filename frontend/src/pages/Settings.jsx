import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Moon, Zap, FileText, Trash2, Download, LogOut } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleExportData = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("careerChats") || key.startsWith("sessionId")) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "career-mentor-export.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure? This will delete all your data permanently.")) {
      // Clear all user data
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.includes(user.uid)) localStorage.removeItem(key);
      }
      logout();
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2><User size={16} /> Profile</h2>
        <div className="settings-profile">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="settings-avatar" />
          ) : (
            <div className="settings-avatar-placeholder">{(user.displayName || user.email)[0].toUpperCase()}</div>
          )}
          <div className="settings-profile-info">
            <span className="settings-name">{user.displayName || "User"}</span>
            <span className="settings-email">{user.email}</span>
            <span className="settings-date">Joined {new Date(user.metadata.creationTime).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2><Moon size={16} /> Appearance</h2>
        <div className="settings-row">
          <span>Theme</span>
          <span className="settings-badge">Dark (default)</span>
        </div>
      </div>

      <div className="settings-section">
        <h2><Zap size={16} /> Features</h2>
        <div className="settings-row">
          <span>Streaming Responses</span>
          <span className="settings-badge settings-badge-green">Enabled</span>
        </div>
        <div className="settings-row">
          <span>Markdown Rendering</span>
          <span className="settings-badge settings-badge-green">Enabled</span>
        </div>
      </div>

      <div className="settings-section">
        <h2><FileText size={16} /> Data</h2>
        <div className="settings-actions">
          <button className="settings-btn" onClick={handleExportData}>
            <Download size={14} /> Export All Data
          </button>
          <button className="settings-btn settings-btn-danger" onClick={handleDeleteAccount}>
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>

      <div className="settings-section">
        <button className="settings-btn settings-btn-logout" onClick={handleLogout}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}
