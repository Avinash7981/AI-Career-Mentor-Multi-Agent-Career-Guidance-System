import { useState } from "react";
import { X, Briefcase, BarChart3, MessageSquare } from "lucide-react";

const experienceLevels = ["Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior (5+ years)"];
const interviewTypes = [
  { id: "hr", label: "HR / Behavioral", icon: MessageSquare, desc: "Culture fit, teamwork, conflict resolution" },
  { id: "technical", label: "Technical", icon: BarChart3, desc: "Coding, system design, problem solving" },
  { id: "behavioral", label: "Behavioral (STAR)", icon: MessageSquare, desc: "Situation, Task, Action, Result" },
  { id: "mixed", label: "Mixed (All Types)", icon: Briefcase, desc: "Combination of all question types" },
];

export default function InterviewSetupModal({ onStart, onClose }) {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState(experienceLevels[0]);
  const [type, setType] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(5);

  const handleStart = () => {
    if (!role.trim()) return;
    onStart({ role: role.trim(), experience, type, questionCount });
    onClose();
  };

  return (
    <div className="ats-modal-overlay" onClick={onClose}>
      <div className="ats-modal interview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ats-modal-header">
          <div className="ats-modal-title">
            <Briefcase size={18} />
            <h3>Mock Interview Setup</h3>
          </div>
          <button className="ats-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="ats-modal-body">
          <div className="ats-field">
            <label className="ats-label">Target Role</label>
            <input
              type="text"
              className="iv-text-input"
              placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoFocus
            />
          </div>

          <div className="ats-field">
            <label className="ats-label">Experience Level</label>
            <div className="iv-radio-group">
              {experienceLevels.map((lvl) => (
                <label key={lvl} className={`iv-radio ${experience === lvl ? "iv-radio-active" : ""}`}>
                  <input type="radio" name="exp" value={lvl} checked={experience === lvl}
                    onChange={() => setExperience(lvl)} />
                  <span>{lvl}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ats-field">
            <label className="ats-label">Interview Type</label>
            <div className="iv-type-grid">
              {interviewTypes.map((t) => (
                <button key={t.id} className={`iv-type-card ${type === t.id ? "iv-type-active" : ""}`}
                  onClick={() => setType(t.id)}>
                  <t.icon size={16} />
                  <span className="iv-type-label">{t.label}</span>
                  <span className="iv-type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ats-field">
            <label className="ats-label">Number of Questions</label>
            <div className="iv-count-selector">
              {[3, 5, 8, 10].map((n) => (
                <button key={n} className={`iv-count-btn ${questionCount === n ? "iv-count-active" : ""}`}
                  onClick={() => setQuestionCount(n)}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="ats-modal-footer">
          <button className="ats-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="ats-submit-btn" onClick={handleStart} disabled={!role.trim()}>
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}
