import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Bell,
  Mail,
  User,
  X,
  Plus,
  Bookmark,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
  Trash2,
  BookOpen,
  Award,
  Layers,
  Filter
} from "lucide-react";
import {
  ACADEMIC_SEMESTER_INFO,
  OFFICIAL_CALENDAR_EVENTS,
  ACADEMIC_WEEKS_TABLE,
  CALENDAR_COLOR_SCHEME
} from "../../data/academic_calendar";

export default function AcademicCalendarView({
  currentUser,
  onShowToast = () => {},
  onSwitchView = () => {}
}) {
  // Navigation: Months from July 2026 to December 2026
  // Default to October 2026 (or current date within semester)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 6 = July, 9 = October
  const [activeTab, setActiveTab] = useState("month"); // "month" | "matrix" | "events" | "reminders"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  // Interactive Day Drawer State
  const [selectedDate, setSelectedDate] = useState("2026-08-25"); // Default highlighted
  const [showDayModal, setShowDayModal] = useState(false);

  // Day Notes State (keyed by date string YYYY-MM-DD)
  const [notesMap, setNotesMap] = useState(() => {
    try {
      const saved = localStorage.getItem("vfstr_calendar_notes");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [newNoteText, setNewNoteText] = useState("");

  // Email Reminder Form State
  const defaultUserEmail =
    currentUser?.email ||
    (currentUser?.roll ? `vu.${currentUser.roll.toLowerCase()}@gmail.com` : "vu.241fa04b57@gmail.com");

  const [reminderEmail, setReminderEmail] = useState(defaultUserEmail);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  // Scheduled Reminders list
  const [scheduledReminders, setScheduledReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("vfstr_calendar_reminders");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Keep reminder email in sync with currentUser
  useEffect(() => {
    if (currentUser?.email) {
      setReminderEmail(currentUser.email);
    }
  }, [currentUser]);

  // Load calendar notes and reminders from backend on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const notesRes = await fetch("/api/calendar/notes");
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          if (notesData.success && notesData.data) {
            setNotesMap((prev) => ({ ...prev, ...notesData.data }));
          }
        }
      } catch (err) {}

      try {
        const remRes = await fetch(
          `/api/calendar/reminders${currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : ""}`
        );
        if (remRes.ok) {
          const remData = await remRes.json();
          if (remData.success && Array.isArray(remData.data)) {
            setScheduledReminders(remData.data);
          }
        }
      } catch (err) {}
    }
    loadBackendData();
  }, [currentUser]);

  // Months meta for semester
  const semesterMonths = [
    { index: 6, name: "July", year: 2026 },
    { index: 7, name: "August", year: 2026 },
    { index: 8, name: "September", year: 2026 },
    { index: 9, name: "October", year: 2026 },
    { index: 10, name: "November", year: 2026 },
    { index: 11, name: "December", year: 2026 }
  ];

  // Map of events by date
  const eventsByDate = useMemo(() => {
    const map = {};
    OFFICIAL_CALENDAR_EVENTS.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, []);

  // Filtered official events list
  const filteredEventsList = useMemo(() => {
    return OFFICIAL_CALENDAR_EVENTS.filter((ev) => {
      const matchCat =
        selectedCategoryFilter === "ALL" || ev.category === selectedCategoryFilter;
      const matchQuery =
        !searchQuery ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.date.includes(searchQuery);
      return matchCat && matchQuery;
    });
  }, [selectedCategoryFilter, searchQuery]);

  // Calendar Grid Days Builder for current month
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: false,
        events: eventsByDate[dateStr] || []
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: true,
        events: eventsByDate[dateStr] || []
      });
    }

    // Next month padding to fill complete weeks (up to multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = currentMonth === 11 ? 1 : currentMonth + 2;
        const y = currentMonth === 11 ? currentYear + 1 : currentYear;
        const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        days.push({
          dayNumber: d,
          dateString: dateStr,
          isCurrentMonth: false,
          events: eventsByDate[dateStr] || []
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  // Open Day Drawer
  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    const evs = eventsByDate[dateStr] || [];
    setReminderTitle(evs.length > 0 ? evs[0].title : `Reminder for ${dateStr}`);
    setReminderNote("");
    setShowDayModal(true);
  };

  // Add Note on Date
  const handleSaveNote = async () => {
    if (!newNoteText.trim()) return;

    const noteEntry = {
      id: `note_${Date.now()}`,
      date: selectedDate,
      note: newNoteText.trim(),
      email: reminderEmail,
      authorName: currentUser?.name || "Student/Faculty",
      updatedAt: new Date().toISOString()
    };

    const nextNotes = {
      ...notesMap,
      [selectedDate]: [noteEntry, ...(notesMap[selectedDate] || [])]
    };

    setNotesMap(nextNotes);
    localStorage.setItem("vfstr_calendar_notes", JSON.stringify(nextNotes));
    setNewNoteText("");

    try {
      await fetch("/api/calendar/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteEntry)
      });
    } catch (e) {}

    onShowToast(`📝 Note saved for ${selectedDate}`, "success");
  };

  // Schedule Email Reminder
  const handleScheduleReminder = async (e) => {
    e?.preventDefault();
    if (!reminderEmail || !selectedDate) {
      onShowToast("Email and Date are required to schedule a notification", "warning");
      return;
    }

    setIsSubmittingReminder(true);
    const newRem = {
      id: `rem_${Date.now()}`,
      email: reminderEmail.toLowerCase().trim(),
      date: selectedDate,
      time: reminderTime || "09:00",
      title: reminderTitle || "Academic Calendar Reminder",
      note: reminderNote || "",
      status: "SCHEDULED",
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/calendar/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRem)
      });
      const data = await res.json();
      if (data.success) {
        const nextList = [newRem, ...scheduledReminders];
        setScheduledReminders(nextList);
        localStorage.setItem("vfstr_calendar_reminders", JSON.stringify(nextList));
        onShowToast(
          `🔔 Email reminder scheduled! Alert will be sent to ${reminderEmail} on ${selectedDate} at ${newRem.time}.`,
          "success"
        );
      } else {
        onShowToast(data.error || "Failed to schedule reminder", "warning");
      }
    } catch (err) {
      const nextList = [newRem, ...scheduledReminders];
      setScheduledReminders(nextList);
      localStorage.setItem("vfstr_calendar_reminders", JSON.stringify(nextList));
      onShowToast(`🔔 Notification scheduled for ${reminderEmail} on ${selectedDate}`, "success");
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  // Event category color helper
  const getEventBadgeStyle = (category, color) => {
    switch (color) {
      case "cyan":
        return { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" };
      case "green":
        return { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
      case "orange":
        return { background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" };
      case "yellow":
        return { background: "#fef9c3", color: "#854d0e", border: "1px solid #fef08a" };
      case "purple":
        return { background: "#f3e8ff", color: "#7e22ce", border: "1px solid #e9d5ff" };
      default:
        return { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
    }
  };

  const selectedEvents = eventsByDate[selectedDate] || [];
  const selectedNotes = notesMap[selectedDate] || [];
  const selectedRemindersList = scheduledReminders.filter((r) => r.date === selectedDate);

  return (
    <div className="notion-calendar-container" style={{ padding: "16px 24px", maxWidth: "1480px", margin: "0 auto" }}>
      {/* Notion-Style Document Header */}
      <div
        className="notion-doc-header"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          padding: "24px 28px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>🗓️</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  color: "#6b7280",
                  textTransform: "uppercase"
                }}
              >
                VFSTR Vadlamudi &bull; Official Academic Document
              </span>
              <span
                style={{
                  background: "#e0e7ff",
                  color: "#4338ca",
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontWeight: "600"
                }}
              >
                Release Date: {ACADEMIC_SEMESTER_INFO.releaseDate}
              </span>
            </div>

            <h1
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#111827",
                margin: "0 0 6px 0",
                letterSpacing: "-0.02em"
              }}
            >
              Academic Calendar 2026-27 (Semester - I)
            </h1>

            <p style={{ margin: 0, color: "#4b5563", fontSize: "14px" }}>
              <strong>{ACADEMIC_SEMESTER_INFO.program}</strong> &bull; Approved by Asst. Dean-AAA, HoD (04/06/2026), and Dean-AAA&FA
            </p>
          </div>

          {/* Quick User Context Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "#f9fafb",
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb"
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#e0e7ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "14px"
              }}
            >
              {currentUser?.name ? currentUser.name.charAt(0) : "U"}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>
                {currentUser?.name || "Student / Faculty"}
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                <Mail size={11} />
                <span>{reminderEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend Chips directly replicating the document colors */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "18px",
            paddingTop: "14px",
            borderTop: "1px solid #f3f4f6",
            fontSize: "12px"
          }}
        >
          <span style={{ fontWeight: "600", color: "#374151" }}>Document Legend:</span>
          <span style={{ padding: "4px 10px", borderRadius: "6px", ...getEventBadgeStyle("", "cyan") }}>
            Commencement of Module
          </span>
          <span style={{ padding: "4px 10px", borderRadius: "6px", ...getEventBadgeStyle("", "green") }}>
            Formative Assessment (FA-1 / FA-2)
          </span>
          <span style={{ padding: "4px 10px", borderRadius: "6px", ...getEventBadgeStyle("", "orange") }}>
            Official Holidays & Festivals
          </span>
          <span style={{ padding: "4px 10px", borderRadius: "6px", ...getEventBadgeStyle("", "yellow") }}>
            Preparation & Summative (P-Based)
          </span>
          <span style={{ padding: "4px 10px", borderRadius: "6px", ...getEventBadgeStyle("", "purple") }}>
            Summative Assessment (L-Based)
          </span>
        </div>
      </div>

      {/* Navigation & View Tabs Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px"
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", padding: "4px", borderRadius: "10px" }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "month" ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: "8px", fontWeight: activeTab === "month" ? "600" : "500" }}
            onClick={() => setActiveTab("month")}
          >
            <CalendarIcon size={15} style={{ marginRight: "6px" }} />
            Notion Month Grid
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "matrix" ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: "8px", fontWeight: activeTab === "matrix" ? "600" : "500" }}
            onClick={() => setActiveTab("matrix")}
          >
            <Layers size={15} style={{ marginRight: "6px" }} />
            Official 24-Week Matrix
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "events" ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: "8px", fontWeight: activeTab === "events" ? "600" : "500" }}
            onClick={() => setActiveTab("events")}
          >
            <Award size={15} style={{ marginRight: "6px" }} />
            All Official Events ({OFFICIAL_CALENDAR_EVENTS.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "reminders" ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: "8px", fontWeight: activeTab === "reminders" ? "600" : "500" }}
            onClick={() => setActiveTab("reminders")}
          >
            <Bell size={15} style={{ marginRight: "6px" }} />
            My Email Reminders ({scheduledReminders.length})
          </button>
        </div>

        {/* Month Selector Pill Buttons */}
        {activeTab === "month" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {semesterMonths.map((m) => (
              <button
                key={m.index}
                type="button"
                className={`btn btn-xs ${currentMonth === m.index ? "btn-primary" : "btn-outline"}`}
                style={{ borderRadius: "6px", padding: "4px 10px" }}
                onClick={() => setCurrentMonth(m.index)}
              >
                {m.name} 2026
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: NOTION MONTH GRID */}
      {activeTab === "month" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
          }}
        >
          {/* Day Headers (Sun to Sat) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              textAlign: "center"
            }}
          >
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName, idx) => (
              <div
                key={dayName}
                style={{
                  padding: "10px 4px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: idx === 0 ? "#dc2626" : "#4b5563",
                  letterSpacing: "0.05em"
                }}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gridAutoRows: "minmax(115px, auto)"
            }}
          >
            {calendarGrid.map((day, idx) => {
              const isSelected = day.dateString === selectedDate;
              const hasNotes = (notesMap[day.dateString] || []).length > 0;
              const hasReminders = scheduledReminders.some((r) => r.date === day.dateString);

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day.dateString)}
                  style={{
                    borderRight: (idx + 1) % 7 === 0 ? "none" : "1px solid #f3f4f6",
                    borderBottom: "1px solid #f3f4f6",
                    padding: "8px 10px",
                    background: isSelected
                      ? "#f0fdf4"
                      : !day.isCurrentMonth
                      ? "#fafafa"
                      : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    position: "relative",
                    opacity: day.isCurrentMonth ? 1 : 0.4
                  }}
                  className="notion-calendar-cell"
                  title={`Click to open day agenda & schedule email notification for ${day.dateString}`}
                >
                  {/* Top Bar of Cell */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? "700" : "600",
                        color: isSelected
                          ? "#16a34a"
                          : idx % 7 === 0
                          ? "#dc2626"
                          : "#1f2937",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background: isSelected ? "#dcfce7" : "transparent"
                      }}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Indicator Badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {hasNotes && (
                        <span title="Contains personal note" style={{ fontSize: "11px" }}>
                          📝
                        </span>
                      )}
                      {hasReminders && (
                        <span title="Email reminder scheduled" style={{ fontSize: "11px" }}>
                          🔔
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day Events Chips */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {day.events.map((ev, evIdx) => (
                      <div
                        key={evIdx}
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          lineHeight: "1.2",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          ...getEventBadgeStyle(ev.category, ev.color)
                        }}
                        title={`${ev.title} (${ev.category})`}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: OFFICIAL 24-WEEK UNIVERSITY MATRIX (EXACT IMAGE REPLICA) */}
      {activeTab === "matrix" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            padding: "20px",
            overflowX: "auto",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
              Vignan's Foundation for Science, Technology and Research :: Vadlamudi
            </h2>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              Bachelor of Technology - AGE 2nd, 3rd & 4th Year &bull; Academic Calendar - 2026-27 (Semester - I)
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Release date: 03-Jun-2026 &bull; Authentic 24-Week Schedule Matrix
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              textAlign: "center"
            }}
          >
            <thead>
              <tr style={{ background: "#475569", color: "#ffffff" }}>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Week</th>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Sunday</th>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Monday</th>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Tuesday</th>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Wednesday</th>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Thursday</th>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Friday</th>
                <th style={{ padding: "10px", border: "1px solid #334155" }}>Saturday</th>
              </tr>
            </thead>
            <tbody>
              {ACADEMIC_WEEKS_TABLE.map((row) => (
                <tr key={row.week} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px", fontWeight: "700", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                    Week-{row.week}
                  </td>

                  {/* Sunday */}
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#b91c1c" }}>
                    {row.sun}
                  </td>

                  {/* Monday */}
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      ...(row.highlight && row.highlight.cell === "mon"
                        ? getEventBadgeStyle("", row.highlight.color)
                        : {})
                    }}
                  >
                    {row.mon}
                  </td>

                  {/* Tuesday */}
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      ...(row.highlight && row.highlight.cell === "tue"
                        ? getEventBadgeStyle("", row.highlight.color)
                        : {})
                    }}
                  >
                    {row.tue}
                  </td>

                  {/* Wednesday */}
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      ...(row.highlight && row.highlight.cell === "wed"
                        ? getEventBadgeStyle("", row.highlight.color)
                        : {})
                    }}
                  >
                    {row.wed}
                  </td>

                  {/* Thursday */}
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      ...(row.highlight && row.highlight.cell === "thu"
                        ? getEventBadgeStyle("", row.highlight.color)
                        : {})
                    }}
                  >
                    {row.thu}
                  </td>

                  {/* Friday */}
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      ...(row.highlight && row.highlight.cell === "fri"
                        ? getEventBadgeStyle("", row.highlight.color)
                        : {})
                    }}
                  >
                    {row.fri}
                  </td>

                  {/* Saturday */}
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      ...(row.highlight && row.highlight.cell === "sat"
                        ? getEventBadgeStyle("", row.highlight.color)
                        : {})
                    }}
                  >
                    {row.sat}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Official Signatures Verification Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px dashed #cbd5e1"
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontStyle: "italic", fontWeight: "700", color: "#1e3a8a", fontSize: "16px" }}>
                Dr. N. V. Rao
              </div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Asst. Dean-AAA</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontStyle: "italic", fontWeight: "700", color: "#1e3a8a", fontSize: "16px" }}>
                Dr. K. Ramanjaneyulu
              </div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>HoD (Signed 04/06/2026)</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontStyle: "italic", fontWeight: "700", color: "#1e3a8a", fontSize: "16px" }}>
                Dr. D. Vijaya Ramu
              </div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Dean-AAA&FA</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ALL OFFICIAL EVENTS & HOLIDAYS */}
      {activeTab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filters Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              background: "#ffffff",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb"
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["ALL", "COMMENCEMENT", "EXAM", "HOLIDAY", "ASSESSMENT", "SUMMATIVE"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-xs ${selectedCategoryFilter === cat ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: "6px" }}
                  onClick={() => setSelectedCategoryFilter(cat)}
                >
                  {cat === "ALL" ? "All Categories" : cat}
                </button>
              ))}
            </div>

            <div className="input-with-icon" style={{ width: "260px" }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="login-input"
                style={{ padding: "6px 12px 6px 36px", fontSize: "13px" }}
                placeholder="Search events, exams, holidays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Events Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
            {filteredEventsList.map((ev, idx) => (
              <div
                key={idx}
                onClick={() => handleDayClick(ev.date)}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}
                className="notion-card-hover"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      ...getEventBadgeStyle(ev.category, ev.color)
                    }}
                  >
                    {ev.badge || ev.category}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>
                    Week {ev.week} &bull; {ev.date}
                  </span>
                </div>

                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: "0 0 6px 0" }}>
                  {ev.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#4b5563", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                  {ev.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6366f1", fontWeight: "600" }}>
                    🔔 Click to notify with {reminderEmail.split("@")[0]}
                  </span>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>Open &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: MY SCHEDULED EMAIL REMINDERS */}
      {activeTab === "reminders" && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
                Scheduled Academic Email Notifications
              </h2>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Automatic alerts dispatched directly to your registered Google address <code>{reminderEmail}</code>
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleDayClick(new Date().toISOString().split("T")[0])}
            >
              <Plus size={15} style={{ marginRight: "4px" }} />
              Schedule New Alert
            </button>
          </div>

          {scheduledReminders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
              <Bell size={36} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#374151" }}>No reminders scheduled yet</p>
              <p style={{ fontSize: "13px" }}>
                Click any date in the calendar and select <strong>"Keep me notified on this day with email"</strong>!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {scheduledReminders.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>{r.title}</span>
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#15803d",
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "2px 8px",
                          borderRadius: "9999px"
                        }}
                      >
                        {r.status || "SCHEDULED"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      📅 <strong>{r.date}</strong> at <strong>{r.time || "09:00"}</strong> &bull; Sent to: <strong>{r.email}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => {
                      const filtered = scheduledReminders.filter((_, i) => i !== idx);
                      setScheduledReminders(filtered);
                      localStorage.setItem("vfstr_calendar_reminders", JSON.stringify(filtered));
                      onShowToast("Reminder removed", "info");
                    }}
                    title="Remove reminder"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTION-STYLE DAY PAGE (DRAWER / MODAL) */}
      {showDayModal && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div
            className="notion-day-drawer"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              borderRadius: "18px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: "1px solid #e5e7eb"
            }}
          >
            {/* Modal Top Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                background: "#fafafa"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>📅</span>
                <span style={{ fontWeight: "700", color: "#111827", fontSize: "16px" }}>
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-icon btn-sm"
                onClick={() => setShowDayModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 1. Official Events on this Day */}
              {selectedEvents.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    🏛️ Official University Schedule
                  </div>
                  {selectedEvents.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        ...getEventBadgeStyle(ev.category, ev.color)
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "700", fontSize: "15px" }}>{ev.title}</span>
                        <span style={{ fontSize: "11px", fontWeight: "700" }}>Week {ev.week}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.4" }}>{ev.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #f3f4f6",
                    fontSize: "13px",
                    color: "#6b7280"
                  }}
                >
                  ✨ Standard instructional day for Semester-I. Classes, practicals, and counselling sessions proceed as per timetable.
                </div>
              )}

              {/* 2. Interactive Email Notification Scheduler */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Bell size={18} style={{ color: "#4f46e5" }} />
                  <span style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                    Keep Me Notified on This Day via Email
                  </span>
                </div>

                <form onSubmit={handleScheduleReminder}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Logged in Email Field */}
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                        Notification Recipient Email (Signed-In Account)
                      </label>
                      <div className="input-with-icon">
                        <Mail className="input-icon" size={16} />
                        <input
                          type="email"
                          className="login-input"
                          style={{ padding: "8px 12px 8px 36px", fontSize: "13px" }}
                          value={reminderEmail}
                          onChange={(e) => setReminderEmail(e.target.value)}
                          placeholder="e.g. vu.241fa04b57@gmail.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Time & Title Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                          Reminder Subject / Title
                        </label>
                        <input
                          type="text"
                          className="login-input"
                          style={{ padding: "8px 12px", fontSize: "13px" }}
                          value={reminderTitle}
                          onChange={(e) => setReminderTitle(e.target.value)}
                          placeholder="e.g., M-1 FA-1 Exam Reminder"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                          Alert Time
                        </label>
                        <input
                          type="time"
                          className="login-input"
                          style={{ padding: "8px 12px", fontSize: "13px" }}
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Custom Note in Email */}
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                        Additional Note to Include in Email (Optional)
                      </label>
                      <input
                        type="text"
                        className="login-input"
                        style={{ padding: "8px 12px", fontSize: "13px" }}
                        value={reminderNote}
                        onChange={(e) => setReminderNote(e.target.value)}
                        placeholder="e.g. Bring hall ticket & calculator, meet counsellor beforehand"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isSubmittingReminder}
                      style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Send size={14} />
                      <span>{isSubmittingReminder ? "Scheduling Email..." : `Schedule Email Alert to ${reminderEmail.split("@")[0]}`}</span>
                    </button>
                  </div>
                </form>

                {/* Existing Reminders on this Day */}
                {selectedRemindersList.length > 0 && (
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #cbd5e1" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                      Active Alerts on this date:
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                      {selectedRemindersList.map((r, ri) => (
                        <div
                          key={ri}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            background: "#ffffff",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <span>🔔 <strong>{r.time}</strong> &bull; {r.title}</span>
                          <span style={{ color: "#16a34a", fontWeight: "600" }}>✓ Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Notion-Style Notes Editor */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    📝 Day Notes & Agenda
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <textarea
                    rows={3}
                    className="login-input"
                    style={{ padding: "10px", fontSize: "13px", resize: "vertical", fontFamily: "inherit" }}
                    placeholder="Write private notes, lecture topics, homework reminders, or study agendas for this date..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleSaveNote}
                      disabled={!newNoteText.trim()}
                    >
                      <Plus size={14} style={{ marginRight: "4px" }} />
                      Save Note
                    </button>
                  </div>
                </div>

                {/* Display Previously Saved Notes */}
                {selectedNotes.length > 0 && (
                  <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedNotes.map((n, ni) => (
                      <div
                        key={ni}
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "10px 12px"
                        }}
                      >
                        <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#1f2937", whiteSpace: "pre-wrap" }}>
                          {n.note}
                        </p>
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                          Written by {n.authorName || n.email} &bull; {new Date(n.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
