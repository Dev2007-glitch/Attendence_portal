import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  User,
  BookOpen,
  X,
  Compass,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Copy,
  Check,
  Building,
  RotateCcw
} from "lucide-react";
import {
  getAllFacultyDirectory,
  getFacultyCurrentLocation,
  COLLEGE_PERIOD_INTERVALS,
  getSlotTime
} from "../../utils/facultyLocator.js";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultyLocatorModal({
  isOpen,
  onClose,
  currentStudent = null,
  onShowToast = () => {}
}) {
  const [facultyList, setFacultyList] = useState(() => getAllFacultyDirectory());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "my_section" | "in_class" | "in_cabin" | "counsellors"
  const [selectedFacultyId, setSelectedFacultyId] = useState(() => {
    const list = getAllFacultyDirectory();
    if (currentStudent?.sectionNum) {
      const secTeacher = list.find((f) => f.sectionNumsList?.includes(currentStudent.sectionNum));
      if (secTeacher) return secTeacher.id;
    }
    return list[0]?.id || null;
  });
  const [selectedDay, setSelectedDay] = useState("LIVE"); // "LIVE" or day name
  const [selectedPeriod, setSelectedPeriod] = useState("LIVE"); // "LIVE" or period "1".."8"
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline"); // "timeline" | "weekly"

  // Update selected faculty when student changes
  useEffect(() => {
    if (facultyList.length > 0 && !selectedFacultyId) {
      if (currentStudent?.sectionNum) {
        const secTeacher = facultyList.find((f) => f.sectionNumsList?.includes(currentStudent.sectionNum));
        if (secTeacher) {
          setSelectedFacultyId(secTeacher.id);
          return;
        }
      }
      setSelectedFacultyId(facultyList[0].id);
    }
  }, [currentStudent, facultyList, selectedFacultyId]);

  // Current real-world Day Name
  const realCurrentDay = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  const effectiveDay = selectedDay === "LIVE" ? realCurrentDay : selectedDay;

  // Filtered faculties
  const filteredFaculties = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const studentSecNum = currentStudent?.sectionNum || 1;

    return facultyList.filter((fac) => {
      // 1. Text Search matching name, subjects, sections, or cabin
      const matchesSearch =
        !q ||
        fac.name.toLowerCase().includes(q) ||
        fac.cabin.toLowerCase().includes(q) ||
        fac.subjectsList.some((s) => s.toLowerCase().includes(q)) ||
        fac.sectionsList.some((sec) => sec.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 2. Tab Filter
      if (activeFilter === "my_section") {
        return fac.sectionNumsList?.includes(studentSecNum);
      }
      if (activeFilter === "counsellors") {
        return fac.isCounsellor || fac.isClassTeacher;
      }

      // Check current location status for in_class / in_cabin
      if (activeFilter === "in_class" || activeFilter === "in_cabin") {
        const loc = getFacultyCurrentLocation(fac, effectiveDay, selectedPeriod);
        if (activeFilter === "in_class") return loc.inClass;
        if (activeFilter === "in_cabin") return !loc.inClass && loc.status === "IN_CABIN";
      }

      return true;
    });
  }, [facultyList, searchQuery, activeFilter, currentStudent, effectiveDay, selectedPeriod]);

  // Selected faculty object
  const activeFaculty = useMemo(() => {
    return facultyList.find((f) => f.id === selectedFacultyId) || filteredFaculties[0] || facultyList[0];
  }, [facultyList, selectedFacultyId, filteredFaculties]);

  // Selected faculty location info
  const activeLocation = useMemo(() => {
    if (!activeFaculty) return null;
    return getFacultyCurrentLocation(activeFaculty, effectiveDay, selectedPeriod);
  }, [activeFaculty, effectiveDay, selectedPeriod]);

  if (!isOpen) return null;

  // Handle WhatsApp message generator
  const handleOpenWhatsApp = () => {
    if (!activeFaculty) return;
    const cleanPhone = (activeFaculty.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      onShowToast("No phone number available for this faculty member.", "error");
      return;
    }
    const studentName = currentStudent?.name || "Student";
    const studentRoll = currentStudent?.roll || "";
    const studentSec = currentStudent?.section || `Section ${currentStudent?.sectionNum || 1}`;

    const text = `Respected Prof. ${activeFaculty.name},\n\nI am ${studentName} (Regd: ${studentRoll}, ${studentSec}). I visited your cabin (${activeFaculty.cabin}) but noticed you were not available.\n\nCould you please let me know when you will be free in your cabin so that I may meet you?\n\nThank you,\n${studentName}`;

    const url = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopyLocation = () => {
    if (!activeFaculty || !activeLocation) return;
    const text = `[VFSTR Faculty Location] ${activeFaculty.name} is currently at: ${activeLocation.room} (${activeLocation.locationDetails}). Cabin: ${activeFaculty.cabin}.`;
    navigator.clipboard.writeText(text);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 2000);
    onShowToast("Faculty location copied to clipboard!", "success");
  };

  const modalContent = (
    <div
      className="modal-overlay active"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(4px)",
        opacity: 1,
        visibility: "visible",
        pointerEvents: "auto"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="faculty-locator-modal"
        style={{
          background: "#ffffff",
          width: "100%",
          maxWidth: "1150px",
          height: "92vh",
          maxHeight: "850px",
          display: "flex",
          flexDirection: "column",
          borderRadius: "0px",
          border: "3px solid #000000",
          boxShadow: "8px 8px 0px #000000",
          overflow: "hidden"
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            background: "#000000",
            color: "#ffffff",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #000000"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "#f59e0b",
                color: "#000000",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900
              }}
            >
              <Compass size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                Search for Faculty
              </h2>
              <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                Faculty not in their cabin? Find their live classroom, lab, or timetable location right now.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "1px solid #ffffff",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: 800
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Simulator & Real-Time Controls Banner */}
        <div
          style={{
            background: "#f8fafc",
            padding: "10px 18px",
            borderBottom: "2px solid #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          {/* Day & Period Pickers */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>
                <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                Day:
              </span>
              <select
                className="form-select form-select-sm"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "0px",
                  border: "1.5px solid #000000"
                }}
              >
                <option value="LIVE">⚡ Today ({realCurrentDay}) - Live Now</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>
                <Clock size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                Time / Period:
              </span>
              <select
                className="form-select form-select-sm"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "0px",
                  border: "1.5px solid #000000"
                }}
              >
                <option value="LIVE">⚡ Real-Time Live Clock</option>
                <option value="1">Period 1 (8.15 - 9.05 AM)</option>
                <option value="2">Period 2 (9.05 - 9.55 AM)</option>
                <option value="3">Period 3 (9.55 - 10.45 AM)</option>
                <option value="4">Period 4 (11.00 - 11.50 AM)</option>
                <option value="5">Period 5 (11.50 - 12.40 PM)</option>
                <option value="6">Period 6 (1.30 - 2.20 PM)</option>
                <option value="7">Period 7 (2.20 - 3.10 PM)</option>
                <option value="8">Period 8 (3.10 - 4.00 PM)</option>
              </select>
            </div>

            {(selectedDay !== "LIVE" || selectedPeriod !== "LIVE") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDay("LIVE");
                  setSelectedPeriod("LIVE");
                }}
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  border: "1px solid #b91c1c",
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer"
                }}
              >
                <RotateCcw size={12} />
                <span>Reset to Live Now</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
            Showing <strong>{filteredFaculties.length}</strong> Faculty Members across 22 Sections
          </div>
        </div>

        {/* Main Body: Master-Detail Layout */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Column: Search & Faculty List */}
          <div
            style={{
              width: "380px",
              borderRight: "2px solid #000000",
              display: "flex",
              flexDirection: "column",
              background: "#fafafa"
            }}
          >
            {/* Search Input */}
            <div style={{ padding: "12px", borderBottom: "1.5px solid #e2e8f0", background: "#ffffff" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b"
                  }}
                />
                <input
                  type="text"
                  placeholder="Search faculty name, subject, or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px 7px 32px",
                    fontSize: "0.82rem",
                    border: "1.5px solid #000000",
                    borderRadius: "0px",
                    outline: "none"
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8"
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  overflowX: "auto",
                  paddingTop: "8px",
                  scrollbarWidth: "none"
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "1px solid #000000",
                    background: activeFilter === "all" ? "#000000" : "#ffffff",
                    color: activeFilter === "all" ? "#ffffff" : "#000000",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  All Faculty
                </button>
                {currentStudent && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("my_section")}
                    style={{
                      padding: "3px 8px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      border: "1px solid #000000",
                      background: activeFilter === "my_section" ? "#000000" : "#ffffff",
                      color: activeFilter === "my_section" ? "#ffffff" : "#000000",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    My Section {currentStudent.sectionNum || 1} Faculty
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveFilter("in_class")}
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "1px solid #000000",
                    background: activeFilter === "in_class" ? "#10b981" : "#ffffff",
                    color: activeFilter === "in_class" ? "#ffffff" : "#047857",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  🟢 In Class
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("in_cabin")}
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "1px solid #000000",
                    background: activeFilter === "in_cabin" ? "#2563eb" : "#ffffff",
                    color: activeFilter === "in_cabin" ? "#ffffff" : "#1d4ed8",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  🔵 In Cabin
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("counsellors")}
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "1px solid #000000",
                    background: activeFilter === "counsellors" ? "#000000" : "#ffffff",
                    color: activeFilter === "counsellors" ? "#ffffff" : "#000000",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Counsellors
                </button>
              </div>
            </div>

            {/* Faculty List Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {filteredFaculties.length === 0 ? (
                <div style={{ padding: "30px 15px", textAlign: "center", color: "#64748b" }}>
                  <AlertCircle size={28} style={{ margin: "0 auto 8px auto", opacity: 0.6 }} />
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>No faculty found</div>
                  <div style={{ fontSize: "0.75rem", marginTop: 4 }}>
                    Try searching for another name or switch filter to "All Faculty".
                  </div>
                </div>
              ) : (
                filteredFaculties.map((fac) => {
                  const loc = getFacultyCurrentLocation(fac, effectiveDay, selectedPeriod);
                  const isSelected = activeFaculty?.id === fac.id;

                  return (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedFacultyId(fac.id)}
                      style={{
                        padding: "10px 12px",
                        marginBottom: "6px",
                        border: isSelected ? "2px solid #000000" : "1px solid #e2e8f0",
                        background: isSelected ? "#ffffff" : "#ffffff",
                        boxShadow: isSelected ? "3px 3px 0px #000000" : "none",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>
                          {fac.name}
                        </div>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "2px",
                            background: loc.inClass ? "#dcfce7" : "#dbeafe",
                            color: loc.inClass ? "#166534" : "#1e40af",
                            border: `1px solid ${loc.inClass ? "#86efac" : "#93c5fd"}`,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {loc.inClass ? `Class: ${loc.room}` : "In Cabin"}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: 3 }}>
                        {fac.cabin}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 6,
                          fontSize: "0.68rem",
                          color: "#64748b"
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "230px" }}>
                          {fac.subjectsList.slice(0, 2).join(", ") || "CSE Faculty"}
                        </span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Faculty Location & Timetable */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              padding: "18px 24px",
              background: "#ffffff"
            }}
          >
            {activeFaculty && activeLocation ? (
              <>
                {/* Faculty Header Card */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                    paddingBottom: "14px",
                    borderBottom: "2px solid #e2e8f0"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 900, color: "#000000" }}>
                        {activeFaculty.name}
                      </h1>
                      {activeFaculty.isClassTeacher && (
                        <span
                          style={{
                            background: "#000000",
                            color: "#ffffff",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            padding: "2px 6px"
                          }}
                        >
                          Class Teacher ({activeFaculty.classTeacherSection})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "3px" }}>
                      {activeFaculty.department}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#334155", fontWeight: 600, marginTop: "2px" }}>
                      Permanent Cabin: <strong>{activeFaculty.cabin}</strong>
                    </div>
                  </div>

                  {/* Direct Contact Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {activeFaculty.phone && (
                      <>
                        <a
                          href={`tel:${activeFaculty.phone}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            background: "#000000",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            textDecoration: "none",
                            border: "1px solid #000000",
                            boxShadow: "2px 2px 0px #000000"
                          }}
                        >
                          <Phone size={13} />
                          <span>Call ({activeFaculty.phone})</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleOpenWhatsApp}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            background: "#16a34a",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            border: "1px solid #16a34a",
                            boxShadow: "2px 2px 0px #16a34a",
                            cursor: "pointer"
                          }}
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyLocation}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        background: "#ffffff",
                        color: "#000000",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        border: "1px solid #000000",
                        boxShadow: "2px 2px 0px #000000",
                        cursor: "pointer"
                      }}
                      title="Copy location summary to clipboard"
                    >
                      {copiedLocation ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{copiedLocation ? "Copied!" : "Share Location"}</span>
                    </button>
                  </div>
                </div>

                {/* Real-Time Live Location Showcase Card */}
                <div
                  style={{
                    marginTop: "16px",
                    background: activeLocation.inClass ? "#ecfdf5" : "#eff6ff",
                    border: `2px solid ${activeLocation.inClass ? "#10b981" : "#3b82f6"}`,
                    boxShadow: "4px 4px 0px #000000",
                    padding: "18px 20px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: activeLocation.inClass ? "#047857" : "#1d4ed8"
                        }}
                      >
                        ● {effectiveDay.toUpperCase()} • {activeLocation.statusBadge}
                      </span>
                      <h3 style={{ margin: "6px 0 2px 0", fontSize: "1.45rem", fontWeight: 900, color: "#0f172a" }}>
                        Location: {activeLocation.room}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155", fontWeight: 600 }}>
                        {activeLocation.locationDetails}
                      </p>
                    </div>

                    <div
                      style={{
                        background: activeLocation.inClass ? "#10b981" : "#2563eb",
                        color: "#ffffff",
                        padding: "8px 14px",
                        fontWeight: 900,
                        fontSize: "0.92rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        border: "1px solid #000000",
                        boxShadow: "2px 2px 0px #000000"
                      }}
                    >
                      <span style={{ fontSize: "0.68rem", opacity: 0.9 }}>
                        {activeLocation.inClass ? "ACTIVE PERIOD" : "SCHEDULE STATUS"}
                      </span>
                      <span>{activeLocation.period ? `Period ${activeLocation.period}` : "FREE"}</span>
                    </div>
                  </div>

                  {/* Next Step / Guidance */}
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: `1px solid ${activeLocation.inClass ? "#a7f3d0" : "#bfdbfe"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.78rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1e293b", fontWeight: 600 }}>
                      <Clock size={14} style={{ color: activeLocation.inClass ? "#059669" : "#2563eb" }} />
                      <span>{activeLocation.nextClassText}</span>
                    </div>

                    {activeLocation.minutesRemaining > 0 && (
                      <span style={{ fontWeight: 800, color: "#0f172a" }}>
                        ~{activeLocation.minutesRemaining} mins remaining in this period
                      </span>
                    )}
                  </div>
                </div>

                {/* View Switcher Tabs: Today's Timeline vs Full Weekly Matrix */}
                <div style={{ marginTop: "20px", display: "flex", borderBottom: "2px solid #000000", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("timeline")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      background: activeTab === "timeline" ? "#000000" : "#f1f5f9",
                      color: activeTab === "timeline" ? "#ffffff" : "#000000",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Today's Hourly Schedule ({effectiveDay})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("weekly")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      background: activeTab === "weekly" ? "#000000" : "#f1f5f9",
                      color: activeTab === "weekly" ? "#ffffff" : "#000000",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Full Weekly Timetable Matrix (Mon – Sat)
                  </button>
                </div>

                {/* Tab 1: Today's Timeline Card Grid */}
                {activeTab === "timeline" && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "10px", fontWeight: 600 }}>
                      All periods for <strong>{effectiveDay}</strong>. Free periods denote when this faculty is available in their cabin (<strong>{activeFaculty.cabin}</strong>).
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((pNum) => {
                        const pStr = String(pNum);
                        const session = activeFaculty.schedule?.[effectiveDay]?.[pStr];
                        const slotTime = getSlotTime(pNum);
                        const isCurrent = activeLocation.period === pStr;

                        return (
                          <div
                            key={pNum}
                            style={{
                              padding: "12px",
                              border: isCurrent ? "2px solid #000000" : "1px solid #cbd5e1",
                              background: session ? "#ffffff" : "#f8fafc",
                              boxShadow: isCurrent ? "3px 3px 0px #000000" : "none",
                              position: "relative"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0f172a" }}>
                                Period {pNum}
                              </span>
                              <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
                                {slotTime}
                              </span>
                            </div>

                            {session ? (
                              <div style={{ marginTop: "6px" }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#166534" }}>
                                  {session.room}
                                </div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
                                  {session.section}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "#475569" }}>
                                  {session.subject}
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginTop: "6px" }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2563eb" }}>
                                  Free in Cabin
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                  {activeFaculty.cabin}
                                </div>
                              </div>
                            )}

                            {isCurrent && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "-8px",
                                  right: "8px",
                                  background: "#000000",
                                  color: "#ffffff",
                                  fontSize: "0.6rem",
                                  padding: "1px 5px",
                                  fontWeight: 800
                                }}
                              >
                                CURRENT
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Full Weekly Timetable Grid */}
                {activeTab === "weekly" && (
                  <div style={{ marginTop: "16px", overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.75rem",
                        border: "1.5px solid #000000"
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#000000", color: "#ffffff" }}>
                          <th style={{ padding: "8px", border: "1px solid #334155", textAlign: "left", width: "90px" }}>
                            Day
                          </th>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                            <th key={p} style={{ padding: "8px", border: "1px solid #334155", textAlign: "center" }}>
                              P{p}
                              <div style={{ fontSize: "0.62rem", opacity: 0.8, fontWeight: 500 }}>
                                {getSlotTime(p)}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS_OF_WEEK.map((day) => {
                          const isDayActive = day === effectiveDay;
                          return (
                            <tr
                              key={day}
                              style={{
                                background: isDayActive ? "#fef3c7" : "#ffffff",
                                borderBottom: "1px solid #e2e8f0"
                              }}
                            >
                              <td
                                style={{
                                  padding: "8px",
                                  fontWeight: 800,
                                  borderRight: "1.5px solid #000000",
                                  color: isDayActive ? "#b45309" : "#0f172a"
                                }}
                              >
                                {day}
                                {isDayActive && <span style={{ display: "block", fontSize: "0.62rem", color: "#b45309" }}>(Today)</span>}
                              </td>

                              {[1, 2, 3, 4, 5, 6, 7, 8].map((pNum) => {
                                const session = activeFaculty.schedule?.[day]?.[String(pNum)];
                                return (
                                  <td
                                    key={pNum}
                                    style={{
                                      padding: "6px",
                                      border: "1px solid #e2e8f0",
                                      textAlign: "center",
                                      verticalAlign: "top",
                                      background: session ? "#f0fdf4" : "transparent"
                                    }}
                                  >
                                    {session ? (
                                      <div>
                                        <div style={{ fontWeight: 800, color: "#15803d", fontSize: "0.72rem" }}>
                                          {session.room}
                                        </div>
                                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.68rem" }}>
                                          {session.section}
                                        </div>
                                        <div style={{ color: "#64748b", fontSize: "0.62rem" }}>
                                          {session.subjectKey || session.subject}
                                        </div>
                                      </div>
                                    ) : (
                                      <span style={{ color: "#94a3b8", fontSize: "0.65rem" }}>
                                        Cabin
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
                )}
              </>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                Select a faculty member from the list to view their live location and schedule.
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div
          style={{
            background: "#f1f5f9",
            padding: "10px 20px",
            borderTop: "2px solid #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#64748b"
          }}
        >
          <div>
            📍 <strong>Tip:</strong> If faculty is in class, please wait outside their classroom or visit them during their free period.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm"
            style={{
              background: "#000000",
              color: "#ffffff",
              padding: "5px 14px",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderRadius: "0px",
              border: "1px solid #000000"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
