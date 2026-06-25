import { memo, useState } from "react";
import { Check, X, Copy, Download, RefreshCw, BookOpen } from "lucide-react";
import ScoreCircle from "../resume/ScoreCircle";
import MarkdownRenderer from "../MarkdownRenderer";

function parseInterviewReport(text) {
  const result = {
    overallScore: null,
    categories: [],
    strengths: [],
    weaknesses: [],
    suggestions: [],
    hiringRecommendation: null,
    raw: text,
  };

  // Extract overall score
  const scoreMatch = text.match(/(?:overall|interview|final)\s*(?:score|rating)[:\s]*(\d{1,3})\s*(?:\/\s*100)?/i);
  if (scoreMatch) {
    const n = parseInt(scoreMatch[1], 10);
    if (n >= 0 && n <= 100) result.overallScore = n;
  }
  if (!result.overallScore) {
    const alt = text.match(/(\d{1,3})\s*\/\s*100/);
    if (alt) { const n = parseInt(alt[1], 10); if (n >= 0 && n <= 100) result.overallScore = n; }
  }

  // Category scores
  const catPatterns = [
    { name: "Communication", pattern: /communication[:\s]*(\d{1,3})/i },
    { name: "Technical Accuracy", pattern: /technical\s*(?:accuracy)?[:\s]*(\d{1,3})/i },
    { name: "Confidence", pattern: /confidence[:\s]*(\d{1,3})/i },
    { name: "Problem Solving", pattern: /problem\s*solving[:\s]*(\d{1,3})/i },
    { name: "Completeness", pattern: /completeness[:\s]*(\d{1,3})/i },
  ];
  for (const { name, pattern } of catPatterns) {
    const m = text.match(pattern);
    if (m) { const s = parseInt(m[1], 10); if (s >= 0 && s <= 100) result.categories.push({ name, score: s }); }
  }

  // Lists
  const extractItems = (pat) => {
    const items = [];
    const sections = text.split(/\n#{1,4}\s+/);
    for (const sec of sections) {
      if (pat.test(sec.substring(0, 80))) {
        const bullets = sec.match(/[-*•]\s+(.+)/g);
        if (bullets) bullets.forEach(b => { const c = b.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim(); if (c.length > 0 && c.length < 200) items.push(c); });
        break;
      }
    }
    return items.slice(0, 8);
  };

  result.strengths = extractItems(/strengths?/i);
  result.weaknesses = extractItems(/weaknesses?|areas?\s*for\s*improvement/i);
  result.suggestions = extractItems(/suggest|better\s*answers?|improve/i);

  // Hiring recommendation
  const hiringMatch = text.match(/(?:hiring|recommendation|likelihood|verdict)[:\s]*(.{5,100}?)(?:\n|$)/i);
  if (hiringMatch) result.hiringRecommendation = hiringMatch[1].replace(/\*\*/g, "").trim();

  return result;
}

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

function InterviewFinalDashboard({ text, onRetry, onRoadmap }) {
  const [copied, setCopied] = useState(false);
  const data = parseInterviewReport(text);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([data.raw], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "interview-report.md"; a.click();
    URL.revokeObjectURL(url);
  };

  if (!data.overallScore && data.categories.length === 0) {
    return <MarkdownRenderer content={text} />;
  }

  return (
    <div className="resume-dashboard iv-final-dashboard">
      {data.overallScore && (
        <div className="rd-section rd-score-section">
          <ScoreCircle score={data.overallScore} />
          <div className="ats-score-label">Interview Performance</div>
        </div>
      )}

      {data.hiringRecommendation && (
        <div className="rd-section iv-recommendation">
          <h3 className="rd-section-title">Hiring Recommendation</h3>
          <p className="iv-rec-text">{data.hiringRecommendation}</p>
        </div>
      )}

      {data.categories.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Skill Breakdown</h3>
          <div className="rd-categories">
            {data.categories.map((c) => <CategoryBar key={c.name} name={c.name} score={c.score} />)}
          </div>
        </div>
      )}

      {data.strengths.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Strengths</h3>
          <div className="rd-chips-grid">
            {data.strengths.map((s, i) => <div key={i} className="rd-chip rd-chip-green"><Check size={12} /><span>{s}</span></div>)}
          </div>
        </div>
      )}

      {data.weaknesses.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Areas for Improvement</h3>
          <div className="rd-chips-grid">
            {data.weaknesses.map((w, i) => <div key={i} className="rd-chip rd-chip-red"><X size={12} /><span>{w}</span></div>)}
          </div>
        </div>
      )}

      <div className="rd-section rd-actions">
        <button className="rd-action-btn" onClick={handleCopy}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Report</>}
        </button>
        <button className="rd-action-btn" onClick={handleDownload}>
          <Download size={14} /> Download
        </button>
        {onRetry && (
          <button className="rd-action-btn" onClick={onRetry}>
            <RefreshCw size={14} /> Retry Interview
          </button>
        )}
        {onRoadmap && (
          <button className="rd-action-btn" onClick={onRoadmap}>
            <BookOpen size={14} /> Learning Roadmap
          </button>
        )}
      </div>

      <details className="rd-raw-section">
        <summary className="rd-raw-toggle">View full report</summary>
        <div className="rd-raw-content"><MarkdownRenderer content={data.raw} /></div>
      </details>
    </div>
  );
}

export default memo(InterviewFinalDashboard);
