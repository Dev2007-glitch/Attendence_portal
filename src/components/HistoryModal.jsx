import React from "react";

export default function HistoryModal({
  isOpen,
  onClose,
  sessions,
  onLoadSession,
  onDeleteSession
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📜</span>
            <h3 className="modal-title">Attendance History & Saved Sessions</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {sessions.length === 0 ? (
            <div className="empty-state" style={{ padding: "3rem 1rem" }}>
              <p className="empty-title">No saved attendance sessions found.</p>
              <p className="empty-sub">
                Submit attendance from the main portal to automatically record sessions.
              </p>
            </div>
          ) : (
            <div className="history-list">
              {sessions.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-card-header">
                    <div>
                      <span className="history-date">{item.date}</span>
                      <span className="history-period">Period {item.period}</span>
                      {item.isTutorial && <span className="badge-tutorial">Tutorial</span>}
                    </div>
                    <span
                      className={`history-percentage ${
                        parseFloat(item.percentage) >= 75 ? "text-success" : "text-danger"
                      }`}
                    >
                      {item.percentage}% Attendance
                    </span>
                  </div>

                  <div className="history-card-body">
                    <span className="history-stat">
                      <strong>Total:</strong> {item.total || 70}
                    </span>
                    <span className="history-stat text-success">
                      <strong>Present:</strong> {item.presentCount}
                    </span>
                    <span className="history-stat text-danger">
                      <strong>Absent:</strong> {item.absentCount}
                    </span>
                    <span className="history-meta text-muted">
                      {item.subject || "21CS204"} &bull; {item.section || "CSE - Sec 1"}
                    </span>
                  </div>

                  {item.absentRolls && item.absentRolls.length > 0 && (
                    <div className="history-absent-preview">
                      <span className="text-muted text-xs">Absent:</span>{" "}
                      {item.absentRolls.map((s) => s.roll || s).join(", ")}
                    </div>
                  )}

                  <div className="history-card-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onLoadSession(item)}
                      title="Restore this session into current attendance roster"
                    >
                      📂 Load into Portal
                    </button>
                    <button
                      className="btn btn-sm btn-danger-outline"
                      onClick={() => onDeleteSession(item.id)}
                      title="Delete this record"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span className="text-muted text-sm">
            Total recorded sessions: <strong>{sessions.length}</strong>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
