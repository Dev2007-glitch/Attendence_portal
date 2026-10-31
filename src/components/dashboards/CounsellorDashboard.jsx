import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Search,
  MessageSquare,
  Plus,
  Download,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  Trash2,
  DoorClosed,
  Phone,
  ShieldAlert
} from "lucide-react";
import { COUNSELLORS, getStudentsByCounsellor } from "../../../data.js";
import { computeStudentStats } from "../../utils/attendanceStats.js";

export default function CounsellorDashboard({
  currentUser,
  students = [],
  sessions = [],
  onShowToast,
  onSwitchToAttendance
}) {
  // Current active counsellor name (from currentUser or default)
  const initialCounsellorName = useMemo(() => {
    if (currentUser?.counsellorName) return currentUser.counsellorName;
    if (currentUser?.name && COUNSELLORS.some((c) => c.name.toLowerCase() === currentUser.name.toLowerCase())) {
      return currentUser.name;
    }
    return "Mr. Gujjula Murali";
  }, [currentUser]);

  const [activeCounsellorName, setActiveCounsellorName] = useState(initialCounsellorName);

  useEffect(() => {
    if (initialCounsellorName) {
      setActiveCounsellorName(initialCounsellorName);
    }
  }, [initialCounsellorName]);

  const [activeTab, setActiveTab] = useState("roster"); // "roster" | "logs"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "SAFE" | "DEFICIT"
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState(null);

  // Form state for adding counselling interaction note
  const [noteStudentRoll, setNoteStudentRoll] = useState("");
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [noteCategory, setNoteCategory] = useState("Attendance Shortage (<75%)");
  const [noteDiscussion, setNoteDiscussion] = useState("");
  const [noteActionPlan, setNoteActionPlan] = useState("");
  const [noteStatus, setNoteStatus] = useState("Follow-up Required");

  // Counselling interaction logs stored in localStorage
  const storageKey = `counselling_records_${activeCounsellorName.replace(/\s+/g, "_")}`;
  const [counsellingLogs, setCounsellingLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "log_demo_1",
        studentRoll: "241FA04035",
        studentName: "SRUJANA",
        date: "2026-10-24",
        category: "Attendance Shortage (<75%)",
        discussion: "Student had 3 consecutive absents due to viral fever. Advised to submit medical certificate to HOD.",
        actionPlan: "Will attend all lab sessions and makeup tutorial classes.",
        status: "Resolved"
      }
    ];
  });

  // Save logs to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(counsellingLogs));
    } catch (e) {}
  }, [counsellingLogs, storageKey]);

  // Current counsellor metadata
  const currentCounsellorMeta = useMemo(() => {
    return (
      COUNSELLORS.find(
        (c) => c.name.toLowerCase() === activeCounsellorName.toLowerCase()
      ) || COUNSELLORS[0]
    );
  }, [activeCounsellorName]);

  // Allotted counselees for this counsellor with live immediate attendance synchronization
  const counselees = useMemo(() => {
    const list = getStudentsByCounsellor(activeCounsellorName);
    return list.map((stu) => {
      const stats = computeStudentStats(stu, sessions);
      const hasNote = counsellingLogs.some((l) => l.studentRoll === stu.roll);

      return {
        ...stu,
        ...stats,
        hasNote
      };
    });
  }, [activeCounsellorName, sessions, counsellingLogs]);

  // KPI statistics for allotted counselees
  const stats = useMemo(() => {
    const total = counselees.length;
    const safeCount = counselees.filter((s) => s.pct >= 75).length;
    const defaulterCount = counselees.filter((s) => s.pct < 75).length;
    const sumPct = counselees.reduce((acc, curr) => acc + curr.pct, 0);
    const avgPct = total > 0 ? (sumPct / total).toFixed(1) : "0.0";

    return {
      total,
      safeCount,
      defaulterCount,
      avgPct
    };
  }, [counselees]);

  // Filtered counselees
  const filteredCounselees = useMemo(() => {
    return counselees.filter((stu) => {
      if (statusFilter === "SAFE" && stu.pct < 75) return false;
      if (statusFilter === "DEFICIT" && stu.pct >= 75) return false;

      if (sectionFilter !== "ALL") {
        const secNum = parseInt(String(sectionFilter).replace(/\D/g, ""), 10);
        if (stu.sectionNum !== secNum && stu.section !== sectionFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRoll = stu.roll.toLowerCase().includes(q);
        const matchName = stu.name.toLowerCase().includes(q);
        if (!matchRoll && !matchName) return false;
      }

      return true;
    });
  }, [counselees, statusFilter, sectionFilter, searchQuery]);

  // Open note modal for a specific student
  const handleOpenNoteModal = (student) => {
    setSelectedStudentForNote(student);
    setNoteStudentRoll(student ? student.roll : counselees[0]?.roll || "");
    setNoteDiscussion("");
    setNoteActionPlan("");
    setNoteCategory(student?.pct < 75 ? "Attendance Shortage (<75%)" : "Academic Improvement");
    setLogModalOpen(true);
  };

  // Save new counselling log
  const handleSaveNote = (e) => {
    e.preventDefault();
    const targetStudent = counselees.find((s) => s.roll === noteStudentRoll);
    if (!targetStudent) return;

    const newLog = {
      id: `log_${Date.now()}`,
      studentRoll: targetStudent.roll,
      studentName: targetStudent.name,
      date: noteDate,
      category: noteCategory,
      discussion: noteDiscussion,
      actionPlan: noteActionPlan,
      status: noteStatus
    };

    setCounsellingLogs((prev) => [newLog, ...prev]);
    setLogModalOpen(false);
    if (onShowToast) {
      onShowToast(`Counselling record saved for ${targetStudent.name}!`, "success");
    }
  };

  // Delete a counselling log
  const handleDeleteLog = (id) => {
    if (confirm("Remove this counselling record?")) {
      setCounsellingLogs((prev) => prev.filter((l) => l.id !== id));
      if (onShowToast) onShowToast("Counselling entry removed.", "info");
    }
  };

  // Export counselees list to CSV
  const handleExportCSV = () => {
    const headers = ["Roll Number", "Student Name", "Section", "Counsellor", "Attended", "Total Classes", "Attendance %", "Standing"];
    const rows = counselees.map((c) => [
      c.roll,
      `"${c.name}"`,
      c.section || `Section ${c.sectionNum}`,
      `"${activeCounsellorName}"`,
      c.attended,
      c.total,
      `${c.pct}%`,
      c.pct >= 75 ? "Eligible" : "Attendance Shortage"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Mentorship_Report_${activeCounsellorName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast("Counselee report exported to CSV!", "success");
  };

  // Send WhatsApp notification to student/parent
  const handleSendWhatsApp = (student) => {
    const isDefaulter = student.pct < 75;
    const text = encodeURIComponent(
      `*VFSTR STUDENT MENTORSHIP & ATTENDANCE NOTICE*\n` +
      `Department of Computer Science & Engineering\n\n` +
      `Dear ${student.name} (${student.roll}),\n` +
      `This is your designated Faculty Counsellor, *${activeCounsellorName}*.\n\n` +
      `Your current cumulative attendance is *${student.pct}%* (${student.attended}/${student.total} classes attended).\n` +
      (isDefaulter
        ? `⚠️ *WARNING:* You are currently below the university mandatory minimum of 75%. Please meet me immediately to discuss remedial measures and prevent exam debarment.\n\n`
        : `✅ *Good job!* Keep maintaining regular attendance for all theory and lab sessions.\n\n`) +
      `Regards,\n` +
      `${activeCounsellorName}\n` +
      `Faculty Counsellor, VFSTR :: Vadlamudi`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="counsellor-dashboard-container" style={{ padding: "1.25rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Banner: Counsellor Profile & Switcher */}
      <div
        className="counsellor-banner"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
          color: "#ffffff",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.25)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem"
            }}
          >
            <UserCheck size={30} className="text-white" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
              <span
                style={{
                  background: "rgba(238, 242, 255, 0.2)",
                  color: "#e0e7ff",
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                Counselling & Mentorship Portal
              </span>
              <span
                style={{
                  background: "#10b981",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "0.72rem",
                  fontWeight: 700
                }}
              >
                Allotted: {counselees.length} Students
              </span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "2px 0 6px 0", color: "#ffffff" }}>
              {activeCounsellorName}
            </h1>
            <p style={{ margin: 0, color: "#c7d2fe", fontSize: "0.88rem" }}>
              VFSTR &bull; B.Tech Computer Science & Engineering (III Year) &bull; Assigned:{" "}
              {currentCounsellorMeta.sections.map((s) => `Section ${s}`).join(", ")}
            </p>
          </div>
        </div>

        {/* Quick Counsellor Switcher Dropdown & Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", padding: "6px 12px", borderRadius: "10px" }}>
            <span style={{ fontSize: "0.78rem", color: "#e0e7ff", fontWeight: 600 }}>Switch Counsellor:</span>
            <select
              style={{
                background: "transparent",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                outline: "none"
              }}
              value={activeCounsellorName}
              onChange={(e) => setActiveCounsellorName(e.target.value)}
            >
              {COUNSELLORS.map((c) => (
                <option key={c.name} value={c.name} style={{ background: "#1e1b4b", color: "#ffffff" }}>
                  {c.name} ({c.studentCount} Mentees &bull; Sec {c.sections.join(",")})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.25)" }}
              onClick={handleExportCSV}
              title="Download CSV report of your counselees"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ background: "#4f46e5", color: "#ffffff", borderColor: "#4338ca" }}
              onClick={() => handleOpenNoteModal(null)}
              id="counsellorAddNoteBtn"
            >
              <Plus size={14} />
              <span>Log Counselling</span>
            </button>
            {onSwitchToAttendance && (
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: "#059669", color: "#ffffff", border: "none" }}
                onClick={() => onSwitchToAttendance(currentCounsellorMeta.sections[0] || 1)}
                title="Switch to Section Attendance Taking view"
              >
                <span>Take Attendance</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-purple">
            <Users size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Allotted Counselees</span>
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-sub">Students under your care</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Eligible (≥ 75%)</span>
            <span className="kpi-value text-success">{stats.safeCount}</span>
            <span className="kpi-sub">Good attendance standing</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-rose">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Shortage Defaulters</span>
            <span className="kpi-value text-danger">{stats.defaulterCount}</span>
            <span className="kpi-sub">Immediate counselling required</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-blue">
            <TrendingUp size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Group Average</span>
            <span className="kpi-value">{stats.avgPct}%</span>
            <span className="kpi-sub">Mentees compliance rate</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Allotted Counselees vs Counselling Interaction Logs */}
      <div className="admin-tabs-nav" style={{ marginBottom: "18px" }}>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "roster" ? "active" : ""}`}
          onClick={() => setActiveTab("roster")}
        >
          <Users size={16} />
          <span>Allotted Counselees ({counselees.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <FileText size={16} />
          <span>Counselling Session Logs ({counsellingLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Allotted Counselees Roster */}
      {activeTab === "roster" && (
        <div className="admin-tab-content">
          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 240px", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <Search size={16} style={{ color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search counselee by roll or name..."
                style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: "0.85rem" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {currentCounsellorMeta.sections.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Section:</span>
                <select
                  style={{ padding: "6px 10px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="ALL">All Assigned Sections</option>
                  {currentCounsellorMeta.sections.map((secNum) => (
                    <option key={secNum} value={secNum}>
                      Section {secNum}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Standing:</span>
              <select
                style={{ padding: "6px 10px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Students ({counselees.length})</option>
                <option value="SAFE">Compliant (≥ 75%) ({stats.safeCount})</option>
                <option value="DEFICIT">Shortage Defaulters (&lt; 75%) ({stats.defaulterCount})</option>
              </select>
            </div>

            <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "auto" }}>
              Showing <strong>{filteredCounselees.length}</strong> of {counselees.length} mentees
            </span>
          </div>

          {filteredCounselees.length === 0 ? (
            <div className="admin-empty-state">
              <CheckCircle2 size={36} className="text-muted" />
              <h4>No Counselees Found</h4>
              <p>No students match your active search or filter criteria.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Section</th>
                    <th>Classes Attended</th>
                    <th>Attendance %</th>
                    <th>Standing</th>
                    <th>Counselling Notes</th>
                    <th>Direct Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCounselees.map((stu) => {
                    const studentLogs = counsellingLogs.filter((l) => l.studentRoll === stu.roll);
                    const latestLog = studentLogs[0];

                    return (
                      <tr key={stu.roll} className={stu.isDefaulter ? "defaulter-row" : ""}>
                        <td className="font-mono font-bold text-primary">{stu.roll}</td>
                        <td className="font-semibold">{stu.name}</td>
                        <td>
                          <span className="badge-tag" style={{ background: "#ede9fe", color: "#5b21b6" }}>
                            {stu.section || `Section ${stu.sectionNum}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span><strong>{stu.attended}</strong> / {stu.total}</span>
                            {stu.liveSessionsCount > 0 && stu.lastSessionStatus && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: stu.lastSessionStatus === "present" ? "#15803d" : "#b91c1c",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}
                              >
                                {stu.lastSessionStatus === "present" ? "✓ Attended latest" : "✕ Absent latest"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "60px", background: "#e2e8f0", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${Math.min(100, stu.pct)}%`,
                                  background: stu.pct >= 75 ? "#10b981" : stu.pct >= 65 ? "#f59e0b" : "#ef4444",
                                  height: "100%"
                                }}
                              />
                            </div>
                            <span className={stu.isDefaulter ? "badge-danger font-bold" : "text-success font-bold"}>
                              {stu.pct}%
                            </span>
                          </div>
                        </td>
                        <td>
                          {stu.pct >= 75 ? (
                            <span className="status-pill status-safe">Eligible</span>
                          ) : (
                            <span className="status-pill status-danger">Shortage ({stu.pct}%)</span>
                          )}
                        </td>
                        <td>
                          {latestLog ? (
                            <div style={{ maxWidth: "220px", fontSize: "0.76rem" }}>
                              <span style={{ fontWeight: 700, color: "#1e293b", display: "block" }}>
                                {latestLog.category}
                              </span>
                              <span style={{ color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                                {latestLog.discussion}
                              </span>
                              <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                                {latestLog.date} &bull; {studentLogs.length} record(s)
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No remarks logged</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              className="whatsapp-alert-btn"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              onClick={() => handleSendWhatsApp(stu)}
                              title="Send official counselling notice via WhatsApp"
                            >
                              <MessageSquare size={13} />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              onClick={() => handleOpenNoteModal(stu)}
                              title="Record counselling interaction"
                            >
                              <Plus size={13} />
                              <span>Remark</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Counselling Session Logs & Interaction History */}
      {activeTab === "logs" && (
        <div className="admin-tab-content">
          <div className="tab-table-header">
            <div>
              <h3>Counselling Interaction Logs & Mentorship Notes</h3>
              <p className="tab-subtitle">
                Official record of student advising sessions, attendance interventions, and parent communications.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenNoteModal(null)}
            >
              <Plus size={14} />
              <span>Log New Session</span>
            </button>
          </div>

          {counsellingLogs.length === 0 ? (
            <div className="admin-empty-state">
              <FileText size={36} className="text-muted" />
              <h4>No Counselling Sessions Logged Yet</h4>
              <p>Click "Log New Session" to record student discussions, attendance reminders, and parent calls.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Category</th>
                    <th>Discussion / Observations</th>
                    <th>Action Plan</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {counsellingLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono font-medium">{log.date}</td>
                      <td>
                        <strong className="text-primary font-mono">{log.studentRoll}</strong>
                        <div style={{ fontSize: "0.82rem", color: "#334155" }}>{log.studentName}</div>
                      </td>
                      <td>
                        <span className="badge-tag" style={{ background: "#fef3c7", color: "#92400e" }}>
                          {log.category}
                        </span>
                      </td>
                      <td style={{ maxWidth: "280px", fontSize: "0.82rem", lineHeight: 1.4 }}>{log.discussion}</td>
                      <td style={{ maxWidth: "200px", fontSize: "0.82rem", color: "#047857" }}>{log.actionPlan || "—"}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            log.status === "Resolved"
                              ? "status-safe"
                              : log.status === "Escalated to HOD"
                              ? "status-danger"
                              : "status-warning"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-icon-btn"
                          onClick={() => handleDeleteLog(log.id)}
                          title="Delete entry"
                        >
                          <Trash2 size={14} />
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

      {/* Log Counselling Interaction Modal */}
      {logModalOpen && (
        <div className="modal-backdrop">
          <div className="od-modal-card" role="dialog" aria-modal="true" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <UserCheck size={20} className="text-primary" />
                <h3>Log Counselling Session</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setLogModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="od-form">
              <div className="form-group">
                <label className="form-label" htmlFor="noteStudentSelect">
                  Select Allotted Counselee
                </label>
                <select
                  id="noteStudentSelect"
                  className="form-input"
                  value={noteStudentRoll}
                  onChange={(e) => setNoteStudentRoll(e.target.value)}
                  required
                >
                  {counselees.map((s) => (
                    <option key={s.roll} value={s.roll}>
                      {s.roll} - {s.name} ({s.pct}%) &bull; {s.section || `Sec ${s.sectionNum}`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="noteDateInput">
                    Meeting Date
                  </label>
                  <input
                    id="noteDateInput"
                    type="date"
                    className="form-input"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="noteCategorySelect">
                    Counselling Focus
                  </label>
                  <select
                    id="noteCategorySelect"
                    className="form-input"
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                  >
                    <option value="Attendance Shortage (<75%)">Attendance Shortage (&lt;75%)</option>
                    <option value="Academic Improvement">Academic Improvement</option>
                    <option value="Backlog Clearing Advice">Backlog Clearing Advice</option>
                    <option value="Medical / Leave Verification">Medical / Leave Verification</option>
                    <option value="Career & Placement Guidance">Career & Placement Guidance</option>
                    <option value="Parent Teleconference">Parent Teleconference</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="noteDiscussionText">
                  Discussion Summary & Observations
                </label>
                <textarea
                  id="noteDiscussionText"
                  className="form-input"
                  rows={3}
                  placeholder="Record reasons for absence, student's explanation, parent conversation..."
                  value={noteDiscussion}
                  onChange={(e) => setNoteDiscussion(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="noteActionPlanText">
                  Agreed Action Plan / Commitment
                </label>
                <input
                  id="noteActionPlanText"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Must achieve 85% in next 15 days; attend lab extra hours"
                  value={noteActionPlan}
                  onChange={(e) => setNoteActionPlan(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="noteStatusSelect">
                  Counselling Outcome Status
                </label>
                <select
                  id="noteStatusSelect"
                  className="form-input"
                  value={noteStatus}
                  onChange={(e) => setNoteStatus(e.target.value)}
                >
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Resolved">Resolved (Commitment Given)</option>
                  <option value="Escalated to HOD">Escalated to HOD / Dean</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setLogModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={15} />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
