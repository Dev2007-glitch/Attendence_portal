import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import LoginScreen from "./components/auth/LoginScreen";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import CounsellorDashboard from "./components/dashboards/CounsellorDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import AcademicCalendarView from "./components/calendar/AcademicCalendarView";
import FacultyLocatorModal from "./components/faculty/FacultyLocatorModal";
import FacultySearchView from "./components/faculty/FacultySearchView";
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
  getPeriodForSlot,
  getMarkedPeriodsForDateAndSection,
  getNextUnmarkedPeriod
} from "./data/timetable";
import { dispatchAbsentEmailNotice, openGmailAbsenceNotice } from "./utils/studentEmail.js";

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

  // Active Dashboard state: "faculty" | "counsellor" | "student" | "admin" | "calendar" | "faculty-search"
  const [activeDashboard, setActiveDashboard] = useState(() => {
    try {
      const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
      if (hash && ["faculty", "counsellor", "student", "admin", "calendar", "faculty-search"].includes(hash)) {
        return hash;
      }
      const savedDash = localStorage.getItem("portal_active_dashboard");
      if (savedDash && ["faculty", "counsellor", "student", "admin", "calendar", "faculty-search"].includes(savedDash)) {
        return savedDash;
      }
      const saved = localStorage.getItem("portal_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role || "faculty";
      }
    } catch (e) {}
    return "faculty";
  });

  // Track previous dashboard for smooth back-navigation
  const [previousDashboard, setPreviousDashboard] = useState(() => {
    return activeDashboard === "faculty-search" ? "calendar" : "student";
  });

  // Listen to browser forward/back button (URL hash changes)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["faculty", "counsellor", "student", "admin", "calendar", "faculty-search"].includes(hash)) {
        setActiveDashboard(hash);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Faculty Locator Modal state (Search for Faculty live modal)
  const [showGlobalFacultyLocator, setShowGlobalFacultyLocator] = useState(false);

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

  const [autoSendEmail, setAutoSendEmail] = useState(() => {
    const saved = localStorage.getItem("auto_send_email");
    return saved !== null ? saved === "true" : true;
  });

  const handleToggleAutoSendEmail = (val) => {
    setAutoSendEmail(val);
    localStorage.setItem("auto_send_email", String(val));
    showToast(val ? "Email auto-send enabled" : "Email auto-send disabled", "info");
  };

  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // Active Faculty Contact Resolution - Defaults to official VFSTR University authority
  const activeFaculty =
    selectedFacultyId === "custom"
      ? {
          id: "custom",
          name: (!currentUser?.name || currentUser.name.toLowerCase().includes("devi") || currentUser.name === "Faculty Contact")
            ? "VFSTR University"
            : currentUser.name,
          phone: customFacultyPhone || "+919000443503"
        }
      : facultyContacts.find((c) => c.id === selectedFacultyId) || {
          id: "custom",
          name: "VFSTR University",
          phone: customFacultyPhone || "+919000443503"
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

  // Cross-tab, window, and server session synchronization for immediate real-time reflection
  useEffect(() => {
    let channel = null;
    try {
      channel = new BroadcastChannel("vfstr_attendance_realtime");
      channel.onmessage = (event) => {
        if (event.data?.type === "SESSION_SAVED" && event.data?.session) {
          const incoming = event.data.session;
          setHistorySessions((prev) => {
            const exists = prev.some((s) => s.id === incoming.id);
            if (exists) return prev;
            const updated = [incoming, ...prev];
            try {
              localStorage.setItem("att_history", JSON.stringify(updated.slice(0, 100)));
              localStorage.setItem("vfstr_attendance_sessions_cache", JSON.stringify(updated.slice(0, 100)));
            } catch (e) {}
            return updated;
          });
          showToast(`🔔 Live Feed: Attendance posted for ${incoming.section} (Period ${incoming.period})!`, "info");
        }
      };
    } catch (e) {}

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

    // Initial load from server to fetch all recorded sessions across all sections
    fetchSessions()
      .then((remoteSessions) => {
        if (Array.isArray(remoteSessions) && remoteSessions.length > 0) {
          setHistorySessions((prev) => {
            const map = new Map();
            remoteSessions.forEach((s) => map.set(s.id, s));
            prev.forEach((s) => map.set(s.id, s));
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.timestamp || b.id) - new Date(a.timestamp || a.id));
            return merged;
          });
        }
      })
      .catch(() => {});

    // High-frequency 3.5s background polling so any attendance posted from any section reflects immediately in Admin Dashboard
    const pollInterval = setInterval(async () => {
      try {
        const remote = await fetchSessions();
        if (Array.isArray(remote) && remote.length > 0) {
          setHistorySessions((prev) => {
            const prevIds = new Set(prev.map((s) => s.id));
            const hasNew = remote.some((r) => !prevIds.has(r.id));
            if (hasNew || remote.length !== prev.length) {
              const map = new Map();
              remote.forEach((s) => map.set(s.id, s));
              prev.forEach((s) => map.set(s.id, s));
              const merged = Array.from(map.values());
              merged.sort((a, b) => new Date(b.timestamp || b.id) - new Date(a.timestamp || a.id));
              return merged;
            }
            return prev;
          });
        }
      } catch (err) {}
    }, 3500);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageSync);
      clearInterval(pollInterval);
    };
  }, []);

  // Smart Timetable Period Progression:
  // When portal opens or section/date change, if the currently selected period
  // is already marked for today, auto-advance to the next unmarked period on initial load.
  const initialSyncRef = useRef(false);
  useEffect(() => {
    if (!initialSyncRef.current && historySessions && historySessions.length > 0) {
      initialSyncRef.current = true;
      const { markedSet } = getMarkedPeriodsForDateAndSection(date, selectedSection, historySessions);
      if (markedSet.has(String(period))) {
        const nextP = getNextUnmarkedPeriod(date, selectedSection, historySessions);
        if (nextP && nextP !== period) {
          setPeriod(nextP);
          applyTimetableSlot(date, nextP, true, selectedSection);
          // Fresh attendance session for the new period (all students present, 0 absentees ticked)
          const resetAtt = {};
          const secStudents = getStudentsBySection(selectedSection);
          secStudents.forEach((s) => {
            resetAtt[s.roll] = "present";
          });
          setAttendance(resetAtt);
          setIsSubmitted(false);
        }
      }
    }
  }, [historySessions]);

  // 24-Hour Daily Window Monitor:
  // Automatically detects when a new day arrives (or across midnight),
  // ensuring all timetable periods are fresh and ready to mark for the new day.
  useEffect(() => {
    const handleDailyRollover = () => {
      const todayStr = getTodayDateString();
      setDate((currentDate) => {
        if (currentDate !== todayStr) {
          const todayPeriods = getTimetablePeriodsForDate(todayStr, selectedSection);
          const firstP = todayPeriods[0]?.value || "1";
          setPeriod(firstP);
          applyTimetableSlot(todayStr, firstP, true, selectedSection);
          setIsSubmitted(false);
          const resetAtt = {};
          const secStudents = getStudentsBySection(selectedSection);
          secStudents.forEach((s) => {
            resetAtt[s.roll] = "present";
          });
          setAttendance(resetAtt);
          return todayStr;
        }
        return currentDate;
      });
    };

    const interval = setInterval(handleDailyRollover, 30000);
    window.addEventListener("focus", handleDailyRollover);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleDailyRollover);
    };
  }, [selectedSection]);

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
    if (target === "calendar" || target === "faculty-search") return true;
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

    // Persist Login Event to MongoDB login_history
    try {
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, provider: user.authProvider || "credentials" })
      }).catch((e) => console.warn("[Auth Sync Warning]:", e.message));
    } catch (e) {}
  };

  const handleLogout = () => {
    if (currentUser) {
      try {
        fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id || currentUser.roll,
            role: currentUser.role,
            name: currentUser.name
          })
        }).catch((e) => console.warn("[Logout Sync Warning]:", e.message));
      } catch (e) {}
    }
    setCurrentUser(null);
    localStorage.removeItem("portal_auth_user");
    sound.playUncheck();
    showToast("Signed out successfully.", "info");
  };

  const handleSwitchDashboard = (target) => {
    console.log("[APP.JSX] handleSwitchDashboard requested with target:", target);
    const userRole = currentUser?.role || "student";
    const allowed = canAccessDashboard(userRole, target);
    console.log(`[APP.JSX] User role: '${userRole}', target: '${target}', permission granted: ${allowed}`);
    if (!allowed) {
      sound.playUncheck();
      showToast(
        `⛔ Access Restricted: ${userRole.toUpperCase()} accounts cannot access the ${target.toUpperCase()} view.`,
        "warning"
      );
      return;
    }

    if (activeDashboard !== target) {
      setPreviousDashboard(activeDashboard);
    }
    setActiveDashboard(target);
    try {
      localStorage.setItem("portal_active_dashboard", target);
      window.location.hash = target;
    } catch (e) {}
    sound.playCheck();
    const label = target === "faculty-search" ? "Faculty Search" : target.charAt(0).toUpperCase() + target.slice(1);
    showToast(`Switched to ${label} View`, "info");
    console.log("[APP.JSX] State updated! activeDashboard is now:", target);
  };

  const handleSelectSection = (newSecNum) => {
    const num = typeof newSecNum === "number" ? newSecNum : parseInt(String(newSecNum).replace(/\D/g, ""), 10) || 1;
    setSelectedSection(num);
    setSelectedCounsellor("ALL");
    setIsSubmitted(false);
    const secMeta = SECTIONS.find((s) => s.sectionNum === num);
    const secName = secMeta ? secMeta.section : `Section ${num}`;
    const room = secMeta ? secMeta.room : "N-Block";

    // Auto-advance period: if Period 1 & 2 marked, show Period 3. If not marked, show Period 1!
    const nextP = getNextUnmarkedPeriod(date, num, historySessions);
    setPeriod(nextP);
    applyTimetableSlot(date, nextP, true, num);

    const { markedSet, sessionsMap } = getMarkedPeriodsForDateAndSection(date, num, historySessions);
    if (markedSet.has(String(nextP))) {
      const existing = sessionsMap.get(String(nextP));
      if (existing && existing.attendance) {
        setAttendance(existing.attendance);
        setIsSubmitted(true);
      }
    } else {
      setIsSubmitted(false);
      const resetAtt = {};
      const secStudents = getStudentsBySection(num);
      secStudents.forEach((s) => {
        resetAtt[s.roll] = "present";
      });
      setAttendance(resetAtt);
    }

    sound.playCheck();
    showToast(`Switched to ${secName} (${room}) • Period ${nextP}`, "info");
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

  // Synchronize subject with respective Section Timetable (from https://tinyurl.com/3rdyearTT2026)
  const applyTimetableSlot = (targetDate, targetPeriod, silent = false, secNum = selectedSection) => {
    const scheduled = getScheduledClass(targetDate, targetPeriod, secNum);
    if (scheduled) {
      setSubject(scheduled.subjectTitle || "Class Session");

      if (facultyContacts && facultyContacts.length > 0) {
        const matchedFaculty = facultyContacts.find(
          (f) =>
            (scheduled.facultyPhone && f.phone === scheduled.facultyPhone) ||
            (scheduled.facultyName && f.name.toLowerCase().includes(scheduled.facultyName.toLowerCase()))
        );
        if (matchedFaculty) {
          setSelectedFacultyId(matchedFaculty.id);
          localStorage.setItem("selected_faculty_id", matchedFaculty.id);
        } else if (scheduled.facultyPhone) {
          setCustomFacultyPhone(scheduled.facultyPhone);
        }
      }

      if (!silent) {
        showToast(
          `📅 Section ${secNum} Timetable (${scheduled.dayName} Period ${targetPeriod}): ${scheduled.subjectTitle} [${scheduled.room}]`,
          "info"
        );
      }
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    const nextP = getNextUnmarkedPeriod(newDate, selectedSection, historySessions);
    setPeriod(nextP);
    applyTimetableSlot(newDate, nextP, false, selectedSection);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    applyTimetableSlot(date, newPeriod, false, selectedSection);

    // If selecting an already marked period, load its recorded attendance; otherwise reset to present
    const { markedSet, sessionsMap } = getMarkedPeriodsForDateAndSection(date, selectedSection, historySessions);
    if (markedSet.has(String(newPeriod))) {
      const existing = sessionsMap.get(String(newPeriod));
      if (existing && existing.attendance) {
        setAttendance(existing.attendance);
        setIsSubmitted(true);
        showToast(`⚠️ Period ${newPeriod} was already submitted for ${date}. Showing recorded attendance.`, "warning");
      }
    } else {
      setIsSubmitted(false);
      const resetAtt = {};
      const secStudents = getStudentsBySection(selectedSection);
      secStudents.forEach((s) => {
        resetAtt[s.roll] = "present";
      });
      setAttendance(resetAtt);
    }
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

  // Toast notifications disabled per user request
  const showToast = () => {};
  const dismissToast = () => {};

  // Initialize students and attendance on startup
  useEffect(() => {
    async function loadData() {
      const roster = await fetchStudents();
      if (roster && roster.length > 0) {
        setAllStudentsList(roster);
      }

      // Ensure active session & login history is recorded in MongoDB
      if (currentUser) {
        try {
          fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: currentUser, provider: currentUser.authProvider || "stored_session" })
          }).catch(() => {});
        } catch (e) {}
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
      section: `Section ${selectedSection}`,
      sectionNum: selectedSection,
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
      const channel = new BroadcastChannel("vfstr_attendance_realtime");
      channel.postMessage({ type: "SESSION_SAVED", session: sessionPayload });
      channel.close();
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

    // Auto-send Email via Google Gmail if enabled
    if (autoSendEmail && absentStudents.length > 0) {
      openGmailAbsenceNotice({
        absentStudents,
        period,
        subject,
        section,
        date,
        facultyName: activeFaculty.name,
        facultyPhone: activeFaculty.phone
      });
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

  // Move cleanly to the next period with fresh attendance
  const handleProceedNextPeriod = (targetPeriod) => {
    const nextP = targetPeriod || getNextUnmarkedPeriod(date, selectedSection, historySessions);
    if (nextP && nextP !== period) {
      setPeriod(nextP);
      applyTimetableSlot(date, nextP, false, selectedSection);
      setIsSubmitted(false);
      const resetAtt = {};
      const secStudents = getStudentsBySection(selectedSection);
      secStudents.forEach((s) => {
        resetAtt[s.roll] = "present";
      });
      setAttendance(resetAtt);
      showToast(`Switched to Period ${nextP} with fresh attendance`, "info");
    }
  };

  // Reset or clear attendance for current period to mark afresh
  const handleResetPeriodAttendance = () => {
    setIsSubmitted(false);
    const resetAtt = {};
    const secStudents = getStudentsBySection(selectedSection);
    secStudents.forEach((s) => {
      resetAtt[s.roll] = "present";
    });
    setAttendance(resetAtt);
    showToast(`Period ${period} attendance reset to all present`, "info");
  };

  // Trigger Google Gmail compose for current absentees
  const handleSendEmailToAbsentees = () => {
    const absentStudents = students.filter((s) => attendance[s.roll] === "absent");
    if (absentStudents.length === 0) {
      showToast("All students are marked present. No absentees to email.", "info");
      return;
    }
    openGmailAbsenceNotice({
      absentStudents,
      period,
      subject,
      section,
      date,
      facultyName: activeFaculty.name,
      facultyPhone: activeFaculty.phone
    });
  };

  // Restore previous session
  const handleLoadSession = (session) => {
    if (session.date) setDate(session.date);
    if (session.period) setPeriod(session.period);
    if (session.subject) setSubject(session.subject);
    if (session.sectionNum) {
      setSelectedSection(session.sectionNum);
    } else if (session.section) {
      const num = parseInt(String(session.section).replace(/\D/g, ""), 10) || 1;
      setSelectedSection(num);
    }
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

  const nextUnmarkedPeriod = useMemo(() => {
    return getNextUnmarkedPeriod(date, selectedSection, historySessions);
  }, [date, selectedSection, historySessions]);

  // If user is not logged in, show Login Screen (direct render without wrapper container to prevent scrollbars)
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} students={allStudentsList} />;
  }

  return (
    <div className="app-container">
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
        onOpenFacultyLocator={() => setShowGlobalFacultyLocator(true)}
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
            section={section}
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
            autoSendEmail={autoSendEmail}
            onToggleAutoSendEmail={handleToggleAutoSendEmail}
            onSendEmailToAbsentees={handleSendEmailToAbsentees}
            onResetPeriodAttendance={handleResetPeriodAttendance}
            onProceedNextPeriod={handleProceedNextPeriod}
            nextPeriod={nextUnmarkedPeriod}
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
          onOpenFacultySearch={() => handleSwitchDashboard("faculty-search")}
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

      {/* Search for Faculty Full Page View */}
      {activeDashboard === "faculty-search" && (
        <FacultySearchView
          currentUser={currentUser}
          onBack={() => handleSwitchDashboard(previousDashboard || "calendar")}
          onShowToast={showToast}
          onOpenLocatorModal={() => setShowGlobalFacultyLocator(true)}
        />
      )}

      {/* Global Search for Faculty Modal (Live Timetable Location Finder) */}
      <FacultyLocatorModal
        isOpen={showGlobalFacultyLocator}
        onClose={() => setShowGlobalFacultyLocator(false)}
        currentStudent={currentUser?.role === "student" ? currentUser : null}
        onShowToast={showToast}
      />
    </div>
  );
}
