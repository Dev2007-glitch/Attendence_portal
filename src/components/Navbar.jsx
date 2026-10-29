import React from "react";
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  UserCheck,
  LogOut,
  Volume2,
  VolumeX,
  User,
  Lock,
  Calendar
} from "lucide-react";

export default function Navbar({
  currentUser,
  activeDashboard,
  onSwitchDashboard,
  onLogout,
  soundEnabled,
  onToggleSound,
  totalStudents = 1511,
  activeSection = 1
}) {
  const getRoleIcon = (role) => {
    switch (role) {
      case "faculty":
        return <BookOpen size={16} />;
      case "counsellor":
        return <UserCheck size={16} />;
      case "student":
        return <GraduationCap size={16} />;
      case "admin":
        return <ShieldCheck size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "faculty":
        return "Faculty (Attendance)";
      case "counsellor":
        return "Faculty (Counselling)";
      case "student":
        return "Student Portal";
      case "admin":
        return "Admin Portal";
      default:
        return role;
    }
  };

  const userRole = currentUser?.role || "student";
  // RBAC Permission rules:
  // - Student: CANNOT access Faculty, Counsellor, or Admin (only student view)
  // - Faculty & Counsellor: CAN access Attendance, Counsellor, and Student (cannot access Admin)
  // - Admin: CAN access Admin, Faculty, Counsellor, and Student
  const canAccessFaculty = userRole === "faculty" || userRole === "counsellor" || userRole === "admin";
  const canAccessCounsellor = userRole === "faculty" || userRole === "counsellor" || userRole === "admin";
  const canAccessStudent = true; // All roles can view student
  const canAccessAdmin = userRole === "admin";

  return (
    <nav className="portal-navbar">
      <div className="navbar-left">
        <div className="navbar-brand">
          <div className="navbar-logo" aria-hidden="true">
            AP
          </div>
          <div className="navbar-titles">
            <span className="navbar-title">VFSTR Attendance</span>
            <span className="navbar-subtitle">CSE Sec {activeSection} &bull; 1,511 Students (22 Sec)</span>
          </div>
        </div>

        {/* Role-based Restricted Dashboard Switcher Pills */}
        <div className="dashboard-pills" role="tablist">
          {/* Faculty Attendance View: Visible to Faculty, Counsellor, and Admin */}
          {canAccessFaculty && (
            <button
              type="button"
              className={`dashboard-pill ${activeDashboard === "faculty" ? "active" : ""}`}
              onClick={() => onSwitchDashboard("faculty")}
              title="Class Attendance Marker"
              id="navFacultyPill"
            >
              <BookOpen size={15} />
              <span>Attendance</span>
            </button>
          )}

          {/* Counsellor Mentorship View: Visible to Faculty, Counsellor, and Admin */}
          {canAccessCounsellor && (
            <button
              type="button"
              className={`dashboard-pill ${activeDashboard === "counsellor" ? "active" : ""}`}
              onClick={() => onSwitchDashboard("counsellor")}
              title="Student Mentorship & Allotted Counselees"
              id="navCounsellorPill"
            >
              <UserCheck size={15} />
              <span>My Counselees</span>
            </button>
          )}

          {/* Student View Pill: Accessible to Student, Faculty, and Admin */}
          {canAccessStudent && (
            <button
              type="button"
              className={`dashboard-pill ${activeDashboard === "student" ? "active" : ""}`}
              onClick={() => onSwitchDashboard("student")}
              title={
                userRole === "student"
                  ? "My Attendance Record"
                  : "Student Individual Attendance View"
              }
              id="navStudentPill"
            >
              <GraduationCap size={15} />
              <span>{userRole === "student" ? "My Dashboard" : "Student View"}</span>
            </button>
          )}

          {/* Admin View Pill: Strictly restricted to Admin only */}
          {canAccessAdmin && (
            <button
              type="button"
              className={`dashboard-pill ${activeDashboard === "admin" ? "active" : ""}`}
              onClick={() => onSwitchDashboard("admin")}
              title="Department Admin & Defaulters Audit (Admin Access Only)"
              id="navAdminPill"
            >
              <ShieldCheck size={15} />
              <span>Admin View</span>
            </button>
          )}

          {/* Academic Calendar Pill (Image 2 Calendar UI): Accessible to All */}
          <button
            type="button"
            className={`dashboard-pill ${activeDashboard === "calendar" ? "active" : ""}`}
            onClick={() => onSwitchDashboard("calendar")}
            title="Institutional Academic Calendar & Task Schedule (Image 2)"
            id="navCalendarPill"
          >
            <Calendar size={15} />
            <span>Academic Calendar</span>
          </button>
        </div>
      </div>

      <div className="navbar-right">
        {/* Audio Synthesizer toggle */}
        <button
          type="button"
          className="navbar-icon-btn"
          onClick={onToggleSound}
          title={soundEnabled ? "Audio synthesized feedback ON" : "Audio muted"}
          id="navSoundToggleBtn"
        >
          {soundEnabled ? <Volume2 size={18} className="text-success" /> : <VolumeX size={18} />}
        </button>

        {/* Current User Badge / Pill */}
        <div className="current-user-card" title={`Logged in as ${currentUser.name} ${currentUser.email ? `(${currentUser.email})` : ''}`}>
          <div className={`user-avatar-circle role-${currentUser.role}`} style={{ overflow: "hidden", padding: 0 }}>
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getRoleIcon(currentUser.role)
            )}
          </div>
          <div className="user-text-info">
            <span className="user-display-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{currentUser.name || currentUser.roll || "User"}</span>
              {currentUser.authProvider === "google" && (
                <span
                  title="Authenticated via Google OAuth 2.0"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    fontSize: "0.62rem",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    fontWeight: 700
                  }}
                >
                  G
                </span>
              )}
            </span>
            <span className={`user-role-badge badge-${currentUser.role}`}>
              {getRoleLabel(currentUser.role)}
              {currentUser.roll ? ` (${currentUser.roll})` : ""}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          className="navbar-logout-btn"
          onClick={onLogout}
          title="Sign out of attendance portal"
          id="navLogoutBtn"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
