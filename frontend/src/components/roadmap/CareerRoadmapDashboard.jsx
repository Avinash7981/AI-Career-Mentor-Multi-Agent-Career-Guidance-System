import { memo, useState } from "react";
import { Check, Copy, Download, Search, BookOpen, Code, Clock } from "lucide-react";
import MarkdownRenderer from "../MarkdownRenderer";

function TimelineCard({ entry, index }) {
  return (
    <div className="rm-timeline-card" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="rm-timeline-dot" />
      <div className="rm-timeline-content">
        <h4 className="rm-timeline-period">{entry.period}</h4>
        <ul className="rm-timeline-items">
          {entry.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}

function SkillCard({ skill }) {
  const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
  const color = priorityColors[skill.priority] || "#f59e0b";
  return (
    <div className="rm-skill-card">
      <span className="rm-skill-name">{skill.name}</span>
      <div className="rm-skill-meta">
        <span className="rm-skill-priority" style={{ color }}>{skill.priority}</span>
        {skill.hours && <span className="rm-skill-hours"><Clock size={10} /> {skill.hours}h</span>}
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const diffColors = { beginner: "#22c55e", intermediate: "#f59e0b", advanced: "#ef4444" };
  return (
    <div className="rm-project-card">
      <Code size={14} className="rm-project-icon" />
      <div className="rm-project-info">
        <span className="rm-project-name">{project.name}</span>
        <span className="rm-project-diff" style={{ color: diffColors[project.difficulty] }}>{project.difficulty}</span>
      </div>
    </div>
  );
}

function MilestoneBar({ milestone }) {
  return (
    <div className="rm-milestone">
      <div className="rm-milestone-header">
        <span className="rm-milestone-text">{milestone.text}</span>
        <span className="rm-milestone-pct">{milestone.progress}%</span>
      </div>
      <div className="rd-progress-track">
        <div className="rd-progress-fill" style={{ width: `${milestone.progress}%`, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
      </div>
    </div>
  );
}

function CareerRoadmapDashboard({ data }) {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([data.raw], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "career-roadmap.md"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="resume-dashboard rm-dashboard">
      {/* Timeline */}
      {data.timeline.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Roadmap Timeline</h3>
          <div className="rm-timeline">
            {data.timeline.map((entry, i) => <TimelineCard key={i} entry={entry} index={i} />)}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Skills to Learn</h3>
          <div className="rm-skills-grid">
            {data.skills.map((s, i) => <SkillCard key={i} skill={s} />)}
          </div>
        </div>
      )}

      {/* Courses */}
      {data.courses.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Recommended Resources</h3>
          <div className="ats-search-wrap">
            <Search size={13} />
            <input type="text" placeholder="Search resources..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="ats-search-input" />
          </div>
          <div className="rm-courses">
            {data.courses.filter(c => c.full.toLowerCase().includes(search.toLowerCase())).map((c, i) => (
              <div key={i} className="rm-course-card">
                <BookOpen size={13} />
                <span className="rm-course-name">{c.full}</span>
                <span className={`rm-course-type rm-course-${c.type}`}>{c.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Practice Projects</h3>
          <div className="rm-projects-grid">
            {data.projects.map((p, i) => <ProjectCard key={i} project={p} />)}
          </div>
        </div>
      )}

      {/* Milestones */}
      {data.milestones.length > 0 && (
        <div className="rd-section">
          <h3 className="rd-section-title">Milestones</h3>
          <div className="rm-milestones">
            {data.milestones.map((m, i) => <MilestoneBar key={i} milestone={m} />)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rd-section rd-actions">
        <button className="rd-action-btn" onClick={handleCopy}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Roadmap</>}
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

export default memo(CareerRoadmapDashboard);
