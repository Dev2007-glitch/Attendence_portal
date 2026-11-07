import React, { useState } from "react";
import SectionSwitcher from "../common/SectionSwitcher";
import SessionBar from "../SessionBar";
import Toolbar from "../Toolbar";
import MatrixView from "../views/MatrixView";
import CardGridView from "../views/CardGridView";
import TableView from "../views/TableView";
import SubmissionSummary from "../SubmissionSummary";
import HistoryModal from "../HistoryModal";
import QuickKeyModal from "../QuickKeyModal";
import FacultyWhatsAppModal from "../FacultyWhatsAppModal";
import TimetableModal from "../TimetableModal";
import StudentLocationModal from "../location/StudentLocationModal";

export default function FacultyDashboard({
  currentUser,
  sections = [],
  section,
  onSelectSection,
  selectedCounsellor = "ALL",
  onSelectCounsellor,
  date,
  onChangeDate,
  period,
  onChangePeriod,
  subject,
  onChangeSubject,
  activeFaculty,
  facultyContacts,
  selectedFacultyId,
  onChangeFacultyId,
  customFacultyPhone,
  onChangeCustomFacultyPhone,
  autoSendWhatsApp,
  onToggleAutoSendWhatsApp,
  autoSendEmail,
  onToggleAutoSendEmail,
  onSendEmailToAbsentees,
  onResetPeriodAttendance,
  onProceedNextPeriod,
  nextPeriod,
  onOpenManageFaculty,
  onOpenTimetable,
  onMarkAll,
  onInvert,
  onClearAll,
  viewMode,
  onViewChange,
  filterMode,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
  onOpenQuickKey,
  filteredStudents,
  students,
  attendance,
  onToggleStudent,
  isSubmitted,
  onSubmitAttendance,
  summaryRef,
  showToast,
  stickyInput,
  setStickyInput,
  stickyInputRef,
  onStickyRollSubmit,
  showHistoryModal,
  setShowHistoryModal,
  historySessions,
  onLoadSession,
  onDeleteSession,
  showQuickKeyModal,
  setShowQuickKeyModal,
  onApplyAbsentKeys,
  showFacultyModal,
  setShowFacultyModal,
  onSaveFacultyContacts,
  showTimetableModal,
  setShowTimetableModal,
  onSelectTimetableSlot
}) {
  const [selectedStudentForLocation, setSelectedStudentForLocation] = useState(null);
  const [showStudentLocationModal, setShowStudentLocationModal] = useState(false);

  return (
    <div className="faculty-dashboard-wrapper">
      {/* Multi-Section Switcher Bar (22 Sections & Counsellors) */}
      <SectionSwitcher
        sections={sections}
        activeSection={section}
        onSelectSection={onSelectSection}
        selectedCounsellor={selectedCounsellor}
        onSelectCounsellor={onSelectCounsellor}
        totalStudentsInSection={students.length}
        currentUser={currentUser}
      />

      {/* Session Controls Bar */}
      <SessionBar
        section={section}
        sections={sections}
        onChangeSection={onSelectSection}
        date={date}
        onChangeDate={onChangeDate}
        period={period}
        onChangePeriod={onChangePeriod}
        subject={subject}
        onChangeSubject={onChangeSubject}
        onOpenTimetable={onOpenTimetable}
        facultyContacts={facultyContacts}
        selectedFacultyId={selectedFacultyId}
        onChangeFacultyId={onChangeFacultyId}
        customFacultyPhone={customFacultyPhone}
        onChangeCustomFacultyPhone={onChangeCustomFacultyPhone}
        onOpenManageFaculty={onOpenManageFaculty}
        autoSendWhatsApp={autoSendWhatsApp}
        onToggleAutoSendWhatsApp={onToggleAutoSendWhatsApp}
        autoSendEmail={autoSendEmail}
        onToggleAutoSendEmail={onToggleAutoSendEmail}
        onSendEmailToAbsentees={onSendEmailToAbsentees}
        onResetPeriodAttendance={onResetPeriodAttendance}
        counts={counts}
        onMarkAll={onMarkAll}
        onInvert={onInvert}
        onClearAll={onClearAll}
        historySessions={historySessions}
      />

      {/* Professional Monochromatic KPI Metric Cards Row */}
      <div className="faculty-kpi-grid" aria-label="Attendance Overview">
        <div className="faculty-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">TOTAL STRENGTH</span>
            <span className="kpi-badge">{section}</span>
          </div>
          <div className="kpi-main-val">
            <span className="kpi-number">{counts.total}</span>
            <span className="kpi-unit">Students</span>
          </div>
          <span className="kpi-subtext">Active Section Roster</span>
        </div>

        <div className="faculty-kpi-card kpi-card-present">
          <div className="kpi-card-top">
            <span className="kpi-label">PRESENTEES</span>
            <span className="kpi-pill kpi-pill-white">
              {counts.total > 0 ? ((counts.present / counts.total) * 100).toFixed(1) : 0}% Present
            </span>
          </div>
          <div className="kpi-main-val">
            <span className="kpi-number">{counts.present}</span>
            <span className="kpi-unit">Attending</span>
          </div>
          <span className="kpi-subtext">In Classroom / Lab</span>
        </div>

        <div className="faculty-kpi-card kpi-card-absent">
          <div className="kpi-card-top">
            <span className="kpi-label">ABSENTEES</span>
            <span className="kpi-pill kpi-pill-invert">
              {counts.absent} Absentees
            </span>
          </div>
          <div className="kpi-main-val">
            <span className="kpi-number">{counts.absent}</span>
            <span className="kpi-unit">Marked Absent</span>
          </div>
          <span className="kpi-subtext">VU Mail / WhatsApp Ready</span>
        </div>

        <div className="faculty-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">SESSION DETAILS</span>
            <span className="kpi-badge">Period {period}</span>
          </div>
          <div className="kpi-main-val">
            <span className="kpi-title-text">{subject || "Scheduled Class"}</span>
          </div>
          <span className="kpi-subtext">Faculty: {activeFaculty?.name || "Course Faculty"}</span>
        </div>
      </div>

      {/* Toolbar: Search, Filters, View Modes, Key-In */}
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filterMode={filterMode}
        onFilterChange={onFilterChange}
        viewMode={viewMode}
        onViewChange={onViewChange}
        counts={counts}
        onOpenQuickKey={onOpenQuickKey}
      />

      {/* Dynamic Student Search & Live GPS Tracker Strip (Attendance Role) */}
      {searchQuery && (
        <div
          className="search-student-location-bar"
          style={{
            background: "#ffffff",
            border: "2px solid #000000",
            padding: "10px 14px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>📍</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
              Authorized Section {section} Student Results: <strong>{filteredStudents.length} matches</strong>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {filteredStudents.slice(0, 3).map((stu) => (
              <button
                key={stu.roll}
                type="button"
                onClick={() => {
                  setSelectedStudentForLocation(stu);
                  setShowStudentLocationModal(true);
                }}
                style={{
                  background: "#000000",
                  color: "#ffffff",
                  border: "1px solid #000000",
                  padding: "4px 10px",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                title={`Track live location for ${stu.name}`}
              >
                <span>📍 Track {stu.name.split(" ")[0]} ({stu.roll})</span>
              </button>
            ))}
            {filteredStudents.length > 3 && (
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                +{filteredStudents.length - 3} more in roster below
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live VU Email Dispatch Status Banner */}
      <div className="vu-mail-dispatch-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "1rem" }}>📧</span>
          <span>
            <strong>Official Student Email Dispatch:</strong> Absence notices routed directly to student inboxes (<code>vu.&lt;roll&gt;@gmail.com</code>).
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {counts.absent > 0 && onSendEmailToAbsentees && (
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: "#000000",
                color: "#ffffff",
                border: "1px solid #000000",
                fontWeight: 700,
                padding: "2px 8px",
                fontSize: "0.75rem"
              }}
              onClick={onSendEmailToAbsentees}
              title="Open Google Gmail compose with all absent student emails"
            >
              📧 Send Email to {counts.absent} Absentees
            </button>
          )}
          <span className="vu-mail-dispatch-pill">
            All 1,511 Student Inboxes Synced
          </span>
        </div>
      </div>

      {/* University Matrix / Cards / Table Roster */}
      <main className="roster-view-container" id="studentViewContainer">
        {viewMode === "matrix" && (
          <MatrixView
            students={filteredStudents}
            attendance={attendance}
            onToggleStudent={onToggleStudent}
          />
        )}
        {viewMode === "cards" && (
          <CardGridView
            students={filteredStudents}
            attendance={attendance}
            onToggleStudent={onToggleStudent}
          />
        )}
        {viewMode === "table" && (
          <TableView
            students={filteredStudents}
            attendance={attendance}
            onToggleStudent={onToggleStudent}
          />
        )}
      </main>

      {/* Post-Submission Analytics & WhatsApp Export Summary */}
      {isSubmitted && (
        <SubmissionSummary
          summaryRef={summaryRef}
          date={date}
          period={period}
          subject={subject}
          section={section}
          facultyName={activeFaculty.name}
          facultyPhone={activeFaculty.phone}
          students={students}
          attendance={attendance}
          onToggleStudent={onToggleStudent}
          onShowToast={showToast}
          onProceedNextPeriod={onProceedNextPeriod}
          nextPeriod={nextPeriod}
        />
      )}

      {/* Sticky Bottom Bar for instant Mobile / Tablet submission */}
      <div className="sticky-action-bar">
        <div className="sticky-action-inner">
          <div className="sticky-info">
            <span>
              Total Strength: <strong style={{ color: "#ffffff" }}>{counts.total}</strong>
            </span>
            <span className="divider">|</span>
            <span>
              Presentees: <strong className="text-success">{counts.present}</strong>
            </span>
            <span className="divider">|</span>
            <span>
              Absentees: <strong className="text-danger">{counts.absent}</strong>
            </span>
            {counts.absent > 0 && onSendEmailToAbsentees && (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  marginLeft: "8px",
                  background: "#ffffff",
                  color: "#000000",
                  padding: "2px 8px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: "1px solid #ffffff",
                  borderRadius: "0px"
                }}
                onClick={onSendEmailToAbsentees}
                title="Send absence notice email to absentees"
              >
                📧 Email Absentees ({counts.absent})
              </button>
            )}
            {activeFaculty.phone && (
              <span className="sticky-target-faculty">
                &bull; WhatsApp: <strong>{activeFaculty.phone}</strong>
              </span>
            )}
          </div>

          {/* Quick Roll / Number Search Bar */}
          <form className="sticky-quick-input-form" onSubmit={onStickyRollSubmit}>
            <div className="sticky-input-wrapper">
              <span className="sticky-input-icon" aria-hidden="true">
                ⚡
              </span>
              <input
                ref={stickyInputRef}
                type="text"
                className="sticky-roll-input"
                placeholder="Enter roll or number (e.g. 35, 54, 4035) & press Enter to toggle tick..."
                value={stickyInput}
                onChange={(e) => setStickyInput(e.target.value)}
                aria-label="Enter student roll number or suffix to toggle attendance"
              />
              {stickyInput && (
                <button
                  type="button"
                  className="sticky-input-clear"
                  onClick={() => {
                    setStickyInput("");
                    if (stickyInputRef.current) stickyInputRef.current.focus();
                  }}
                  title="Clear input"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          <button
            className="btn btn-primary btn-sm"
            onClick={onSubmitAttendance}
            style={{ minWidth: "160px" }}
          >
            {isSubmitted ? "Update Submission" : "Submit Attendance"}
          </button>
        </div>
      </div>

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        sessions={historySessions}
        onLoadSession={onLoadSession}
        onDeleteSession={onDeleteSession}
      />

      {/* Quick Roll Key-In Modal */}
      <QuickKeyModal
        isOpen={showQuickKeyModal}
        onClose={() => setShowQuickKeyModal(false)}
        students={students}
        onApplyAbsentKeys={onApplyAbsentKeys}
      />

      {/* Faculty WhatsApp Contacts Manager Modal */}
      <FacultyWhatsAppModal
        isOpen={showFacultyModal}
        onClose={() => setShowFacultyModal(false)}
        contacts={facultyContacts}
        onSaveContacts={onSaveFacultyContacts}
        selectedId={selectedFacultyId}
        onSelectFaculty={onChangeFacultyId}
      />

      {/* Section Weekly Timetable Modal */}
      <TimetableModal
        isOpen={showTimetableModal}
        onClose={() => setShowTimetableModal(false)}
        currentDate={date}
        currentPeriod={period}
        selectedSection={section}
        onSelectSlot={onSelectTimetableSlot}
      />

      {/* Role-Based Student Live Location Modal */}
      <StudentLocationModal
        isOpen={showStudentLocationModal}
        onClose={() => setShowStudentLocationModal(false)}
        student={selectedStudentForLocation}
        currentUser={currentUser}
        section={section}
        onShowToast={showToast}
      />
    </div>
  );
}
