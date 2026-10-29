import React, { useState, useMemo } from "react";
import {
  Users,
  Award,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Download,
  Plus,
  Trash2,
  Edit2,
  Search,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  DoorClosed,
  UserCheck,
  ArrowRight
} from "lucide-react";
import { SECTION_1_FACULTIES, SECTION_1_SUBJECTS } from "../../data/timetable";
import { SECTIONS, COUNSELLORS } from "../../../data.js";

export default function AdminDashboard({
  currentUser,
  students = [],
  sessions = [],
  facultyContacts = [],
  onSaveStudent,
  onDeleteStudent,
  onDeleteSession,
  onShowToast,
  onSwitchToSection
}) {
  const [activeTab, setActiveTab] = useState("sections"); // "sections" | "defaulters" | "students" | "faculty" | "sessions"
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("ALL");
  const [selectedCounsellorFilter, setSelectedCounsellorFilter] = useState("ALL");
  const [searchStudent, setSearchStudent] = useState("");
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [newRoll, setNewRoll] = useState("");
  const [newName, setNewName] = useState("");
  const [newSection, setNewSection] = useState("Section 1");
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);

  // Compute student-by-student attendance stats
  const studentStats = useMemo(() => {
    const totalSessions = sessions.length;
    return students.map((student) => {
      let attended = 0;
      let missed = 0;

      if (totalSessions > 0) {
        sessions.forEach((s) => {
          const status = s.attendance?.[student.roll];
          if (status === "present") attended++;
          else if (status === "absent") missed++;
        });
      } else {
        // Mock baseline if no sessions
        attended = 10;
        missed = 2;
      }

      const total = attended + missed > 0 ? attended + missed : 1;
      const pct = Number(((attended / total) * 100).toFixed(1));

      return {
        ...student,
        attended,
        missed,
        total,
        pct,
        isDefaulter: pct < attendanceThreshold
      };
    });
  }, [students, sessions, attendanceThreshold]);

  // Defaulters list (< threshold) filtered by section and counsellor
  const defaulters = useMemo(() => {
    return studentStats
      .filter((s) => {
        if (s.pct >= attendanceThreshold) return false;
        if (selectedSectionFilter !== "ALL") {
          const secNum = parseInt(String(selectedSectionFilter).replace(/\D/g, ""), 10);
          if (s.sectionNum !== secNum && s.section !== selectedSectionFilter) return false;
        }
        if (selectedCounsellorFilter !== "ALL") {
          if (!s.counsellor || !s.counsellor.toLowerCase().includes(selectedCounsellorFilter.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => a.pct - b.pct);
  }, [studentStats, attendanceThreshold, selectedSectionFilter, selectedCounsellorFilter]);

  // Overall batch statistics
  const overallStats = useMemo(() => {
    const totalStudents = students.length;
    const totalSessions = sessions.length;

    let totalAttendanceSum = 0;
    studentStats.forEach((s) => {
      totalAttendanceSum += s.pct;
    });

    const avgAttendance =
      totalStudents > 0 ? (totalAttendanceSum / totalStudents).toFixed(1) : "0.0";

    const above85 = studentStats.filter((s) => s.pct >= 85).length;
    const between75and84 = studentStats.filter((s) => s.pct >= 75 && s.pct < 85).length;
    const between65and74 = studentStats.filter((s) => s.pct >= 65 && s.pct < 75).length;
    const below65 = studentStats.filter((s) => s.pct < 65).length;

    return {
      totalStudents,
      totalSessions,
      avgAttendance,
      defaulterCount: defaulters.length,
      above85,
      between75and84,
      between65and74,
      below65
    };
  }, [students, sessions, studentStats, defaulters]);

  // Filtered student roster for management tab
  const filteredRoster = useMemo(() => {
    return studentStats.filter((s) => {
      if (selectedSectionFilter !== "ALL") {
        const secNum = parseInt(String(selectedSectionFilter).replace(/\D/g, ""), 10);
        if (s.sectionNum !== secNum && s.section !== selectedSectionFilter) return false;
      }
      if (selectedCounsellorFilter !== "ALL") {
        if (!s.counsellor || !s.counsellor.toLowerCase().includes(selectedCounsellorFilter.toLowerCase())) return false;
      }
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase().trim();
        const matchesRoll = s.roll.toLowerCase().includes(q);
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCounsellor = s.counsellor && s.counsellor.toLowerCase().includes(q);
        if (!matchesRoll && !matchesName && !matchesCounsellor) return false;
      }
      return true;
    });
  }, [studentStats, selectedSectionFilter, selectedCounsellorFilter, searchStudent]);

  // Export Defaulters to CSV
  const handleExportDefaultersCSV = () => {
    const headers = ["Roll Number", "Student Name", "Section", "Attended", "Total Classes", "Attendance %", "Deficit to 75%"];
    const rows = defaulters.map((d) => [
      d.roll,
      d.name,
      d.section,
      d.attended,
      d.total,
      `${d.pct}%`,
      `${Math.max(0, (75 - d.pct).toFixed(1))}%`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CSE_Sec1_Attendance_Defaulters_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast("Defaulters CSV exported successfully!", "success");
  };

  // Export All Sessions to CSV
  const handleExportSessionsCSV = () => {
    const headers = ["Session ID", "Date", "Period", "Subject", "Section", "Faculty", "Total", "Present", "Absent", "Attendance %"];
    const rows = sessions.map((s) => [
      s.id,
      s.date,
      s.period,
      `"${s.subject}"`,
      s.section,
      `"${s.facultyName || "Faculty"}"`,
      s.total,
      s.presentCount,
      s.absentCount,
      `${s.percentage}%`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CSE_Sec1_All_Sessions_Audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast("Sessions Audit report downloaded!", "success");
  };

  // Send WhatsApp Defaulter Warning Message
  const handleSendDefaulterWhatsApp = (student) => {
    const text = encodeURIComponent(
      `*ATTENDANCE WARNING NOTICE - VFSTR CSE*\n\n` +
      `Dear ${student.name} (${student.roll}),\n` +
      `Your current attendance in B.Tech CSE (III Year Sec 1) is *${student.pct}%*, which is below the university mandatory minimum of ${attendanceThreshold}%.\n\n` +
      `Classes Attended: ${student.attended}/${student.total}\n` +
      `Kindly meet your Class Teacher (Dr. P. Siva Prasad) or HOD immediately to avoid exam debarment.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Handle adding new student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newRoll.trim() || !newName.trim()) return;

    const studentObj = {
      id: newRoll.trim().toUpperCase(),
      roll: newRoll.trim().toUpperCase(),
      name: newName.trim().toUpperCase(),
      section: newSection.trim()
    };

    if (onSaveStudent) {
      await onSaveStudent(studentObj);
    }

    setNewRoll("");
    setNewName("");
    setStudentModalOpen(false);
    if (onShowToast) onShowToast(`Student ${studentObj.roll} added to roster!`, "success");
  };

  return (
    <div className="admin-dashboard-container">
      {/* Admin Top Header Banner */}
      <div className="admin-header-banner">
        <div className="admin-banner-left">
          <div className="admin-badge-icon">
            <ShieldCheck size={28} />
          </div>
          <div className="admin-banner-titles">
            <h2>Department Administration & Audit Dashboard</h2>
            <p>
              VFSTR &bull; B.Tech CSE (III Year - All 22 Sections) &bull; Academic Year 2026-2027
            </p>
          </div>
        </div>

        <div className="admin-banner-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportDefaultersCSV}
            title="Download Defaulters CSV"
          >
            <Download size={14} />
            <span>Export Defaulters</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setStudentModalOpen(true)}
            id="adminAddStudentBtn"
          >
            <Plus size={14} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Global Institutional KPIs */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-blue">
            <Users size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Total Enrolled</span>
            <span className="kpi-value">{overallStats.totalStudents}</span>
            <span className="kpi-sub">Students in All 22 Sections</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-purple">
            <Calendar size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Recorded Sessions</span>
            <span className="kpi-value">{overallStats.totalSessions}</span>
            <span className="kpi-sub">Class periods logged</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-emerald">
            <TrendingUp size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Batch Average</span>
            <span className="kpi-value">{overallStats.avgAttendance}%</span>
            <span className="kpi-sub">Overall batch compliance</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-rose">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Defaulters (&lt; {attendanceThreshold}%)</span>
            <span className="kpi-value text-danger">{overallStats.defaulterCount}</span>
            <span className="kpi-sub">Students at exam risk</span>
          </div>
        </div>
      </div>

      {/* Attendance Distribution Overview Bar */}
      <div className="distribution-card">
        <div className="distribution-header">
          <h4>Batch Attendance Distribution Index</h4>
          <div className="threshold-selector">
            <label htmlFor="thresholdSelect">Mandatory Threshold:</label>
            <select
              id="thresholdSelect"
              value={attendanceThreshold}
              onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
            >
              <option value={75}>75% (Standard University)</option>
              <option value={80}>80% (Strict Compliance)</option>
              <option value={65}>65% (Condonation Lower Bound)</option>
            </select>
          </div>
        </div>

        <div className="distribution-bar-track">
          <div
            className="dist-segment seg-safe"
            style={{ width: `${(overallStats.above85 / (overallStats.totalStudents || 1)) * 100}%` }}
            title={`Above 85%: ${overallStats.above85} students`}
          >
            {overallStats.above85 > 0 ? `≥85% (${overallStats.above85})` : ""}
          </div>
          <div
            className="dist-segment seg-good"
            style={{ width: `${(overallStats.between75and84 / (overallStats.totalStudents || 1)) * 100}%` }}
            title={`75% - 84%: ${overallStats.between75and84} students`}
          >
            {overallStats.between75and84 > 0 ? `75-84% (${overallStats.between75and84})` : ""}
          </div>
          <div
            className="dist-segment seg-warning"
            style={{ width: `${(overallStats.between65and74 / (overallStats.totalStudents || 1)) * 100}%` }}
            title={`65% - 74%: ${overallStats.between65and74} students`}
          >
            {overallStats.between65and74 > 0 ? `65-74% (${overallStats.between65and74})` : ""}
          </div>
          <div
            className="dist-segment seg-danger"
            style={{ width: `${(overallStats.below65 / (overallStats.totalStudents || 1)) * 100}%` }}
            title={`< 65%: ${overallStats.below65} students`}
          >
            {overallStats.below65 > 0 ? `<65% (${overallStats.below65})` : ""}
          </div>
        </div>
      </div>

      {/* Interactive Tabs Navigation */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "sections" ? "active" : ""}`}
          onClick={() => setActiveTab("sections")}
          id="adminTabSections"
        >
          <Layers size={16} />
          <span>Sections Overview (22)</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "defaulters" ? "active" : ""}`}
          onClick={() => setActiveTab("defaulters")}
          id="adminTabDefaulters"
        >
          <AlertTriangle size={16} />
          <span>Defaulters List ({defaulters.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
          id="adminTabStudents"
        >
          <Users size={16} />
          <span>Student Roster ({filteredRoster.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "faculty" ? "active" : ""}`}
          onClick={() => setActiveTab("faculty")}
          id="adminTabFaculty"
        >
          <Award size={16} />
          <span>Counsellors & Faculty ({COUNSELLORS ? COUNSELLORS.length : 53})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
          id="adminTabSessions"
        >
          <Calendar size={16} />
          <span>Session Logs ({sessions.length})</span>
        </button>
      </div>

      {/* TAB 0: 22 Sections Bird's Eye Overview */}
      {activeTab === "sections" && (
        <div className="admin-tab-content">
          <div className="tab-table-header">
            <div>
              <h3>All 22 CSE Academic Sections (1,511 Students)</h3>
              <p className="tab-subtitle">
                Official VFSTR Vadlamudi &bull; B.Tech Computer Science & Engineering &bull; III Year - I Sem
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span className="badge-tag" style={{ background: "#ede9fe", color: "#6d28d9", fontWeight: 700 }}>
                22 Sections Active
              </span>
              <span className="badge-tag" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                {COUNSELLORS ? COUNSELLORS.length : 53} Mentors
              </span>
              <span className="badge-tag" style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>
                {overallStats.totalStudents} Enrolled
              </span>
            </div>
          </div>

          <div className="admin-sections-grid">
            {SECTIONS.map((sec) => (
              <div key={sec.sectionNum} className="admin-section-card">
                <div className="sec-card-header">
                  <div>
                    <h4 className="sec-card-title">{sec.section}</h4>
                    <span className="sec-card-room">
                      <DoorClosed size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                      {sec.room}
                    </span>
                  </div>
                  <span className="sec-card-badge">
                    <Users size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                    {sec.studentCount} Students
                  </span>
                </div>

                <div className="sec-card-body">
                  <div className="sec-teacher-row">
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Class In-Charge:</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b" }}>{sec.classTeacher}</span>
                  </div>

                  <div className="sec-counsellors-list">
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                      Designated Counsellors ({sec.counsellors.length}):
                    </span>
                    <div className="sec-c-pills">
                      {sec.counsellors.map((c, idx) => (
                        <span key={idx} className="sec-c-pill">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sec-card-footer">
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "monospace" }}>
                    {sec.firstRoll.slice(-4)} &rarr; {sec.lastRoll.slice(-4)}
                  </span>
                  <button
                    type="button"
                    className="sec-open-btn"
                    onClick={() => onSwitchToSection && onSwitchToSection(sec.sectionNum)}
                    title={`Open ${sec.section} to mark attendance`}
                  >
                    <span>Mark Attendance</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: Defaulters List */}
      {activeTab === "defaulters" && (
        <div className="admin-tab-content">
          <div className="tab-table-header">
            <div>
              <h3>Attendance Shortage Defaulters (&lt; {attendanceThreshold}%)</h3>
              <p className="tab-subtitle">
                Students below {attendanceThreshold}% face semester exam debarment without valid condonation.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportDefaultersCSV}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Section & Counsellor Filter Toolbar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              marginBottom: "16px",
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={14} style={{ color: "#64748b" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Section:</span>
              <select
                style={{ padding: "4px 8px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
              >
                <option value="ALL">All 22 Sections</option>
                {SECTIONS.map((sec) => (
                  <option key={sec.sectionNum} value={sec.sectionNum}>
                    {sec.section} ({sec.studentCount} stu)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <UserCheck size={14} style={{ color: "#64748b" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Counsellor:</span>
              <select
                style={{
                  padding: "4px 8px",
                  fontSize: "0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  maxWidth: "240px"
                }}
                value={selectedCounsellorFilter}
                onChange={(e) => setSelectedCounsellorFilter(e.target.value)}
              >
                <option value="ALL">All 53 Counsellors</option>
                {COUNSELLORS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.studentCount} stu)
                  </option>
                ))}
              </select>
            </div>

            {(selectedSectionFilter !== "ALL" || selectedCounsellorFilter !== "ALL") && (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                onClick={() => {
                  setSelectedSectionFilter("ALL");
                  setSelectedCounsellorFilter("ALL");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {defaulters.length === 0 ? (
            <div className="admin-empty-state">
              <CheckCircle2 size={36} className="text-success" />
              <h4>Outstanding Performance!</h4>
              <p>No students match the defaulter criteria under the current filters.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Section</th>
                    <th>Counsellor</th>
                    <th>Attended / Total</th>
                    <th>Attendance %</th>
                    <th>Deficit</th>
                    <th>Urgent Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {defaulters.map((stu) => (
                    <tr key={stu.roll} className="defaulter-row">
                      <td className="font-mono font-bold text-primary">{stu.roll}</td>
                      <td className="font-semibold">{stu.name}</td>
                      <td>{stu.section || `Sec ${stu.sectionNum}`}</td>
                      <td style={{ fontSize: "0.82rem", color: "#64748b" }}>{stu.counsellor || "—"}</td>
                      <td>
                        <strong>{stu.attended}</strong> / {stu.total}
                      </td>
                      <td>
                        <span className="badge-danger font-bold">{stu.pct}%</span>
                      </td>
                      <td className="text-danger font-mono font-semibold">
                        -{Math.max(0, (attendanceThreshold - stu.pct).toFixed(1))}%
                      </td>
                      <td>
                        <button
                          type="button"
                          className="whatsapp-alert-btn"
                          onClick={() => handleSendDefaulterWhatsApp(stu)}
                          title="Send official warning notice via WhatsApp"
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp Alert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Student Roster Management */}
      {activeTab === "students" && (
        <div className="admin-tab-content">
          <div className="tab-table-header">
            <div className="search-with-button">
              <div className="search-box-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search 1,511 students by roll, name, or counsellor..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setStudentModalOpen(true)}
            >
              <Plus size={14} />
              <span>Add Student</span>
            </button>
          </div>

          {/* Section & Counsellor Filter Toolbar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              marginBottom: "16px",
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={14} style={{ color: "#64748b" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Section:</span>
              <select
                style={{ padding: "4px 8px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
              >
                <option value="ALL">All 22 Sections</option>
                {SECTIONS.map((sec) => (
                  <option key={sec.sectionNum} value={sec.sectionNum}>
                    {sec.section} ({sec.studentCount} stu)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <UserCheck size={14} style={{ color: "#64748b" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Counsellor:</span>
              <select
                style={{
                  padding: "4px 8px",
                  fontSize: "0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  maxWidth: "240px"
                }}
                value={selectedCounsellorFilter}
                onChange={(e) => setSelectedCounsellorFilter(e.target.value)}
              >
                <option value="ALL">All 53 Counsellors</option>
                {COUNSELLORS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.studentCount} stu)
                  </option>
                ))}
              </select>
            </div>

            <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "auto" }}>
              Showing <strong>{filteredRoster.length}</strong> of {students.length} students
            </span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Section</th>
                  <th>Counsellor</th>
                  <th>Classes Attended</th>
                  <th>Attendance %</th>
                  <th>Standing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((stu) => (
                  <tr key={stu.roll}>
                    <td className="font-mono font-bold">{stu.roll}</td>
                    <td>{stu.name}</td>
                    <td>{stu.section || `Sec ${stu.sectionNum}`}</td>
                    <td style={{ fontSize: "0.82rem", color: "#64748b" }}>{stu.counsellor || "—"}</td>
                    <td>
                      {stu.attended} / {stu.total}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          stu.pct >= 75 ? "status-safe" : stu.pct >= 65 ? "status-warning" : "status-danger"
                        }`}
                      >
                        {stu.pct}%
                      </span>
                    </td>
                    <td>
                      {stu.pct >= 75 ? (
                        <span className="text-success font-semibold">Eligible</span>
                      ) : (
                        <span className="text-danger font-semibold">Shortage</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-icon-btn"
                        onClick={() => {
                          if (confirm(`Remove student ${stu.roll} - ${stu.name} from the portal?`)) {
                            onDeleteStudent && onDeleteStudent(stu.roll);
                          }
                        }}
                        title="Remove student from roster"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Faculty & Counsellors Directory (53 Mentors) */}
      {activeTab === "faculty" && (
        <div className="admin-tab-content">
          <div className="tab-table-header">
            <div>
              <h3>Official Designated Counsellors & Mentors (53 Faculty)</h3>
              <p className="tab-subtitle">
                Official mentor allocations for all 22 Sections of B.Tech CSE III Year (VFSTR Vadlamudi).
              </p>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Counsellor / Mentor Name</th>
                  <th>Role</th>
                  <th>Assigned Sections</th>
                  <th>Counselees Strength</th>
                  <th>Contact Direct</th>
                </tr>
              </thead>
              <tbody>
                {COUNSELLORS.map((c, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-primary">{c.name}</td>
                    <td>Faculty Mentor & Counsellor</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {c.sections.map((secNum) => (
                          <span key={secNum} className="sec-c-pill">
                            Section {secNum}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong>{c.studentCount}</strong> Students
                    </td>
                    <td>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `*VFSTR CSE ATTENDANCE PORTAL*\nDear ${c.name},\nRegarding attendance and mentorship for your assigned counselees.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-alert-btn"
                      >
                        <MessageSquare size={13} />
                        <span>Chat WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Session Logs */}
      {activeTab === "sessions" && (
        <div className="admin-tab-content">
          <div className="tab-table-header">
            <div>
              <h3>Master Session Audit Log</h3>
              <p className="tab-subtitle">
                Every attendance session submitted to the backend database.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportSessionsCSV}
            >
              <Download size={14} />
              <span>Export Sessions CSV</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="admin-empty-state">
              <Calendar size={36} className="text-muted" />
              <h4>No Sessions Logged Yet</h4>
              <p>When faculty members submit attendance, session logs will be audited here.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Period</th>
                    <th>Subject</th>
                    <th>Faculty Submitter</th>
                    <th>Present / Total</th>
                    <th>Attendance %</th>
                    <th>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess) => (
                    <tr key={sess.id}>
                      <td className="font-mono">{sess.date}</td>
                      <td>
                        <span className="badge-tag">{sess.period}</span>
                      </td>
                      <td className="font-semibold">{sess.subject}</td>
                      <td>{sess.facultyName || "Faculty Member"}</td>
                      <td>
                        <strong className="text-success">{sess.presentCount}</strong> / {sess.total}
                      </td>
                      <td>
                        <span className="font-mono font-bold text-primary">{sess.percentage}%</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-icon-btn"
                          onClick={() => {
                            if (confirm(`Delete session ${sess.id} (${sess.subject} on ${sess.date})?`)) {
                              onDeleteSession && onDeleteSession(sess.id);
                            }
                          }}
                          title="Delete session record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Student Modal */}
      {studentModalOpen && (
        <div className="modal-backdrop">
          <div className="od-modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Users size={20} className="text-primary" />
                <h3>Add New Student to Roster</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setStudentModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="od-form">
              <div className="form-group">
                <label className="form-label" htmlFor="newRollInput">
                  Roll Number (e.g., 241FA04999)
                </label>
                <input
                  id="newRollInput"
                  type="text"
                  className="form-input font-mono"
                  placeholder="241FA04..."
                  value={newRoll}
                  onChange={(e) => setNewRoll(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newNameInput">
                  Full Student Name
                </label>
                <input
                  id="newNameInput"
                  type="text"
                  className="form-input"
                  placeholder="STUDENT NAME"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newSectionInput">
                  Section
                </label>
                <input
                  id="newSectionInput"
                  type="text"
                  className="form-input"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStudentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={15} />
                  <span>Save Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
