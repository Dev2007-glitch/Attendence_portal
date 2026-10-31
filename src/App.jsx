import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import LoginScreen from "./components/auth/LoginScreen";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import CounsellorDashboard from "./components/dashboards/CounsellorDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import AcademicCalendarView from "./components/calendar/AcademicCalendarView";
import Toast from "./components/Toast";
import { sound } from "./utils/sound";
import {
  fetchStudents,
  fetchSessions,
  saveSession,
  deleteSession,
  fetchFacultyContacts,
  saveFacultyContacts,
  saveStudent,
  deleteStudent
} from "./services/api";
import {
  ALL_STUDENTS,
  INITIAL_STUDENTS,
  SECTIONS,
  COUNSELLORS,
  getStudentsBySection,
  getStudentsByCounsellor,
  DEFAULT_SETTINGS
} from "../data.js";
import { generateWhatsAppMessage, openWhatsAppChat } from "./utils/whatsapp";
import {
  SECTION_1_FACULTIES,
  SECTION_1_SUBJECTS,
  getScheduledClass,
  getTimetablePeriodsForDate,
  getPeriodForSlot
} from "./data/timetable";
import { dispatchAbsentEmailNotice } from "./utils/studentEmail.js";

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("portal_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Active Dashboard state: "faculty" | "student" | "admin"
  const [activeDashboard, setActiveDashboard] = useState(() => {
    try {
      const saved = localStorage.getItem("portal_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role || "faculty";
      }
    } catch (e) {}
    return "faculty";
  });

  // Multi-Section and Mentorship State
  const [selectedSection, setSelectedSection] = useState(1);
  const [selectedCounsellor, setSelectedCounsellor] = useState("ALL");
  const [allStudentsList, setAllStudentsList] = useState(ALL_STUDENTS);

  // Multi-section attendance cache: { [sectionNum]: { [roll]: 'present' | 'absent' } }
  const [sectionAttendanceMap, setSectionAttendanceMap] = useState(() => {
    const map = {};
    for (let s = 1; s <= 22; s++) {
      const secStu = getStudentsBySection(s);
      const initial = {};
      secStu.forEach((stu) => {
        initial[stu.roll] = "present";
      });
      map[s] = initial;
    }
    return map;
  });

  // Current active section's attendance mapping
  const attendance = sectionAttendanceMap[selectedSection] || {};

  // Attendance setter updating the selected section
  const setAttendance = (updater) => {
    setSectionAttendanceMap((prev) => {
      const currentSecAtt = prev[selectedSection] || {};
      const nextSecAtt = typeof updater === "function" ? updater(currentSecAtt) : updater;
      return {
        ...prev,
        [selectedSection]: nextSecAtt
      };
    });
  };

  // Active section metadata
  const currentSectionMeta = useMemo(() => {
    return SECTIONS.find((s) => s.sectionNum === selectedSection) || SECTIONS[0];
  }, [selectedSection]);

  // Section display string e.g. "Section 1"
  const section = currentSectionMeta ? currentSectionMeta.section : `Section ${selectedSection}`;

  // Students in currently selected section (filtered by counsellor if chosen)
  const students = useMemo(() => {
    const list = getStudentsBySection(selectedSection);
    if (selectedCounsellor && selectedCounsellor !== "ALL") {
      const q = selectedCounsellor.toLowerCase().trim();
      return list.filter((s) => s.counsellor && s.counsellor.toLowerCase().includes(q));
    }
    return list;
  }, [selectedSection, selectedCounsellor, allStudentsList]);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [date, setDate] = useState(getTodayDateString);
  const [period, setPeriod] = useState(() => {
    const todayPeriods = getTimetablePeriodsForDate(getTodayDateString());
    return todayPeriods[0]?.value || "1";
  });
  const [subject, setSubject] = useState(SECTION_1_SUBJECTS[0].name);

  // Faculty WhatsApp Contacts State
  const [facultyContacts, setFacultyContacts] = useState(() => {
    const saved = localStorage.getItem("faculty_whatsapp_contacts_v3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [selectedFacultyId, setSelectedFacultyId] = useState(() => {
    return localStorage.getItem("selected_faculty_id") || "custom";
  });

  const [customFacultyPhone, setCustomFacultyPhone] = useState(() => {
    return localStorage.getItem("custom_faculty_phone") || "";
  });

  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(() => {
    const saved = localStorage.getItem("auto_send_whatsapp");
    return saved !== null ? saved === "true" : true;
  });

  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // Active Faculty Contact Resolution
  const activeFaculty =
    selectedFacultyId === "custom"
      ? { id: "custom", name: currentUser?.name || "Faculty Contact", phone: customFacultyPhone }
      : facultyContacts.find((c) => c.id === selectedFacultyId) || {
          id: "custom",
          name: currentUser?.name || "Faculty Contact",
          phone: customFacultyPhone
        };

  const [viewMode, setViewMode] = useState("matrix"); // 'matrix' | 'cards' | 'table'
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'present' | 'absent'
  const [searchQuery, setSearchQuery] = useState("");

  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [historySessions, setHistorySessions] = useState(() => {
    try {
      const cached =
        localStorage.getItem("vfstr_attendance_sessions_cache") ||
        localStorage.getItem("att_history");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Cross-tab and window session synchronization for immediate reflection
  useEffect(() => {
    const handleStorageSync = (e) => {
      if (e.key === "vfstr_attendance_sessions_cache" || e.key === "att_history") {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setHistorySessions(parsed);
            }
          }
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showQuickKeyModal, setShowQuickKeyModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [stickyInput, setStickyInput] = useState("");
  const stickyInputRef = useRef(null);
  const summaryRef = useRef(null);

  // Role-Based Access Control (RBAC) Guard Rules:
  // - Student: CANNOT access Faculty or Admin (only student view)
  // - Student: CANNOT access Faculty, Counsellor, or Admin (only student view)
  // - Faculty & Counsellor: CAN access Attendance, Counsellor, and Student (cannot access Admin)
  // - Admin: CAN access Admin, Faculty, Counsellor, and Student
  const canAccessDashboard = (userRole, target) => {
    if (target === "calendar") return true;
    if (userRole === "admin") return true;
    if (userRole === "faculty" || userRole === "counsellor") {
      return target === "faculty" || target === "counsellor" || target === "student";
    }
    if (userRole === "student") return target === "student";
    return false;
  };

  // Auth Handlers with RBAC Access Control & Role-Based Routing
  const handleLogin = (user) => {
    setCurrentUser(user);
    // Role-based routing: Admin -> Admin Dashboard, Faculty/Counsellor -> Faculty Portal, Student -> Student Dashboard
    if (user.role === "admin") {
      setActiveDashboard("admin");
    } else if (user.role === "faculty" || user.role === "counsellor") {
      setActiveDashboard("faculty");
    } else if (user.role === "student") {
      setActiveDashboard("student");
    } else {
      setActiveDashboard(user.role || "faculty");
    }

    if (user.sectionNum) {
      setSelectedSection(user.sectionNum);
    }
    if (user.role === "counsellor" && user.name) {
      setSelectedCounsellor(user.name);
    }
    localStorage.setItem("portal_auth_user", JSON.stringify(user));
    sound.playSuccess();
    showToast(`Welcome ${user.name}! (${user.role.toUpperCase()} Portal)`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("portal_auth_user");
    sound.playUncheck();
    showToast("Signed out successfully.", "info");
  };

  const handleSwitchDashboard = (target) => {
    const userRole = currentUser?.role || "student";
    if (!canAccessDashboard(userRole, target)) {
      sound.playUncheck();
      showToast(
        `⛔ Access Restricted: ${userRole.toUpperCase()} accounts cannot access the ${target.toUpperCase()} view.`,
        "warning"
      );
      return;
    }

    setActiveDashboard(target);
    sound.playCheck();
    showToast(`Switched to ${target.charAt(0).toUpperCase() + target.slice(1)} View`, "info");
  };

  const handleSelectSection = (newSecNum) => {
    const num = typeof newSecNum === "number" ? newSecNum : parseInt(String(newSecNum).replace(/\D/g, ""), 10) || 1;
    setSelectedSection(num);
    setSelectedCounsellor("ALL");
    setIsSubmitted(false);
    const secMeta = SECTIONS.find((s) => s.sectionNum === num);
    const secName = secMeta ? secMeta.section : `Section ${num}`;
    const room = secMeta ? secMeta.room : "N-Block";
    sound.playCheck();
    showToast(`Switched to ${secName} (${room})`, "info");
  };

  const handleSelectCounsellor = (counsellorName) => {
    setSelectedCounsellor(counsellorName);
    sound.playCheck();
    if (counsellorName === "ALL") {
      showToast(`Showing all students in ${section}`, "info");
    } else {
      showToast(`Filtered by Counsellor: ${counsellorName}`, "info");
    }
  };

  const handleSwitchToSection = (secNum) => {
    handleSelectSection(secNum);
    setActiveDashboard("faculty");
    sound.playCheck();
    showToast(`Opened Section ${secNum} in Faculty View`, "success");
  };

  // Enforce access rule on active dashboard whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (!canAccessDashboard(currentUser.role, activeDashboard)) {
        setActiveDashboard(currentUser.role === "student" ? "student" : "faculty");
      }
    }
  }, [currentUser]);

  // Save contacts updates permanently to backend & localStorage
  const handleSaveFacultyContacts = async (contacts) => {
    setFacultyContacts(contacts);
    localStorage.setItem("faculty_whatsapp_contacts_v3", JSON.stringify(contacts));
    await saveFacultyContacts(contacts);
  };

  const handleSelectFacultyId = (id) => {
    setSelectedFacultyId(id);
    localStorage.setItem("selected_faculty_id", id);
  };

  const handleChangeCustomPhone = (phone) => {
    setCustomFacultyPhone(phone);
    localStorage.setItem("custom_faculty_phone", phone);
  };

  const handleToggleAutoSend = (val) => {
    setAutoSendWhatsApp(val);
    localStorage.setItem("auto_send_whatsapp", String(val));
    showToast(val ? "WhatsApp auto-send enabled" : "WhatsApp auto-send disabled", "info");
  };

  // Synchronize subject with Section 1 Timetable
  const applyTimetableSlot = (targetDate, targetPeriod, silent = false) => {
    const scheduled = getScheduledClass(targetDate, targetPeriod);
    if (scheduled) {
      const sub =
        SECTION_1_SUBJECTS.find((s) => s.id === scheduled.subjectMeta?.id) ||
        scheduled.subjectMeta;
      const subName = sub?.name || scheduled.subjectTitle;
      setSubject(subName);

      if (facultyContacts && facultyContacts.length > 0) {
        const matchedFaculty = facultyContacts.find(
          (f) =>
            f.phone === scheduled.facultyPhone ||
            f.name.toLowerCase().includes(scheduled.facultyName.toLowerCase())
        );
        if (matchedFaculty) {
          setSelectedFacultyId(matchedFaculty.id);
          localStorage.setItem("selected_faculty_id", matchedFaculty.id);
        }
      }

      if (!silent) {
        showToast(
          `📅 Timetable (${scheduled.dayName} Period ${targetPeriod}): ${scheduled.subjectTitle}`,
          "info"
        );
      }
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    const dayPeriods = getTimetablePeriodsForDate(newDate);
    const isValid = dayPeriods.some((p) => p.value === period);
    const nextPeriod = isValid ? period : dayPeriods[0]?.value || "1";
    if (!isValid) {
      setPeriod(nextPeriod);
    }
    applyTimetableSlot(newDate, nextPeriod);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    applyTimetableSlot(date, newPeriod);
  };

  const handleChangeSubject = (newSubjectName) => {
    setSubject(newSubjectName);
    const matchedSubject = SECTION_1_SUBJECTS.find((s) => s.name === newSubjectName);
    if (matchedSubject) {
      const matchedFaculty = facultyContacts.find(
        (f) =>
          f.phone === matchedSubject.phone ||
          f.name.toLowerCase().includes(matchedSubject.facultyName.toLowerCase())
      );
      if (matchedFaculty) {
        setSelectedFacultyId(matchedFaculty.id);
        localStorage.setItem("selected_faculty_id", matchedFaculty.id);
        showToast(`Subject: ${matchedSubject.name} (${matchedFaculty.name})`, "info");
      }
    }
  };

  const handleSelectTimetableSlot = (slot) => {
    const targetPeriod = getPeriodForSlot(slot.day, slot.period) || slot.period;
    if (targetPeriod) setPeriod(targetPeriod);
    if (slot.subject) {
      const fullSub = SECTION_1_SUBJECTS.find(
        (s) =>
          s.name.toLowerCase().includes(slot.subject.toLowerCase()) ||
          s.id === slot.subject
      );
      setSubject(fullSub ? fullSub.name : slot.subject);
    }
    if (slot.phone) {
      const match = facultyContacts.find((f) => f.phone === slot.phone);
      if (match) {
        setSelectedFacultyId(match.id);
      } else {
        setSelectedFacultyId("custom");
        setCustomFacultyPhone(slot.phone);
      }
    }
    showToast(`Applied ${slot.day} Period ${targetPeriod}: ${slot.subject} (${slot.faculty})`, "success");
  };

  // Sync timetable on initial load
  useEffect(() => {
    applyTimetableSlot(date, period, true);
  }, []);

  // Helper to push toasts
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize students and attendance on startup
  useEffect(() => {
    async function loadData() {
      const roster = await fetchStudents();
      if (roster && roster.length > 0) {
        setAllStudentsList(roster);
      }

      // Load sessions history from backend
      const sessions = await fetchSessions();
      if (Array.isArray(sessions) && sessions.length > 0) {
        setHistorySessions(sessions);
        try {
          localStorage.setItem("vfstr_attendance_sessions_cache", JSON.stringify(sessions.slice(0, 100)));
          localStorage.setItem("att_history", JSON.stringify(sessions.slice(0, 100)));
        } catch (e) {}
      }

      // Load custom faculty contacts from backend
      try {
        const customFaculty = await fetchFacultyContacts();
        if (Array.isArray(customFaculty)) {
          setFacultyContacts(customFaculty);
          localStorage.setItem("faculty_whatsapp_contacts_v3", JSON.stringify(customFaculty));
        }
      } catch (err) {
        console.warn("Could not fetch faculty contacts from backend:", err);
      }
    }
    loadData();
  }, []);

  // Audio synthesizer toggle
  const handleToggleSound = () => {
    const nextState = sound.toggle();
    setSoundEnabled(nextState);
    showToast(nextState ? "Audio Synthesizer ON" : "Audio Synthesizer OFF", "info");
  };

  // Toggle individual student attendance with real-time email notification
  const handleToggleStudent = (roll) => {
    setAttendance((prev) => {
      const current = prev[roll] || "present";
      const next = current === "present" ? "absent" : "present";
      if (next === "absent") {
        sound.playUncheck();
        const stu = students.find((s) => s.roll === roll) || { roll, name: roll };
        const rollLower = roll.toLowerCase();
        // Immediately dispatch real absence alert to vu.<roll>@gmail.com inbox
        dispatchAbsentEmailNotice({
          studentRoll: roll,
          studentName: stu.name,
          date,
          period,
          subject,
          section,
          facultyName: activeFaculty.name,
          facultyPhone: activeFaculty.phone
        });
        showToast(`📧 Absence alert delivered to vu.${rollLower}@gmail.com (${stu.name})`, "warning");
      } else {
        sound.playCheck();
      }
      return { ...prev, [roll]: next };
    });
  };

  // Bulk actions
  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.roll] = status;
    });
    setAttendance(updated);
    if (status === "present") sound.playSuccess();
    else sound.playUncheck();

    showToast(
      status === "present"
        ? "Marked all students as Present"
        : "Marked all students as Absent",
      status === "present" ? "success" : "warning"
    );
  };

  const handleInvert = () => {
    setAttendance((prev) => {
      const inverted = {};
      students.forEach((s) => {
        inverted[s.roll] = prev[s.roll] === "absent" ? "present" : "absent";
      });
      return inverted;
    });
    sound.playCheck();
    showToast("Inverted attendance selection", "info");
  };

  const handleClearAll = () => {
    handleMarkAll("present");
  };

  // Rapid roll key-in absent apply (modal)
  const handleApplyAbsentKeys = (absentRolls) => {
    setAttendance((prev) => {
      const updated = { ...prev };
      absentRolls.forEach((r) => {
        updated[r] = "absent";
        const stu = students.find((s) => s.roll === r) || { roll: r, name: r };
        dispatchAbsentEmailNotice({
          studentRoll: r,
          studentName: stu.name,
          date,
          period,
          subject,
          section,
          facultyName: activeFaculty.name,
          facultyPhone: activeFaculty.phone
        });
      });
      return updated;
    });
    sound.playUncheck();
    showToast(`Marked ${absentRolls.length} roll number(s) as Absent & delivered alerts to vu.<roll>@gmail.com`, "warning");
  };

  // Quick roll search/key-in from the sticky bottom bar
  const handleStickyRollSubmit = (e) => {
    e.preventDefault();
    const query = stickyInput.trim().toUpperCase();
    if (!query) return;

    const tokens = query.split(/[\s,;]+/).filter(Boolean);
    const matchedStudents = [];

    tokens.forEach((tok) => {
      const matched = students.find((s, idx) => {
        const roll = s.roll.toUpperCase();
        const seq = String(idx + 1);
        return roll === tok || roll.endsWith(tok) || roll.includes(tok) || seq === tok;
      });
      if (matched && !matchedStudents.some((m) => m.roll === matched.roll)) {
        matchedStudents.push(matched);
      }
    });

    if (matchedStudents.length > 0) {
      const summaryNotes = [];
      setAttendance((prev) => {
        const updated = { ...prev };
        matchedStudents.forEach((student) => {
          const current = updated[student.roll] || "present";
          const next = current === "present" ? "absent" : "present";
          updated[student.roll] = next;

          if (next === "absent") {
            sound.playUncheck();
            summaryNotes.push(`✕ ${student.roll} (${student.name}) Absent`);
            // Real absence email dispatched to vu.<roll>@gmail.com
            dispatchAbsentEmailNotice({
              studentRoll: student.roll,
              studentName: student.name,
              date,
              period,
              subject,
              section,
              facultyName: activeFaculty.name,
              facultyPhone: activeFaculty.phone
            });
          } else {
            sound.playCheck();
            summaryNotes.push(`✓ ${student.roll} (${student.name}) Present`);
          }
        });
        return updated;
      });

      showToast(summaryNotes.join(" • "), "info");
      setStickyInput("");
      if (stickyInputRef.current) stickyInputRef.current.focus();
    } else {
      showToast(`No student found matching "${query}"`, "warning");
    }
  };

  // Submit attendance and save
  const handleSubmitAttendance = async () => {
    setIsSubmitted(true);
    sound.playSuccess();

    const presentStudents = students.filter((s) => attendance[s.roll] === "present");
    const absentStudents = students.filter((s) => attendance[s.roll] === "absent");
    const presentCount = presentStudents.length;
    const absentCount = absentStudents.length;
    const percentage = students.length > 0 ? ((presentCount / students.length) * 100).toFixed(1) : "0.0";

    const sessionPayload = {
      id: `session_${Date.now()}`,
      date,
      period,
      subject,
      section,
      facultyName: activeFaculty.name,
      facultyPhone: activeFaculty.phone,
      total: students.length,
      presentCount,
      absentCount,
      percentage,
      absentRolls: absentStudents.map((s) => ({ roll: s.roll, name: s.name })),
      presentRolls: presentStudents.map((s) => ({ roll: s.roll, name: s.name })),
      attendance,
      timestamp: new Date().toISOString()
    };

    // 1. Immediate optimistic synchronous update across all views (0ms latency)
    setHistorySessions((prev) => {
      const updated = [sessionPayload, ...prev.filter((s) => s.id !== sessionPayload.id)];
      try {
        localStorage.setItem("att_history", JSON.stringify(updated.slice(0, 100)));
        localStorage.setItem("vfstr_attendance_sessions_cache", JSON.stringify(updated.slice(0, 100)));
      } catch (e) {}
      return updated;
    });

    // 2. Dispatch cross-component and cross-tab window event immediately
    try {
      window.dispatchEvent(new CustomEvent("attendance_session_saved", { detail: sessionPayload }));
    } catch (e) {}

    // 3. Save to Express backend asynchronously without blocking or delaying portals
    saveSession(sessionPayload)
      .then((res) => {
        if (res && res.data && res.data.id !== sessionPayload.id) {
          setHistorySessions((prev) => {
            const synced = prev.map((s) => (s.id === sessionPayload.id ? res.data : s));
            try {
              localStorage.setItem("att_history", JSON.stringify(synced.slice(0, 100)));
              localStorage.setItem("vfstr_attendance_sessions_cache", JSON.stringify(synced.slice(0, 100)));
            } catch (e) {}
            return synced;
          });
        }
      })
      .catch((err) => {
        console.warn("Backend saveSession background error (local state preserved):", err);
      });

    // Batch dispatch absence emails to all absentees at vu.<roll>@gmail.com
    if (absentStudents.length > 0) {
      // Optimistically record each absent student in local mailbox storage
      absentStudents.forEach((stu) => {
        dispatchAbsentEmailNotice({
          studentRoll: stu.roll,
          studentName: stu.name,
          date,
          period,
          subject,
          section,
          facultyName: activeFaculty.name,
          facultyPhone: activeFaculty.phone
        });
      });

      try {
        const batchRes = await fetch("/api/notifications/absent/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            absentRolls: absentStudents.map((s) => ({ roll: s.roll, name: s.name })),
            date,
            period,
            subject,
            section,
            facultyName: activeFaculty.name,
            facultyPhone: activeFaculty.phone
          })
        });
        const batchData = await batchRes.json();
        if (batchData.success) {
          showToast(`📧 Official absence alerts delivered to ${batchData.count} students at vu.<roll>@gmail.com`, "info");
        }
      } catch (err) {
        console.warn("Absentee email batch dispatch error:", err);
      }
    }

    if (autoSendWhatsApp && activeFaculty.phone) {
      const waMessage = generateWhatsAppMessage({
        date,
        period,
        section,
        subject,
        facultyName: activeFaculty.name,
        total: students.length,
        presentCount,
        absentCount,
        absentStudents
      });

      const { cleanNumber, opened } = openWhatsAppChat({
        phone: activeFaculty.phone,
        message: waMessage
      });

      if (opened) {
        showToast(
          `Attendance Submitted! Opening WhatsApp to send absent numbers to ${activeFaculty.name}...`,
          "success"
        );
      } else {
        showToast(
          `Attendance Submitted! (Popup blocked: Click 'Send to WhatsApp' in summary below)`,
          "info"
        );
      }
    } else {
      showToast(
        `Attendance Submitted! ${presentCount} Present, ${absentCount} Absent (${percentage}%)`,
        "success"
      );
    }

    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Restore previous session
  const handleLoadSession = (session) => {
    if (session.date) setDate(session.date);
    if (session.period) setPeriod(session.period);
    if (session.subject) setSubject(session.subject);
    if (session.section) setSection(session.section);
    if (session.facultyPhone) {
      const match = facultyContacts.find((c) => c.phone === session.facultyPhone);
      if (match) {
        setSelectedFacultyId(match.id);
      } else {
        setSelectedFacultyId("custom");
        setCustomFacultyPhone(session.facultyPhone);
      }
    }

    if (session.attendance) {
      setAttendance(session.attendance);
    } else if (session.absentRolls) {
      const restored = {};
      students.forEach((s) => {
        restored[s.roll] = "present";
      });
      session.absentRolls.forEach((item) => {
        const roll = item.roll || item;
        restored[roll] = "absent";
      });
      setAttendance(restored);
    }

    setIsSubmitted(true);
    setShowHistoryModal(false);
    sound.playSuccess();
    showToast(`Loaded session from ${session.date} (Period ${session.period})`, "info");
  };

  // Delete session
  const handleDeleteSession = async (id) => {
    setHistorySessions((prev) => {
      const updated = prev.filter((s) => String(s.id) !== String(id));
      try {
        localStorage.setItem("att_history", JSON.stringify(updated));
        localStorage.setItem("vfstr_attendance_sessions_cache", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      window.dispatchEvent(new CustomEvent("attendance_session_deleted", { detail: { id } }));
    } catch (e) {}
    await deleteSession(id);
    showToast("Session removed from records", "info");
  };

  // Admin student roster methods
  const handleSaveStudent = async (student) => {
    await saveStudent(student);
    setAllStudentsList((prev) => {
      const existing = prev.findIndex((s) => s.roll.toUpperCase() === student.roll.toUpperCase());
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = student;
        return copy;
      }
      return [...prev, student];
    });
    setAttendance((prev) => ({ ...prev, [student.roll]: "present" }));
  };

  const handleDeleteStudent = async (roll) => {
    await deleteStudent(roll);
    setAllStudentsList((prev) => prev.filter((s) => s.roll.toUpperCase() !== roll.toUpperCase()));
    setAttendance((prev) => {
      const copy = { ...prev };
      delete copy[roll];
      return copy;
    });
    showToast(`Student ${roll} removed from roster`, "info");
  };

  // Filter students for Faculty view
  const filteredStudents = students.filter((s) => {
    const status = attendance[s.roll] || "present";
    if (filterMode === "present" && status !== "present") return false;
    if (filterMode === "absent" && status !== "absent") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRoll = s.roll.toLowerCase().includes(q);
      const matchName = s.name && s.name.toLowerCase().includes(q);
      if (!matchRoll && !matchName) return false;
    }

    return true;
  });

  const counts = {
    total: students.length,
    present: students.filter((s) => attendance[s.roll] === "present").length,
    absent: students.filter((s) => attendance[s.roll] === "absent").length
  };

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return (
      <div className="app-container">
        <Toast toasts={toasts} onDismiss={dismissToast} />
        <LoginScreen onLogin={handleLogin} students={allStudentsList} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar with Profile, Dashboard Switcher & Logout */}
      <Navbar
        currentUser={currentUser}
        activeDashboard={activeDashboard}
        onSwitchDashboard={handleSwitchDashboard}
        onLogout={handleLogout}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        totalStudents={allStudentsList.length}
        activeSection={selectedSection}
      />

      {/* Render Selected Dashboard */}
      {activeDashboard === "faculty" && (
        <>
          <Header
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenTimetable={() => setShowTimetableModal(true)}
            onOpenHistory={() => setShowHistoryModal(true)}
            historyCount={historySessions.length}
            onSubmit={handleSubmitAttendance}
            isSubmitted={isSubmitted}
            studentCount={students.length}
            settings={settings}
          />
          <FacultyDashboard
            currentUser={currentUser}
            sections={SECTIONS}
            section={section}
            onSelectSection={handleSelectSection}
            selectedCounsellor={selectedCounsellor}
            onSelectCounsellor={handleSelectCounsellor}
            date={date}
            onChangeDate={handleDateChange}
            period={period}
            onChangePeriod={handlePeriodChange}
            subject={subject}
            onChangeSubject={handleChangeSubject}
            activeFaculty={activeFaculty}
            facultyContacts={facultyContacts}
            selectedFacultyId={selectedFacultyId}
            onChangeFacultyId={handleSelectFacultyId}
            customFacultyPhone={customFacultyPhone}
            onChangeCustomFacultyPhone={handleChangeCustomPhone}
            autoSendWhatsApp={autoSendWhatsApp}
            onToggleAutoSendWhatsApp={handleToggleAutoSend}
            onOpenManageFaculty={() => setShowFacultyModal(true)}
            onOpenTimetable={() => setShowTimetableModal(true)}
            onMarkAll={handleMarkAll}
            onInvert={handleInvert}
            onClearAll={handleClearAll}
            viewMode={viewMode}
            onViewChange={setViewMode}
            filterMode={filterMode}
            onFilterChange={setFilterMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            counts={counts}
            onOpenQuickKey={() => setShowQuickKeyModal(true)}
            filteredStudents={filteredStudents}
            students={students}
            attendance={attendance}
            onToggleStudent={handleToggleStudent}
            isSubmitted={isSubmitted}
            onSubmitAttendance={handleSubmitAttendance}
            summaryRef={summaryRef}
            showToast={showToast}
            stickyInput={stickyInput}
            setStickyInput={setStickyInput}
            stickyInputRef={stickyInputRef}
            onStickyRollSubmit={handleStickyRollSubmit}
            showHistoryModal={showHistoryModal}
            setShowHistoryModal={setShowHistoryModal}
            historySessions={historySessions}
            onLoadSession={handleLoadSession}
            onDeleteSession={handleDeleteSession}
            showQuickKeyModal={showQuickKeyModal}
            setShowQuickKeyModal={setShowQuickKeyModal}
            onApplyAbsentKeys={handleApplyAbsentKeys}
            showFacultyModal={showFacultyModal}
            setShowFacultyModal={setShowFacultyModal}
            onSaveFacultyContacts={handleSaveFacultyContacts}
            showTimetableModal={showTimetableModal}
            setShowTimetableModal={setShowTimetableModal}
            onSelectTimetableSlot={handleSelectTimetableSlot}
          />
        </>
      )}

      {activeDashboard === "counsellor" && (
        <CounsellorDashboard
          currentUser={currentUser}
          students={allStudentsList}
          sessions={historySessions}
          onShowToast={showToast}
          onSwitchToAttendance={(secNum) => {
            handleSelectSection(secNum);
            handleSwitchDashboard("faculty");
          }}
        />
      )}

      {activeDashboard === "calendar" && (
        <AcademicCalendarView
          currentUser={currentUser}
          onShowToast={showToast}
          onSwitchView={handleSwitchDashboard}
        />
      )}

      {activeDashboard === "student" && (
        <StudentDashboard
          currentUser={currentUser}
          students={allStudentsList}
          sessions={historySessions}
          onShowToast={showToast}
          onOpenCalendarView={() => handleSwitchDashboard("calendar")}
        />
      )}

      {activeDashboard === "admin" && (
        <AdminDashboard
          currentUser={currentUser}
          students={allStudentsList}
          sessions={historySessions}
          facultyContacts={facultyContacts}
          onSaveStudent={handleSaveStudent}
          onDeleteStudent={handleDeleteStudent}
          onDeleteSession={handleDeleteSession}
          onShowToast={showToast}
          onSwitchToSection={handleSwitchToSection}
        />
      )}
    </div>
  );
}
