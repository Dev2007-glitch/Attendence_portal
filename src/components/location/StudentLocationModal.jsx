import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Clock,
  Radio,
  ShieldCheck,
  AlertTriangle,
  User,
  GraduationCap,
  RotateCcw
} from "lucide-react";
import RoleLocationMap from "./RoleLocationMap.jsx";
import { apiGetStudentLocation } from "../../services/api.js";

export default function StudentLocationModal({
  isOpen,
  onClose,
  student, // { name, roll, section, counsellor, id }
  currentUser, // faculty user { id, facultyId, name, role }
  section = 1,
  onShowToast = () => {}
}) {
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const studentRoll = student?.roll || student?.id;

  const fetchStudentLoc = async () => {
    if (!studentRoll) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await apiGetStudentLocation(studentRoll, {
        viewerRole: currentUser?.role || "faculty",
        viewerId: currentUser?.id || currentUser?.facultyId || currentUser?.roll || "FAC_ATTENDANCE",
        viewerName: currentUser?.name || "Attendance Faculty",
        section: section
      });

      if (res && res.success) {
        setLocationData(res);
      } else {
        setErrorMsg(res?.message || "Unable to retrieve student location.");
      }
    } catch (err) {
      console.error("Error fetching student location:", err);
      setErrorMsg(err.message || "Failed to load student location.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && studentRoll) {
      fetchStudentLoc();
      const interval = setInterval(fetchStudentLoc, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, studentRoll, section]);

  if (!isOpen || !student) return null;

  const status = locationData?.status || (locationData?.isSharing ? "LIVE" : "NOT_ENABLED");
  const isLive = status === "LIVE";
  const isStale = status === "STALE";
  const isOffline = status === "OFFLINE";
  const isNotEnabled = status === "NOT_ENABLED" || !locationData?.isSharing;
  const isUnauthorized = locationData?.authorized === false;

  const targetUserObj = {
    name: student.name,
    id: studentRoll,
    roll: studentRoll,
    role: "student",
    section: student.section || `Section ${section}`,
    location: locationData?.location || null
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          background: "#ffffff",
          width: "100%",
          maxWidth: "760px",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px rgba(0, 0, 0, 1)",
          borderRadius: "0px",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#000000",
            color: "#ffffff",
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #000000"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.2rem" }}>🎓</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                Student Live Location Tracker
              </h3>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                Role-Based Attendance Verification &bull; {student.name} ({studentRoll})
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
              padding: "4px 8px",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "0.85rem"
            }}
          >
            ✕
          </button>
        </div>

        {/* Student Profile Strip */}
        <div
          style={{
            padding: "10px 18px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "#000000",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.85rem"
              }}
            >
              {student.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#000000" }}>
                {student.name}
              </div>
              <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                Roll / ID: <strong>{studentRoll}</strong> &bull; Section: <strong>{student.section || `Section ${section}`}</strong> &bull; Counsellor: <strong>{student.counsellor || "Assigned Mentor"}</strong>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isLive && (
              <span
                style={{
                  background: "#16a34a",
                  color: "#ffffff",
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <Radio size={12} className="animate-pulse" />
                LIVE GPS ACTIVE
              </span>
            )}

            {isStale && (
              <span
                style={{
                  background: "#d97706",
                  color: "#ffffff",
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <Clock size={12} />
                LAST KNOWN LOCATION
              </span>
            )}

            {isOffline && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 800
                }}
              >
                OFFLINE
              </span>
            )}

            {isNotEnabled && (
              <span
                style={{
                  background: "#64748b",
                  color: "#ffffff",
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 800
                }}
              >
                SHARING DISABLED
              </span>
            )}

            <button
              type="button"
              onClick={fetchStudentLoc}
              disabled={loading}
              style={{
                background: "#000000",
                color: "#ffffff",
                border: "1px solid #000000",
                padding: "4px 10px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <RotateCcw size={12} />
              {loading ? "Checking..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div style={{ padding: "8px 18px", borderBottom: "1px solid #000000" }}>
          {isUnauthorized && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #dc2626",
                padding: "8px 12px",
                fontSize: "0.78rem",
                color: "#991b1b",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <AlertTriangle size={15} color="#dc2626" />
              <span>You are not authorized to view students outside your assigned section.</span>
            </div>
          )}

          {isNotEnabled && !isUnauthorized && (
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #94a3b8",
                padding: "8px 12px",
                fontSize: "0.78rem",
                color: "#334155",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <MapPin size={15} color="#475569" />
              <span>Location sharing is not enabled.</span>
            </div>
          )}

          {isOffline && !isNotEnabled && !isUnauthorized && (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #d97706",
                padding: "8px 12px",
                fontSize: "0.78rem",
                color: "#92400e",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Clock size={15} color="#d97706" />
              <span>Student location currently unavailable.</span>
            </div>
          )}

          {isStale && (
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #f59e0b",
                padding: "8px 12px",
                fontSize: "0.78rem",
                color: "#b45309",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Clock size={15} color="#f59e0b" />
              <span>Last known location – not currently live.</span>
            </div>
          )}

          {isLive && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #16a34a",
                padding: "8px 12px",
                fontSize: "0.78rem",
                color: "#166534",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} color="#16a34a" />
                <span>
                  <strong>Live GPS Verified:</strong> Student device is actively reporting campus coordinates.
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#15803d" }}>
                Last Updated: {locationData?.location?.updatedAt ? new Date(locationData.location.updatedAt).toLocaleTimeString() : "Just now"}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Map View */}
        <div style={{ flex: 1, minHeight: "380px" }}>
          <RoleLocationMap
            targetUser={targetUserObj}
            status={status}
            statusMessage={errorMsg || locationData?.message}
            height="380px"
            onRefresh={fetchStudentLoc}
            showCampusBlocks={true}
          />
        </div>

        {/* Footer info & Institutional Disclaimer */}
        <div
          style={{
            padding: "10px 18px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.72rem",
            color: "#64748b",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <span>
            ⚖️ <strong>Institutional Notice:</strong> GPS coordinates are supplementary and do not constitute automatic attendance proof. Official marking is recorded in MongoDB.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#000000",
              color: "#ffffff",
              border: "1px solid #000000",
              padding: "5px 14px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.76rem"
            }}
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}

