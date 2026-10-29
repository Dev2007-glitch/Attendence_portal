import React from "react";

export default function CardGridView({ students, attendance, onToggleStudent }) {
  if (students.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">No students match your filter or search.</p>
        <p className="empty-sub">Try adjusting the filter buttons or search bar.</p>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {students.map((student) => {
        const isPresent = attendance[student.roll] === "present";
        const initials = student.name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join("");

        return (
          <div
            key={student.roll}
            className={`student-card ${isPresent ? "is-present" : "is-absent"}`}
            onClick={() => onToggleStudent(student.roll)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onToggleStudent(student.roll);
              }
            }}
          >
            <div className="card-top">
              <div className="card-avatar">{initials}</div>
              <div className="card-details">
                <span className="card-roll">{student.roll}</span>
                <span className="card-name">{student.name}</span>
                {student.counsellor && (
                  <span className="card-counsellor-badge" title={`Counsellor: ${student.counsellor}`}>
                    👤 {student.counsellor}
                  </span>
                )}
              </div>
            </div>
            <div className="card-footer">
              <span className={`status-badge ${isPresent ? "badge-present" : "badge-absent"}`}>
                {isPresent ? "✓ PRESENT" : "✕ ABSENT"}
              </span>
              <span className="card-action-hint">Click to toggle</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
