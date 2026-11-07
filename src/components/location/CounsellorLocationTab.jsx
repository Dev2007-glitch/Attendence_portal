import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  Clock,
  Radio,
  User,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Users,
  Compass,
  ExternalLink,
  Lock
} from "lucide-react";
import RoleLocationMap from "./RoleLocationMap.jsx";
import {
  apiSearchFacultyLocation,
  apiGetFacultyLocation,
  apiSearchStudentsLocation,
  apiGetStudentLocation
} from "../../services/api.js";
import { SECTION_1_FACULTIES } from "../../data/timetable.js";
import { getStudentsByCounsellor, ALL_STUDENTS } from "../../../data.js";

export default function CounsellorLocationTab({
  activeCounsellorName = "Mr. Gujjula Murali",
  currentUser,
  onShowToast = () => {}
}) {
  // Mode selection: "faculty" or "student"
  const [selectedSubTab, setSelectedSubTab] = useState("student"); // "student" | "faculty"

  // INPUT 1: SEARCH FACULTY State
  const [facultySearchQuery, setFacultySearchQuery] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyLocationData, setFacultyLocationData] = useState(null);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // INPUT 2: SEARCH STUDENT State
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLocationData, setStudentLocationData] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Retrieve students assigned to this counsellor only
  const assignedStudents = useMemo(() => {
    return getStudentsByCounsellor(activeCounsellorName);
  }, [activeCounsellorName]);

  // Filter assigned students based on INPUT 2
  const filteredCounseleeStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return assignedStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return assignedStudents.filter((s) => {
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchRoll = s.roll && s.roll.toLowerCase().includes(q);
      const matchId = s.id && String(s.id).toLowerCase().includes(q);
      const matchReg = s.regNo && String(s.regNo).toLowerCase().includes(q);
      return matchName || matchRoll || matchId || matchReg;
    });
  }, [assignedStudents, studentSearchQuery]);

  // Load faculty list
  const loadFaculty = async () => {
    setLoadingFaculty(true);
    try {
      const res = await apiSearchFacultyLocation({
        viewerRole: "counsellor",
        viewerId: currentUser?.id || currentUser?.facultyId || "COUNSELLOR",
        viewerName: activeCounsellorName,
        q: facultySearchQuery
      });
      if (res && res.success && res.faculty) {
        setFacultyList(res.faculty);
      } else {
        // Fallback to timetable faculties
        setFacultyList(SECTION_1_FACULTIES);
      }
    } catch (e) {
      setFacultyList(SECTION_1_FACULTIES);
    } finally {
      setLoadingFaculty(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [facultySearchQuery]);

  // Fetch selected faculty's location
  const handleSelectFaculty = async (fac) => {
    setSelectedFaculty(fac);
    setLoadingFaculty(true);
    try {
      const res = await apiGetFacultyLocation(fac.id, {
        viewerRole: "counsellor",
        viewerId: currentUser?.id || currentUser?.facultyId || "COUNSELLOR",
        viewerName: activeCounsellorName
      });
      if (res && res.success) {
        setFacultyLocationData(res);
      } else {
        setFacultyLocationData({
          isSharing: false,
          status: "NOT_ENABLED",
          message: res?.message || "Faculty location sharing is disabled."
        });
      }
    } catch (err) {
      setFacultyLocationData({
        isSharing: false,
        status: "NOT_ENABLED",
        message: err.message || "Failed to load faculty location."
      });
    } finally {
      setLoadingFaculty(false);
    }
  };

  // Fetch selected student's location
  const handleSelectStudent = async (stu) => {
    setSelectedStudent(stu);
    setLoadingStudent(true);
    try {
      const res = await apiGetStudentLocation(stu.roll, {
        viewerRole: "counsellor",
        viewerId: currentUser?.id || currentUser?.facultyId || "COUNSELLOR",
        viewerName: activeCounsellorName
      });
      if (res && res.success) {
        setStudentLocationData(res);
      } else {
        setStudentLocationData({
          isSharing: false,
          status: "NOT_ENABLED",
          message: res?.message || "Location sharing is not enabled."
        });
      }
    } catch (err) {
      setStudentLocationData({
        isSharing: false,
        status: "NOT_ENABLED",
        message: err.message || "Student location currently unavailable."
      });
    } finally {
      setLoadingStudent(false);
    }
  };

  return (
    <div className="counsellor-location-container" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Banner Notice */}
      <div
        style={{
          background: "#000000",
          color: "#ffffff",
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 2px 0", fontSize: "1.05rem", fontWeight: 800 }}>
            🗺️ Counsellor Role-Based Live Location Tracker
          </h3>
          <p style={{ margin: 0, fontSize: "0.76rem", color: "#94a3b8" }}>
            Assigned Counsellor: <strong>{activeCounsellorName}</strong> &bull; Student Privacy Isolation Active
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setSelectedSubTab("student")}
            style={{
              background: selectedSubTab === "student" ? "#ffffff" : "#1e293b",
              color: selectedSubTab === "student" ? "#000000" : "#ffffff",
              border: "1px solid #ffffff",
              padding: "6px 14px",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            🎓 Assigned Students ({assignedStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubTab("faculty")}
            style={{
              background: selectedSubTab === "faculty" ? "#ffffff" : "#1e293b",
              color: selectedSubTab === "faculty" ? "#000000" : "#ffffff",
              border: "1px solid #ffffff",
              padding: "6px 14px",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            👔 Authorized Faculty Directory
          </button>
        </div>
      </div>

      {/* Main Grid: Left Search & Selection Lists / Right Interactive Map */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "16px", minHeight: "520px" }}>
        
        {/* Left Column: Two Distinct Search Inputs */}
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #000000",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {selectedSubTab === "student" ? (
            /* ============================================================ */
            /* INPUT 2: SEARCH STUDENT (Strictly assigned counselees)      */
            /* ============================================================ */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "12px 14px", background: "#f8fafc", borderBottom: "1px solid #000000" }}>
                <label
                  htmlFor="counsellorStudentSearch"
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
                  INPUT 2: SEARCH STUDENT
                </label>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                  <input
                    id="counsellorStudentSearch"
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search student name, roll number, or ID..."
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      border: "1px solid #000000",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      outline: "none"
                    }}
                  />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchQuery("")}
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
                  Displaying {filteredCounseleeStudents.length} of {assignedStudents.length} assigned counselees
                </div>
              </div>

              {/* Counselee Student List */}
              <div style={{ flex: 1, overflowY: "auto", maxHeight: "450px" }}>
                {filteredCounseleeStudents.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
                    No assigned students found matching search.
                  </div>
                ) : (
                  filteredCounseleeStudents.map((stu) => {
                    const isSelected = selectedStudent?.roll === stu.roll;
                    return (
                      <div
                        key={stu.roll}
                        onClick={() => handleSelectStudent(stu)}
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #e2e8f0",
                          cursor: "pointer",
                          background: isSelected ? "#000000" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#000000",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background 0.15s ease"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{stu.name}</div>
                          <div style={{ fontSize: "0.72rem", color: isSelected ? "#cbd5e1" : "#64748b" }}>
                            Roll: {stu.roll} &bull; {stu.section || "CSE Sec"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              background: isSelected ? "#ffffff" : "#f1f5f9",
                              color: isSelected ? "#000000" : "#0f172a",
                              border: "1px solid",
                              borderColor: isSelected ? "#ffffff" : "#cbd5e1",
                              padding: "2px 6px",
                              fontSize: "0.68rem",
                              fontWeight: 800
                            }}
                          >
                            Track GPS
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* INPUT 1: SEARCH FACULTY (Authorized Faculty Directory)     */
            /* ============================================================ */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "12px 14px", background: "#f8fafc", borderBottom: "1px solid #000000" }}>
                <label
                  htmlFor="counsellorFacultySearch"
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
                  INPUT 1: SEARCH FACULTY
                </label>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                  <input
                    id="counsellorFacultySearch"
                    type="text"
                    value={facultySearchQuery}
                    onChange={(e) => setFacultySearchQuery(e.target.value)}
                    placeholder="Search faculty name or ID..."
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      border: "1px solid #000000",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      outline: "none"
                    }}
                  />
                  {facultySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFacultySearchQuery("")}
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
                  Authorized University Faculty Directory
                </div>
              </div>

              {/* Faculty Directory List */}
              <div style={{ flex: 1, overflowY: "auto", maxHeight: "450px" }}>
                {facultyList.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
                    No faculty found matching search.
                  </div>
                ) : (
                  facultyList.map((fac) => {
                    const isSelected = selectedFaculty?.id === fac.id;
                    return (
                      <div
                        key={fac.id}
                        onClick={() => handleSelectFaculty(fac)}
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #e2e8f0",
                          cursor: "pointer",
                          background: isSelected ? "#000000" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#000000",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background 0.15s ease"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{fac.name}</div>
                          <div style={{ fontSize: "0.72rem", color: isSelected ? "#cbd5e1" : "#64748b" }}>
                            ID: {fac.id} &bull; {fac.dept || "CSE"} &bull; {fac.subject || "Faculty"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              background: isSelected ? "#ffffff" : "#f1f5f9",
                              color: isSelected ? "#000000" : "#0f172a",
                              border: "1px solid",
                              borderColor: isSelected ? "#ffffff" : "#cbd5e1",
                              padding: "2px 6px",
                              fontSize: "0.68rem",
                              fontWeight: 800
                            }}
                          >
                            Locate
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
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
          {selectedSubTab === "student" ? (
            /* Student Location View */
            selectedStudent ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Profile Header */}
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
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "0.95rem", fontWeight: 800 }}>
                      🎓 {selectedStudent.name}
                    </h4>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      Roll / Reg: {selectedStudent.roll} &bull; Section: {selectedStudent.section || "CSE"} &bull; Counsellor: {activeCounsellorName}
                    </span>
                  </div>
                  <div>
                    {studentLocationData?.status === "LIVE" && (
                      <span style={{ background: "#16a34a", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        LIVE GPS
                      </span>
                    )}
                    {studentLocationData?.status === "STALE" && (
                      <span style={{ background: "#d97706", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        LAST KNOWN
                      </span>
                    )}
                    {studentLocationData?.status === "OFFLINE" && (
                      <span style={{ background: "#ef4444", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        OFFLINE
                      </span>
                    )}
                    {(studentLocationData?.status === "NOT_ENABLED" || !studentLocationData?.isSharing) && (
                      <span style={{ background: "#64748b", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        SHARING OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Bar */}
                <div style={{ padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #000000", fontSize: "0.76rem" }}>
                  {studentLocationData?.isSharing ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>
                        Status: <strong>{studentLocationData.status === "LIVE" ? "Live" : "Stale"}</strong> &bull; Accuracy: {studentLocationData.location?.accuracy || 12}m
                      </span>
                      <span>
                        Last Updated: {studentLocationData.location?.updatedAt ? new Date(studentLocationData.location.updatedAt).toLocaleTimeString() : "Just now"}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "#64748b", fontWeight: 700 }}>
                      Location sharing is not enabled by this student.
                    </div>
                  )}
                </div>

                {/* Map */}
                <div style={{ flex: 1, minHeight: "380px" }}>
                  <RoleLocationMap
                    targetUser={{
                      name: selectedStudent.name,
                      id: selectedStudent.roll,
                      roll: selectedStudent.roll,
                      role: "student",
                      location: studentLocationData?.location || null
                    }}
                    status={studentLocationData?.status || "NOT_ENABLED"}
                    statusMessage={studentLocationData?.message}
                    height="380px"
                    onRefresh={() => handleSelectStudent(selectedStudent)}
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
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎓</div>
                <h4 style={{ margin: "0 0 6px 0", fontWeight: 800 }}>Select an Assigned Counselee Student</h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", maxWidth: "360px" }}>
                  Use <strong>INPUT 2: SEARCH STUDENT</strong> on the left to locate students assigned to your mentorship group and view their shared GPS position.
                </p>
              </div>
            )
          ) : (
            /* Faculty Location View */
            selectedFaculty ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Profile Header */}
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
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "0.95rem", fontWeight: 800 }}>
                      👔 {selectedFaculty.name}
                    </h4>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      ID: {selectedFaculty.id} &bull; Dept: {selectedFaculty.dept || "CSE"} &bull; Cabin: {selectedFaculty.room || "N-Block CSE"}
                    </span>
                  </div>
                  <div>
                    {facultyLocationData?.status === "LIVE" && (
                      <span style={{ background: "#16a34a", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        LIVE GPS
                      </span>
                    )}
                    {facultyLocationData?.status === "STALE" && (
                      <span style={{ background: "#d97706", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        LAST KNOWN
                      </span>
                    )}
                    {facultyLocationData?.status === "OFFLINE" && (
                      <span style={{ background: "#ef4444", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        OFFLINE
                      </span>
                    )}
                    {(facultyLocationData?.status === "NOT_ENABLED" || !facultyLocationData?.isSharing) && (
                      <span style={{ background: "#64748b", color: "#fff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 800 }}>
                        SHARING OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Bar */}
                <div style={{ padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #000000", fontSize: "0.76rem" }}>
                  {facultyLocationData?.isSharing ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>
                        Status: <strong>{facultyLocationData.status === "LIVE" ? "Live" : "Stale"}</strong> &bull; Building: {facultyLocationData.location?.building || "N-Block CSE"}
                      </span>
                      <span>
                        Last Updated: {facultyLocationData.location?.updatedAt ? new Date(facultyLocationData.location.updatedAt).toLocaleTimeString() : "Just now"}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "#64748b", fontWeight: 700 }}>
                      Faculty location sharing is currently turned off.
                    </div>
                  )}
                </div>

                {/* Map */}
                <div style={{ flex: 1, minHeight: "380px" }}>
                  <RoleLocationMap
                    targetUser={{
                      name: selectedFaculty.name,
                      id: selectedFaculty.id,
                      role: "faculty",
                      location: facultyLocationData?.location || null
                    }}
                    status={facultyLocationData?.status || "NOT_ENABLED"}
                    statusMessage={facultyLocationData?.message}
                    height="380px"
                    onRefresh={() => handleSelectFaculty(selectedFaculty)}
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
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>👔</div>
                <h4 style={{ margin: "0 0 6px 0", fontWeight: 800 }}>Select a Faculty Member</h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", maxWidth: "360px" }}>
                  Use <strong>INPUT 1: SEARCH FACULTY</strong> on the left to locate authorized faculty members and view their shared campus location.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

