import { useState } from "react";
import { X, FileText, Briefcase, Upload } from "lucide-react";

export default function ATSInputModal({ onSubmit, onClose, hasResume }) {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const handleSubmit = () => {
    if (!jobDescription.trim()) return;
    onSubmit({ jobDescription: jobDescription.trim(), resumeFile });
    onClose();
  };

  return (
    <div className="ats-modal-overlay" onClick={onClose}>
      <div className="ats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ats-modal-header">
          <div className="ats-modal-title">
            <Briefcase size={18} />
            <h3>ATS Resume Analyzer</h3>
          </div>
          <button className="ats-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="ats-modal-body">
          {!hasResume && (
            <div className="ats-field">
              <label className="ats-label">
                <FileText size={14} /> Resume (PDF)
              </label>
              <div className="ats-file-input">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files[0] || null)}
                  id="ats-resume-input"
                />
                <label htmlFor="ats-resume-input" className="ats-file-label">
                  <Upload size={14} />
                  {resumeFile ? resumeFile.name : "Choose file..."}
                </label>
              </div>
            </div>
          )}

          {hasResume && (
            <div className="ats-resume-status">
              <FileText size={14} />
              <span>Using previously uploaded resume</span>
            </div>
          )}

          <div className="ats-field">
            <label className="ats-label">
              <Briefcase size={14} /> Job Description
            </label>
            <textarea
              className="ats-jd-input"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
            />
          </div>
        </div>

        <div className="ats-modal-footer">
          <button className="ats-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="ats-submit-btn"
            onClick={handleSubmit}
            disabled={!jobDescription.trim() || (!hasResume && !resumeFile)}
          >
            Analyze ATS Match
          </button>
        </div>
      </div>
    </div>
  );
}
