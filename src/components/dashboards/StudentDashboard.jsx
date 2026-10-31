import React, { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  User,
  Search,
  FileText,
  Send,
  Award,
  TrendingUp,
  Percent,
  Check,
  Info,
  CreditCard,
  Phone,
  MessageSquare,
  ShieldCheck,
  Download,
  Filter,
  CheckSquare,
  Mail,
  Inbox,
  AlertCircle,
  Layers,
  ChevronRight,
  Printer,
  ChevronDown,
  Star,
  Users,
  Compass,
  FileCheck,
  CalendarDays,
  ExternalLink,
  DollarSign
} from "lucide-react";
import {
  SECTION_1_SUBJECTS,
  SECTION_1_FACULTIES,
  getTimetablePeriodsForDate,
  SECTION_1_TIMETABLE
} from "../../data/timetable";
import { SECTIONS, ALL_STUDENTS } from "../../../data.js";
import { getStudentBaseline } from "../../utils/attendanceStats.js";
import { getStudentMailboxNotices, markMailNoticeAsRead } from "../../utils/studentEmail.js";
import { fetchStudentMailbox } from "../../services/api.js";

export default function StudentDashboard({
  currentUser,
  students = [],
  sessions = [],
  onShowToast,
  onOpenCalendarView
}) {
  const isStaff = currentUser?.role === "faculty" || currentUser?.role === "admin";
  const [inspectorSection, setInspectorSection] = useState(1);

  // Vignan SIS Parent Dashboard Navigation Tabs
  const [activeTab, setActiveTab] = useState("attendance"); // "attendance" | "marks" | "timetable" | "fees" | "counselor" | "od"

  // Collapsible Accordions for Left Hero Profile Grid
  const [openAccordions, setOpenAccordions] = useState({
    particulars: true,
    parent: false,
    counselor: false,
    standing: false
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Expandable Completion Portfolio Items
  const [openPortfolio, setOpenPortfolio] = useState({
    attendance: true,
    cie: false,
    labs: false,
    moocs: false
  });

  const togglePortfolio = (key) => {
    setOpenPortfolio((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Popups: Academic Calendar, Student Feedback, and VU Mailbox
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [mailboxNotices, setMailboxNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [mailboxFilter, setMailboxFilter] = useState("ALL"); // "ALL" | "UNREAD"
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState("Curriculum & Teaching Quality");
  const [feedbackComment, setFeedbackComment] = useState("");

  // Date Range Filter (Signature Vignan SIS feature)
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("ALL");

  // If currentUser is student, strictly locked to their roll
  const [selectedRoll, setSelectedRoll] = useState(() => {
    if (currentUser?.role === "student" && currentUser?.roll) {
      return currentUser.roll;
    }
    return students[0]?.roll || "241FA04035";
  });

  // OD Application State
  const [odDate, setOdDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [odReason, setOdReason] = useState("Technical Symposium / Hackathon Participation");
  const [odRemarks, setOdRemarks] = useState("");
  const [odSubmittedList, setOdSubmittedList] = useState([
    {
      id: "od_demo_1",
      date: "2026-09-08",
      reason: "National Hackathon Championship",
      remarks: "Certificate verified by Dr. P. Siva Prasad",
      status: "Approved (OD Credited)",
      periods: "P1-P4 (4 Periods)"
    }
  ]);

  // Active student object (resolves registered name, section, counsellor)
  const activeStudent = useMemo(() => {
    const targetRoll = !isStaff && currentUser?.roll ? currentUser.roll : selectedRoll;
    const found =
      students.find((s) => s.roll.toUpperCase() === targetRoll.toUpperCase()) ||
      ALL_STUDENTS.find((s) => s.roll.toUpperCase() === targetRoll.toUpperCase()) ||
      (currentUser?.roll && currentUser.roll.toUpperCase() === targetRoll.toUpperCase() ? currentUser : null);

    if (found) {
      return {
        ...found,
        name: currentUser?.roll?.toUpperCase() === targetRoll.toUpperCase() && currentUser?.name ? currentUser.name : found.name,
        section: found.section || currentUser?.section || `Section ${found.sectionNum || 1}`,
        counsellor: found.counsellor || currentUser?.counsellor || "Class Counsellor",
        room: found.room || currentUser?.room || `Room N-40${((found.sectionNum || 1) % 10) + 1}`
      };
    }

    return (
      students[0] || {
        roll: targetRoll,
        name: currentUser?.name || "Student",
        section: "CSE - Sec 1"
      }
    );
  }, [students, selectedRoll, currentUser, isStaff]);

  // Sync VU Mailbox notices for the active student (supports all 1,511 students)
  useEffect(() => {
    async function loadMailbox() {
      if (!activeStudent?.roll) return;
      const rollClean = activeStudent.roll.toUpperCase();
      const localNotices = getStudentMailboxNotices(rollClean);
      setMailboxNotices(localNotices);
      if (localNotices.length > 0) {
        setSelectedNotice(localNotices[0]);
      }

      try {
        const remoteNotices = await fetchStudentMailbox(rollClean);
        if (Array.isArray(remoteNotices) && remoteNotices.length > 0) {
          const map = new Map();
          localNotices.forEach((n) => map.set(n.id, n));
          remoteNotices.forEach((n) => map.set(n.id, n));
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.sentAt || b.date) - new Date(a.sentAt || a.date));
          setMailboxNotices(merged);
          if (merged.length > 0) {
            setSelectedNotice(merged[0]);
          }
        }
      } catch (e) {}
    }

    loadMailbox();

    const handleMailDelivery = (e) => {
      const notice = e.detail;
      if (notice && notice.studentRoll?.toUpperCase() === activeStudent?.roll?.toUpperCase()) {
        setMailboxNotices((prev) => [notice, ...prev.filter((n) => n.id !== notice.id)]);
        setSelectedNotice(notice);
        if (onShowToast) {
          onShowToast(`📬 New official absence alert delivered to your VU inbox!`, "warning");
        }
      }
    };

    window.addEventListener("vu_student_mail_received", handleMailDelivery);
    return () => window.removeEventListener("vu_student_mail_received", handleMailDelivery);
  }, [activeStudent?.roll]);

  // Computed attendance records
  const stats = useMemo(() => {
    let attendedCount = 0;
    let absentCount = 0;

    const subjectMap = {};
    SECTION_1_SUBJECTS.forEach((sub, idx) => {
      subjectMap[sub.name] = {
        code: sub.code || `21CS30${idx + 1}`,
        name: sub.name,
        faculty: sub.faculty || "Faculty Member",
        type: sub.name.toLowerCase().includes("lab") ? "Practical" : "Theory",
        held: 0,
        attended: 0
      };
    });

    sessions.forEach((sess) => {
      const studentStatus = sess.attendance?.[activeStudent.roll];
      if (studentStatus) {
        const isPresent = studentStatus === "present";
        if (isPresent) {
          attendedCount++;
        } else {
          absentCount++;
        }

        const subName = sess.subject || "Subject";
        if (!subjectMap[subName]) {
          subjectMap[subName] = {
            code: `21CS30${Object.keys(subjectMap).length + 1}`,
            name: subName,
            faculty: sess.facultyName || "Faculty Member",
            type: "Theory",
            held: 0,
            attended: 0
          };
        }
        subjectMap[subName].held++;
        if (isPresent) {
          subjectMap[subName].attended++;
        }
      }
    });

    // Incorporate realistic semester baseline plus live recorded sessions
    const { baseHeld, baseAttended, baseAbsent } = getStudentBaseline(activeStudent);
    let totalClassesHeld = baseHeld + attendedCount + absentCount;
    let finalAttended = baseAttended + attendedCount;
    let finalAbsent = baseAbsent + absentCount;

    const overallPct =
      totalClassesHeld > 0
        ? Number(((finalAttended / totalClassesHeld) * 100).toFixed(1))
        : 100;

    // University 75% formula:
    let classesToAttend = 0;
    let safeMargin = 0;

    if (overallPct < 75) {
      const needed = (0.75 * totalClassesHeld - finalAttended) / 0.25;
      classesToAttend = Math.max(1, Math.ceil(needed));
    } else {
      const margin = finalAttended / 0.75 - totalClassesHeld;
      safeMargin = Math.max(0, Math.floor(margin));
    }

    const subjectList = Object.values(subjectMap).map((item, idx) => {
      const held = item.held > 0 ? item.held : (idx % 2 === 0 ? 8 : 7);
      const attended = item.held > 0 ? item.attended : (idx === 1 ? Math.max(0, held - 2) : Math.max(0, held - 1));
      const pct = Number(((attended / held) * 100).toFixed(1));
      return {
        ...item,
        held,
        attended,
        absent: held - attended,
        od: idx === 0 ? 2 : 0,
        pct
      };
    });

    return {
      totalClassesHeld,
      attendedCount: finalAttended,
      absentCount: finalAbsent,
      odCount: 2,
      overallPct,
      classesToAttend,
      safeMargin,
      subjectList
    };
  }, [sessions, activeStudent]);

  // Internal Continuous Evaluation Marks
  const internalMarks = useMemo(() => {
    return stats.subjectList.map((sub, i) => {
      const mid1 = 25 + ((i * 3 + 1) % 5); // 25 to 29 / 30
      const mid2 = 26 + ((i * 2 + 3) % 4); // 26 to 29 / 30
      const quiz = 9 + ((i * 1 + 2) % 2);  // 9 or 10 / 10
      const total = Number(((mid1 + mid2) / 2 + quiz).toFixed(1));
      return {
        code: sub.code,
        name: sub.name,
        faculty: sub.faculty,
        mid1,
        mid2,
        quiz,
        total,
        grade: total >= 36 ? "O (Outstanding)" : total >= 31 ? "A+ (Excellent)" : "A (Very Good)",
        status: "Pass"
      };
    });
  }, [stats.subjectList]);

  // Filtered Subject List for Attendance Register
  const filteredSubjects = useMemo(() => {
    if (selectedSubjectFilter === "ALL") return stats.subjectList;
    return stats.subjectList.filter((s) => s.code === selectedSubjectFilter);
  }, [stats.subjectList, selectedSubjectFilter]);

  // Handle OD Exemption submission
  const handleOdSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `od_${Date.now()}`,
      date: odDate,
      reason: odReason,
      remarks: odRemarks || "Submitted for Class Teacher Verification",
      status: "Submitted (Under Review)",
      periods: "All Scheduled Periods"
    };
    setOdSubmittedList((prev) => [newEntry, ...prev]);
    setOdRemarks("");
    if (onShowToast) {
      onShowToast(
        `On-Duty (OD) application for ${odDate} submitted to Class Teacher (Dr. P. Siva Prasad)!`,
        "success"
      );
    }
  };

  // Handle Student Feedback Submission
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setShowFeedbackModal(false);
    setFeedbackComment("");
    if (onShowToast) {
      onShowToast("Student feedback successfully submitted to VFSTR Quality Assurance Cell!", "success");
    }
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  return (
    <div className="vignan-sis-container">
      {/* =========================================================================
          TOP INSTITUTIONAL HEADER (VFSTR STUDENT INFORMATION SYSTEM)
          ========================================================================= */}
      <header className="sis-institutional-header">
        <div className="sis-header-brand">
          <div className="sis-vfstr-emblem" aria-hidden="true">
            <span className="sis-emblem-main">VFSTR</span>
            <span className="sis-emblem-sub">DEEMED TO BE UNIVERSITY</span>
          </div>
          <div className="sis-title-meta">
            <span className="sis-uni-name">
              VIGNAN'S FOUNDATION FOR SCIENCE, TECHNOLOGY AND RESEARCH
            </span>
            <span className="sis-uni-sub">
              Estd. u/s 3 of UGC Act 1956 &bull; Accredited with NAAC 'A+' &bull; Vadlamudi, Guntur - 522213
            </span>
            <h1 className="sis-portal-heading">Student Information System — Parent Dashboard</h1>
          </div>
        </div>

        <div className="sis-header-right-badges">
          <div className="sis-session-pill">
            <span className="sis-pill-label">Academic Year: <strong>2026-2027</strong></span>
            <span className="sis-pill-label">Regulation: <strong>R22 CBCS</strong></span>
            <span className="sis-pill-status">ACTIVE REGULAR</span>
          </div>
          <button
            type="button"
            className="sis-print-btn"
            onClick={handlePrintDashboard}
            title="Print Official Parent Statement"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          PAGE HEAD BAR (Exact Vignan ERP header title, badge, reg-chip & actions)
          ========================================================================= */}
      <div className="page-head">
        <div className="head-title">
          <span className="parent-view-badge">
            <ShieldCheck size={14} />
            {isStaff ? "Staff Inspector View" : "Parent View — Read Only"}
          </span>
          <h1>{activeStudent.name}</h1>
          <span className="reg-chip">Regd. No: {activeStudent.roll}</span>
        </div>

        <div className="page-head-actions">
          <button
            type="button"
            className="calendar-btn"
            onClick={() => {
              if (onOpenCalendarView) {
                onOpenCalendarView();
              } else {
                setShowCalendarModal(true);
              }
            }}
            id="academicCalendarBtn"
          >
            <Calendar size={14} />
            <span>Academic Calendar</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 13px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.82rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
            }}
            onClick={() => setShowMailboxModal(true)}
            id="studentVUMailboxBtn"
            title={`Open Official VU Mailbox for vu.${activeStudent.roll.toLowerCase()}@gmail.com`}
          >
            <Mail size={14} />
            <span>VU Mailbox</span>
            {mailboxNotices.filter((n) => !n.isRead).length > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontWeight: 800
                }}
              >
                {mailboxNotices.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>

          <button
            type="button"
            className="fb-dash-btn"
            onClick={() => setShowFeedbackModal(true)}
            id="studentFeedbackBtn"
          >
            <MessageSquare size={14} />
            <span>Student Feedback</span>
          </button>

          {isStaff && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="sis-inspector-box" style={{ margin: 0 }}>
                <label htmlFor="sisInspectorSecSelect" className="sis-inspector-title">
                  <Layers size={13} />
                  <span>Section:</span>
                </label>
                <select
                  id="sisInspectorSecSelect"
                  className="sis-inspector-select"
                  value={inspectorSection}
                  onChange={(e) => {
                    const sec = Number(e.target.value);
                    setInspectorSection(sec);
                    const firstInSec = students.find((s) => s.sectionNum === sec);
                    if (firstInSec) setSelectedRoll(firstInSec.roll);
                  }}
                >
                  {SECTIONS.map((s) => (
                    <option key={s.sectionNum} value={s.sectionNum}>
                      {s.section} ({s.studentCount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sis-inspector-box" style={{ margin: 0 }}>
                <label htmlFor="sisInspectorSelect" className="sis-inspector-title">
                  <Search size={13} />
                  <span>Student:</span>
                </label>
                <select
                  id="sisInspectorSelect"
                  className="sis-inspector-select"
                  value={activeStudent.roll}
                  onChange={(e) => setSelectedRoll(e.target.value)}
                >
                  {students
                    .filter((s) => !inspectorSection || s.sectionNum === inspectorSection)
                    .map((s) => (
                      <option key={s.roll} value={s.roll}>
                        {s.roll} - {s.name} ({s.section})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          PROFILE GRID (Signature Vignan ERP 1.05fr : 1.5fr Hero Layout)
          Left: Accordion Stack (Student, Parent, Counselor, Standing)
          Right: 6-Card Academic Stat Grid (Attendance, CGPA, SGPA, Backlogs, Credits, Fees)
          ========================================================================= */}
      <div className="profile-grid">
        {/* Left Column: .detail-stack */}
        <div className="detail-stack">
          {/* Block 1: Student Particulars */}
          <div className="detail-block">
            <button
              type="button"
              className={`detail-card ${openAccordions.particulars ? "is-open" : ""}`}
              onClick={() => toggleAccordion("particulars")}
              aria-expanded={openAccordions.particulars}
            >
              <div className="icon-wrap">
                <GraduationCap size={18} />
              </div>
              <div className="text">
                <div className="title">Student Particulars</div>
              </div>
              <span className="arrow">▶</span>
            </button>
            <div className={`detail-panel ${openAccordions.particulars ? "open" : ""}`}>
              <dl className="panel-inner">
                <div>
                  <dt>Registration No</dt>
                  <dd className="font-mono">{activeStudent.roll}</dd>
                </div>
                <div>
                  <dt>Full Name</dt>
                  <dd>{activeStudent.name}</dd>
                </div>
                <div>
                  <dt>Programme & Branch</dt>
                  <dd>B.Tech — CSE</dd>
                </div>
                <div>
                  <dt>Year & Semester</dt>
                  <dd>III Year — I Sem</dd>
                </div>
                <div>
                  <dt>Section & Room</dt>
                  <dd>{activeStudent.section || "Section 1"} ({activeStudent.room || "Room N-402"})</dd>
                </div>
                <div>
                  <dt>Academic Regulation</dt>
                  <dd>R22 CBCS</dd>
                </div>
                <div>
                  <dt>Official Student Gmail</dt>
                  <dd style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                    <span className="font-mono text-primary" style={{ color: "#4f46e5", fontWeight: "700", fontSize: "0.85rem" }}>
                      vu.{activeStudent.roll.toLowerCase()}@gmail.com
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMailboxModal(true)}
                      style={{
                        background: "#ede9fe",
                        color: "#6d28d9",
                        border: "1px solid #c4b5fd",
                        borderRadius: "6px",
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="View Official Absence Alerts in VU Mailbox"
                    >
                      <Mail size={12} />
                      <span>Inbox ({mailboxNotices.length})</span>
                    </button>
                    <a
                      href={`https://mail.google.com/mail/u/?authuser=vu.${activeStudent.roll.toLowerCase()}@gmail.com`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#f1f5f9",
                        color: "#475569",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Open in Gmail Webmail Client"
                    >
                      <span>Gmail</span>
                      <ExternalLink size={11} />
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Block 2: Parent & Residence Details */}
          <div className="detail-block">
            <button
              type="button"
              className={`detail-card ${openAccordions.parent ? "is-open" : ""}`}
              onClick={() => toggleAccordion("parent")}
              aria-expanded={openAccordions.parent}
            >
              <div className="icon-wrap">
                <Users size={18} />
              </div>
              <div className="text">
                <div className="title">Parent & Residence Details</div>
              </div>
              <span className="arrow">▶</span>
            </button>
            <div className={`detail-panel ${openAccordions.parent ? "open" : ""}`}>
              <dl className="panel-inner">
                <div>
                  <dt>Father's Name</dt>
                  <dd>Mr. K. Venkateswara Rao</dd>
                </div>
                <div>
                  <dt>Mother's Name</dt>
                  <dd>Mrs. K. Lakshmi</dd>
                </div>
                <div>
                  <dt>Parent Mobile</dt>
                  <dd className="font-mono">+91 98480 12345</dd>
                </div>
                <div>
                  <dt>Residence Type</dt>
                  <dd>Day Scholar (Guntur Route 14)</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Block 3: Counselor & Mentorship */}
          <div className="detail-block">
            <button
              type="button"
              className={`detail-card ${openAccordions.counselor ? "is-open" : ""}`}
              onClick={() => toggleAccordion("counselor")}
              aria-expanded={openAccordions.counselor}
            >
              <div className="icon-wrap">
                <Compass size={18} />
              </div>
              <div className="text">
                <div className="title">Counselor & Mentorship</div>
              </div>
              <span className="arrow">▶</span>
            </button>
            <div className={`detail-panel ${openAccordions.counselor ? "open" : ""}`}>
              <dl className="panel-inner">
                <div>
                  <dt>Counselor Name</dt>
                  <dd style={{ fontWeight: 700, color: "var(--accent-primary)" }}>
                    {activeStudent.counsellor || "Dr. P. Siva Prasad"}
                  </dd>
                </div>
                <div>
                  <dt>Department</dt>
                  <dd>Computer Science & Engineering</dd>
                </div>
                <div>
                  <dt>Cabin Location</dt>
                  <dd>Room N-412 (N-Block)</dd>
                </div>
                <div>
                  <dt>Counselor Contact</dt>
                  <dd className="font-mono">+91 90004 43503</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Block 4: Academic Standing & Clearance */}
          <div className="detail-block">
            <button
              type="button"
              className={`detail-card ${openAccordions.standing ? "is-open" : ""}`}
              onClick={() => toggleAccordion("standing")}
              aria-expanded={openAccordions.standing}
            >
              <div className="icon-wrap">
                <FileCheck size={18} />
              </div>
              <div className="text">
                <div className="title">Academic Standing & Clearance</div>
              </div>
              <span className="arrow">▶</span>
            </button>
            <div className={`detail-panel ${openAccordions.standing ? "open" : ""}`}>
              <dl className="panel-inner">
                <div>
                  <dt>Academic Status</dt>
                  <dd className="text-success font-bold">Active & Regular</dd>
                </div>
                <div>
                  <dt>Hall Ticket Eligibility</dt>
                  <dd className="text-success font-bold">Cleared (Eligible)</dd>
                </div>
                <div>
                  <dt>Library Records</dt>
                  <dd>Nil Dues (Cleared)</dd>
                </div>
                <div>
                  <dt>Laboratory Records</dt>
                  <dd>100% Certified</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Column: .stat-grid (2 columns x 3 rows of 6 cards) */}
        <div className="stat-grid">
          {/* Card 1: Attendance Percentage */}
          <div className="stat-card">
            <div
              className="icon-wrap stat-pct"
              style={{
                background:
                  stats.overallPct >= 75
                    ? "linear-gradient(135deg, #059669, #10b981)"
                    : stats.overallPct >= 65
                    ? "linear-gradient(135deg, #d97706, #f59e0b)"
                    : "linear-gradient(135deg, #dc2626, #ef4444)"
              }}
            >
              {stats.overallPct}%
            </div>
            <div className="label">Cumulative Attendance</div>
          </div>

          {/* Card 2: Cumulative GPA */}
          <div className="stat-card">
            <div className="icon-wrap stat-pct">8.72</div>
            <div className="label">Cumulative GPA (CGPA)</div>
          </div>

          {/* Card 3: Semester GPA */}
          <div className="stat-card">
            <div className="icon-wrap stat-pct">8.85</div>
            <div className="label">Semester GPA (SGPA)</div>
          </div>

          {/* Card 4: Active Backlogs */}
          <div className="stat-card">
            <div
              className="icon-wrap stat-pct"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
            >
              0
            </div>
            <div className="label">Active Backlogs</div>
          </div>

          {/* Card 5: Credits Earned */}
          <div className="stat-card">
            <div className="icon-wrap stat-pct">76/160</div>
            <div className="label">Credits Earned</div>
          </div>

          {/* Card 6: Fee Clearance */}
          <div className="stat-card">
            <div
              className="icon-wrap stat-pct"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
            >
              ₹ 0
            </div>
            <div className="label">Fee Clearance</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COMPLETION / ACADEMIC PORTFOLIO SECTION (Exact Vignan ERP .completion-section)
          ========================================================================= */}
      <section className="completion-section" aria-label="Student Academic Portfolio">
        <div className="completion-head">
          <h2>
            Student Academic Portfolio <span>VFSTR</span>
          </h2>
          <p>Institutional milestones, continuous internal evaluations, and compliance records</p>
        </div>

        <div className="completion-list">
          {/* Item 1: Attendance Compliance */}
          <div className={`completion-item ${openPortfolio.attendance ? "open" : ""}`}>
            <button
              type="button"
              className="completion-row"
              onClick={() => togglePortfolio("attendance")}
              aria-expanded={openPortfolio.attendance}
            >
              <div className="cr-icon">
                <CheckCircle2 size={18} />
              </div>
              <div className="cr-name">Biometric Attendance Compliance</div>
              <div className="cr-count font-mono">
                {stats.overallPct >= 75 ? "Compliant (+75%)" : "Shortage (<75%)"}
              </div>
            </button>
            <div className="completion-sublist">
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  Classes Conducted: {stats.totalClassesHeld} &bull; Attended: {stats.attendedCount}
                </div>
                <div className="sr-count font-mono font-bold text-success">{stats.overallPct}%</div>
              </div>
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  Approved On-Duty (OD) Sessions
                </div>
                <div className="sr-count font-mono">2 Days Credited</div>
              </div>
            </div>
          </div>

          {/* Item 2: Continuous Internal Evaluation (CIE) */}
          <div className={`completion-item ${openPortfolio.cie ? "open" : ""}`}>
            <button
              type="button"
              className="completion-row"
              onClick={() => togglePortfolio("cie")}
              aria-expanded={openPortfolio.cie}
            >
              <div className="cr-icon">
                <Award size={18} />
              </div>
              <div className="cr-name">Continuous Internal Evaluation (CIE)</div>
              <div className="cr-count font-mono">36.5 / 40 Avg</div>
            </button>
            <div className="completion-sublist">
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  Mid-I Sessional Examination
                </div>
                <div className="sr-count font-mono font-bold">27.6 / 30 Avg</div>
              </div>
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  Mid-II Sessional Examination
                </div>
                <div className="sr-count font-mono font-bold">28.2 / 30 Avg</div>
              </div>
            </div>
          </div>

          {/* Item 3: Laboratory & Practical Assessments */}
          <div className={`completion-item ${openPortfolio.labs ? "open" : ""}`}>
            <button
              type="button"
              className="completion-row"
              onClick={() => togglePortfolio("labs")}
              aria-expanded={openPortfolio.labs}
            >
              <div className="cr-icon">
                <Layers size={18} />
              </div>
              <div className="cr-name">Laboratory Assessments & Continuous Viva</div>
              <div className="cr-count font-mono">100% Certified</div>
            </button>
            <div className="completion-sublist">
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  Operating Systems Lab (21CS304)
                </div>
                <div className="sr-count font-mono text-success font-bold">Grade O</div>
              </div>
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  DBMS & SQL Practice Lab (21CS305)
                </div>
                <div className="sr-count font-mono text-success font-bold">Grade A+</div>
              </div>
            </div>
          </div>

          {/* Item 4: Co-Curricular & NPTEL MOOCs */}
          <div className={`completion-item ${openPortfolio.moocs ? "open" : ""}`}>
            <button
              type="button"
              className="completion-row"
              onClick={() => togglePortfolio("moocs")}
              aria-expanded={openPortfolio.moocs}
            >
              <div className="cr-icon">
                <BookOpen size={18} />
              </div>
              <div className="cr-name">Co-Curricular & NPTEL / SWAYAM MOOCs</div>
              <div className="cr-count font-mono">2 Certifications</div>
            </button>
            <div className="completion-sublist">
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  NPTEL Cloud Computing (12 Weeks)
                </div>
                <div className="sr-count font-mono text-primary font-bold">Elite Gold (88%)</div>
              </div>
              <div className="sub-row">
                <div className="sr-name">
                  <Check size={12} style={{ display: "inline", marginRight: 6, color: "#10b981" }} />
                  Smart India Hackathon Finalist
                </div>
                <div className="sr-count font-mono text-primary font-bold">National Finalist</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          VIGNAN SIS PARENT DASHBOARD TABS
          ========================================================================= */}
      <nav className="sis-nav-tabs" role="tablist" aria-label="Student Information System Sections">
        <button
          type="button"
          className={`sis-tab ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
          id="sisTabAttendance"
          role="tab"
          aria-selected={activeTab === "attendance"}
        >
          <TrendingUp size={16} />
          <span>Attendance Details</span>
        </button>

        <button
          type="button"
          className={`sis-tab ${activeTab === "marks" ? "active" : ""}`}
          onClick={() => setActiveTab("marks")}
          id="sisTabMarks"
          role="tab"
          aria-selected={activeTab === "marks"}
        >
          <Award size={16} />
          <span>Continuous Evaluation & Marks</span>
        </button>

        <button
          type="button"
          className={`sis-tab ${activeTab === "timetable" ? "active" : ""}`}
          onClick={() => setActiveTab("timetable")}
          id="sisTabTimetable"
          role="tab"
          aria-selected={activeTab === "timetable"}
        >
          <Clock size={16} />
          <span>Time Table Schedule</span>
        </button>

        <button
          type="button"
          className={`sis-tab ${activeTab === "fees" ? "active" : ""}`}
          onClick={() => setActiveTab("fees")}
          id="sisTabFees"
          role="tab"
          aria-selected={activeTab === "fees"}
        >
          <CreditCard size={16} />
          <span>Fee Particulars & Dues</span>
        </button>

        <button
          type="button"
          className={`sis-tab ${activeTab === "counselor" ? "active" : ""}`}
          onClick={() => setActiveTab("counselor")}
          id="sisTabCounselor"
          role="tab"
          aria-selected={activeTab === "counselor"}
        >
          <Phone size={16} />
          <span>Counselor Diary</span>
        </button>

        <button
          type="button"
          className={`sis-tab ${activeTab === "od" ? "active" : ""}`}
          onClick={() => setActiveTab("od")}
          id="sisTabOd"
          role="tab"
          aria-selected={activeTab === "od"}
        >
          <FileText size={16} />
          <span>Apply On-Duty / Leave</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: ATTENDANCE DETAILS (Signature Vignan SIS Parent View)
          ========================================================================= */}
      {activeTab === "attendance" && (
        <div className="sis-tab-content-panel" role="tabpanel" aria-labelledby="sisTabAttendance">
          {/* Signature Vignan Date Range Filter Bar */}
          <div className="sis-filter-strip">
            <div className="sis-filter-title">
              <Filter size={15} />
              <span>DATE-RANGE ATTENDANCE FILTER:</span>
            </div>
            <div className="sis-filter-inputs">
              <div className="sis-input-block">
                <label htmlFor="sisFromDate">From Date:</label>
                <input
                  type="date"
                  id="sisFromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="sis-date-input"
                />
              </div>
              <div className="sis-input-block">
                <label htmlFor="sisToDate">To Date:</label>
                <input
                  type="date"
                  id="sisToDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="sis-date-input"
                />
              </div>
              <div className="sis-input-block">
                <label htmlFor="sisSubSelect">Course / Subject:</label>
                <select
                  id="sisSubSelect"
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="sis-sub-select"
                >
                  <option value="ALL">All Enrolled Courses (6 Courses)</option>
                  {stats.subjectList.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-secondary sis-btn-apply"
                onClick={() => {
                  if (onShowToast) onShowToast("Attendance records filtered for selected date range.", "info");
                }}
              >
                Apply Range Filter
              </button>
            </div>
          </div>

          {/* 4 KPI Cards: Periods Held, Attended, Absent, Cumulative % */}
          <div className="sis-metric-tiles-row">
            <div className="sis-metric-tile">
              <div className="sis-tile-icon-box">
                <Calendar size={20} />
              </div>
              <div className="sis-tile-data">
                <span className="sis-tile-val font-mono">{stats.totalClassesHeld}</span>
                <span className="sis-tile-lbl">TOTAL PERIODS HELD</span>
              </div>
            </div>

            <div className="sis-metric-tile present-tile">
              <div className="sis-tile-icon-box present-icon">
                <CheckCircle2 size={20} />
              </div>
              <div className="sis-tile-data">
                <span className="sis-tile-val font-mono text-success">{stats.attendedCount}</span>
                <span className="sis-tile-lbl">PERIODS ATTENDED</span>
              </div>
            </div>

            <div className="sis-metric-tile absent-tile">
              <div className="sis-tile-icon-box absent-icon">
                <XCircle size={20} />
              </div>
              <div className="sis-tile-data">
                <span className="sis-tile-val font-mono text-danger">{stats.absentCount}</span>
                <span className="sis-tile-lbl">PERIODS ABSENT</span>
              </div>
            </div>

            <div className="sis-metric-tile aggregate-tile">
              <div className="sis-tile-icon-box agg-icon">
                <Percent size={20} />
              </div>
              <div className="sis-tile-data">
                <span
                  className={`sis-tile-val font-mono ${
                    stats.overallPct >= 75
                      ? "text-success"
                      : stats.overallPct >= 65
                      ? "text-warning"
                      : "text-danger"
                  }`}
                >
                  {stats.overallPct}%
                </span>
                <span className="sis-tile-lbl">CUMULATIVE ATTENDANCE</span>
              </div>
            </div>
          </div>

          {/* 75% Regulation Notice Banner */}
          <div
            className={`sis-regulation-alert ${
              stats.overallPct >= 75 ? "alert-safe" : "alert-warning"
            }`}
          >
            <div className="alert-badge-icon">
              {stats.overallPct >= 75 ? <CheckSquare size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div className="alert-content-meta">
              <h4>
                VFSTR ATTENDANCE REGULATION NOTICE: Minimum 75% Aggregate Required for Semester End Examinations
              </h4>
              <p>
                {stats.overallPct >= 75 ? (
                  <>
                    Student has maintained <strong>{stats.overallPct}%</strong> cumulative attendance, satisfying the university requirement.{" "}
                    <strong>Safe Margin:</strong> Can afford up to <strong>{stats.safeMargin}</strong> period absences without slipping below 75%.
                  </>
                ) : (
                  <>
                    <strong className="text-danger">ATTENDANCE SHORTAGE DETECTED ({stats.overallPct}%):</strong> Student is currently below the mandatory 75% limit.{" "}
                    <strong>Required Action:</strong> Must attend the next <strong>{stats.classesToAttend}</strong> consecutive scheduled periods to restore eligibility without condonation fines.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Subject-Wise Cumulative Table */}
          <div className="sis-table-card">
            <div className="sis-card-header">
              <h3>SUBJECT-WISE CUMULATIVE ATTENDANCE STATEMENT</h3>
              <span className="sis-card-sub font-mono">OD CREDITS INCLUDED &bull; SECTION 1 (CSE)</span>
            </div>

            <div className="sis-table-responsive">
              <table className="sis-data-table">
                <thead>
                  <tr>
                    <th>COURSE CODE</th>
                    <th>SUBJECT TITLE</th>
                    <th>TYPE</th>
                    <th>FACULTY INCHARGE</th>
                    <th className="text-center">HELD</th>
                    <th className="text-center">ATTENDED</th>
                    <th className="text-center">ABSENT</th>
                    <th className="text-center">OD</th>
                    <th className="text-center">PERCENTAGE</th>
                    <th className="text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.code}>
                      <td className="font-mono font-bold text-primary">{sub.code}</td>
                      <td className="font-bold">{sub.name}</td>
                      <td>
                        <span className={`badge-pill ${sub.type === "Practical" ? "badge-pill-lab" : "badge-pill-theory"}`}>
                          {sub.type}
                        </span>
                      </td>
                      <td className="text-muted">{sub.faculty}</td>
                      <td className="text-center font-mono font-bold">{sub.held}</td>
                      <td className="text-center font-mono text-success font-bold">{sub.attended}</td>
                      <td className="text-center font-mono text-danger font-bold">{sub.absent}</td>
                      <td className="text-center font-mono text-warning font-bold">{sub.od}</td>
                      <td className="text-center font-mono font-bold">
                        <span
                          className={`pct-badge ${
                            sub.pct >= 75
                              ? "pct-badge-safe"
                              : sub.pct >= 65
                              ? "pct-badge-warning"
                              : "pct-badge-danger"
                          }`}
                        >
                          {sub.pct}%
                        </span>
                      </td>
                      <td className="text-center">
                        {sub.pct >= 75 ? (
                          <span className="badge-tag-safe font-bold">ELIGIBLE</span>
                        ) : (
                          <span className="badge-tag-danger font-bold">SHORTAGE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Day-to-Day Period Log */}
          <div className="sis-table-card" style={{ marginTop: 24 }}>
            <div className="sis-card-header">
              <h3>DAY-TO-DAY PERIOD ATTENDANCE LOG</h3>
              <span className="sis-card-sub font-mono">TIMETABLE SESSION VERIFICATION</span>
            </div>

            {sessions.length === 0 ? (
              <div className="sis-empty-note">
                <Info size={18} />
                <span>No active attendance sessions recorded yet for Section 1. Sessions marked by faculty will appear here instantly.</span>
              </div>
            ) : (
              <div className="sis-table-responsive">
                <table className="sis-data-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>PERIOD</th>
                      <th>SUBJECT</th>
                      <th>FACULTY</th>
                      <th className="text-center">STUDENT STATUS</th>
                      <th>REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 15).map((sess) => {
                      const studentStatus = sess.attendance?.[activeStudent.roll] || "absent";
                      const isPresent = studentStatus === "present";
                      return (
                        <tr key={sess.id}>
                          <td className="font-mono font-bold">{sess.date}</td>
                          <td className="font-mono">Period {sess.period}</td>
                          <td className="font-bold text-primary">{sess.subject}</td>
                          <td className="text-muted">{sess.facultyName || "Faculty Incharge"}</td>
                          <td className="text-center">
                            {isPresent ? (
                              <span className="badge-tag-safe font-mono font-bold">PRESENT</span>
                            ) : (
                              <span className="badge-tag-danger font-mono font-bold">ABSENT</span>
                            )}
                          </td>
                          <td className="text-muted text-sm">
                            {isPresent ? "Biometric / Roll verified" : "Unexcused Absence"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONTINUOUS EVALUATION & MARKS (CIE Mid-I, Mid-II, Quiz)
          ========================================================================= */}
      {activeTab === "marks" && (
        <div className="sis-tab-content-panel" role="tabpanel" aria-labelledby="sisTabMarks">
          <div className="sis-table-card">
            <div className="sis-card-header">
              <h3>CONTINUOUS INTERNAL EVALUATION (CIE) & SESSIONAL MARKS</h3>
              <span className="sis-card-sub font-mono">MAXIMUM INTERNAL WEIGHTAGE: 40 MARKS</span>
            </div>

            <div className="sis-table-responsive">
              <table className="sis-data-table">
                <thead>
                  <tr>
                    <th>COURSE CODE</th>
                    <th>SUBJECT TITLE</th>
                    <th>FACULTY INCHARGE</th>
                    <th className="text-center">MID-I (30M)</th>
                    <th className="text-center">MID-II (30M)</th>
                    <th className="text-center">QUIZ / ASSIGN (10M)</th>
                    <th className="text-center">TOTAL CIE (40M)</th>
                    <th className="text-center">PROJECTED GRADE</th>
                    <th className="text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {internalMarks.map((m) => (
                    <tr key={m.code}>
                      <td className="font-mono font-bold text-primary">{m.code}</td>
                      <td className="font-bold">{m.name}</td>
                      <td className="text-muted">{m.faculty}</td>
                      <td className="text-center font-mono font-bold">{m.mid1} / 30</td>
                      <td className="text-center font-mono font-bold">{m.mid2} / 30</td>
                      <td className="text-center font-mono font-bold">{m.quiz} / 10</td>
                      <td className="text-center font-mono font-bold text-primary" style={{ fontSize: "1.05rem" }}>
                        {m.total} / 40
                      </td>
                      <td className="text-center">
                        <span className="pct-badge pct-badge-safe font-mono font-bold">{m.grade}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge-tag-safe font-bold font-mono">{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TIME TABLE SCHEDULE (Room N-407 Weekly Matrix)
          ========================================================================= */}
      {activeTab === "timetable" && (
        <div className="sis-tab-content-panel" role="tabpanel" aria-labelledby="sisTabTimetable">
          <div className="sis-table-card">
            <div className="sis-card-header">
              <h3>{(activeStudent.section || "SECTION 1").toUpperCase()} — CLASS TIME TABLE ({activeStudent.room || "ROOM N-402"})</h3>
              <span className="sis-card-sub font-mono">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</span>
            </div>

            <div className="sis-table-responsive">
              <table className="sis-data-table timetable-matrix-table">
                <thead>
                  <tr>
                    <th>DAY</th>
                    <th className="text-center">PERIOD 1<br /><span className="time-sub font-mono">08:00 - 08:50</span></th>
                    <th className="text-center">PERIOD 2<br /><span className="time-sub font-mono">08:50 - 09:40</span></th>
                    <th className="text-center">PERIOD 3<br /><span className="time-sub font-mono">09:50 - 10:40</span></th>
                    <th className="text-center">PERIOD 4<br /><span className="time-sub font-mono">10:40 - 11:30</span></th>
                    <th className="text-center">PERIOD 5<br /><span className="time-sub font-mono">12:30 - 01:20</span></th>
                    <th className="text-center">PERIOD 6<br /><span className="time-sub font-mono">01:20 - 02:10</span></th>
                    <th className="text-center">PERIOD 7<br /><span className="time-sub font-mono">02:20 - 03:10</span></th>
                  </tr>
                </thead>
                <tbody>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName) => {
                    const daySchedule = SECTION_1_TIMETABLE?.[dayName] || [];
                    return (
                      <tr key={dayName}>
                        <td className="font-bold text-primary font-mono">{dayName}</td>
                        {[1, 2, 3, 4, 5, 6, 7].map((pNum) => {
                          const slot = daySchedule.find((s) => s.period === pNum);
                          return (
                            <td key={pNum} className="text-center timetable-slot-cell">
                              {slot ? (
                                <div className="slot-badge-box">
                                  <span className="slot-sub font-bold">{slot.subject}</span>
                                  <span className="slot-fac text-muted font-mono">{slot.faculty || "Faculty"}</span>
                                  <span className="slot-room font-mono">N-407</span>
                                </div>
                              ) : (
                                <span className="text-muted font-mono" style={{ fontSize: "0.75rem" }}>
                                  Library / Sports
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: FEE PARTICULARS & CLEARANCE
          ========================================================================= */}
      {activeTab === "fees" && (
        <div className="sis-tab-content-panel" role="tabpanel" aria-labelledby="sisTabFees">
          <div className="sis-table-card">
            <div className="sis-card-header">
              <h3>TUITION & INSTITUTIONAL FEE PARTICULARS (ACADEMIC YEAR 2026-27)</h3>
              <span className="sis-card-sub font-mono">RECEIPT VERIFICATION & HALL TICKET STATUS</span>
            </div>

            <div className="sis-table-responsive">
              <table className="sis-data-table">
                <thead>
                  <tr>
                    <th>FEE HEAD</th>
                    <th>CHALLAN / RECEIPT NO</th>
                    <th>PAYMENT DATE</th>
                    <th>MODE</th>
                    <th className="text-right">FEE DEMAND</th>
                    <th className="text-right">AMOUNT PAID</th>
                    <th className="text-right">BALANCE DUE</th>
                    <th className="text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">Annual Tuition Fee (Merit Concession Applied)</td>
                    <td className="font-mono text-primary font-bold">VFSTR/2026/TF-90421</td>
                    <td className="font-mono">2026-06-24</td>
                    <td>Online NetBanking (ICICI)</td>
                    <td className="text-right font-mono">₹ 1,10,000</td>
                    <td className="text-right font-mono text-success font-bold">₹ 1,10,000</td>
                    <td className="text-right font-mono font-bold">₹ 0</td>
                    <td className="text-center"><span className="badge-tag-safe font-bold font-mono">PAID & CLEARED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Semester Examination & Sessional Evaluation Fee</td>
                    <td className="font-mono text-primary font-bold">VFSTR/2026/EX-14029</td>
                    <td className="font-mono">2026-09-12</td>
                    <td>UPI Portal (HDFC)</td>
                    <td className="text-right font-mono">₹ 2,500</td>
                    <td className="text-right font-mono text-success font-bold">₹ 2,500</td>
                    <td className="text-right font-mono font-bold">₹ 0</td>
                    <td className="text-center"><span className="badge-tag-safe font-bold font-mono">PAID & CLEARED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Laboratory & Skill Training Special Lab Fee</td>
                    <td className="font-mono text-primary font-bold">VFSTR/2026/LB-03912</td>
                    <td className="font-mono">2026-06-24</td>
                    <td>Included in Tuition</td>
                    <td className="text-right font-mono">₹ 8,000</td>
                    <td className="text-right font-mono text-success font-bold">₹ 8,000</td>
                    <td className="text-right font-mono font-bold">₹ 0</td>
                    <td className="text-center"><span className="badge-tag-safe font-bold font-mono">PAID & CLEARED</span></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: "var(--bg-tertiary)" }}>
                    <th colSpan={4} className="font-bold">TOTAL CLEARANCE STATUS:</th>
                    <th className="text-right font-mono font-bold">₹ 1,20,500</th>
                    <th className="text-right font-mono font-bold text-success">₹ 1,20,500</th>
                    <th className="text-right font-mono font-bold text-success">₹ 0</th>
                    <th className="text-center">
                      <span className="badge-tag-safe font-bold font-mono">NO DUES &bull; CLEARED</span>
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: COUNSELOR DIARY & MENTORSHIP
          ========================================================================= */}
      {activeTab === "counselor" && (
        <div className="sis-tab-content-panel" role="tabpanel" aria-labelledby="sisTabCounselor">
          <div className="sis-counselor-layout">
            <div className="sis-table-card" style={{ flex: "0 0 340px" }}>
              <div className="sis-card-header">
                <h3>FACULTY MENTOR PROFILE</h3>
              </div>
              <div className="sis-counselor-profile">
                <div className="counselor-avatar-circle">
                  <User size={30} />
                </div>
                <div className="counselor-meta-details">
                  <h4 className="counselor-full-name">{activeStudent.counsellor || "Dr. P. Siva Prasad"}</h4>
                  <span className="counselor-title">Designated Faculty Counselor & Mentor</span>
                  <span className="counselor-contact-line font-mono">{activeStudent.room || "Room N-402"} &bull; {activeStudent.section || "Section 1"}</span>
                  <span className="counselor-contact-line">counsellor@vignan.ac.in</span>
                  <div className="counselor-actions-bar">
                    <a
                      href={`https://wa.me/919000443503?text=${encodeURIComponent(`Hello ${activeStudent.counsellor || "Counselor"}, this is regarding student ${activeStudent.name} (${activeStudent.roll}) in ${activeStudent.section}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem", width: "100%", justifyContent: "center" }}
                    >
                      <MessageSquare size={14} />
                      <span>Message Counselor on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="sis-table-card" style={{ flex: 1 }}>
              <div className="sis-card-header">
                <h3>COUNSELOR INTERACTION & MENTORSHIP LOG</h3>
                <span className="sis-card-sub font-mono">PERIODIC PERFORMANCE REVIEWS</span>
              </div>
              <div className="sis-table-responsive">
                <table className="sis-data-table">
                  <thead>
                    <tr>
                      <th>MEETING DATE</th>
                      <th>TYPE</th>
                      <th>TOPICS DISCUSSED</th>
                      <th>MENTOR RECOMMENDATIONS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-mono font-bold">2026-09-22</td>
                      <td>Post Mid-I Review</td>
                      <td>Discussion on Algorithms performance and maintaining 85%+ attendance</td>
                      <td>Advised extra coding practice in Graph Dynamic Programming</td>
                      <td><span className="badge-tag-safe font-bold font-mono">COMPLETED</span></td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold">2026-08-14</td>
                      <td>Cocurricular Mentorship</td>
                      <td>Hackathon OD approval and MOOC certification enrollment</td>
                      <td>Approved 2 days OD for National Hackathon Finals</td>
                      <td><span className="badge-tag-safe font-bold font-mono">APPROVED</span></td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold">2026-07-10</td>
                      <td>Semester Induction</td>
                      <td>Semester goals, academic calendar dates and elective selections</td>
                      <td>Targeting CGPA above 8.75 for placement tier-1 eligibility</td>
                      <td><span className="badge-tag-safe font-bold font-mono">COMPLETED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: APPLY ON-DUTY (OD) / LEAVE
          ========================================================================= */}
      {activeTab === "od" && (
        <div className="sis-tab-content-panel" role="tabpanel" aria-labelledby="sisTabOd">
          <div className="sis-counselor-layout">
            <div className="sis-table-card" style={{ flex: "0 0 380px" }}>
              <div className="sis-card-header">
                <h3>SUBMIT ON-DUTY (OD) EXEMPTION</h3>
              </div>

              <form onSubmit={handleOdSubmit} className="sis-od-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="sisOdDate">
                    Event / Exemption Date
                  </label>
                  <input
                    type="date"
                    id="sisOdDate"
                    className="form-input"
                    value={odDate}
                    onChange={(e) => setOdDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sisOdReason">
                    Exemption Category / Reason
                  </label>
                  <select
                    id="sisOdReason"
                    className="form-select"
                    value={odReason}
                    onChange={(e) => setOdReason(e.target.value)}
                  >
                    <option value="Technical Symposium / Hackathon Participation">
                      Technical Symposium / Hackathon Participation
                    </option>
                    <option value="Inter-University Sports Meet / NCC / NSS">
                      Inter-University Sports Meet / NCC / NSS
                    </option>
                    <option value="Medical Emergency / Hospitalization with Medical Slip">
                      Medical Emergency / Hospitalization with Medical Slip
                    </option>
                    <option value="Placement Drive / Off-Campus Technical Interview">
                      Placement Drive / Off-Campus Technical Interview
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sisOdRemarks">
                    Description / Certificate Reference
                  </label>
                  <textarea
                    id="sisOdRemarks"
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter event name, certificate registration number, or medical slip details..."
                    value={odRemarks}
                    onChange={(e) => setOdRemarks(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                  <Send size={15} />
                  <span>Submit Application to Class Teacher</span>
                </button>
              </form>
            </div>

            <div className="sis-table-card" style={{ flex: 1 }}>
              <div className="sis-card-header">
                <h3>ON-DUTY APPLICATIONS HISTORY & APPROVAL STATUS</h3>
              </div>

              {odSubmittedList.length === 0 ? (
                <div className="sis-empty-note">
                  <Info size={16} />
                  <span>No OD requests submitted in this academic session.</span>
                </div>
              ) : (
                <div className="sis-od-history-list">
                  {odSubmittedList.map((od) => (
                    <div key={od.id} className="sis-od-history-item">
                      <div className="sis-od-meta">
                        <div className="sis-od-top-row">
                          <span className="font-bold text-primary font-mono">{od.date}</span>
                          <span className="sis-od-periods-pill">{od.periods}</span>
                        </div>
                        <span className="sis-od-cat">{od.reason}</span>
                        <span className="sis-od-rem text-muted">{od.remarks}</span>
                      </div>
                      <span className="badge-tag-safe font-bold font-mono">{od.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ACADEMIC CALENDAR (VFSTR OFFICIAL SCHEDULE)
          ========================================================================= */}
      {showCalendarModal && (
        <div className="modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={18} />
                <span>VFSTR Academic Calendar (2026-2027 Odd Semester)</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCalendarModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="panel-body">
              <table className="sis-data-table">
                <thead>
                  <tr>
                    <th>EVENT / MILESTONE</th>
                    <th>SCHEDULED DATES</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">Commencement of Class Work</td>
                    <td className="font-mono">01-07-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">COMPLETED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Continuous Internal Evaluation (Mid-I)</td>
                    <td className="font-mono">18-08-2026 to 22-08-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">COMPLETED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Mid-I Marks & Sessional Parent Notification</td>
                    <td className="font-mono">28-08-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">DISPATCHED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Continuous Internal Evaluation (Mid-II)</td>
                    <td className="font-mono">12-10-2026 to 16-10-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">COMPLETED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Dussehra Vacation</td>
                    <td className="font-mono">19-10-2026 to 24-10-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">OBSERVED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Last Instructional Day of Semester</td>
                    <td className="font-mono">05-11-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">UPCOMING</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Semester End Practical / Lab Examinations</td>
                    <td className="font-mono">09-11-2026 to 14-11-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">SCHEDULED</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Semester End Theory Examinations</td>
                    <td className="font-mono">18-11-2026 to 02-12-2026</td>
                    <td><span className="badge-tag-safe font-mono font-bold">SCHEDULED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: STUDENT FEEDBACK (VFSTR QUALITY ASSURANCE)
          ========================================================================= */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare size={18} />
                <span>Student & Parent Institutional Feedback</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowFeedbackModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="panel-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Your feedback directly assists the Internal Quality Assurance Cell (IQAC) at VFSTR in academic governance.
              </p>

              <div className="form-group">
                <label className="form-label">Overall Rating:</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        color: star <= feedbackRating ? "#f59e0b" : "#cbd5e1"
                      }}
                    >
                      <Star size={24} fill={star <= feedbackRating ? "#f59e0b" : "none"} />
                    </button>
                  ))}
                  <span style={{ marginLeft: 8, fontSize: "0.9rem", fontWeight: 700, alignSelf: "center" }}>
                    {feedbackRating} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fbCat">
                  Feedback Category:
                </label>
                <select
                  id="fbCat"
                  className="form-select"
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                >
                  <option value="Curriculum & Teaching Quality">Curriculum & Teaching Quality</option>
                  <option value="Laboratory & Infrastructure">Laboratory & Infrastructure</option>
                  <option value="Counseling & Mentorship Support">Counseling & Mentorship Support</option>
                  <option value="Examination & Evaluation Transparency">Examination & Evaluation Transparency</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fbComment">
                  Comments & Suggestions:
                </label>
                <textarea
                  id="fbComment"
                  className="form-textarea"
                  rows={4}
                  placeholder="Share your experience or suggestions for department enhancement..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                <Send size={15} />
                <span>Submit Feedback to IQAC Cell</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VU STUDENT OFFICIAL MAILBOX MODAL (vu.<roll>@gmail.com)
          ========================================================================= */}
      {showMailboxModal && (
        <div className="modal-backdrop" onClick={() => setShowMailboxModal(false)}>
          <div
            className="modal-card"
            style={{
              maxWidth: "960px",
              width: "95vw",
              height: "85vh",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mailbox Top Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
                color: "#ffffff",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Mail size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>VFSTR Student Official Mailbox</span>
                    <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", color: "#6ee7b7", padding: "2px 8px", borderRadius: "12px" }}>
                      Connected
                    </span>
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#c7d2fe", fontFamily: "monospace" }}>
                    Inbox: vu.{activeStudent.roll.toLowerCase()}@gmail.com &bull; {activeStudent.name}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <a
                  href={`https://mail.google.com/mail/u/?authuser=vu.${activeStudent.roll.toLowerCase()}@gmail.com`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.8rem",
                    textDecoration: "none"
                  }}
                  title="Open in official Google Gmail web client"
                >
                  <span>Open in Gmail</span>
                  <ExternalLink size={13} />
                </a>
                <button
                  type="button"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#ffffff",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem"
                  }}
                  onClick={() => setShowMailboxModal(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Mailbox Body (Split Screen: Left List, Right Message) */}
            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
              {/* Left Side: Message List */}
              <div
                style={{
                  width: "360px",
                  borderRight: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  background: "#f8fafc"
                }}
              >
                {/* Search / Filter Header */}
                <div style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                    Official Notices ({mailboxNotices.length})
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setMailboxFilter("ALL")}
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background: mailboxFilter === "ALL" ? "#4f46e5" : "#e2e8f0",
                        color: mailboxFilter === "ALL" ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setMailboxFilter("UNREAD")}
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background: mailboxFilter === "UNREAD" ? "#4f46e5" : "#e2e8f0",
                        color: mailboxFilter === "UNREAD" ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Unread
                    </button>
                  </div>
                </div>

                {/* List of Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                  {mailboxNotices.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748b" }}>
                      <CheckCircle2 size={36} color="#10b981" style={{ margin: "0 auto 12px" }} />
                      <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem", color: "#1e293b" }}>Inbox Zero</h4>
                      <p style={{ margin: 0, fontSize: "0.78rem" }}>
                        No absence warnings have been issued for your roll number. Keep up your regular attendance!
                      </p>
                    </div>
                  ) : (
                    mailboxNotices
                      .filter((n) => (mailboxFilter === "UNREAD" ? !n.isRead : true))
                      .map((notice) => {
                        const isSelected = selectedNotice?.id === notice.id;
                        return (
                          <div
                            key={notice.id}
                            onClick={() => {
                              setSelectedNotice(notice);
                              markMailNoticeAsRead(notice.id);
                              setMailboxNotices((prev) =>
                                prev.map((n) => (n.id === notice.id ? { ...n, isRead: true } : n))
                              );
                            }}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "10px",
                              marginBottom: "6px",
                              cursor: "pointer",
                              background: isSelected ? "#eef2ff" : "#ffffff",
                              border: isSelected ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                              transition: "all 0.15s ease",
                              position: "relative"
                            }}
                          >
                            {!notice.isRead && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "10px",
                                  right: "10px",
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  background: "#ef4444"
                                }}
                              />
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e293b" }}>
                                Academic Affairs
                              </span>
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                {notice.date}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.8rem", fontWeight: notice.isRead ? 500 : 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>
                              Period {notice.period}: {notice.subject}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "0.68rem", background: "#fee2e2", color: "#b91c1c", fontWeight: 700, padding: "1px 6px", borderRadius: "4px" }}>
                                ABSENT RECORDED
                              </span>
                              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                {notice.facultyName}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Right Side: Message Reader */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff", overflowY: "auto", padding: "24px" }}>
                {selectedNotice ? (
                  <div>
                    {/* Email Letterhead */}
                    <div style={{ borderBottom: "2px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: "0 0 6px 0" }}>
                            {selectedNotice.subjectLine || `Official Absence Alert: Period ${selectedNotice.period} (${selectedNotice.subject})`}
                          </h2>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.8rem", color: "#64748b" }}>
                            <span><strong>From:</strong> Office of the Dean (Academic Affairs) &lt;attendance@vignan.ac.in&gt;</span>
                            <span>&bull;</span>
                            <span><strong>To:</strong> <code style={{ color: "#4f46e5" }}>{selectedNotice.recipientEmail || `vu.${activeStudent.roll.toLowerCase()}@gmail.com`}</code></span>
                          </div>
                        </div>
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "16px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <CheckCircle2 size={13} />
                          Delivered to Inbox
                        </span>
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        Timestamp: {new Date(selectedNotice.sentAt || Date.now()).toLocaleString()} &bull; Message-ID: &lt;{selectedNotice.id}@sis.vignan.ac.in&gt;
                      </div>
                    </div>

                    {/* Class Parameter Cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "10px",
                        background: "#f8fafc",
                        padding: "14px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        marginBottom: "20px"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Class Date</span>
                        <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>{selectedNotice.date}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Period Slot</span>
                        <strong style={{ fontSize: "0.85rem", color: "#4f46e5" }}>Period {selectedNotice.period}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Subject / Course</span>
                        <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>{selectedNotice.subject}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Academic Section</span>
                        <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>{selectedNotice.section || activeStudent.section}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Instructor In-Charge</span>
                        <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>{selectedNotice.facultyName || "Course Faculty"}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Faculty Contact</span>
                        <strong style={{ fontSize: "0.85rem", color: "#16a34a" }}>{selectedNotice.facultyPhone || "+919000443503"}</strong>
                      </div>
                    </div>

                    {/* Formal University Warning Body */}
                    <div
                      style={{
                        lineHeight: "1.65",
                        fontSize: "0.88rem",
                        color: "#334155",
                        whiteSpace: "pre-line",
                        background: "#ffffff",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid #f1f5f9",
                        marginBottom: "20px"
                      }}
                    >
                      {selectedNotice.messageBody}
                    </div>

                    {/* Action Buttons for Student */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                      <a
                        href={`https://wa.me/${(selectedNotice.facultyPhone || "+919000443503").replace(/\D/g, "")}?text=${encodeURIComponent(`Respected Sir, this is ${activeStudent.name} (${activeStudent.roll}) regarding my absence in Period ${selectedNotice.period} (${selectedNotice.subject}) on ${selectedNotice.date}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm"
                        style={{ background: "#25d366", color: "#ffffff", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                      >
                        <Phone size={14} />
                        <span>WhatsApp Course Faculty</span>
                      </a>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setShowMailboxModal(false);
                          setActiveTab("od");
                          setOdDate(selectedNotice.date);
                          setOdRemarks(`Exemption requested for Period ${selectedNotice.period} (${selectedNotice.subject})`);
                          if (onShowToast) onShowToast("Auto-filled OD exemption application for this absence!", "info");
                        }}
                      >
                        <FileText size={14} />
                        <span>Apply for OD / Medical Exemption</span>
                      </button>

                      <a
                        href={`https://mail.google.com/mail/u/?authuser=vu.${activeStudent.roll.toLowerCase()}@gmail.com`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                      >
                        <ExternalLink size={14} />
                        <span>Open in Google Mailbox</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", margin: "auto", color: "#64748b" }}>
                    <Mail size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                    <h4>Select a notice to view</h4>
                    <p style={{ fontSize: "0.85rem" }}>
                      Official absence notifications sent to vu.{activeStudent.roll.toLowerCase()}@gmail.com are audited here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SIS FOOTER NOTICE
          ========================================================================= */}
      <footer className="sis-footer-card">
        <p>
          &copy; 2026 VFSTR &bull; Vignan's Foundation for Science, Technology and Research (Deemed to be University) &bull; All Rights Reserved.
          <br />
          For any discrepancies in attendance, marks, or fees, please contact your Class Teacher (Dr. P. Siva Prasad) or Department HOD.
        </p>
      </footer>
    </div>
  );
}
