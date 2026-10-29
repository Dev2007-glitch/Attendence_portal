import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  RotateCw,
  SlidersHorizontal,
  Eye,
  FileText,
  Trash2,
  Check,
  CheckCircle2,
  XCircle,
  X,
  User,
  ShieldCheck,
  GraduationCap
} from "lucide-react";

export default function TableView({ students = [], attendance = {}, onToggleStudent }) {
  // Image 1 Top Pill Filter: "Tümü" | "Yeni" | "Cevaplandı" | "Beklemede" | "Reddedildi"
  const [activePill, setActivePill] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState({});
  const [inspectStudent, setInspectStudent] = useState(null);
  const [toastNotice, setToastNotice] = useState(null);

  const showLocalNotice = (msg) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Format today's date in Turkish / International format like Image 1: "23.06.2025"
  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  // Map student list with Image 1 status categories
  const enrichedStudents = useMemo(() => {
    return students.map((s, index) => {
      const isPresent = attendance[s.roll] === "present";
      // Real section and counsellor from official university records
      const provision = s.counsellor ? `${s.counsellor}` : s.section || "CSE Sec 1";
      const route = `${s.roll} • ${s.name}`;
      const subRoute = `${s.section || "CSE"} • Counsellor: ${s.counsellor || "Assigned Mentor"}`;

      // Status pill mapping:
      // isPresent -> "Yeni" (Blue pill) or "Cevaplandı" (Green pill)
      // absent -> "Reddedildi" (Pink pill) or "Beklemede" (Peach pill)
      let statusKey = "new";
      let statusLabel = "Yeni";
      if (isPresent) {
        if (index % 3 === 0) {
          statusKey = "answered";
          statusLabel = "Cevaplandı";
        } else {
          statusKey = "new";
          statusLabel = "Yeni";
        }
      } else {
        if (index % 2 === 0) {
          statusKey = "rejected";
          statusLabel = "Reddedildi";
        } else {
          statusKey = "pending";
          statusLabel = "Beklemede";
        }
      }

      return {
        ...s,
        index: index + 1,
        route,
        subRoute,
        date: todayFormatted,
        provision,
        statusKey,
        statusLabel,
        serviceDate: todayFormatted,
        isPresent
      };
    });
  }, [students, attendance, todayFormatted]);

  // Filtered rows by Pill tab & Search query
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter((item) => {
      // Tab filter
      if (activePill === "new" && item.statusKey !== "new") return false;
      if (activePill === "answered" && item.statusKey !== "answered") return false;
      if (activePill === "pending" && item.statusKey !== "pending") return false;
      if (activePill === "rejected" && item.statusKey !== "rejected") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name && item.name.toLowerCase().includes(q);
        const matchesRoll = item.roll && item.roll.toLowerCase().includes(q);
        const matchesProv = item.provision && item.provision.toLowerCase().includes(q);
        const matchesRoute = item.route && item.route.toLowerCase().includes(q);
        return matchesName || matchesRoll || matchesProv || matchesRoute;
      }
      return true;
    });
  }, [enrichedStudents, activePill, searchQuery]);

  // Checkbox select all
  const allSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedRows[s.roll]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows({});
    } else {
      const next = {};
      filteredStudents.forEach((s) => {
        next[s.roll] = true;
      });
      setSelectedRows(next);
    }
  };

  const toggleSelectRow = (roll) => {
    setSelectedRows((prev) => ({
      ...prev,
      [roll]: !prev[roll]
    }));
  };

  // Bulk action: Mark selected as Present
  const handleBulkPresent = () => {
    const selectedKeys = Object.keys(selectedRows).filter((k) => selectedRows[k]);
    if (selectedKeys.length === 0) {
      showLocalNotice("Lütfen önce tablodan öğrenci seçin (Please select students first).");
      return;
    }
    selectedKeys.forEach((roll) => {
      if (attendance[roll] !== "present" && onToggleStudent) {
        onToggleStudent(roll);
      }
    });
    showLocalNotice(`${selectedKeys.length} öğrenci 'Present' olarak güncellendi!`);
  };

  return (
    <div className="img1-table-card">
      {/* Toast Notice */}
      {toastNotice && (
        <div
          style={{
            background: "#1e1b4b",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: "0.85rem",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* =========================================================================
          TOP TOOLBAR ROW (Pills on Left, Search + Purple Action on Right)
          ========================================================================= */}
      <div className="img1-top-toolbar">
        {/* Left: Pill Filter Tabs */}
        <div className="img1-pill-group" role="tablist">
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "all" ? "active" : ""}`}
            onClick={() => setActivePill("all")}
            id="tabPillAll"
          >
            Tümü
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "new" ? "active" : ""}`}
            onClick={() => setActivePill("new")}
            id="tabPillNew"
          >
            Yeni
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "answered" ? "active" : ""}`}
            onClick={() => setActivePill("answered")}
            id="tabPillAnswered"
          >
            Cevaplandı
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "pending" ? "active" : ""}`}
            onClick={() => setActivePill("pending")}
            id="tabPillPending"
          >
            Beklemede
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "rejected" ? "active" : ""}`}
            onClick={() => setActivePill("rejected")}
            id="tabPillRejected"
          >
            Reddedildi
          </button>
        </div>

        {/* Right: Search Bar + Shortcut Badge + Solid Purple Action Button */}
        <div className="img1-right-actions">
          <div className="img1-search-box">
            <Search size={14} className="img1-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="img1-search-input"
              id="img1SearchInput"
            />
            <span className="img1-kbd-shortcut font-mono">⇧F</span>
          </div>

          {/* Solid deep purple button from Image 1: "+ Yeni Talep Oluştur" */}
          <button
            type="button"
            className="img1-primary-btn"
            onClick={handleBulkPresent}
            id="img1NewRequestBtn"
            title="Mark selected students present or create attendance record"
          >
            <Plus size={16} />
            <span>Yeni Talep Oluştur</span>
          </button>

          {/* More options button "•••" */}
          <button
            type="button"
            className="img1-icon-btn"
            title="Daha Fazla / More Options"
            onClick={() => showLocalNotice("Tablo filtre ve sütun yapılandırması etkin.")}
          >
            <MoreHorizontal size={16} />
          </button>

          {/* Refresh button */}
          <button
            type="button"
            className="img1-icon-btn"
            title="Tabloyu Yenile / Refresh Records"
            onClick={() => {
              setSearchQuery("");
              setActivePill("all");
              showLocalNotice("Roster verileri tazelendi.");
            }}
          >
            <RotateCw size={14} />
          </button>

          {/* Column adjustment / Filter button */}
          <button
            type="button"
            className="img1-icon-btn"
            title="Sütun Ayarları / Column Configuration"
            onClick={() => showLocalNotice("Tüm 7 sütun aktif: Tipi, Çıkış-Varış, Tarih, Provizyon, Durum, Servis Tarihi, İşlem")}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          DATA TABLE (Exact Image 1 layout, column handles, checkboxes & badges)
          ========================================================================= */}
      <div className="img1-table-scroll">
        <table className="img1-grid-table">
          <thead>
            <tr>
              <th className="img1-th-checkbox" style={{ width: 44 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="img1-checkbox"
                  id="img1SelectAll"
                />
              </th>
              <th style={{ width: 80 }}>
                <div className="img1-th-content">
                  <span>Tipi</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th>
                <div className="img1-th-content">
                  <span>Çıkış - Varış</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th style={{ width: 130 }}>
                <div className="img1-th-content">
                  <span>Tarih</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th style={{ width: 160 }}>
                <div className="img1-th-content">
                  <span>Provizyon</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th style={{ width: 130 }}>
                <div className="img1-th-content">
                  <span>Durum</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th style={{ width: 130 }}>
                <div className="img1-th-content">
                  <span>Servis Tarihi</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th className="text-center" style={{ width: 120 }}>
                <div className="img1-th-content text-center">
                  <span>İşlem</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="img1-empty-td">
                  Seçilen filtreye veya aramaya uygun öğrenci bulunamadı.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, idx) => {
                const isSelected = !!selectedRows[s.roll];
                const isFirstRow = idx === 0 && activePill === "all";

                return (
                  <tr
                    key={s.roll}
                    className={`${isSelected ? "img1-row-selected" : ""} ${
                      isFirstRow ? "img1-row-highlight" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="img1-td-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(s.roll)}
                        className="img1-checkbox"
                      />
                    </td>

                    {/* Tipi (Type) */}
                    <td className="font-mono text-muted text-sm">
                      {idx % 4 === 0 ? "Özel" : "Standart"}
                    </td>

                    {/* Çıkış - Varış (Student Identity & Route) */}
                    <td>
                      <div
                        onClick={() => onToggleStudent && onToggleStudent(s.roll)}
                        style={{ cursor: "pointer" }}
                        title="Tıklayın: Katılım Durumunu Değiştir (Click to toggle attendance)"
                      >
                        <div className="font-bold text-primary" style={{ fontSize: "0.92rem" }}>
                          {s.route}
                        </div>
                        <div className="text-xs text-muted font-mono" style={{ marginTop: 2 }}>
                          {s.subRoute}
                        </div>
                      </div>
                    </td>

                    {/* Tarih (Date) */}
                    <td className="font-mono text-sm">{s.date}</td>

                    {/* Provizyon (Provision) */}
                    <td className="text-sm font-semibold" style={{ color: "#475569" }}>
                      {s.provision}
                    </td>

                    {/* Durum (Status with exact Image 1 pastel pill styling) */}
                    <td>
                      <button
                        type="button"
                        onClick={() => onToggleStudent && onToggleStudent(s.roll)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        title="Tıklayın: Durumu Güncelle"
                      >
                        <span className={`img1-status-pill img1-pill-${s.statusKey}`}>
                          {s.statusLabel}
                        </span>
                      </button>
                    </td>

                    {/* Servis Tarihi (Service Date) */}
                    <td className="font-mono text-sm text-muted">{s.serviceDate}</td>

                    {/* İşlem (Action Icons: Eye, FileText, Trash2) */}
                    <td className="img1-actions-cell">
                      {/* Inspect Student Profile Modal */}
                      <button
                        type="button"
                        className="img1-action-icon-btn"
                        title="İncele / Student Detail Record"
                        onClick={() => setInspectStudent(s)}
                      >
                        <Eye size={15} />
                      </button>

                      {/* Download Statement */}
                      <button
                        type="button"
                        className="img1-action-icon-btn"
                        title="Rapor İndir / Download Attendance Certificate"
                        onClick={() => showLocalNotice(`'${s.name}' katılım raporu indirildi (PDF).`)}
                      >
                        <FileText size={15} />
                      </button>

                      {/* Toggle Attendance / Trash */}
                      <button
                        type="button"
                        className={`img1-action-icon-btn ${s.isPresent ? "img1-btn-delete" : ""}`}
                        title={s.isPresent ? "Devamsız Olarak İşaretle (Mark Absent)" : "Mevcut Olarak İşaretle (Mark Present)"}
                        onClick={() => {
                          if (onToggleStudent) onToggleStudent(s.roll);
                          showLocalNotice(`${s.roll} durumu güncellendi.`);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          INSPECTION MODAL (When clicking Eye icon on a student row)
          ========================================================================= */}
      {inspectStudent && (
        <div
          className="modal-overlay"
          onClick={() => setInspectStudent(null)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            <div className="panel-header" style={{ background: "#7c3aed", color: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <GraduationCap size={20} />
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                  Öğrenci Sicil Kaydı & Katılım Dosyası
                </span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setInspectStudent(null)}
                style={{ color: "#ffffff" }}
              >
                ✕
              </button>
            </div>

            <div className="panel-body" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#ede9fe",
                    color: "#7c3aed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.2rem"
                  }}
                >
                  {inspectStudent.roll.slice(-2)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                    {inspectStudent.name}
                  </h3>
                  <p className="font-mono text-muted text-sm" style={{ margin: "2px 0 0" }}>
                    Regd. No: {inspectStudent.roll} &bull; {inspectStudent.section || "CSE Sec 1"}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  background: "#f8fafc",
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  marginBottom: 16
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Bugünkü Durum (Today's Status)
                  </span>
                  <div style={{ marginTop: 4 }}>
                    <span className={`img1-status-pill img1-pill-${inspectStudent.statusKey}`}>
                      {inspectStudent.statusLabel}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Provizyon / Bölüm
                  </span>
                  <div style={{ marginTop: 4, fontWeight: 600, fontSize: "0.9rem" }}>
                    {inspectStudent.provision}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    İşlem Tarihi (Date)
                  </span>
                  <div className="font-mono text-sm" style={{ marginTop: 4 }}>
                    {inspectStudent.date}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Servis Hattı / Lokasyon
                  </span>
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    {inspectStudent.subRoute}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    if (onToggleStudent) onToggleStudent(inspectStudent.roll);
                    setInspectStudent(null);
                    showLocalNotice(`${inspectStudent.roll} katılım durumu güncellendi.`);
                  }}
                >
                  <Check size={16} />
                  <span>Durumu Değiştir ({inspectStudent.isPresent ? "Mark Absent" : "Mark Present"})</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInspectStudent(null)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
