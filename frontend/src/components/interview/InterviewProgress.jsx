import { memo } from "react";
import { Clock } from "lucide-react";

function InterviewProgress({ current, total, role }) {
  const progress = (current / total) * 100;
  const remaining = total - current;
  const estMinutes = remaining * 2; // ~2 min per question

  return (
    <div className="iv-progress">
      <div className="iv-progress-header">
        <span className="iv-progress-label">Mock Interview: {role}</span>
        <span className="iv-progress-count">Question {current} / {total}</span>
      </div>
      <div className="iv-progress-track">
        <div className="iv-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="iv-progress-footer">
        <span className="iv-progress-remaining">
          <Clock size={11} /> ~{estMinutes} min remaining
        </span>
        {current >= total && <span className="iv-progress-done">Interview Complete</span>}
      </div>
    </div>
  );
}

export default memo(InterviewProgress);
