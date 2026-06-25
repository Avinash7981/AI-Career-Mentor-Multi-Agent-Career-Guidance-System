import { memo, useState } from "react";
import { Check, X, ArrowUp, ArrowRight, ArrowDown, Copy, Download, FileText } from "lucide-react";
import ScoreCircle from "./ScoreCircle";
import MarkdownRenderer from "../MarkdownRenderer";

function CategoryBar({ name, score }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="rd-category">
      <div className="rd-cat-header">
        <span className="rd-cat-name">{name}</span>
        <span className="rd-cat-score" style={{ color }}>{score}%</span>
      </div>
      <div className="rd-progress-track">
        <div className="rd-progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function PriorityIcon({ priority }) {
  if (priority === "high") return <ArrowUp size={12} className="priority-high" />;
  if (priority === "low") return <ArrowDown size={12} className="priority-low" />;
  return <ArrowRight size={12} className="priority-med" />;
}

function ResumeDashboard({ data }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([data.raw], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-review.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="resume-dashboard">
      {/* Score Section */}
      {data.score !== null && (
        <div className="rd-section rd-score-section">
          <ScoreCircle score={data.score} />
        </div>
      )}

      {/* Category Scores */}
      {data.categories.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Category Scores</h3>
          <div className="rd-categories">
            {data.categories.map((cat) => (
              <CategoryBar key={cat.name} name={cat.name} score={cat.score} />
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Strengths</h3>
          <div className="rd-chips-grid">
            {data.strengths.map((s, i) => (
              <div key={i} className="rd-chip rd-chip-green">
                <Check size={12} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {data.weaknesses.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Areas for Improvement</h3>
          <div className="rd-chips-grid">
            {data.weaknesses.map((w, i) => (
              <div key={i} className="rd-chip rd-chip-red">
                <X size={12} />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Skills Extracted</h3>
          <div className="rd-skills">
            {data.skills.map((group) => (
              <div key={group.category} className="rd-skill-group">
                <span className="rd-skill-category">{group.category}</span>
                <div className="rd-skill-chips">
                  {group.skills.map((skill, i) => (
                    <span key={i} className="rd-skill-chip">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {data.improvements.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Improvement Suggestions</h3>
          <div className="rd-improvements">
            {data.improvements.map((imp, i) => (
              <div key={i} className="rd-improvement">
                <PriorityIcon priority={imp.priority} />
                <span className="rd-imp-text">{imp.text}</span>
                <span className={`rd-imp-badge rd-imp-${imp.priority}`}>{imp.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rd-section rd-actions">
        <button className="rd-action-btn" onClick={handleCopy}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Review</>}
        </button>
        <button className="rd-action-btn" onClick={handleDownloadMd}>
          <Download size={14} /> Download MD
        </button>
        <button className="rd-action-btn rd-action-secondary" onClick={() => {}}>
          <FileText size={14} /> Full Report
        </button>
      </div>

      {/* Expandable Raw Markdown */}
      <details className="rd-raw-section">
        <summary className="rd-raw-toggle">View full response</summary>
        <div className="rd-raw-content">
          <MarkdownRenderer content={data.raw} />
        </div>
      </details>
    </div>
  );
}

export default memo(ResumeDashboard);
