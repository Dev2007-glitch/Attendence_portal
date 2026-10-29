import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck,
  Download,
  Share2,
  Search,
  Bell,
  Mail,
  User,
  X,
  Eye,
  Check,
  Star,
  Layers,
  Shield,
  Briefcase,
  DollarSign,
  Grid,
  Settings,
  Home,
  MessageSquare,
  HelpCircle,
  ExternalLink
} from "lucide-react";

export default function AcademicCalendarView({
  currentUser,
  onShowToast,
  onSwitchView
}) {
  // Calendar Month Navigation
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 3, 1)); // April 2026 as per Image 2 reference
  const [selectedDay, setSelectedDay] = useState(29); // Highlighted active day

  // Modal State for Image 2 "New event" dialog
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("Weekly Strategic Planning");
  const [eventCategory, setEventCategory] = useState("IMPORTANT");
  const [eventFrom, setEventFrom] = useState("08:00, Wed, 15 Apr");
  const [eventTo, setEventTo] = useState("14:00, Mon, 20 Apr");
  const [selectedMembers, setSelectedMembers] = useState([
    { id: 1, name: "Dr. P. Siva Prasad", role: "Class Teacher" },
    { id: 2, name: "Dr. K. Venkatesh", role: "HOD CSE" },
    { id: 3, name: "Section 1 Council", role: "Students" }
  ]);

  // Request Approval Modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalReason, setApprovalReason] = useState("Hackathon / On-Duty Attendance Exemption");

  // Document Viewer Modal
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Calendar Events Store (initialized with Image 2 + VFSTR Section 1 events)
  const [events, setEvents] = useState([
    {
      id: "ev1",
      day: 1,
      month: 3,
      year: 2026,
      time: "08:00",
      title: "Meeting Vue...",
      type: "green",
      badge: "DEV"
    },
    {
      id: "ev2",
      day: 1,
      month: 3,
      year: 2026,
      time: "09:30",
      title: "Dev. Stage",
      type: "green",
      badge: "DEV"
    },
    {
      id: "ev3",
      day: 5,
      month: 3,
      year: 2026,
      time: "08:00",
      title: "Demo Call",
      type: "pink",
      badge: "LECTURE"
    },
    {
      id: "ev4",
      day: 5,
      month: 3,
      year: 2026,
      time: "12:00",
      title: "Meeting With...",
      type: "green",
      badge: "IMPORTANT"
    },
    {
      id: "ev5",
      day: 7,
      month: 3,
      year: 2026,
      time: "09:00",
      title: "HS Birthday",
      type: "celebration",
      emoji: "🎈",
      isSpecial: true
    },
    {
      id: "ev6",
      day: 10,
      month: 3,
      year: 2026,
      time: "16:00",
      title: "Forest Biking",
      type: "pink",
      badge: "CLUB"
    },
    {
      id: "ev7",
      day: 15,
      month: 3,
      year: 2026,
      time: "09:30",
      title: "Coaching",
      type: "pink",
      badge: "MENTOR"
    },
    {
      id: "ev8",
      day: 15,
      month: 3,
      year: 2026,
      time: "16:45",
      title: "CRM QA Test",
      type: "blue",
      badge: "LAB"
    },
    {
      id: "ev9",
      day: 21,
      month: 3,
      year: 2026,
      time: "12:00",
      title: "Meeting Vue...",
      type: "green",
      badge: "REVIEW"
    },
    {
      id: "ev10",
      day: 21,
      month: 3,
      year: 2026,
      time: "13:00",
      title: "Dev. Stage",
      type: "green",
      badge: "LAB"
    },
    {
      id: "ev11",
      day: 28,
      month: 3,
      year: 2026,
      time: "13:00",
      title: "Invoice check",
      type: "grey",
      badge: "FEES"
    },
    {
      id: "ev12",
      day: 29,
      month: 3,
      year: 2026,
      time: "17:00",
      title: "Last Friday",
      type: "celebration",
      emoji: "🥂",
      isSpecial: true
    }
  ]);

  // Tasks List (Image 2 Right Widget)
  const taskList = [
    {
      id: "t1",
      time: "08:00",
      title: "Demo Call",
      subtitle: "HS Internal",
      tag: "TEAM",
      tagColor: "pink"
    },
    {
      id: "t2",
      time: "12:00",
      title: "Meeting with partners",
      subtitle: "IKEA Norway",
      tag: "IMPORTANT",
      tagColor: "green"
    },
    {
      id: "t3",
      time: "14:30",
      title: "Marketing Reports",
      subtitle: "IKEA Norway",
      tag: "IMPORTANT",
      tagColor: "green"
    }
  ];

  // Contracts / Academic Documents (Image 2 Right Widget)
  const documentsList = [
    {
      id: "doc1",
      title: "Privacy policy v2",
      org: "Real Facture Technology · 04.06.2021",
      iconColor: "#f97316",
      type: "PDF"
    },
    {
      id: "doc2",
      title: "UE Funds compare",
      org: "BMW Germany · 08.05.2021",
      iconColor: "#ef4444",
      type: "DOC"
    },
    {
      id: "doc3",
      title: "Promotion Strategy Q2",
      org: "Real Facture Technology · 21.04.2021",
      iconColor: "#3b82f6",
      type: "PDF"
    },
    {
      id: "doc4",
      title: "Invoice",
      org: "Real Facture Technology · 14.03.2021",
      iconColor: "#10b981",
      type: "XLS"
    },
    {
      id: "doc5",
      title: "Sale 2021",
      org: "Real Facture Technology · 18.03.2021",
      iconColor: "#10b981",
      type: "XLS"
    }
  ];

  // Pinned Messages / Announcements (Image 2 Right Widget)
  const pinnedMessages = [
    {
      id: "m1",
      name: "Tom Hawk",
      avatar: "TH",
      date: "04.06.2021",
      text: "Excited to see this live! FigJam's been an awesome addition to our weekly UX Jams"
    },
    {
      id: "m2",
      name: "Alisa Stewart",
      avatar: "AS",
      date: "08.06.2021",
      text: "StarX now uses an automated mail system, check out the technology"
    }
  ];

  // Recent User Activities (Image 2 Bottom Panel)
  const userActivities = [
    {
      id: "u1",
      name: "Adam Matysiak",
      role: "Chief Executive Officer",
      email: "workmail@hsweb.com",
      company: "HighSolutions",
      date: "02.06.2021"
    },
    {
      id: "u2",
      name: "Marvin McKinney",
      role: "Sales manager",
      email: "ikeasales@ikea.com",
      company: "IKEA",
      date: "04.06.2021"
    },
    {
      id: "u3",
      name: "Darrell Steward",
      role: "Marketing Operations",
      email: "workmail@amazon.com",
      company: "Amazon",
      date: "02.06.2021"
    }
  ];

  // Month navigation helpers
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const yearNumber = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar Day Grid generator
  const daysInMonth = new Date(yearNumber, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (new Date(yearNumber, currentDate.getMonth(), 1).getDay() + 6) % 7; // Monday = 0
  const daysInPrevMonth = new Date(yearNumber, currentDate.getMonth(), 0).getDate();

  // Create Event Form Submit
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEv = {
      id: `ev_${Date.now()}`,
      day: selectedDay || 15,
      month: currentDate.getMonth(),
      year: yearNumber,
      time: eventFrom.split(",")[0] || "10:00",
      title: eventTitle,
      type: eventCategory === "IMPORTANT" ? "green" : "pink",
      badge: eventCategory
    };

    setEvents((prev) => [...prev, newEv]);
    setShowNewEventModal(false);
    setEventTitle("");
    if (onShowToast) {
      onShowToast(`Event "${newEv.title}" added to academic schedule!`, "success");
    }
  };

  return (
    <div className="cal2-app-layout">
      {/* =========================================================================
          LEFT NAVIGATION RAIL (Image 2 Left Sidebar)
          ========================================================================= */}
      <aside className="cal2-left-rail" aria-label="Main Navigation">
        <div className="cal2-rail-logo">
          <div className="cal2-logo-triangle" aria-hidden="true">
            ▲
          </div>
        </div>

        <nav className="cal2-rail-nav">
          <button
            type="button"
            className="cal2-rail-btn"
            title="Dashboard"
            onClick={() => onSwitchView && onSwitchView("faculty")}
          >
            <Home size={18} />
          </button>
          <button
            type="button"
            className="cal2-rail-btn"
            title="Academic Documents"
            onClick={() => onSwitchView && onSwitchView("student")}
          >
            <FileText size={18} />
          </button>
          <button
            type="button"
            className="cal2-rail-btn"
            title="Admin & Faculty Operations"
            onClick={() => onSwitchView && onSwitchView("admin")}
          >
            <Briefcase size={18} />
          </button>
          <button
            type="button"
            className="cal2-rail-btn"
            title="Fee Particulars"
            onClick={() => onSwitchView && onSwitchView("student")}
          >
            <DollarSign size={18} />
          </button>
          <button
            type="button"
            className="cal2-rail-btn active"
            title="Academic Calendar (Current)"
          >
            <CalendarIcon size={18} />
          </button>
          <button
            type="button"
            className="cal2-rail-btn"
            title="Class Grid & Timetable"
            onClick={() => onSwitchView && onSwitchView("faculty")}
          >
            <Grid size={18} />
          </button>
        </nav>

        <div className="cal2-rail-bottom">
          <button type="button" className="cal2-rail-btn" title="Institutional Compliance">
            <Shield size={18} />
          </button>
          <button type="button" className="cal2-rail-btn" title="System Settings">
            <Settings size={18} />
          </button>
        </div>
      </aside>

      {/* =========================================================================
          CENTER / MAIN CALENDAR WORKSPACE (Image 2 Main Content)
          ========================================================================= */}
      <div className="cal2-main-workspace">
        {/* Top Header Bar from Image 2 */}
        <header className="cal2-topbar">
          <div className="cal2-search-box">
            <Search size={15} className="cal2-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="cal2-search-input"
            />
          </div>

          <div className="cal2-topbar-right">
            <button type="button" className="cal2-icon-pill" title="Notifications">
              <Bell size={16} />
            </button>
            <button type="button" className="cal2-icon-pill" title="Messages">
              <Mail size={16} />
            </button>

            <div className="cal2-user-chip">
              <div className="cal2-avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="cal2-user-details">
                <span className="cal2-user-name">
                  {currentUser?.name || "Anton O."}
                </span>
                <span className="cal2-user-role">
                  {currentUser?.role ? currentUser.role.toUpperCase() : "USER"}
                </span>
              </div>
              <span className="cal2-caret">▾</span>
            </div>
          </div>
        </header>

        {/* Content Body: Calendar Grid + Right Sidebar */}
        <div className="cal2-body-content">
          <div className="cal2-left-calendar-area">
            {/* Calendar Controls Bar */}
            <div className="cal2-controls-row">
              <div className="cal2-month-selector">
                <button
                  type="button"
                  className="cal2-arrow-btn"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="cal2-month-title">
                  {monthName} {yearNumber}
                </h2>
                <button
                  type="button"
                  className="cal2-arrow-btn"
                  onClick={handleNextMonth}
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="cal2-action-btns">
                <button
                  type="button"
                  className="cal2-btn-secondary"
                  onClick={() => setShowApprovalModal(true)}
                >
                  Request Approval
                </button>
                <button
                  type="button"
                  className="cal2-btn-primary"
                  onClick={() => setShowNewEventModal(true)}
                >
                  <Plus size={15} />
                  <span>Add event</span>
                </button>
              </div>
            </div>

            {/* 7-Column Calendar Month Matrix */}
            <div className="cal2-calendar-card">
              <div className="cal2-weekday-header">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
              </div>

              <div className="cal2-month-grid">
                {/* Previous month trailing days */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                  const dayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
                  return (
                    <div key={`prev_${i}`} className="cal2-day-cell cal2-out-of-month">
                      <div className="cal2-day-num">{dayNum}</div>
                      {dayNum === 27 && (
                        <div className="cal2-event-chip cal2-chip-grey">
                          <span className="font-mono">18:00</span> Invoice check
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayEvents = events.filter((e) => e.day === dayNum);
                  const isSelected = selectedDay === dayNum;
                  const isSpecialDay = dayEvents.some((e) => e.isSpecial);

                  return (
                    <div
                      key={`curr_${dayNum}`}
                      className={`cal2-day-cell ${isSelected ? "selected-day" : ""} ${
                        isSpecialDay ? "special-day" : ""
                      }`}
                      onClick={() => setSelectedDay(dayNum)}
                    >
                      <div className="cal2-day-top">
                        {isSpecialDay ? (
                          <span className="cal2-special-badge">
                            <strong>{dayNum}</strong>
                          </span>
                        ) : (
                          <span className={`cal2-day-num ${dayNum === 29 ? "cal2-blue-circle" : ""}`}>
                            {dayNum}
                          </span>
                        )}
                        {dayNum === 5 && <span className="cal2-notification-dot">5</span>}
                      </div>

                      <div className="cal2-day-events">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={`cal2-event-chip cal2-chip-${ev.type}`}
                            title={ev.title}
                          >
                            <span className="cal2-chip-time font-mono">{ev.time}</span>
                            <span className="cal2-chip-title">{ev.title}</span>
                            {ev.emoji && <span className="cal2-chip-emoji">{ev.emoji}</span>}
                          </div>
                        ))}
                        {dayNum === 1 && (
                          <span className="cal2-more-link">5 more</span>
                        )}
                        {dayNum === 29 && (
                          <div className="cal2-last-friday-box">
                            <span className="cal2-last-friday-label font-bold text-primary">Last Friday</span>
                            <span className="cal2-champagne">🥂</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Next month leading days to complete 35 or 42 grid slots */}
                {Array.from({
                  length: (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7
                }).map((_, i) => (
                  <div key={`next_${i}`} className="cal2-day-cell cal2-out-of-month">
                    <div className="cal2-day-num">{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Panel: User Activities (Image 2 Bottom Section) */}
            <div className="cal2-bottom-card">
              <div className="cal2-bottom-header">
                <h3>User activities</h3>
                <button
                  type="button"
                  className="cal2-btn-secondary"
                  onClick={() => {
                    if (onShowToast) onShowToast("Activity report exported as PDF.", "info");
                  }}
                >
                  Reports
                </button>
              </div>

              <div className="cal2-activities-table-wrap">
                <table className="cal2-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User Name</th>
                      <th>Designation / Role</th>
                      <th>Email / Contact</th>
                      <th>Organization / Dept</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivities.map((act, idx) => (
                      <tr key={act.id}>
                        <td className="text-muted font-mono">{14 + idx}</td>
                        <td className="font-bold text-primary">{act.name}</td>
                        <td className="text-muted">{act.role}</td>
                        <td className="font-mono text-sm">{act.email}</td>
                        <td>
                          <span className="cal2-company-tag">
                            <span className="cal2-comp-dot"></span>
                            {act.company}
                          </span>
                        </td>
                        <td className="font-mono text-muted">{act.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT SIDEBAR WIDGETS (Image 2 Right Column)
              ========================================================================= */}
          <aside className="cal2-right-sidebar" aria-label="Tasks and Announcements">
            {/* Widget 1: Task List */}
            <div className="cal2-widget-card">
              <div className="cal2-widget-header">
                <h4>Task List</h4>
                <button type="button" className="cal2-link-btn">
                  View all
                </button>
              </div>

              <div className="cal2-task-list">
                {taskList.map((task) => (
                  <div key={task.id} className="cal2-task-item">
                    <div className="cal2-task-time font-mono font-bold">
                      {task.time}
                    </div>
                    <div className="cal2-task-content">
                      <div className="cal2-task-title font-bold">
                        {task.title}
                      </div>
                      <div className="cal2-task-sub text-muted font-mono">
                        📁 {task.subtitle}
                      </div>
                    </div>
                    <span className={`cal2-badge cal2-badge-${task.tagColor}`}>
                      {task.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Contracts & Academic Documents */}
            <div className="cal2-widget-card">
              <div className="cal2-widget-header">
                <h4>Contracts</h4>
              </div>

              <div className="cal2-docs-list">
                {documentsList.map((doc) => (
                  <div key={doc.id} className="cal2-doc-item">
                    <div
                      className="cal2-doc-icon"
                      style={{ color: doc.iconColor }}
                    >
                      <FileText size={20} />
                    </div>
                    <div className="cal2-doc-meta">
                      <div className="cal2-doc-title font-bold">
                        {doc.title}
                      </div>
                      <div className="cal2-doc-sub text-muted">
                        {doc.org}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cal2-open-pill-btn"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Pinned Message */}
            <div className="cal2-widget-card">
              <div className="cal2-widget-header">
                <h4>Pinned message</h4>
                <button type="button" className="cal2-link-btn">
                  View all
                </button>
              </div>

              <div className="cal2-pinned-list">
                {pinnedMessages.map((msg) => (
                  <div key={msg.id} className="cal2-pinned-item">
                    <div className="cal2-pinned-top">
                      <div className="cal2-pinned-avatar">{msg.avatar}</div>
                      <div className="cal2-pinned-author">
                        <span className="font-bold">{msg.name}</span>
                        <span className="cal2-pinned-date font-mono text-muted">
                          {msg.date}
                        </span>
                      </div>
                    </div>
                    <p className="cal2-pinned-text">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* =========================================================================
          "NEW EVENT" MODAL DIALOG (Pixel-Perfect from Image 2!)
          ========================================================================= */}
      {showNewEventModal && (
        <div
          className="cal2-modal-backdrop"
          onClick={() => setShowNewEventModal(false)}
        >
          <div
            className="cal2-new-event-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cal2-modal-head">
              <div>
                <h3>New event</h3>
                <p>Complete the basic details of your event</p>
              </div>
              <button
                type="button"
                className="cal2-modal-close-btn"
                onClick={() => setShowNewEventModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="cal2-modal-form">
              <div className="cal2-form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  className="cal2-input"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Weekly Strategic Planning"
                  required
                />
              </div>

              <div className="cal2-tag-row">
                <span className="cal2-tag-selected">
                  {eventCategory} <span className="close-x">✕</span>
                </span>
                <button
                  type="button"
                  className="cal2-tag-choice"
                  onClick={() => setEventCategory("EXAM")}
                >
                  EXAM
                </button>
                <button
                  type="button"
                  className="cal2-tag-choice"
                  onClick={() => setEventCategory("LAB")}
                >
                  LAB
                </button>
                <button
                  type="button"
                  className="cal2-tag-choice"
                  onClick={() => setEventCategory("SEMINAR")}
                >
                  SEMINAR
                </button>
              </div>

              <div className="cal2-datetime-row">
                <div className="cal2-dt-field">
                  <label>From</label>
                  <input
                    type="text"
                    className="cal2-dt-input font-mono"
                    value={eventFrom}
                    onChange={(e) => setEventFrom(e.target.value)}
                  />
                </div>
                <div className="cal2-dt-field">
                  <label>To</label>
                  <input
                    type="text"
                    className="cal2-dt-input font-mono"
                    value={eventTo}
                    onChange={(e) => setEventTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="cal2-form-group">
                <label>Members</label>
                <div className="cal2-members-pills">
                  {selectedMembers.map((m) => (
                    <span key={m.id} className="cal2-member-pill">
                      <span className="cal2-mem-dot"></span>
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <button type="submit" className="cal2-create-btn">
                Create event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          REQUEST APPROVAL MODAL (Image 2 Action)
          ========================================================================= */}
      {showApprovalModal && (
        <div
          className="cal2-modal-backdrop"
          onClick={() => setShowApprovalModal(false)}
        >
          <div
            className="cal2-new-event-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div className="cal2-modal-head">
              <div>
                <h3>Request Approval</h3>
                <p>Submit academic exemption or scheduled event approval</p>
              </div>
              <button
                type="button"
                className="cal2-modal-close-btn"
                onClick={() => setShowApprovalModal(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowApprovalModal(false);
                if (onShowToast) onShowToast("Approval request submitted to Academic Dean!", "success");
              }}
              className="cal2-modal-form"
            >
              <div className="cal2-form-group">
                <label>Request Type / Category</label>
                <select
                  className="cal2-input"
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                >
                  <option value="Hackathon / On-Duty Attendance Exemption">
                    Hackathon / On-Duty Attendance Exemption
                  </option>
                  <option value="Guest Lecture / Special Session Reschedule">
                    Guest Lecture / Special Session Reschedule
                  </option>
                  <option value="Laboratory Examination Hall Clearance">
                    Laboratory Examination Hall Clearance
                  </option>
                  <option value="University Event Hall Booking">
                    University Event Hall Booking
                  </option>
                </select>
              </div>

              <div className="cal2-form-group">
                <label>Remarks & Description</label>
                <textarea
                  className="cal2-input"
                  rows={3}
                  placeholder="Provide supporting justifications or reference ticket number..."
                  required
                />
              </div>

              <button type="submit" className="cal2-create-btn">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCUMENT VIEWER POPUP MODAL (Contracts widget preview)
          ========================================================================= */}
      {selectedDoc && (
        <div
          className="cal2-modal-backdrop"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="cal2-new-event-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="cal2-modal-head">
              <div>
                <h3>{selectedDoc.title}</h3>
                <p>{selectedDoc.org}</p>
              </div>
              <button
                type="button"
                className="cal2-modal-close-btn"
                onClick={() => setSelectedDoc(null)}
              >
                ✕
              </button>
            </div>

            <div className="cal2-doc-preview-body">
              <div className="cal2-doc-certified-banner">
                <FileCheck size={28} className="text-success" />
                <div>
                  <h4 className="font-bold text-success">Official Certified Document</h4>
                  <p className="text-muted text-sm">
                    Verified by VFSTR Academic Council & Controller of Examinations.
                  </p>
                </div>
              </div>

              <div className="cal2-doc-meta-table">
                <div>
                  <span className="cal2-meta-lbl">DOCUMENT TYPE</span>
                  <span className="cal2-meta-val font-mono">{selectedDoc.type}</span>
                </div>
                <div>
                  <span className="cal2-meta-lbl">AUTHENTICATION STATUS</span>
                  <span className="cal2-meta-val text-success font-bold">DIGITALLY SIGNED</span>
                </div>
                <div>
                  <span className="cal2-meta-lbl">SECURITY HASH</span>
                  <span className="cal2-meta-val font-mono">0x4F9B...8E21</span>
                </div>
              </div>

              <button
                type="button"
                className="cal2-create-btn"
                style={{ background: "#2563eb" }}
                onClick={() => {
                  setSelectedDoc(null);
                  if (onShowToast) onShowToast(`Downloaded ${selectedDoc.title}.pdf`, "success");
                }}
              >
                <Download size={15} />
                <span>Download Document Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
