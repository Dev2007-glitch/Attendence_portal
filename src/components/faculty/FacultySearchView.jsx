import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  User,
  BookOpen,
  ArrowLeft,
  X,
  Compass,
  Filter,
  Check,
  Copy,
  ExternalLink,
  RotateCcw,
  Building,
  GraduationCap,
  Layers,
  Sparkles,
  Loader2
} from "lucide-react";
import { searchFaculty, fetchFacultyDepartments, fetchFacultySubjects } from "../../services/api.js";
import {
  getAllFacultyDirectory,
  getFacultyCurrentLocation,
  COLLEGE_PERIOD_INTERVALS
} from "../../utils/facultyLocator.js";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultySearchView({
  currentUser,
  onBack,
  onShowToast = () => {},
  onOpenLocatorModal = () => {}
}) {
  console.log("[FACULTY SEARCH VIEW] Component successfully mounted and rendering. currentUser:", currentUser);
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [quickFilter, setQuickFilter] = useState("all"); // "all" | "class_teacher" | "counsellor" | "in_cabin" | "in_class"
  const [sortBy, setSortBy] = useState("name_asc");

  // Data State
  const [facultyResults, setFacultyResults] = useState([]);
  const [totalFacultyCount, setTotalFacultyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentsList, setDepartmentsList] = useState(["Computer Science & Engineering (CSE)"]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedFacultyForTimetable, setSelectedFacultyForTimetable] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const abortControllerRef = useRef(null);

  // Current real-world Day Name
  const realCurrentDay = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  // 1. Initial Load of Departments and Subjects
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchFacultyDepartments(), fetchFacultySubjects()])
      .then(([depts, subjs]) => {
        if (!mounted) return;
        if (depts && depts.length > 0) setDepartmentsList(depts);
        if (subjs && subjs.length > 0) setSubjectsList(subjs);
      })
      .catch((err) => console.warn("Failed to load departments/subjects filter metadata:", err));

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Perform Debounced Search (300ms) with Backend API & In-Memory Fallback
  const performSearch = useCallback(
    async (queryText, dept, subject, quick, sort) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);

      try {
        const res = await searchFaculty(
          {
            q: queryText,
            department: dept,
            subject: subject,
            limit: 100
          },
          controller.signal
        );

        let data = res?.data || [];

        // Apply quick filter on client side for live status (in_cabin / in_class)
        if (quick === "class_teacher") {
          data = data.filter((f) => f.isClassTeacher);
        } else if (quick === "counsellor") {
          data = data.filter((f) => f.isCounsellor);
        } else if (quick === "in_cabin" || quick === "in_class") {
          data = data.filter((fac) => {
            const loc = getFacultyCurrentLocation(fac, realCurrentDay, "LIVE");
            if (quick === "in_cabin") return !loc.inClass && loc.status === "IN_CABIN";
            if (quick === "in_class") return loc.inClass;
            return true;
          });
        }

        // Apply sorting
        data.sort((a, b) => {
          if (sort === "name_desc") return b.name.localeCompare(a.name);
          if (sort === "cabin") return (a.cabin || "").localeCompare(b.cabin || "");
          if (sort === "sections") return (b.sections?.length || 0) - (a.sections?.length || 0);
          return a.name.localeCompare(b.name);
        });

        setFacultyResults(data);
        setTotalFacultyCount(res?.total || data.length);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Search execution failed:", err);
          // Fallback to local
          const fallback = getAllFacultyDirectory();
          setFacultyResults(fallback);
          setTotalFacultyCount(fallback.length);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [realCurrentDay]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, selectedDept, selectedSubject, quickFilter, sortBy);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedDept, selectedSubject, quickFilter, sortBy, performSearch]);

  // Handle WhatsApp Link
  const handleOpenWhatsApp = (faculty) => {
    const cleanPhone = (faculty.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      onShowToast("No contact number available for this faculty.", "warning");
      return;
    }
    const studentName = currentUser?.name || "Student";
    const studentRoll = currentUser?.roll || "";
    const studentSec = currentUser?.section || `Section ${currentUser?.sectionNum || 1}`;

    const text = `Respected Prof. ${faculty.name},\n\nI am ${studentName} (Regd: ${studentRoll}, ${studentSec}). I checked the VFSTR Portal for your cabin location (${faculty.cabin}). Could you please let me know your availability for consultation?\n\nThank you,\n${studentName}`;
    const url = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Copy Location to Clipboard
  const handleCopyLocation = (faculty, loc) => {
    const text = `[VFSTR CSE Faculty Location] ${faculty.name} is currently at: ${loc?.room || faculty.cabin} (${loc?.locationDetails || "Cabin"}). Official Cabin: ${faculty.cabin}.`;
    navigator.clipboard.writeText(text);
    setCopiedId(faculty.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast(`Copied location for ${faculty.name} to clipboard!`, "success");
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDept("ALL");
    setSelectedSubject("ALL");
    setQuickFilter("all");
    setSortBy("name_asc");
  };

  return (
    <div className="faculty-search-page-container" style={{ padding: "20px 24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div
        className="faculty-search-header-card"
        style={{
          background: "#ffffff",
          border: "2px solid #000000",
          boxShadow: "4px 4px 0px #000000",
          padding: "18px 24px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            onClick={onBack}
            className="btn btn-sm"
            style={{
              background: "#000000",
              color: "#ffffff",
              border: "1px solid #000000",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "7px 14px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              borderRadius: "0px"
            }}
            title="Return to previous dashboard or Academic Calendar"
            id="facultySearchBackBtn"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#000000",
                  color: "#ffffff",
                  padding: "4px 8px",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em"
                }}
              >
                VFSTR CSE
              </div>
              <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Faculty Search & Live Location Directory
              </h1>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Search across all department faculty, cabins, subject allocations, and live classroom timetables.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #000000",
              padding: "6px 12px",
              fontSize: "0.8rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Compass size={14} />
            <span>Database Records: {totalFacultyCount}</span>
          </div>

          <button
            type="button"
            onClick={onOpenLocatorModal}
            className="btn btn-sm"
            style={{
              background: "#f59e0b",
              color: "#000000",
              border: "1px solid #000000",
              fontWeight: 800,
              fontSize: "0.82rem",
              padding: "7px 13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              borderRadius: "0px"
            }}
            title="Open interactive period-by-period cabin timetable locator"
          >
            <Clock size={15} />
            <span>Live Timetable Modal</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTERS CONTROL BAR */}
      <div
        className="faculty-search-controls-card"
        style={{
          background: "#ffffff",
          border: "2px solid #000000",
          boxShadow: "4px 4px 0px #000000",
          padding: "16px 20px",
          marginBottom: "24px"
        }}
      >
        {/* Main Search Input */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b"
              }}
            />
            <input
              type="text"
              id="facultySearchInputField"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name (e.g. Siva Prasad), ID (e.g. fac_sivaprasad), subject (e.g. Cloud Computing), or cabin..."
              style={{
                width: "100%",
                padding: "10px 40px 10px 42px",
                fontSize: "0.95rem",
                border: "2px solid #000000",
                borderRadius: "0px",
                outline: "none",
                fontWeight: 600,
                background: "#ffffff"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px"
                }}
                title="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-sm"
              style={{
                background: "#ffffff",
                color: "#000000",
                border: "2px solid #000000",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: "0 16px",
                borderRadius: "0px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Quick Filter Pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          {/* Quick Filters */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: "#64748b" }}>
              Filter:
            </span>

            {[
              { id: "all", label: "All Faculty" },
              { id: "in_cabin", label: "In Cabin Right Now" },
              { id: "in_class", label: "In Class / Lab" },
              { id: "class_teacher", label: "Class Teachers" },
              { id: "counsellor", label: "Counsellors" }
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setQuickFilter(pill.id)}
                style={{
                  background: quickFilter === pill.id ? "#000000" : "#ffffff",
                  color: quickFilter === pill.id ? "#ffffff" : "#000000",
                  border: "1px solid #000000",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  borderRadius: "0px"
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Department, Subject & Sorting Dropdowns */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Department Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="deptSelectFilter" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                Dept:
              </label>
              <select
                id="deptSelectFilter"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{
                  padding: "5px 8px",
                  fontSize: "0.8rem",
                  border: "1px solid #000000",
                  fontWeight: 600,
                  borderRadius: "0px",
                  maxWidth: "200px"
                }}
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            {subjectsList.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label htmlFor="subjSelectFilter" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                  Subject:
                </label>
                <select
                  id="subjSelectFilter"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{
                    padding: "5px 8px",
                    fontSize: "0.8rem",
                    border: "1px solid #000000",
                    fontWeight: 600,
                    borderRadius: "0px",
                    maxWidth: "180px"
                  }}
                >
                  <option value="ALL">All Subjects</option>
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="sortSelectFilter" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                Sort:
              </label>
              <select
                id="sortSelectFilter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "5px 8px",
                  fontSize: "0.8rem",
                  border: "1px solid #000000",
                  fontWeight: 600,
                  borderRadius: "0px"
                }}
              >
                <option value="name_asc">Name (A &rarr; Z)</option>
                <option value="name_desc">Name (Z &rarr; A)</option>
                <option value="cabin">Cabin Number</option>
                <option value="sections">Section Count</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH RESULTS BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          padding: "0 4px"
        }}
      >
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>Querying MongoDB database...</span>
            </>
          ) : (
            <span>Showing {facultyResults.length} matching faculty members</span>
          )}
        </div>

        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
          Today is <strong>{realCurrentDay}</strong> &bull; Period timings synced to university bell system
        </div>
      </div>

      {/* 4. RESULTS GRID */}
      {isLoading && facultyResults.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #000000",
            padding: "60px 20px",
            textAlign: "center"
          }}
        >
          <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 14px auto", color: "#000000" }} />
          <h3 style={{ margin: 0, fontWeight: 800 }}>Retrieving Faculty Records...</h3>
          <p style={{ margin: "6px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            Connecting to VFSTR_CSE_Attendance_DB and filtering results.
          </p>
        </div>
      ) : facultyResults.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px #000000",
            padding: "50px 20px",
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              border: "2px solid #000000"
            }}
          >
            <X size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", fontWeight: 800 }}>
            No Matching Faculty Found
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "0.85rem", maxWidth: "450px", marginLeft: "auto", marginRight: "auto" }}>
            No faculty record matched your search query <strong>"{searchQuery}"</strong>. Try checking the spelling, searching by cabin (e.g. N-320), or clearing your active filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-sm"
            style={{
              background: "#000000",
              color: "#ffffff",
              border: "1px solid #000000",
              fontWeight: 700,
              padding: "8px 18px",
              borderRadius: "0px",
              cursor: "pointer"
            }}
          >
            Clear All Search Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "18px"
          }}
        >
          {facultyResults.map((fac) => {
            const loc = getFacultyCurrentLocation(fac, realCurrentDay, "LIVE");
            const isCopied = copiedId === fac.id;

            return (
              <div
                key={fac.id}
                className="faculty-card"
                style={{
                  background: "#ffffff",
                  border: "2px solid #000000",
                  boxShadow: "4px 4px 0px #000000",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                {/* Card Top Banner */}
                <div>
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "12px",
                      background: "#fafafa"
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          background: "#000000",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "1rem",
                          border: "1px solid #000000"
                        }}
                      >
                        {fac.name
                          .replace(/^Dr\.\s*|^Prof\.\s*/i, "")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                          {fac.name}
                        </h3>
                        <span
                          style={{
                            fontSize: "0.73rem",
                            color: "#64748b",
                            fontWeight: 700,
                            display: "block",
                            marginTop: "2px"
                          }}
                        >
                          {fac.designation || (fac.name.startsWith("Dr.") ? "Associate Professor" : "Assistant Professor")}
                          &bull; <code style={{ color: "#000000", fontWeight: 800 }}>{fac.id}</code>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                      {fac.isClassTeacher && (
                        <span
                          style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            border: "1px solid #3730a3",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "2px 6px"
                          }}
                        >
                          Class Teacher
                        </span>
                      )}
                      {fac.isCounsellor && (
                        <span
                          style={{
                            background: "#ecfdf5",
                            color: "#065f46",
                            border: "1px solid #065f46",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "2px 6px"
                          }}
                        >
                          Counsellor
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "14px 16px" }}>
                    {/* Live Location Status Indicator */}
                    <div
                      style={{
                        background: loc.inClass ? "#eff6ff" : "#f0fdf4",
                        border: `1px solid ${loc.inClass ? "#3b82f6" : "#22c55e"}`,
                        padding: "8px 12px",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: loc.inClass ? "#2563eb" : "#16a34a",
                            display: "inline-block"
                          }}
                        />
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: loc.inClass ? "#1e40af" : "#15803d" }}>
                          {loc.statusBadge}
                        </span>
                      </div>

                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                        {loc.time}
                      </span>
                    </div>

                    {/* Cabin & Current Room */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                        <MapPin size={15} style={{ color: "#000000", marginTop: "2px", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
                          {loc.room}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "21px" }}>
                        Official Cabin: <strong>{fac.cabin}</strong>
                      </div>
                    </div>

                    {/* Subjects Handled */}
                    {fac.subjects && fac.subjects.length > 0 && (
                      <div style={{ marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                          Subjects:
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {fac.subjects.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                padding: "2px 7px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: "#1e293b"
                              }}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assigned Sections */}
                    {fac.sections && fac.sections.length > 0 && (
                      <div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                          Sections:
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {fac.sections.map((sec, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                background: "#e2e8f0",
                                padding: "1px 6px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: "#0f172a"
                              }}
                            >
                              {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    padding: "10px 16px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    gap: "8px",
                    justifyContent: "space-between"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleCopyLocation(fac, loc)}
                    className="btn btn-sm"
                    style={{
                      background: "#ffffff",
                      color: "#000000",
                      border: "1px solid #000000",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "5px 10px",
                      borderRadius: "0px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer"
                    }}
                    title="Copy current room and cabin location"
                  >
                    {isCopied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied" : "Copy Location"}</span>
                  </button>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(fac)}
                      className="btn btn-sm"
                      style={{
                        background: "#16a34a",
                        color: "#ffffff",
                        border: "1px solid #16a34a",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: "0px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer"
                      }}
                      title="Generate student inquiry message via WhatsApp"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenLocatorModal}
                      className="btn btn-sm"
                      style={{
                        background: "#000000",
                        color: "#ffffff",
                        border: "1px solid #000000",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: "0px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer"
                      }}
                      title="Inspect full weekly schedule"
                    >
                      <Calendar size={13} />
                      <span>Schedule</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

