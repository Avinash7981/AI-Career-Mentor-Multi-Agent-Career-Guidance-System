import { FileText, X, CheckCircle } from "lucide-react";

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function FileAttachment({ file, onRemove, uploading, uploaded }) {
  return (
    <div className={`file-attachment ${uploaded ? "uploaded" : ""}`}>
      <div className="fa-icon">
        <FileText size={18} />
      </div>
      <div className="fa-info">
        <span className="fa-name">{file.name}</span>
        <span className="fa-size">{formatFileSize(file.size)}</span>
      </div>
      {uploading && <div className="fa-progress"><div className="fa-progress-bar" /></div>}
      {uploaded && <CheckCircle size={16} className="fa-success" />}
      {!uploading && !uploaded && onRemove && (
        <button className="fa-remove" onClick={onRemove} aria-label="Remove file">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
