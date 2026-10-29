import React from "react";
import {
  SECTION_1_TIMETABLE,
  SECTION_1_SUBJECTS,
  PERIOD_TIME_SLOTS
} from "../data/timetable";

export default function TimetableModal({
  isOpen,
  onClose,
  currentDate,
  currentPeriod,
  onSelectSlot
}) {
  if (!isOpen) return null;

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const activeDay = currentDate ? daysFull[new Date(currentDate).getDay()] : null;

  const isPeriodActive = (pNum) => {
    if (!currentPeriod) return false;
    const str = String(currentPeriod);
    if (str.includes("-")) {
      const parts = str.split(/[^0-9]+/).filter(Boolean);
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      const target = parseInt(pNum, 10);
      return target >= start && target <= end;
    }
    const cleanNum = str.split(/[^0-9]/)[0];
    return String(pNum) === cleanNum;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog modal-xl"
        style={{ maxWidth: "1050px", width: "95vw" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timetableModalTitle"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📅</span>
            <div>
              <h3 className="modal-title" id="timetableModalTitle" style={{ margin: 0 }}>
                Section 1 Timetable [Room N-407]
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Official VFSTR CSE 3rd Year - 1st Semester Section 1 Timetable
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ overflowX: "auto", padding: "1rem" }}>
          <div className="timetable-table-wrapper">
            <table className="timetable-table">
              <thead>
                <tr>
                  <th style={{ width: "100px" }}>Day</th>
                  {PERIOD_TIME_SLOTS.map((p) => (
                    <th key={p.period} className={isPeriodActive(p.period) ? "th-active-period" : ""}>
                      <div className="tt-period-head">Period {p.period}</div>
                      <div className="tt-time-head">{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map((day) => {
                  const isToday = activeDay === day;
                  const daySlots = SECTION_1_TIMETABLE[day] || {};

                  return (
                    <tr key={day} className={isToday ? "tr-today" : ""}>
                      <td className="tt-day-label">
                        <strong>{day}</strong>
                        {isToday && <span className="tt-today-pill">Today</span>}
                      </td>
                      {PERIOD_TIME_SLOTS.map((p) => {
                        const slot = daySlots[p.period];
                        const isCurrentSlot = isToday && isPeriodActive(p.period);

                        if (!slot) {
                          return (
                            <td key={p.period} className="tt-slot-empty">
                              -
                            </td>
                          );
                        }

                        return (
                          <td
                            key={p.period}
                            className={`tt-slot ${isCurrentSlot ? "tt-slot-active" : ""}`}
                            onClick={() => {
                              if (onSelectSlot) {
                                onSelectSlot({
                                  day,
                                  period: p.period,
                                  subject: slot.subject,
                                  faculty: slot.faculty,
                                  phone: slot.phone
                                });
                                onClose();
                              }
                            }}
                            title={`Click to set: ${slot.subject} with ${slot.faculty} (${slot.phone})`}
                          >
                            <div className="tt-slot-subject">{slot.subject}</div>
                            <div className="tt-slot-meta">
                              <span className="tt-slot-room">{slot.room}</span>
                              <span className="tt-slot-faculty">{slot.faculty}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subject & Faculty Legend */}
          <div style={{ marginTop: "18px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              📚 Subject Incharges & Faculty Contacts (Section 1):
            </h4>
            <div className="timetable-faculty-grid">
              {SECTION_1_SUBJECTS.map((s) => (
                <div key={s.id} className="tt-faculty-chip">
                  <span className="tt-chip-dot" style={{ backgroundColor: s.color }} />
                  <span className="tt-chip-subject">
                    <strong>{s.id}:</strong> {s.name}
                  </span>
                  <span className="tt-chip-phone">
                    {s.facultyName} ({s.phone})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Tip: Click on any timetable slot to apply it to your current attendance session.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
