import React from "react";
import FacultyWhatsAppSelect from "./FacultyWhatsAppSelect";
import { SECTION_1_SUBJECTS, getTimetablePeriodsForDate } from "../data/timetable";

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
  onMarkAll,
  onInvert,
  onClearAll
}) {
  const periodOptions = getTimetablePeriodsForDate(date);

  return (
    <section className="session-bar" aria-label="Session Information">
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

        {/* Period Selector - Dynamically mapped directly from Section 1 Timetable */}
        <div className="control-group">
          <label htmlFor="periodSelect" className="control-label">PERIOD :</label>
          <select
            id="periodSelect"
            className="input-control period-select"
            value={period}
            onChange={(e) => onChangePeriod(e.target.value)}
          >
            {periodOptions.map((p) => (
              <option
                key={p.value}
                value={p.value}
                title={p.subject ? `${p.value}: ${p.subject}${p.faculty ? ` (${p.faculty})` : ""}` : p.value}
              >
                {p.label}
              </option>
            ))}
            {/* Retain current period if loaded from historical session or custom */}
            {!periodOptions.some((p) => p.value === period) && period && (
              <option value={period}>{period}</option>
            )}
          </select>
        </div>

        {/* Subject Selector from Section 1 Timetable */}
        <div className="control-group">
          <label htmlFor="subjectSelect" className="control-label">SUBJECT :</label>
          <select
            id="subjectSelect"
            className="input-control subject-select"
            value={subject}
            onChange={(e) => onChangeSubject(e.target.value)}
          >
            {SECTION_1_SUBJECTS.map((s) => (
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
          🔄 Invert
        </button>
        <button
          onClick={onClearAll}
          className="btn btn-sm btn-secondary"
          title="Reset to default (all present)"
          id="resetSnapshotBtn"
        >
          ↺ Reset
        </button>
      </div>
    </section>
  );
}
