import { useEffect, useState } from "react";

function getColor(score) {
  if (score >= 90) return "#22c55e";
  if (score >= 75) return "#f59e0b";
  return "#ef4444";
}

export default function ScoreCircle({ score }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame;
    let current = 0;
    const step = () => {
      current += 1;
      if (current <= score) {
        setAnimatedScore(current);
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="score-circle-container">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1e1e1e" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div className="score-circle-value" style={{ color }}>
        <span className="score-number">{animatedScore}</span>
        <span className="score-total">/ 100</span>
      </div>
      <div className="score-label">Overall ATS Score</div>
    </div>
  );
}
