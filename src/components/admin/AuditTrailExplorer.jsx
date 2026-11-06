import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Database,
  Clock,
  User,
  Activity,
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Save
} from "lucide-react";

export default function AuditTrailExplorer({ onShowToast = () => {} }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [viewMode, setViewMode] = useState("logs"); // "logs" | "backups"

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleFilter !== "ALL") params.append("module", moduleFilter);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("limit", "100");

      const res = await fetch(`/api/audit/logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
      }
    } catch (e) {
      console.warn("Could not fetch audit logs:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/admin/backups");
      const json = await res.json();
      if (json.success) {
        setBackups(json.data || []);
      }
    } catch (e) {
      console.warn("Could not fetch backups:", e.message);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchBackups();
  }, [moduleFilter, roleFilter]);

  const handleTriggerBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin UI Manual Snapshot" })
      });
      const json = await res.json();
      if (json.success) {
        onShowToast(`Database snapshot created (${json.data.totalDocuments} documents saved)`, "success");
        fetchBackups();
        fetchLogs();
      } else {
        onShowToast(`Backup failed: ${json.error}`, "error");
      }
    } catch (e) {
      onShowToast(`Backup failed: ${e.message}`, "error");
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "16px", background: "#ffffff", border: "2px solid #000000", padding: "18px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "2px solid #000000", paddingBottom: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Database size={20} color="#000000" />
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>
              MongoDB Enterprise Audit Trail & Database History
            </h2>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            Active Database: <strong>VFSTR_CSE_Attendance_DB</strong> • Permanent, immutable operation history across all 4 roles.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "logs" ? "backups" : "logs")}
            style={{
              padding: "6px 12px",
              background: "#ffffff",
              color: "#000000",
              border: "1.5px solid #000000",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Clock size={14} />
            <span>{viewMode === "logs" ? `View Backups (${backups.length})` : "View Audit Logs"}</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerBackup}
            disabled={backupLoading}
            style={{
              padding: "6px 14px",
              background: "#000000",
              color: "#ffffff",
              border: "1.5px solid #000000",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Save size={14} />
            <span>{backupLoading ? "Backing up..." : "Create DB Snapshot"}</span>
          </button>
        </div>
      </div>

      {viewMode === "logs" ? (
        <>
          {/* Filters Bar */}
          <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
              <input
                type="text"
                placeholder="Search event type, user, roll, or entity ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "0.82rem",
                  border: "1.5px solid #000000",
                  outline: "none"
                }}
              />
            </div>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{ padding: "6px 10px", fontSize: "0.8rem", fontWeight: 700, border: "1.5px solid #000000" }}
            >
              <option value="ALL">All Modules</option>
              <option value="attendance">Attendance</option>
              <option value="authentication">Authentication</option>
              <option value="students">Students</option>
              <option value="counsellor">Counsellor / OD</option>
              <option value="academic_calendar">Academic Calendar</option>
              <option value="admin">Admin Operations</option>
              <option value="system">System Events</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: "6px 10px", fontSize: "0.8rem", fontWeight: 700, border: "1.5px solid #000000" }}
            >
              <option value="ALL">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="counsellor">Counsellor</option>
              <option value="student">Student</option>
              <option value="admin">Administrator</option>
              <option value="system">System</option>
            </select>

            <button
              type="button"
              onClick={fetchLogs}
              style={{
                padding: "6px 12px",
                background: "#000000",
                color: "#ffffff",
                border: "1px solid #000000",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Refresh
            </button>
          </div>

          {/* Audit Logs Table */}
          <div style={{ marginTop: "14px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", border: "1.5px solid #000000" }}>
              <thead>
                <tr style={{ background: "#000000", color: "#ffffff", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px" }}>Timestamp</th>
                  <th style={{ padding: "8px 10px" }}>Event Type</th>
                  <th style={{ padding: "8px 10px" }}>Module</th>
                  <th style={{ padding: "8px 10px" }}>Initiator / Actor</th>
                  <th style={{ padding: "8px 10px" }}>Target Entity</th>
                  <th style={{ padding: "8px 10px" }}>Result</th>
                  <th style={{ padding: "8px 10px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                      Loading audit history from MongoDB...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                      No audit events found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.eventId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                        {new Date(log.timestamp).toLocaleString("en-GB")}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: 800 }}>
                        <span style={{ background: "#000000", color: "#ffffff", padding: "2px 6px", fontSize: "0.7rem" }}>
                          {log.eventType}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textTransform: "capitalize", fontWeight: 600 }}>
                        {log.module}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <strong>{log.actor?.name || log.actor?.userId}</strong>{" "}
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>({log.actor?.role})</span>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <code>{log.target?.entityType}</code>: {log.target?.entityId}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ color: log.result === "SUCCESS" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          ● {log.result}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(log)}
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.72rem",
                            background: "#ffffff",
                            border: "1px solid #000000",
                            cursor: "pointer",
                            fontWeight: 700
                          }}
                        >
                          View JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Backups View */
        <div style={{ marginTop: "14px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 10px 0" }}>
            Database Backup Manifests & Snapshots
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", border: "1.5px solid #000000" }}>
            <thead>
              <tr style={{ background: "#000000", color: "#ffffff", textAlign: "left" }}>
                <th style={{ padding: "8px 10px" }}>Backup ID</th>
                <th style={{ padding: "8px 10px" }}>Timestamp</th>
                <th style={{ padding: "8px 10px" }}>Reason</th>
                <th style={{ padding: "8px 10px" }}>Total Documents</th>
                <th style={{ padding: "8px 10px" }}>Collections</th>
                <th style={{ padding: "8px 10px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.backupId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: 700 }}>{b.backupId}</td>
                  <td style={{ padding: "8px 10px" }}>{new Date(b.timestamp).toLocaleString("en-GB")}</td>
                  <td style={{ padding: "8px 10px" }}>{b.reason}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 800 }}>{b.totalDocuments}</td>
                  <td style={{ padding: "8px 10px" }}>{Object.keys(b.collections || {}).length} collections</td>
                  <td style={{ padding: "8px 10px", color: "#16a34a", fontWeight: 800 }}>● {b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Modal */}
      {selectedEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "3px solid #000000",
              boxShadow: "6px 6px 0px #000000",
              width: "100%",
              maxWidth: "750px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              padding: "20px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000000", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>Event Document: {selectedEvent.eventId}</h3>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{ background: "#000000", color: "#ffffff", border: "none", padding: "4px 8px", cursor: "pointer", fontWeight: 800 }}
              >
                ✕
              </button>
            </div>
            <pre style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: "14px", fontSize: "0.75rem", border: "1px solid #cbd5e1", marginTop: "12px" }}>
              {JSON.stringify(selectedEvent, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

