import React, { useMemo } from "react";
import FacultyWhatsAppSelect from "./FacultyWhatsAppSelect";
import {
  getSectionSubjects,
  getTimetablePeriodsForDate,
  getMarkedPeriodsForDateAndSection,
  getNextUnmarkedPeriod
} from "../data/timetable";

export default function SessionBar({
  section,
  sections = [],
  onChangeSection,
  date,
  onChangeDate,
  period,
  onChangePeriod,
  subject,
  onChangeSubject,
  onOpenTimetable,
  facultyContacts,
  selectedFacultyId,
  onChangeFacultyId,
  customFacultyPhone,
  onChangeCustomFacultyPhone,
  onOpenManageFaculty,
  autoSendWhatsApp,
  onToggleAutoSendWhatsApp,
  autoSendEmail,
  onToggleAutoSendEmail,
  onSendEmailToAbsentees,
  onResetPeriodAttendance,
  counts = { total: 0, present: 0, absent: 0 },
  onMarkAll,
  onInvert,
  onClearAll,
  historySessions = []
}) {
  const secNum = typeof section === "number" ? section : parseInt(String(section || "1").replace(/\D/g, ""), 10) || 1;
  const periodOptions = getTimetablePeriodsForDate(date, secNum);
  const sectionSubjects = getSectionSubjects(secNum);

  const { markedSet } = useMemo(() => {
    return getMarkedPeriodsForDateAndSection(date, secNum, historySessions);
  }, [date, secNum, historySessions]);

  const nextUnmarked = useMemo(() => {
    return getNextUnmarkedPeriod(date, secNum, historySessions);
  }, [date, secNum, historySessions]);

  const isCurrentPeriodMarked = useMemo(() => {
    if (!period) return false;
    const pStr = String(period);
    const digits = pStr.match(/\d+/g) || [];
    return markedSet.has(pStr) || digits.some((d) => markedSet.has(d));
  }, [period, markedSet]);

  const markedCount = periodOptions.filter((p) => {
    return markedSet.has(p.value) || (p.startPeriod && markedSet.has(p.startPeriod));
  }).length;

  return (
    <section className="session-bar" aria-label="Session Information">
      {/* Real-time Total Strength, Presentees & Absentees Counters Banner */}
      <div
        className="session-attendance-live-stats"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          width: "100%",
          padding: "8px 14px",
          marginBottom: "10px",
          background: "#ffffff",
          border: "2px solid #000000",
          boxShadow: "3px 3px 0px #000000",
          fontSize: "0.85rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ color: "#000000", fontWeight: 700 }}>
            👥 Total Strength: <strong style={{ fontSize: "1.05rem", color: "#000000" }}>{counts?.total || 0}</strong>
          </span>
          <span style={{ color: "#166534", fontWeight: 700 }}>
            ✓ Presentees: <strong style={{ fontSize: "1.05rem", color: "#15803d" }}>{counts?.present || 0}</strong>
          </span>
          <span style={{ color: "#991b1b", fontWeight: 700 }}>
            ✕ Absentees: <strong style={{ fontSize: "1.05rem", color: "#dc2626" }}>{counts?.absent || 0}</strong>
          </span>
          <span style={{ color: "#52525b", fontWeight: 600, fontSize: "0.8rem" }}>
            (Rate: {counts?.total > 0 ? ((counts.present / counts.total) * 100).toFixed(1) : "0.0"}%)
          </span>
        </div>

        {/* Email Sending Option & Auto-send Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {counts?.absent > 0 && onSendEmailToAbsentees && (
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: "#000000",
                color: "#ffffff",
                border: "1px solid #000000",
                fontWeight: 700,
                padding: "4px 10px",
                fontSize: "0.78rem"
              }}
              onClick={onSendEmailToAbsentees}
              title="Open Google Gmail to dispatch absence notification to all absent students (vu.<roll>@gmail.com)"
            >
              📧 Send Email to Absentees ({counts.absent})
            </button>
          )}

          {typeof autoSendEmail === "boolean" && onToggleAutoSendEmail && (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#000000",
                userSelect: "none"
              }}
              title="Auto-send absence emails via Google Gmail upon clicking Submit Attendance"
            >
              <input
                type="checkbox"
                checked={autoSendEmail}
                onChange={(e) => onToggleAutoSendEmail(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span>Auto-send Email</span>
            </label>
          )}
        </div>
      </div>

      {/* Smart Daily Timetable Status Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          width: "100%",
          padding: "6px 14px",
          marginBottom: "8px",
          borderRadius: "6px",
          background: isCurrentPeriodMarked ? "#fef3c7" : "#f0fdf4",
          border: `1px solid ${isCurrentPeriodMarked ? "#fde68a" : "#bbf7d0"}`,
          fontSize: "0.8rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "#1e293b" }}>
            📅 Section {secNum} Timetable Status:
          </span>
          <span style={{ color: "#475569" }}>
            <strong>{markedCount}</strong> of <strong>{periodOptions.length}</strong> periods marked for {date}
          </span>
          {nextUnmarked && (
            <span
              style={{
                background: "#dbeafe",
                color: "#1e40af",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "0.75rem"
              }}
            >
              ➔ Up Next: Period {nextUnmarked}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isCurrentPeriodMarked ? (
            <span style={{ color: "#92400e", fontWeight: 700, fontSize: "0.76rem" }}>
              ⚠️ Period {period} has already been submitted (Viewing / Updating record)
            </span>
          ) : (
            <span style={{ color: "#15803d", fontWeight: 600, fontSize: "0.76rem" }}>
              🟢 Ready to mark Period {period}
            </span>
          )}
          {onOpenTimetable && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ padding: "2px 8px", fontSize: "0.75rem", height: "auto" }}
              onClick={onOpenTimetable}
            >
              View Full TT
            </button>
          )}
        </div>
      </div>

      <div className="session-inputs">
        {/* Section Control */}
        <div className="control-group">
          <label htmlFor="secSelectBar" className="control-label">SECTION :</label>
          <select
            id="secSelectBar"
            className="input-control font-bold"
            style={{ minWidth: 110, color: "var(--accent-primary)" }}
            value={typeof section === "number" ? section : parseInt(String(section).replace(/\D/g, "") || "1", 10)}
            onChange={(e) => onChangeSection && onChangeSection(Number(e.target.value))}
          >
            {sections.map((s) => (
              <option key={s.sectionNum} value={s.sectionNum}>
                {s.section}
              </option>
            ))}
          </select>
        </div>

        {/* Date Control */}
        <div className="control-group">
          <label htmlFor="dateInput" className="control-label">DATE :</label>
          <input
            type="date"
            id="dateInput"
            className="input-control"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
          />
        </div>

        {/* Period Selector - Shows all periods for the 24-hr daily schedule without hiding completed ones */}
        <div className="control-group">
          <label htmlFor="periodSelect" className="control-label">
            PERIOD :
            {isCurrentPeriodMarked ? (
              <span style={{ marginLeft: "4px", color: "#15803d", fontWeight: 700 }} title="Already submitted">
                ✓
              </span>
            ) : (
              <span style={{ marginLeft: "4px", color: "#2563eb", fontWeight: 700 }} title="Scheduled">
                ➔
              </span>
            )}
          </label>
          <select
            id="periodSelect"
            className="input-control period-select"
            value={period}
            onChange={(e) => onChangePeriod(e.target.value)}
            style={{
              fontWeight: 600,
              borderColor: isCurrentPeriodMarked ? "#10b981" : "#3b82f6"
            }}
          >
            {periodOptions.map((p) => {
              const isMarked =
                markedSet.has(p.value) ||
                (p.startPeriod && markedSet.has(p.startPeriod)) ||
                (p.endPeriod && markedSet.has(p.endPeriod));
              const isNext = !isMarked && p.value === nextUnmarked;

              let labelPrefix = "";
              if (isMarked) labelPrefix = "✓ ";
              else if (isNext) labelPrefix = "➔ ";

              let statusTag = "";
              if (isMarked) statusTag = " [Marked]";
              else if (isNext) statusTag = " [Next to Mark]";

              return (
                <option
                  key={p.value}
                  value={p.value}
                  title={p.subject ? `${p.value}: ${p.subject}${p.faculty ? ` (${p.faculty})` : ""}` : p.value}
                >
                  {labelPrefix}Period {p.value}{statusTag}{p.subject ? ` • ${p.subject}` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Subject Selector from Section Specific Timetable */}
        <div className="control-group">
          <label htmlFor="subjectSelect" className="control-label">SUBJECT :</label>
          <select
            id="subjectSelect"
            className="input-control subject-select"
            value={subject}
            onChange={(e) => onChangeSubject(e.target.value)}
          >
            {sectionSubjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Faculty WhatsApp Selector */}
        <FacultyWhatsAppSelect
          contacts={facultyContacts}
          selectedId={selectedFacultyId}
          onChangeFacultyId={onChangeFacultyId}
          customPhone={customFacultyPhone}
          onChangeCustomPhone={onChangeCustomFacultyPhone}
          onOpenManage={onOpenManageFaculty}
          autoSendWhatsApp={autoSendWhatsApp}
          onToggleAutoSend={onToggleAutoSendWhatsApp}
        />
      </div>

      {/* Quick Session Controls */}
      <div className="session-quick-stats">
        <button
          onClick={() => onMarkAll("present")}
          className="btn btn-sm btn-success"
          title="Mark all students as present (untick all)"
          id="markAllPresentBtn"
        >
          ✓ All Present
        </button>
        <button
          onClick={() => onMarkAll("absent")}
          className="btn btn-sm btn-danger"
          title="Mark all students as absent (tick all)"
          id="markAllAbsentBtn"
        >
          ✕ All Absent
        </button>
        <button
          onClick={onInvert}
          className="btn btn-sm btn-secondary"
          title="Invert selection"
          id="invertSelectionBtn"
        >
          ⇄ Invert
        </button>
        <button
          onClick={onClearAll}
          className="btn btn-sm btn-outline"
          title="Reset to Present"
          id="clearAllBtn"
        >
          Clear
        </button>
        {isCurrentPeriodMarked && onResetPeriodAttendance && (
          <button
            onClick={onResetPeriodAttendance}
            className="btn btn-sm btn-outline"
            style={{ borderColor: "#dc2626", color: "#dc2626", fontWeight: 700 }}
            title="Clear and re-mark attendance afresh for this period"
          >
            🔄 Re-mark Period
          </button>
        )}
      </div>
    </section>
  );
}
