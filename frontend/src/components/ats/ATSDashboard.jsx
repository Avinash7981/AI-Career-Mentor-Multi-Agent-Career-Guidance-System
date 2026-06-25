import { memo, useState } from "react";
import { Check, X, Copy, Download, Search, ArrowUp, ArrowRight, ArrowDown, AlertTriangle } from "lucide-react";
import ScoreCircle from "../resume/ScoreCircle";
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

function KeywordChip({ keyword, found }) {
  return (
    <span className={`ats-keyword-chip ${found ? "ats-kw-found" : "ats-kw-missing"}`}>
      {found ? <Check size={10} /> : <X size={10} />}
      {keyword}
    </span>
  );
}

function RewriteCard({ current, improved }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ats-rewrite-card">
      <div className="ats-rewrite-current">
        <span className="ats-rw-label">Current</span>
        <p>{current}</p>
      </div>
      <div className="ats-rewrite-improved">
        <span className="ats-rw-label">Improved</span>
        <p>{improved}</p>
        <button className="ats-rw-copy" onClick={handleCopy}>
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
    </div>
  );
}

function ATSDashboard({ data }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(data.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([data.raw], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ats-analysis.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="resume-dashboard ats-dashboard">
      {/* Score */}
      {data.overallScore !== null && (
        <div className="rd-section rd-score-section">
          <ScoreCircle score={data.overallScore} />
          <div className="ats-score-label">ATS Match Score</div>
        </div>
      )}

      {/* Category Scores */}
      {data.categoryScores.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Category Breakdown</h3>
          <div className="rd-categories">
            {data.categoryScores.map((cat) => <CategoryBar key={cat.name} name={cat.name} score={cat.score} />)}
          </div>
        </div>
      )}

      {/* Keywords */}
      {(data.keywordsFound.length > 0 || data.missingKeywords.length > 0) && (
        <div className="rd-section">
          <h3 className="rd-section-title">Keyword Analysis</h3>
          <div className="ats-keywords-section">
            {data.keywordsFound.length > 0 && (
              <div className="ats-kw-group">
                <span className="ats-kw-label ats-kw-label-found">Keywords Found ({data.keywordsFound.length})</span>
                <div className="ats-kw-chips">
                  {data.keywordsFound.map((kw, i) => <KeywordChip key={i} keyword={kw} found />)}
                </div>
              </div>
            )}
            {data.missingKeywords.length > 0 && (
              <div className="ats-kw-group">
                <span className="ats-kw-label ats-kw-label-missing">Missing Keywords ({data.missingKeywords.length})</span>
                <div className="ats-kw-chips">
                  {data.missingKeywords.map((kw, i) => <KeywordChip key={i} keyword={kw} found={false} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {data.strengths.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Strengths</h3>
          <div className="rd-chips-grid">
            {data.strengths.map((s, i) => (
              <div key={i} className="rd-chip rd-chip-green"><Check size={12} /><span>{s}</span></div>
            ))}
          </div>
        </div>
      )}

      {data.weaknesses.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Gaps</h3>
          <div className="rd-chips-grid">
            {data.weaknesses.map((w, i) => (
              <div key={i} className="rd-chip rd-chip-red"><X size={12} /><span>{w}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Sections */}
      {data.missingSections.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Missing Sections</h3>
          <div className="rd-chips-grid">
            {data.missingSections.map((s, i) => (
              <div key={i} className="rd-chip rd-chip-red"><AlertTriangle size={12} /><span>{s}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {(data.highPriority.length > 0 || data.mediumPriority.length > 0 || data.lowPriority.length > 0) && (
        <div className="rd-section">
          <h3 className="rd-section-title">Improvement Suggestions</h3>
          <div className="ats-search-wrap">
            <Search size={13} />
            <input type="text" placeholder="Search suggestions..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="ats-search-input" />
          </div>
          <div className="rd-improvements">
            {data.highPriority.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase())).map((imp, i) => (
              <div key={`h${i}`} className="rd-improvement">
                <ArrowUp size={12} className="priority-high" />
                <span className="rd-imp-text">{imp}</span>
                <span className="rd-imp-badge rd-imp-high">high</span>
              </div>
            ))}
            {data.mediumPriority.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase())).map((imp, i) => (
              <div key={`m${i}`} className="rd-improvement">
                <ArrowRight size={12} className="priority-med" />
                <span className="rd-imp-text">{imp}</span>
                <span className="rd-imp-badge rd-imp-medium">medium</span>
              </div>
            ))}
            {data.lowPriority.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase())).map((imp, i) => (
              <div key={`l${i}`} className="rd-improvement">
                <ArrowDown size={12} className="priority-low" />
                <span className="rd-imp-text">{imp}</span>
                <span className="rd-imp-badge rd-imp-low">low</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Rewrites */}
      {data.rewrites.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">AI Rewrite Suggestions</h3>
          <div className="ats-rewrites">
            {data.rewrites.map((rw, i) => <RewriteCard key={i} current={rw.current} improved={rw.improved} />)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rd-section rd-actions">
        <button className="rd-action-btn" onClick={handleCopyAll}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Report</>}
        </button>
        <button className="rd-action-btn" onClick={handleDownload}>
          <Download size={14} /> Download MD
        </button>
      </div>

      {/* Raw */}
      <details className="rd-raw-section">
        <summary className="rd-raw-toggle">View full response</summary>
        <div className="rd-raw-content"><MarkdownRenderer content={data.raw} /></div>
      </details>
    </div>
  );
}

export default memo(ATSDashboard);
