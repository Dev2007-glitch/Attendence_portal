import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Clock,
  Radio,
  User,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  BookOpen,
  Briefcase,
  Compass,
  AlertCircle
} from "lucide-react";
import RoleLocationMap from "./RoleLocationMap.jsx";
import { apiSearchFacultyLocation, apiGetFacultyLocation } from "../../services/api.js";
import { SECTION_1_FACULTIES } from "../../data/timetable.js";

export default function StudentFacultyLocationTab({
  currentUser,
  onShowToast = () => {}
}) {
  const studentRoll = currentUser?.roll || currentUser?.id || "STUDENT";
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyList, setFacultyList] = useState(SECTION_1_FACULTIES);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyLocationData, setFacultyLocationData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load faculty directory with backend search
  const loadDirectory = async () => {
    setLoading(true);
    try {
      const res = await apiSearchFacultyLocation({
        viewerRole: "student",
        viewerId: studentRoll,
        q: searchQuery
      });
      if (res && res.success && res.faculty) {
        setFacultyList(res.faculty);
      } else {
        // Fallback filter locally
        const q = searchQuery.toLowerCase().trim();
        const filtered = SECTION_1_FACULTIES.filter((f) => {
          return (
            f.name.toLowerCase().includes(q) ||
            f.id.toLowerCase().includes(q) ||
            (f.dept && f.dept.toLowerCase().includes(q)) ||
            (f.subject && f.subject.toLowerCase().includes(q))
          );
        });
        setFacultyList(filtered);
      }
    } catch (e) {
      console.warn("Using offline faculty fallback:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [searchQuery]);

  // Load selected faculty location with auto-refresh if live
  const fetchSelectedFacultyLoc = async (faculty) => {
    if (!faculty) return;
    try {
      const res = await apiGetFacultyLocation(faculty.id, {
        viewerRole: "student",
        viewerId: studentRoll
      });

      if (res && res.success) {
        setFacultyLocationData(res);
      } else {
        setFacultyLocationData({
          isSharing: false,
          status: "NOT_ENABLED",
          message: res?.message || "Faculty location sharing is currently turned off."
        });
      }
    } catch (err) {
      setFacultyLocationData({
        isSharing: false,
        status: "NOT_ENABLED",
        message: err.message || "Unable to retrieve faculty location."
      });
    }
  };

  const handleSelectFaculty = (faculty) => {
    setSelectedFaculty(faculty);
    fetchSelectedFacultyLoc(faculty);
  };

  // Auto-refresh every 10 seconds if live
  useEffect(() => {
    if (selectedFaculty && facultyLocationData?.status === "LIVE") {
      const interval = setInterval(() => {
        fetchSelectedFacultyLoc(selectedFaculty);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedFaculty, facultyLocationData?.status]);

  return (
    <div className="student-faculty-location-tab" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "#000000",
          color: "#ffffff",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 800 }}>
            🧭 Faculty Location Directory & Live Campus Map
          </h3>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
            Search authorized department faculty and view their shared campus locations in real time.
          </p>
        </div>
        <div style={{ fontSize: "0.74rem", background: "#1e293b", padding: "4px 10px", border: "1px solid #334155" }}>
          🔒 <strong>Privacy Protected:</strong> Student peer location search is disabled by institutional policy.
        </div>
      </div>

      {/* Two Column Layout: Left Directory / Right Map */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "16px", minHeight: "560px" }}>
        
        {/* Left Column: Search & Directory */}
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #000000",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Search Input Box */}
          <div style={{ padding: "14px", background: "#f8fafc", borderBottom: "1px solid #000000" }}>
            <label
              htmlFor="studentFacultySearchInput"
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
                color: "#0f172a"
              }}
            >
              SEARCH FACULTY
            </label>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
              <input
                id="studentFacultySearchInput"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty name, ID, department, or subject..."
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 32px",
                  border: "1px solid #000000",
                  fontSize: "0.82rem",
                  fontWeight: 600,
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
                    top: "7px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "6px" }}>
              Displaying {facultyList.length} authorized university faculty members
            </div>
          </div>

          {/* Directory Cards List */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "500px" }}>
            {facultyList.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
                No faculty found matching your search.
              </div>
            ) : (
              facultyList.map((fac) => {
                const isSelected = selectedFaculty?.id === fac.id;
                const isSharing = fac.isSharing;
                return (
                  <div
                    key={fac.id}
                    onClick={() => handleSelectFaculty(fac)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid #e2e8f0",
                      cursor: "pointer",
                      background: isSelected ? "#000000" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#000000",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{fac.name}</div>
                      <span
                        style={{
                          background: isSharing ? (isSelected ? "#ffffff" : "#16a34a") : (isSelected ? "#334155" : "#94a3b8"),
                          color: isSharing ? (isSelected ? "#000000" : "#ffffff") : "#ffffff",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "0px"
                        }}
                      >
                        {isSharing ? "SHARING ON" : "OFFLINE"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.74rem", color: isSelected ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                      <strong>ID:</strong> {fac.id} &bull; <strong>Dept:</strong> {fac.dept || "CSE"} &bull; <strong>Role:</strong> {fac.designation || "Assistant Professor"}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: isSelected ? "#94a3b8" : "#64748b" }}>
                      <span>📚 Subject: {fac.subject || "Computer Science"}</span>
                      <span style={{ fontWeight: 700, color: isSelected ? "#ffffff" : "#000000" }}>
                        📍 View Map &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Map & Details */}
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #000000",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {selectedFaculty ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Faculty Profile Bar */}
              <div
                style={{
                  padding: "12px 18px",
                  background: "#000000",
                  color: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px"
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "0.98rem", fontWeight: 800 }}>
                    👔 {selectedFaculty.name}
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    ID: {selectedFaculty.id} &bull; Department: {selectedFaculty.dept || "Computer Science & Engineering"} &bull; Designation: {selectedFaculty.designation || "Faculty"}
                  </span>
                </div>
                <div>
                  {facultyLocationData?.status === "LIVE" && (
                    <span style={{ background: "#16a34a", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                      LIVE GPS SHARING
                    </span>
                  )}
                  {facultyLocationData?.status === "STALE" && (
                    <span style={{ background: "#d97706", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                      LAST KNOWN LOCATION
                    </span>
                  )}
                  {facultyLocationData?.status === "OFFLINE" && (
                    <span style={{ background: "#ef4444", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                      LOCATION UNAVAILABLE
                    </span>
                  )}
                  {(facultyLocationData?.status === "NOT_ENABLED" || !facultyLocationData?.isSharing) && (
                    <span style={{ background: "#64748b", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                      SHARING DISABLED
                    </span>
                  )}
                </div>
              </div>

              {/* Status Notice */}
              <div style={{ padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #000000", fontSize: "0.76rem" }}>
                {facultyLocationData?.isSharing ? (
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                    <span>
                      Current Location: <strong>{facultyLocationData.location?.building || "N-Block CSE"}</strong> &bull; Accuracy: {facultyLocationData.location?.accuracy || 10}m
                    </span>
                    <span>
                      Last Updated: {facultyLocationData.location?.updatedAt ? new Date(facultyLocationData.location.updatedAt).toLocaleTimeString() : "Just now"}
                    </span>
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontWeight: 700 }}>
                    Faculty location sharing is currently turned off or device is not sharing.
                  </div>
                )}
              </div>

              {/* Map */}
              <div style={{ flex: 1, minHeight: "400px" }}>
                <RoleLocationMap
                  targetUser={{
                    name: selectedFaculty.name,
                    id: selectedFaculty.id,
                    role: "faculty",
                    location: facultyLocationData?.location || null
                  }}
                  status={facultyLocationData?.status || "NOT_ENABLED"}
                  statusMessage={facultyLocationData?.message}
                  height="400px"
                  onRefresh={() => fetchSelectedFacultyLoc(selectedFaculty)}
                  showCampusBlocks={true}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "40px 20px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🧭</div>
              <h4 style={{ margin: "0 0 6px 0", fontWeight: 800 }}>Select a Faculty Member to Track</h4>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", maxWidth: "360px" }}>
                Select any faculty member from the directory on the left to check their live campus location and timetable coordinates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

