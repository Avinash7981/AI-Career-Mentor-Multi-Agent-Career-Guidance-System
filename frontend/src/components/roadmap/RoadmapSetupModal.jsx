import { useState } from "react";
import { X, Map, Briefcase } from "lucide-react";

const experienceLevels = ["Student / Fresh Graduate", "Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior (5+ years)"];
const timeOptions = ["1 month", "3 months", "6 months", "12 months"];

export default function RoadmapSetupModal({ onSubmit, onClose }) {
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [dreamRole, setDreamRole] = useState("");
  const [experience, setExperience] = useState(experienceLevels[0]);
  const [timeAvailable, setTimeAvailable] = useState("6 months");
  const [targetCompany, setTargetCompany] = useState("");

  const handleSubmit = () => {
    if (!dreamRole.trim()) return;
    onSubmit({ education, skills, dreamRole: dreamRole.trim(), experience, timeAvailable, targetCompany });
    onClose();
  };

  return (
    <div className="ats-modal-overlay" onClick={onClose}>
      <div className="ats-modal roadmap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ats-modal-header">
          <div className="ats-modal-title">
            <Map size={18} />
            <h3>Career Roadmap Generator</h3>
          </div>
          <button className="ats-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="ats-modal-body">
          <div className="ats-field">
            <label className="ats-label"><Briefcase size={14} /> Dream Role</label>
            <input type="text" className="iv-text-input" placeholder="e.g., AI Engineer, Full Stack Developer, Data Scientist"
              value={dreamRole} onChange={(e) => setDreamRole(e.target.value)} autoFocus />
          </div>

          <div className="ats-field">
            <label className="ats-label">Current Education</label>
            <input type="text" className="iv-text-input" placeholder="e.g., B.Tech CS, Self-taught, Bootcamp Graduate"
              value={education} onChange={(e) => setEducation(e.target.value)} />
          </div>

          <div className="ats-field">
            <label className="ats-label">Current Skills (comma separated)</label>
            <input type="text" className="iv-text-input" placeholder="e.g., Python, React, SQL, Machine Learning"
              value={skills} onChange={(e) => setSkills(e.target.value)} />
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
            <label className="ats-label">Timeline</label>
            <div className="iv-count-selector">
              {timeOptions.map((t) => (
                <button key={t} className={`iv-count-btn rm-time-btn ${timeAvailable === t ? "iv-count-active" : ""}`}
                  onClick={() => setTimeAvailable(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="ats-field">
            <label className="ats-label">Target Company (optional)</label>
            <input type="text" className="iv-text-input" placeholder="e.g., Google, Meta, startup"
              value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} />
          </div>
        </div>

        <div className="ats-modal-footer">
          <button className="ats-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="ats-submit-btn" onClick={handleSubmit} disabled={!dreamRole.trim()}>
            Generate Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
