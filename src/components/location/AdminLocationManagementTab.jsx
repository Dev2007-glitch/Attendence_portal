import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  ShieldCheck,
  Radio,
  Clock,
  Search,
  Eye,
  RotateCcw,
  AlertTriangle,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  Building,
  GraduationCap,
  Download
} from "lucide-react";
import RoleLocationMap from "./RoleLocationMap.jsx";
import { apiGetAdminLocationOverview, apiGetLocationAccessHistory } from "../../services/api.js";
import { ALL_STUDENTS, COUNSELLORS } from "../../../data.js";
import { SECTION_1_FACULTIES } from "../../data/timetable.js";

export default function AdminLocationManagementTab({
  currentUser,
  onShowToast = () => {}
}) {
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [accessLogs, setAccessLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // "ALL" | "faculty" | "student" | "counsellor"
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "LIVE" | "STALE" | "OFFLINE" | "NOT_ENABLED"
  const [activeSectionView, setActiveSectionView] = useState("users"); // "users" | "logs" | "policy"
  const [selectedUserForMap, setSelectedUserForMap] = useState(null);

  // Load Admin Location Overview & Audit Logs
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, logRes] = await Promise.all([
        apiGetAdminLocationOverview({
          viewerRole: "admin",
          viewerId: currentUser?.id || "ADMIN"
        }),
        apiGetLocationAccessHistory({
          viewerRole: "admin",
          viewerId: currentUser?.id || "ADMIN",
          limit: 100
        })
      ]);

      if (ovRes && ovRes.success) {
        setOverviewData(ovRes);
      }
      if (logRes && logRes.success && logRes.logs) {
        setAccessLogs(logRes.logs);
      }
    } catch (err) {
      console.warn("Failed to load admin location data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Compute aggregated user list across all roles
  const aggregatedUsers = useMemo(() => {
    const list = [];

    // Faculty members
    SECTION_1_FACULTIES.forEach((f) => {
      const liveInfo = overviewData?.facultyLocations?.find((fl) => fl.userId === f.id);
      list.push({
        id: f.id,
        name: f.name,
        role: "faculty",
        dept: f.dept || "CSE",
        isSharing: liveInfo?.isSharing || false,
        status: liveInfo?.status || "NOT_ENABLED",
        lastSeen: liveInfo?.updatedAt || null,
        location: liveInfo?.location || null
      });
    });

    // Counsellors
    COUNSELLORS.forEach((c) => {
      list.push({
        id: `COUN_${c.id}`,
        name: c.name,
        role: "counsellor",
        dept: "CSE Counselling",
        isSharing: false,
        status: "NOT_ENABLED",
        lastSeen: null,
        location: null
      });
    });

    // Students (sample 100 for roster or search)
    const stuList = ALL_STUDENTS.slice(0, 100);
    stuList.forEach((s) => {
      const liveInfo = overviewData?.activeLiveLocations?.find((al) => al.userId === s.roll);
      list.push({
        id: s.roll,
        name: s.name,
        role: "student",
        dept: s.section || "CSE",
        isSharing: liveInfo?.isSharing || false,
        status: liveInfo?.status || "NOT_ENABLED",
        lastSeen: liveInfo?.updatedAt || null,
        location: liveInfo?.location || null
      });
    });

    return list;
  }, [overviewData]);

  // Filter users by search, role, and status
  const filteredUsers = useMemo(() => {
    return aggregatedUsers.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchId = u.id.toLowerCase().includes(q);
        const matchDept = u.dept && u.dept.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept) return false;
      }
      return true;
    });
  }, [aggregatedUsers, roleFilter, statusFilter, searchQuery]);

  return (
    <div className="admin-location-tab" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Overview KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px"
        }}
      >
        <div style={{ background: "#ffffff", border: "2px solid #000000", padding: "14px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b" }}>TOTAL MONITORED USERS</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#000000" }}>{aggregatedUsers.length}</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Faculty, Counsellors, & Students</div>
        </div>

        <div style={{ background: "#ffffff", border: "2px solid #000000", padding: "14px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#16a34a" }}>ACTIVE LIVE SHARING</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#16a34a" }}>
            {overviewData?.metrics?.activeLiveCount || 0}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#16a34a" }}>Fresh GPS updates (&lt; 5m)</div>
        </div>

        <div style={{ background: "#ffffff", border: "2px solid #000000", padding: "14px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#d97706" }}>LAST KNOWN / STALE</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#d97706" }}>
            {overviewData?.metrics?.staleCount || 0}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#d97706" }}>Cached location (5m - 15m)</div>
        </div>

        <div style={{ background: "#ffffff", border: "2px solid #000000", padding: "14px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#000000" }}>AUDIT ACCESS LOGS</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#000000" }}>
            {accessLogs.length || overviewData?.metrics?.totalAccessLogs || 0}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Audited requests tracked</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #000000",
          background: "#ffffff",
          padding: "4px 12px",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setActiveSectionView("users")}
            style={{
              background: activeSectionView === "users" ? "#000000" : "#ffffff",
              color: activeSectionView === "users" ? "#ffffff" : "#000000",
              border: "1px solid #000000",
              padding: "6px 14px",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            👥 User Location Status
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionView("logs")}
            style={{
              background: activeSectionView === "logs" ? "#000000" : "#ffffff",
              color: activeSectionView === "logs" ? "#ffffff" : "#000000",
              border: "1px solid #000000",
              padding: "6px 14px",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            🛡️ Access Audit Trail ({accessLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionView("policy")}
            style={{
              background: activeSectionView === "policy" ? "#000000" : "#ffffff",
              color: activeSectionView === "policy" ? "#ffffff" : "#000000",
              border: "1px solid #000000",
              padding: "6px 14px",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            ⚖️ Institutional Privacy Policy
          </button>
        </div>

        <button
          type="button"
          onClick={loadAdminData}
          disabled={loading}
          style={{
            background: "#ffffff",
            color: "#000000",
            border: "1px solid #000000",
            padding: "5px 12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          <RotateCcw size={12} />
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* SECTION VIEW 1: User Status Matrix & Map Preview */}
      {activeSectionView === "users" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "16px" }}>
          {/* Left Table */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", overflow: "hidden" }}>
            {/* Filter Controls Bar */}
            <div
              style={{
                padding: "10px 14px",
                background: "#f8fafc",
                borderBottom: "1px solid #000000",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center"
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
                <Search size={14} style={{ position: "absolute", left: "8px", top: "8px", color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Search user name, ID, or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 8px 6px 28px",
                    border: "1px solid #000000",
                    fontSize: "0.78rem"
                  }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #000000", fontSize: "0.78rem", fontWeight: 700 }}
              >
                <option value="ALL">All Roles</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
                <option value="counsellor">Counsellor</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #000000", fontSize: "0.78rem", fontWeight: 700 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="LIVE">Live GPS</option>
                <option value="STALE">Stale Location</option>
                <option value="OFFLINE">Offline</option>
                <option value="NOT_ENABLED">Sharing Off</option>
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", maxHeight: "500px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "#000000", color: "#ffffff", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>User</th>
                    <th style={{ padding: "8px 12px" }}>Role</th>
                    <th style={{ padding: "8px 12px" }}>Dept / Section</th>
                    <th style={{ padding: "8px 12px" }}>Status</th>
                    <th style={{ padding: "8px 12px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                        No users matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUserForMap?.id === u.id;
                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            background: isSelected ? "#f1f5f9" : "transparent"
                          }}
                        >
                          <td style={{ padding: "8px 12px" }}>
                            <strong>{u.name}</strong>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>ID: {u.id}</div>
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span
                              style={{
                                background: u.role === "faculty" ? "#000000" : u.role === "counsellor" ? "#0284c7" : "#475569",
                                color: "#ffffff",
                                padding: "2px 6px",
                                fontSize: "0.68rem",
                                fontWeight: 800
                              }}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", color: "#475569" }}>{u.dept}</td>
                          <td style={{ padding: "8px 12px" }}>
                            {u.status === "LIVE" ? (
                              <span style={{ color: "#16a34a", fontWeight: 800 }}>● LIVE GPS</span>
                            ) : u.status === "STALE" ? (
                              <span style={{ color: "#d97706", fontWeight: 800 }}>▲ STALE</span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>DISABLED</span>
                            )}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <button
                              type="button"
                              onClick={() => setSelectedUserForMap(u)}
                              style={{
                                background: "#000000",
                                color: "#ffffff",
                                border: "none",
                                padding: "3px 8px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Map Inspector */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 14px", background: "#000000", color: "#ffffff", fontWeight: 800, fontSize: "0.82rem" }}>
              🗺️ User Location Map Inspector
            </div>
            {selectedUserForMap ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #000000", fontSize: "0.74rem" }}>
                  <strong>{selectedUserForMap.name}</strong> ({selectedUserForMap.id}) &bull; Status: {selectedUserForMap.status}
                </div>
                <div style={{ flex: 1, minHeight: "350px" }}>
                  <RoleLocationMap
                    targetUser={{
                      name: selectedUserForMap.name,
                      id: selectedUserForMap.id,
                      role: selectedUserForMap.role,
                      location: selectedUserForMap.location
                    }}
                    status={selectedUserForMap.status}
                    height="350px"
                    showCampusBlocks={true}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
                Select any user from the table on the left to inspect their location status and map position.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION VIEW 2: Access Audit Trail */}
      {activeSectionView === "logs" && (
        <div style={{ background: "#ffffff", border: "2px solid #000000", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: "#000000", color: "#ffffff", fontWeight: 800, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
            <span>🛡️ Institutional Location Access Audit Trail</span>
            <span style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>Recorded in MongoDB (LOCATION_ACCESS_LOGS)</span>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "500px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left", borderBottom: "2px solid #000000" }}>
                  <th style={{ padding: "8px 12px" }}>Timestamp</th>
                  <th style={{ padding: "8px 12px" }}>Viewer</th>
                  <th style={{ padding: "8px 12px" }}>Viewer Role</th>
                  <th style={{ padding: "8px 12px" }}>Target User</th>
                  <th style={{ padding: "8px 12px" }}>Authorized</th>
                  <th style={{ padding: "8px 12px" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                      No location access logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  accessLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "8px 12px", fontWeight: 700 }}>{log.viewerName || log.viewerId}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: "#000000", color: "#ffffff", padding: "1px 5px", fontSize: "0.68rem" }}>
                          {log.viewerRole}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", fontWeight: 700 }}>
                        {log.targetName || log.targetUserId} ({log.targetRole})
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {log.authorized ? (
                          <span style={{ color: "#16a34a", fontWeight: 800 }}>GRANTED</span>
                        ) : (
                          <span style={{ color: "#dc2626", fontWeight: 800 }}>DENIED</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#64748b", fontSize: "0.72rem" }}>
                        {log.reason || log.purpose || "Role-based verification"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION VIEW 3: Institutional Privacy Policy */}
      {activeSectionView === "policy" && (
        <div style={{ background: "#ffffff", border: "2px solid #000000", padding: "20px" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "1.05rem", fontWeight: 800 }}>
            ⚖️ Institutional Location-Sharing Policy & Privacy Governance
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: "1.6" }}>
            The VFSTR Attendance Portal complies with institutional privacy directives and university bylaws.
            Location sharing operates under strict role-based access boundaries:
          </p>
          <ul style={{ fontSize: "0.82rem", color: "#334155", lineHeight: "1.7", paddingLeft: "20px" }}>
            <li>
              <strong>Explicit Opt-In:</strong> Location tracking requires explicit browser consent via the{" "}
              <code>[ Enable Location Sharing ]</code> action. It is never enabled automatically.
            </li>
            <li>
              <strong>Attendance Role Boundary:</strong> Faculty members may only search and view students enrolled in their authorized section and subject. Faculty search is disabled in the Attendance category.
            </li>
            <li>
              <strong>Counsellor Boundary:</strong> Counsellors may only inspect assigned counselees. Student search is strictly scoped to assigned mentee rosters.
            </li>
            <li>
              <strong>Student Privacy Isolation:</strong> Students can search and view authorized faculty locations only. Students are strictly barred from searching or viewing peer student coordinates.
            </li>
            <li>
              <strong>Immutable Audit Logging:</strong> Every query for live GPS is audited in <code>LOCATION_ACCESS_LOGS</code> with viewer ID, role, target, and timestamp.
            </li>
            <li>
              <strong>No Automatic Attendance Proof:</strong> GPS coordinates do not replace attendance marking. Official records are stored in MongoDB.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

