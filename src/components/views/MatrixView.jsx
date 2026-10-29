import React from "react";

export default function MatrixView({ students, attendance, onToggleStudent }) {
  if (students.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">No students match your filter or search.</p>
        <p className="empty-sub">Try adjusting the filter buttons or search bar.</p>
      </div>
    );
  }

  return (
    <div className="matrix-grid">
      {students.map((student, index) => {
        const isAbsent = attendance[student.roll] === "absent";
        return (
          <div
            key={student.roll}
            className={`portal-item ${isAbsent ? "checked" : ""}`}
            onClick={() => onToggleStudent(student.roll)}
            title={`${index + 1}. ${student.name} (${student.roll}) - Click to toggle Absent/Present`}
            tabIndex={0}
            role="checkbox"
            aria-checked={isAbsent}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onToggleStudent(student.roll);
              }
            }}
          >
            <input
              type="checkbox"
              className="student-checkbox"
              checked={isAbsent}
              onChange={() => {}} // Handled by container click
              tabIndex={-1}
              aria-hidden="true"
            />
            <div className="portal-roll-details">
              <span className="portal-roll-text">{student.roll}</span>
              <span className="portal-name-text">{student.name}</span>
              {student.counsellor && (
                <span className="portal-counsellor-text" title={`Counsellor: ${student.counsellor}`}>
                  &bull; {student.counsellor}
                </span>
              )}
            </div>
            <span className="student-seq">#{student.slNo || index + 1}</span>
          </div>
        );
      })}
    </div>
  );
}
