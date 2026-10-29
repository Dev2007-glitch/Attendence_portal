import React from "react";
import { sound } from "../utils/sound";

export default function Header({
  soundEnabled,
  onToggleSound,
  onOpenTimetable,
  onOpenHistory,
  historyCount,
  onSubmit,
  isSubmitted,
  studentCount,
  settings
}) {
  const institution = settings?.institution || "VFSTR :: Vadlamudi";
  const semester = settings?.semester || "III Year - 5th Semester";
  const section = settings?.section || "CSE - Section 1";

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo" aria-hidden="true">AP</div>
        <div className="brand-info">
          <h1>
            Attendance Portal
            <span className="brand-badge">{section}</span>
            <span className="brand-badge-tech" style={{ marginLeft: "8px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
              React + Vite + Backend
            </span>
          </h1>
          <p className="brand-subtitle">
            {institution} &bull; B.Tech CSE ({semester}, 1 Section) &bull; Roster ({studentCount})
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={onToggleSound}
          className="btn btn-secondary btn-sm"
          title="Toggle audio synthesizer feedback"
          id="soundToggleBtn"
        >
          {soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
        </button>

        <button
          onClick={onOpenHistory}
          className="btn btn-secondary btn-sm"
          title="View Saved Sessions"
          id="historyBtn"
        >
          📜 History {historyCount > 0 ? `(${historyCount})` : ""}
        </button>

        <button
          onClick={onSubmit}
          className="btn btn-primary btn-sm"
          title="Submit & Review Attendance"
          id="headerSubmitBtn"
        >
          {isSubmitted ? "🔄 Update Submission" : "🚀 Submit Attendance"}
        </button>
      </div>
    </header>
  );
}
