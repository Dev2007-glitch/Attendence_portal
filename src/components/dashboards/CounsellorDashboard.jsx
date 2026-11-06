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
  Bell,
  BellRing,
  Check,
  X,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Paperclip,
  ExternalLink
} from "lucide-react";
import { COUNSELLORS, getStudentsByCounsellor } from "../../../data.js";
import { computeStudentStats } from "../../utils/attendanceStats.js";
import {
  getOdApplicationsForCounsellor,
  updateOdApplicationStatus,
  markOdAsRead
} from "../../utils/odManagement.js";

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

  const [activeTab, setActiveTab] = useState("roster"); // "roster" | "logs" | "all_counsellors" | "od_requests"
  const [counsellorSearch, setCounsellorSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "SAFE" | "DEFICIT"
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState(null);

  // OD Exemption Applications state & Real-Time Sync
  const [odApplications, setOdApplications] = useState([]);
  const [odFilter, setOdFilter] = useState("ALL"); // "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  const [odSearch, setOdSearch] = useState("");
  const [odActionRemarks, setOdActionRemarks] = useState({});
  const [previewDocModal, setPreviewDocModal] = useState({ isOpen: false, od: null });

  // Sync OD applications for this counsellor
  useEffect(() => {
    const loadOds = () => {
      const list = getOdApplicationsForCounsellor(activeCounsellorName);
      setOdApplications(list);
    };

    loadOds();

    const handleNewOd = (e) => {
      const detail = e.detail;
      loadOds();
      if (
        detail &&
        detail.counsellorName &&
        (activeCounsellorName.toLowerCase().includes(detail.counsellorName.toLowerCase()) ||
          detail.counsellorName.toLowerCase().includes(activeCounsellorName.toLowerCase()))
      ) {
        if (onShowToast) {
          onShowToast(
            `🔔 New OD Alert: Your counselling student ${detail.studentName} applied for OD on ${detail.date}!`,
            "info"
          );
        }
      }
    };

    const handleStatusSync = () => {
      loadOds();
    };

    window.addEventListener("vu_counsellor_od_notification", handleNewOd);
    window.addEventListener("vu_counsellor_od_status_updated", handleStatusSync);
    return () => {
      window.removeEventListener("vu_counsellor_od_notification", handleNewOd);
      window.removeEventListener("vu_counsellor_od_status_updated", handleStatusSync);
    };
  }, [activeCounsellorName, onShowToast]);

  const pendingOdCount = useMemo(() => {
    return odApplications.filter((a) => a.status?.toLowerCase().includes("pending")).length;
  }, [odApplications]);

  const latestPendingOd = useMemo(() => {
    return odApplications.find((a) => a.status?.toLowerCase().includes("pending"));
  }, [odApplications]);

  const handleApproveOd = (odItem) => {
    const remarks = odActionRemarks[odItem.id] || "Approved by Counsellor. Attendance credited under institutional regulations.";
    updateOdApplicationStatus(odItem.id, "Approved (OD Credited)", remarks);
    if (onShowToast) {
      onShowToast(`OD application for ${odItem.studentName} (${odItem.studentRoll}) APPROVED!`, "success");
    }
  };

  const handleRejectOd = (odItem) => {
    const remarks = odActionRemarks[odItem.id] || "Rejected by Counsellor. Insufficient documentation or schedule clash.";
    updateOdApplicationStatus(odItem.id, "Rejected", remarks);
    if (onShowToast) {
      onShowToast(`OD application for ${odItem.studentName} (${odItem.studentRoll}) marked as Rejected.`, "warning");
    }
  };

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

      {/* Prominent High-Visibility OD Exemption Notification Banner */}
      {pendingOdCount > 0 && latestPendingOd && (
        <div
          className="counsellor-od-alert-banner"
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1.5px solid #93c5fd",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            boxShadow: "0 4px 16px rgba(37, 99, 235, 0.1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 320px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 10px rgba(37, 99, 235, 0.4)"
              }}
            >
              <BellRing size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#1d4ed8" }}>
                  On-Duty (OD) Notification Alert
                </span>
                <span style={{ background: "#ef4444", color: "#ffffff", fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: "999px" }}>
                  {pendingOdCount} New Request{pendingOdCount > 1 ? "s" : ""}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "#1e3a8a", lineHeight: 1.5 }}>
                <strong>{latestPendingOd.notificationMessage}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: "9px 18px",
              fontWeight: 700,
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
            }}
            onClick={() => setActiveTab("od_requests")}
          >
            Review OD Requests ({pendingOdCount})
          </button>
        </div>
      )}

      {/* Tabs Navigation: Allotted Counselees vs OD Requests vs Counselling Logs vs All Counsellors */}
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
          className={`admin-tab-btn ${activeTab === "od_requests" ? "active" : ""}`}
          onClick={() => setActiveTab("od_requests")}
          style={{ position: "relative" }}
        >
          <FileCheck size={16} />
          <span>OD Requests & Alerts</span>
          {pendingOdCount > 0 ? (
            <span
              style={{
                marginLeft: "6px",
                background: "#ef4444",
                color: "#ffffff",
                fontSize: "0.7rem",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "999px"
              }}
            >
              {pendingOdCount} New
            </span>
          ) : (
            <span
              style={{
                marginLeft: "6px",
                background: "#f1f5f9",
                color: "#64748b",
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "999px"
              }}
            >
              {odApplications.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <FileText size={16} />
          <span>Counselling Session Logs ({counsellingLogs.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "all_counsellors" ? "active" : ""}`}
          onClick={() => setActiveTab("all_counsellors")}
        >
          <Users size={16} />
          <span>All Counsellors ({COUNSELLORS.length})</span>
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

      {/* TAB 3: All Counsellors Directory */}
      {activeTab === "all_counsellors" && (
        <div className="admin-tab-content">
          <div className="tab-table-header">
            <div>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.15rem" }}>
                All Designated Counsellors &amp; Mentors ({COUNSELLORS.length} Faculty)
              </h3>
              <p className="tab-subtitle" style={{ margin: "4px 0 0" }}>
                Official mentor allocations — VFSTR B.Tech CSE III Year, All 22 Sections
              </p>
            </div>
            {/* Search bar */}
            <div style={{ position: "relative", minWidth: "240px" }}>
              <input
                type="text"
                placeholder="Search counsellor name..."
                value={counsellorSearch}
                onChange={(e) => setCounsellorSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  outline: "none",
                  background: "#f8fafc"
                }}
              />
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                🔍
              </span>
            </div>
          </div>

          {/* Section-wise grouped counsellor cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px", marginTop: "16px" }}>
            {COUNSELLORS
              .filter((c) => c.name.toLowerCase().includes(counsellorSearch.toLowerCase()))
              .map((c, idx) => {
                const initials = c.name
                  .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, "")
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();
                const avatarColors = [
                  "#4f46e5", "#0891b2", "#059669", "#d97706",
                  "#dc2626", "#7c3aed", "#0284c7", "#16a34a"
                ];
                const bg = avatarColors[idx % avatarColors.length];
                return (
                  <div
                    key={c.name}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
                  >
                    {/* Top: Avatar + Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "46px", height: "46px", borderRadius: "50%",
                        background: bg, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "1rem", flexShrink: 0, letterSpacing: "0.5px"
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: "0.88rem",
                          color: "#1e293b", lineHeight: 1.3,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                          Faculty Counsellor &amp; Mentor
                        </div>
                      </div>
                    </div>

                    {/* Middle: Section badges + mentee count */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                      {c.sections.map((secNum) => (
                        <span key={secNum} style={{
                          background: "#ede9fe", color: "#6d28d9",
                          fontSize: "0.7rem", fontWeight: 700,
                          padding: "2px 8px", borderRadius: "20px",
                          border: "1px solid #ddd6fe", fontFamily: "monospace"
                        }}>
                          Section {secNum}
                        </span>
                      ))}
                      <span style={{
                        marginLeft: "auto",
                        background: "#f0fdf4", color: "#15803d",
                        fontSize: "0.72rem", fontWeight: 700,
                        padding: "2px 8px", borderRadius: "20px",
                        border: "1px solid #bbf7d0"
                      }}>
                        👥 {c.studentCount} Mentees
                      </span>
                    </div>

                    {/* Bottom: Action buttons */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveCounsellorName(c.name)}
                        style={{
                          flex: 1, padding: "7px", borderRadius: "7px",
                          border: "1.5px solid #6d28d9", background: activeCounsellorName === c.name ? "#6d28d9" : "transparent",
                          color: activeCounsellorName === c.name ? "#fff" : "#6d28d9",
                          fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        {activeCounsellorName === c.name ? "✓ Viewing" : "View Counselees"}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `*VFSTR CSE ATTENDANCE PORTAL*\nDear ${c.name},\nRegarding attendance & mentorship for your assigned counselees (Sections ${c.sections.join(", ")}).`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "7px 12px", borderRadius: "7px",
                          background: "#25D366", color: "#fff",
                          fontSize: "0.78rem", fontWeight: 700,
                          textDecoration: "none", display: "flex",
                          alignItems: "center", gap: "4px"
                        }}
                      >
                        <MessageSquare size={13} /> WA
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>

          {COUNSELLORS.filter((c) => c.name.toLowerCase().includes(counsellorSearch.toLowerCase())).length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <Users size={40} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p>No counsellors found matching "<strong>{counsellorSearch}</strong>"</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OD Requests & Counsellor Notification Review Panel */}
      {activeTab === "od_requests" && (
        <div className="admin-tab-content">
          <div className="tab-table-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileCheck size={20} className="text-primary" />
                <span>On-Duty (OD) Exemption Requests & Notifications</span>
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                Review and approve institutional OD applications submitted by students assigned to <strong>{activeCounsellorName}</strong>.
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setOdFilter("ALL")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: odFilter === "ALL" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  background: odFilter === "ALL" ? "#eff6ff" : "#ffffff",
                  color: odFilter === "ALL" ? "#1d4ed8" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                All ({odApplications.length})
              </button>
              <button
                type="button"
                onClick={() => setOdFilter("PENDING")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: odFilter === "PENDING" ? "2px solid #d97706" : "1px solid #cbd5e1",
                  background: odFilter === "PENDING" ? "#fef3c7" : "#ffffff",
                  color: odFilter === "PENDING" ? "#92400e" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                Pending Review ({pendingOdCount})
              </button>
              <button
                type="button"
                onClick={() => setOdFilter("APPROVED")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: odFilter === "APPROVED" ? "2px solid #16a34a" : "1px solid #cbd5e1",
                  background: odFilter === "APPROVED" ? "#dcfce7" : "#ffffff",
                  color: odFilter === "APPROVED" ? "#166534" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                Approved ({odApplications.filter((a) => a.status?.toLowerCase().includes("approved")).length})
              </button>
              <button
                type="button"
                onClick={() => setOdFilter("REJECTED")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: odFilter === "REJECTED" ? "2px solid #dc2626" : "1px solid #cbd5e1",
                  background: odFilter === "REJECTED" ? "#fee2e2" : "#ffffff",
                  color: odFilter === "REJECTED" ? "#991b1b" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                Rejected ({odApplications.filter((a) => a.status?.toLowerCase().includes("reject")).length})
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              padding: "10px 14px",
              background: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #e2e8f0"
            }}
          >
            <Search size={16} style={{ color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search by student roll number, student name, or reason..."
              value={odSearch}
              onChange={(e) => setOdSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "0.86rem"
              }}
            />
          </div>

          {/* OD Cards Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {odApplications
              .filter((item) => {
                if (odFilter === "PENDING" && !item.status?.toLowerCase().includes("pending")) return false;
                if (odFilter === "APPROVED" && !item.status?.toLowerCase().includes("approved")) return false;
                if (odFilter === "REJECTED" && !item.status?.toLowerCase().includes("reject")) return false;

                if (odSearch) {
                  const q = odSearch.toLowerCase();
                  return (
                    item.studentRoll?.toLowerCase().includes(q) ||
                    item.studentName?.toLowerCase().includes(q) ||
                    item.reason?.toLowerCase().includes(q) ||
                    item.description?.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((od) => {
                const isPending = od.status?.toLowerCase().includes("pending");
                const isApproved = od.status?.toLowerCase().includes("approved");
                const isRejected = od.status?.toLowerCase().includes("reject");

                return (
                  <div
                    key={od.id}
                    style={{
                      background: "#ffffff",
                      border: isPending ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "18px 20px",
                      boxShadow: isPending ? "0 4px 16px rgba(59, 130, 246, 0.08)" : "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    {/* Top Row: Student Meta + Status Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: isPending ? "#3b82f6" : "#64748b",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.95rem"
                          }}
                        >
                          {od.studentName?.charAt(0) || "S"}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                              {od.studentName}
                            </span>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", color: "#2563eb", background: "#eff6ff", padding: "1px 8px", borderRadius: "6px" }}>
                              {od.studentRoll}
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "#475569", background: "#f1f5f9", padding: "1px 8px", borderRadius: "6px", fontWeight: 600 }}>
                              {od.studentSection}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                            Assigned Counsellor: <strong>{od.counsellorName}</strong> &bull; Applied: {od.submittedAt ? new Date(od.submittedAt).toLocaleDateString() : "Recent"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            padding: "5px 12px",
                            borderRadius: "999px",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            letterSpacing: "0.3px",
                            background: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef3c7",
                            color: isApproved ? "#166534" : isRejected ? "#991b1b" : "#92400e",
                            border: `1px solid ${isApproved ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a"}`
                          }}
                        >
                          {od.status}
                        </span>
                      </div>
                    </div>

                    {/* Official Counsellor Notification Message Callout (Exact required format) */}
                    <div
                      style={{
                        background: "#f0f9ff",
                        borderLeft: "4px solid #0284c7",
                        padding: "12px 16px",
                        borderRadius: "0 8px 8px 0"
                      }}
                    >
                      <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#0369a1", marginBottom: "4px" }}>
                        📢 Official Counsellor Notification Notice:
                      </div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0c4a6e", lineHeight: 1.55 }}>
                        "{od.notificationMessage || `Your counselling student ${od.studentName} (${od.studentRoll}, ${od.studentSection}) applied for OD on ${od.date} due to ${od.reason}.${od.description ? ` Description: ${od.description}` : ""}`}"
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                        background: "#f8fafc",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Exemption Date:</span>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                          📅 {od.date}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Duration / Periods:</span>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#334155" }}>
                          ⏰ {od.periods || "All Scheduled Periods"}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Category / Reason:</span>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#334155" }}>
                          🏷️ {od.reason}
                        </div>
                      </div>
                    </div>

                    {/* Official Anti-Malpractice Verification Document Box */}
                    {od.hasVerificationDoc || od.documentData ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#f0fdf4",
                          border: "1.5px solid #16a34a",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          flexWrap: "wrap",
                          gap: "10px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "#dcfce7",
                              color: "#16a34a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                          >
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#166534" }}>
                              Official Verification Document Attached (Anti-Malpractice Verified)
                            </div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginTop: "1px" }}>
                              📎 {od.documentName || "Supporting_Certificate.pdf"} <span style={{ color: "#64748b", fontWeight: 500, fontSize: "0.78rem" }}>({od.documentSize || "PDF"})</span>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#475569" }}>
                              Authenticity Ref: <strong style={{ color: "#000000" }}>{od.verificationRef || "VFSTR-OD-RECORD"}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({ isOpen: true, od })}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#166534",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 14px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(22, 101, 52, 0.2)"
                          }}
                        >
                          <Eye size={14} />
                          <span>Inspect / Verify Document</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "#fffbeb",
                          border: "1.5px solid #f59e0b",
                          padding: "10px 14px",
                          borderRadius: "8px"
                        }}
                      >
                        <AlertTriangle size={18} style={{ color: "#b45309", flexShrink: 0 }} />
                        <div style={{ fontSize: "0.8rem", color: "#92400e" }}>
                          <strong>⚠️ No Supporting Proof Attached (High Malpractice Risk):</strong> Student did not attach an official event invitation, medical prescription, or sports relief order. Verify with student/HOD before approving.
                        </div>
                      </div>
                    )}

                    {/* Existing remarks if already reviewed */}
                    {od.counsellorRemarks && (
                      <div style={{ fontSize: "0.82rem", color: "#15803d", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                        <strong>Counsellor Decision Remark:</strong> {od.counsellorRemarks}
                      </div>
                    )}

                    {/* Counsellor Decision Toolbar & WhatsApp Contact */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "1 1 280px" }}>
                        <input
                          type="text"
                          placeholder="Optional decision remark (e.g. Verified with HOD / Sports Director)..."
                          value={odActionRemarks[od.id] || ""}
                          onChange={(e) => setOdActionRemarks({ ...odActionRemarks, [od.id]: e.target.value })}
                          style={{
                            padding: "7px 12px",
                            fontSize: "0.82rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            flex: 1
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveOd(od)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#16a34a",
                                color: "#ffffff",
                                border: "none",
                                padding: "7px 14px",
                                borderRadius: "7px",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              <Check size={14} />
                              <span>Approve OD</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectOd(od)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#dc2626",
                                color: "#ffffff",
                                border: "none",
                                padding: "7px 14px",
                                borderRadius: "7px",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `*VFSTR OD NOTIFICATION UPDATE*\nDear ${od.studentName} (${od.studentRoll}),\nRegarding your On-Duty (OD) request for ${od.date} (${od.reason}):\nStatus: ${od.status}\nCounsellor: ${od.counsellorName}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#25D366",
                            color: "#ffffff",
                            textDecoration: "none",
                            padding: "7px 12px",
                            borderRadius: "7px",
                            fontSize: "0.82rem",
                            fontWeight: 700
                          }}
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp Student</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

            {odApplications.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <FileCheck size={40} style={{ marginBottom: "12px", opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No On-Duty applications recorded for {activeCounsellorName} yet.</p>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>When a counselee submits an OD in their student portal, it will immediately appear here with a notification.</p>
              </div>
            )}
          </div>
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
      {/* =========================================================================
          MODAL: COUNSELLOR DOCUMENT INSPECTION & MALPRACTICE VERIFICATION
          ========================================================================= */}
      {previewDocModal.isOpen && previewDocModal.od && (
        <div className="modal-overlay" onClick={() => setPreviewDocModal({ isOpen: false, od: null })}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "720px", width: "95%", maxHeight: "90vh", overflowY: "auto", border: "2px solid #000000", boxShadow: "8px 8px 0px #000000", borderRadius: 0 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "2px solid #000000", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldCheck size={22} style={{ color: "#16a34a" }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>COUNSELLOR DOCUMENT INSPECTION & AUDIT</h3>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    Anti-Malpractice Verification &bull; Ref: {previewDocModal.od.verificationRef || "VFSTR-OD-RECORD"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocModal({ isOpen: false, od: null })}
                style={{ background: "#ffffff", border: "1px solid #000000", padding: "4px 8px", cursor: "pointer", fontWeight: 700 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {/* Student Metadata Card */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", background: "#f8fafc", border: "1px solid #000000", padding: "12px", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Student:</span>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{previewDocModal.od.studentName} ({previewDocModal.od.studentRoll})</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{previewDocModal.od.studentSection}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Requested Date & Duration:</span>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>📅 {previewDocModal.od.date}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>⏰ {previewDocModal.od.periods}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Exemption Category:</span>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>🏷️ {previewDocModal.od.reason}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Document Name:</span>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2563eb" }}>📎 {previewDocModal.od.documentName || "Supporting_Certificate.pdf"}</div>
                </div>
              </div>

              {/* Document Display Canvas */}
              <div style={{ border: "2px solid #000000", background: "#ffffff", padding: "12px", textAlign: "center", minHeight: "260px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {previewDocModal.od.documentData ? (
                  previewDocModal.od.documentType?.includes("pdf") ? (
                    previewDocModal.od.documentData.startsWith("data:image/") ? (
                      <img
                        src={previewDocModal.od.documentData}
                        alt="Verification Proof Certificate"
                        style={{ maxWidth: "100%", maxHeight: "420px", objectFit: "contain", border: "1px solid #cbd5e1" }}
                      />
                    ) : (
                      <div style={{ width: "100%" }}>
                        <iframe
                          src={previewDocModal.od.documentData}
                          title="Verification Document"
                          style={{ width: "100%", height: "400px", border: "none" }}
                        />
                      </div>
                    )
                  ) : (
                    <img
                      src={previewDocModal.od.documentData}
                      alt="Verification Proof"
                      style={{ maxWidth: "100%", maxHeight: "420px", objectFit: "contain", border: "1px solid #cbd5e1" }}
                    />
                  )
                ) : (
                  <div style={{ color: "#94a3b8" }}>
                    <FileText size={48} style={{ margin: "0 auto 8px" }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>No electronic document data attached.</p>
                  </div>
                )}
              </div>

              {/* Anti-Malpractice Verification Checklist */}
              <div style={{ marginTop: "16px", background: "#f0fdf4", border: "1px solid #16a34a", padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "0.82rem", color: "#166534", marginBottom: "8px" }}>
                  <ShieldCheck size={16} />
                  <span>Counsellor Anti-Malpractice Verification Standards</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.76rem", color: "#14532d" }}>
                  <div>✓ Student identity and Roll No matched with University records</div>
                  <div>✓ Event host / authority details and letterhead inspected</div>
                  <div>✓ Dates and requested periods match official schedule</div>
                  <div>✓ Official seal / digital certification acknowledged</div>
                </div>
              </div>

              {/* Counsellor Decision Toolbar directly inside modal */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", gap: "10px", flexWrap: "wrap" }}>
                <div>
                  {previewDocModal.od.documentData && (
                    <a
                      href={previewDocModal.od.documentData}
                      download={previewDocModal.od.documentName || "VFSTR_OD_Supporting_Document"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        color: "#0f172a",
                        padding: "7px 12px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        textDecoration: "none"
                      }}
                    >
                      <Download size={14} />
                      <span>Download Proof File</span>
                    </a>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {previewDocModal.od.status?.toLowerCase().includes("pending") && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleApproveOd(previewDocModal.od);
                          setPreviewDocModal({ isOpen: false, od: null });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 16px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        <Check size={14} />
                        <span>Confirm Valid Proof & Approve OD</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleRejectOd(previewDocModal.od);
                          setPreviewDocModal({ isOpen: false, od: null });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#dc2626",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 16px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        <X size={14} />
                        <span>Reject Exemption</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewDocModal({ isOpen: false, od: null })}
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 14px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
