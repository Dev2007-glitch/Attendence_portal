import React, { useState, useEffect } from "react";
import {
  getTimetableForSection,
  getSectionRoom,
  getSectionClassTeacher,
  getSectionSubjects,
  PERIOD_TIME_SLOTS,
  ALL_SECTION_TIMETABLES
} from "../data/timetable";

export default function TimetableModal({
  isOpen,
  onClose,
  currentDate,
  currentPeriod,
  selectedSection = 1,
  onSelectSlot
}) {
  const [activeSection, setActiveSection] = useState(selectedSection || 1);

  useEffect(() => {
    if (selectedSection) {
      setActiveSection(selectedSection);
    }
  }, [selectedSection]);

  if (!isOpen) return null;

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const activeDay = currentDate ? daysFull[new Date(currentDate).getDay()] : null;

  const sectionData = getTimetableForSection(activeSection);
  const timetableMatrix = sectionData?.timetable || {};
  const roomName = getSectionRoom(activeSection);
  const classTeacher = getSectionClassTeacher(activeSection);
  const sectionSubjects = getSectionSubjects(activeSection);

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
        style={{ maxWidth: "1150px", width: "96vw" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timetableModalTitle"
      >
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div className="modal-title-group" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="modal-icon" style={{ fontSize: "1.8rem" }}>📅</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h3 className="modal-title" id="timetableModalTitle" style={{ margin: 0 }}>
                  Section {activeSection} Timetable [{roomName}]
                </h3>
                <span className="badge-tag-safe" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>
                  Class Teacher: {classTeacher.name} {classTeacher.phone ? `(${classTeacher.phone})` : ""}
                </span>
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Official VFSTR CSE 3rd Year (I Semester) Daily Schedule & Attendance Hours (8 Periods)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Section Switcher dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="modalSecSelect" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Switch Section:
              </label>
              <select
                id="modalSecSelect"
                className="form-control"
                style={{ padding: "4px 10px", fontSize: "0.85rem", width: "auto", fontWeight: 600 }}
                value={activeSection}
                onChange={(e) => setActiveSection(Number(e.target.value))}
              >
                {Array.from({ length: 22 }, (_, i) => i + 1).map((secNum) => {
                  const r = getSectionRoom(secNum);
                  return (
                    <option key={secNum} value={secNum}>
                      Section {secNum} ({r})
                    </option>
                  );
                })}
              </select>
            </div>

            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ overflowX: "auto", padding: "1.2rem" }}>
          <div className="timetable-table-wrapper">
            <table className="timetable-table">
              <thead>
                <tr>
                  <th style={{ width: "110px", textAlign: "center" }}>Day</th>
                  {PERIOD_TIME_SLOTS.map((p) => (
                    <th key={p.period} className={isPeriodActive(p.period) ? "th-active-period" : ""}>
                      <div className="tt-period-head" style={{ fontWeight: 700 }}>Period {p.period}</div>
                      <div className="tt-time-head" style={{ fontSize: "0.73rem", opacity: 0.85 }}>{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map((day) => {
                  const isToday = activeDay === day;
                  const daySlots = timetableMatrix[day] || {};

                  return (
                    <tr key={day} className={isToday ? "tr-today" : ""}>
                      <td className="tt-day-label" style={{ textAlign: "center" }}>
                        <strong>{day}</strong>
                        {isToday && <span className="tt-today-pill" style={{ display: "block", marginTop: "2px" }}>Today</span>}
                      </td>
                      {PERIOD_TIME_SLOTS.map((p) => {
                        const slot = daySlots[p.period];
                        const isCurrentSlot = isToday && isPeriodActive(p.period);

                        if (!slot) {
                          return (
                            <td key={p.period} className="tt-slot-empty" style={{ textAlign: "center", color: "var(--text-muted)" }}>
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
                                  phone: slot.phone,
                                  room: slot.room || roomName,
                                  sectionNum: activeSection
                                });
                                onClose();
                              }
                            }}
                            title={`Click to set: ${slot.subject} with ${slot.faculty} (${slot.phone || "No phone"})`}
                            style={{ cursor: onSelectSlot ? "pointer" : "default" }}
                          >
                            <div className="tt-slot-subject" style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                              {slot.subject}
                            </div>
                            <div className="tt-slot-meta" style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                              <span className="tt-slot-room" style={{ fontSize: "0.72rem", opacity: 0.8 }}>
                                {slot.room || roomName}
                              </span>
                              <span className="tt-slot-faculty" style={{ fontSize: "0.72rem", color: "var(--primary-color, #2563eb)" }}>
                                {slot.faculty}
                              </span>
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

          {/* Subject & Faculty Legend for Current Section */}
          <div style={{ marginTop: "18px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                📚 Subject Incharges & Faculty Contacts — Section {activeSection} [{roomName}]:
              </h4>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Class Teacher: <strong>{classTeacher.name}</strong> {classTeacher.phone ? `(${classTeacher.phone})` : ""}
              </span>
            </div>
            <div className="timetable-faculty-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
              {sectionSubjects.map((s) => (
                <div key={s.id} className="tt-faculty-chip" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "6px", background: "var(--bg-card, rgba(0,0,0,0.03))", border: "1px solid var(--border-color, #e2e8f0)" }}>
                  <span className="tt-chip-dot" style={{ backgroundColor: s.color || "#3b82f6", width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    <span className="tt-chip-subject" style={{ fontSize: "0.8rem", fontWeight: 600, display: "block" }}>
                      {s.id}: {s.name}
                    </span>
                    <span className="tt-chip-phone" style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      {s.facultyName} {s.phone ? `• ${s.phone}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Tip: Click on any period slot to apply that subject, faculty, and room to your active attendance session.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
