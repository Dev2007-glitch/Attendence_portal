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
  ChevronDown
} from "lucide-react";

export default function ModernDataTable({
  title = "Attendance Records",
  data = [],
  onAddNew,
  addNewLabel = "Yeni Talep Oluştur",
  onInspect,
  onDownload,
  onDelete,
  onRefresh,
  showActions = true
}) {
  const [activePill, setActivePill] = useState("all"); // "all" | "new" | "answered" | "pending" | "rejected"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState({});

  // Pill counts
  const counts = useMemo(() => {
    return {
      all: data.length,
      newCount: data.filter((d) => d.statusKey === "new" || d.status === "Present" || d.status === "Yeni").length,
      answered: data.filter((d) => d.statusKey === "answered" || d.status === "Eligible" || d.status === "Cevaplandı" || d.status === "Pass").length,
      pending: data.filter((d) => d.statusKey === "pending" || d.status === "Warning" || d.status === "Beklemede").length,
      rejected: data.filter((d) => d.statusKey === "rejected" || d.status === "Absent" || d.status === "Reddedildi" || d.status === "Shortage").length
    };
  }, [data]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Pill tab match
      if (activePill === "new" && !(item.statusKey === "new" || item.status === "Present" || item.status === "Yeni")) return false;
      if (activePill === "answered" && !(item.statusKey === "answered" || item.status === "Eligible" || item.status === "Cevaplandı" || item.status === "Pass")) return false;
      if (activePill === "pending" && !(item.statusKey === "pending" || item.status === "Warning" || item.status === "Beklemede")) return false;
      if (activePill === "rejected" && !(item.statusKey === "rejected" || item.status === "Absent" || item.status === "Reddedildi" || item.status === "Shortage")) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name && item.name.toLowerCase().includes(q);
        const matchesRoll = item.roll && item.roll.toLowerCase().includes(q);
        const matchesRoute = item.route && item.route.toLowerCase().includes(q);
        const matchesSubject = item.subject && item.subject.toLowerCase().includes(q);
        const matchesDate = item.date && item.date.toLowerCase().includes(q);
        return matchesName || matchesRoll || matchesRoute || matchesSubject || matchesDate;
      }
      return true;
    });
  }, [data, activePill, searchQuery]);

  // Handle select all
  const allSelected = filteredData.length > 0 && filteredData.every((d) => selectedRows[d.id || d.roll]);
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows({});
    } else {
      const next = {};
      filteredData.forEach((d) => {
        next[d.id || d.roll] = true;
      });
      setSelectedRows(next);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper for status badge styling matching Image 1
  const renderStatusBadge = (status, statusKey) => {
    const key = statusKey || (
      status === "Present" || status === "Yeni" ? "new" :
      status === "Eligible" || status === "Pass" || status === "Cevaplandı" ? "answered" :
      status === "Warning" || status === "Beklemede" ? "pending" : "rejected"
    );

    const labels = {
      new: status || "Yeni",
      answered: status || "Cevaplandı",
      pending: status || "Beklemede",
      rejected: status || "Reddedildi"
    };

    return (
      <span className={`img1-status-pill img1-pill-${key}`}>
        {labels[key]}
      </span>
    );
  };

  return (
    <div className="img1-table-card">
      {/* =========================================================================
          TOP TOOLBAR ROW (Pills on Left, Search + Actions on Right - Exact Image 1!)
          ========================================================================= */}
      <div className="img1-top-toolbar">
        {/* Left: Pill Filter Tabs */}
        <div className="img1-pill-group" role="tablist">
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "all" ? "active" : ""}`}
            onClick={() => setActivePill("all")}
          >
            Tümü
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "new" ? "active" : ""}`}
            onClick={() => setActivePill("new")}
          >
            Yeni
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "answered" ? "active" : ""}`}
            onClick={() => setActivePill("answered")}
          >
            Cevaplandı
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "pending" ? "active" : ""}`}
            onClick={() => setActivePill("pending")}
          >
            Beklemede
          </button>
          <button
            type="button"
            className={`img1-tab-pill ${activePill === "rejected" ? "active" : ""}`}
            onClick={() => setActivePill("rejected")}
          >
            Reddedildi
          </button>
        </div>

        {/* Right: Search Bar + Shortcut Badge + Primary Action Button */}
        <div className="img1-right-actions">
          <div className="img1-search-box">
            <Search size={14} className="img1-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="img1-search-input"
            />
            <span className="img1-kbd-shortcut font-mono">⇧F</span>
          </div>

          {onAddNew && (
            <button
              type="button"
              className="img1-primary-btn"
              onClick={onAddNew}
              id="img1AddNewBtn"
            >
              <Plus size={15} />
              <span>{addNewLabel}</span>
            </button>
          )}

          <button
            type="button"
            className="img1-icon-btn"
            title="More Options"
          >
            <MoreHorizontal size={16} />
          </button>

          {onRefresh && (
            <button
              type="button"
              className="img1-icon-btn"
              onClick={onRefresh}
              title="Refresh Records"
            >
              <RotateCw size={14} />
            </button>
          )}

          <button
            type="button"
            className="img1-icon-btn"
            title="Filter Settings"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          DATA TABLE (Exact Image 1 columns, column handles, checkboxes & badges)
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
                />
              </th>
              <th>
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
              <th>
                <div className="img1-th-content">
                  <span>Tarih</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th>
                <div className="img1-th-content">
                  <span>Provizyon</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th>
                <div className="img1-th-content">
                  <span>Durum</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              <th>
                <div className="img1-th-content">
                  <span>Servis Tarihi</span>
                  <span className="img1-th-handle">⋮</span>
                </div>
              </th>
              {showActions && (
                <th className="text-center" style={{ width: 110 }}>
                  <div className="img1-th-content text-center">
                    <span>İşlem</span>
                    <span className="img1-th-handle">⋮</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className="img1-empty-td">
                  No records matching the selected filter or search query.
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => {
                const rowId = row.id || row.roll || `row_${idx}`;
                const isSelected = !!selectedRows[rowId];
                const isFirstRow = idx === 0;

                return (
                  <tr
                    key={rowId}
                    className={`${isSelected ? "img1-row-selected" : ""} ${
                      isFirstRow ? "img1-row-highlight" : ""
                    }`}
                  >
                    <td className="img1-td-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rowId)}
                        className="img1-checkbox"
                      />
                    </td>
                    <td className="font-mono text-muted text-sm">
                      {row.type || "Standart"}
                    </td>
                    <td className="font-bold text-primary">
                      {row.route || `${row.roll || ""} ${row.name || ""}`}
                    </td>
                    <td className="font-mono text-sm">
                      {row.date || "23.06.2025"}
                    </td>
                    <td className="text-muted text-sm">
                      {row.provision || row.department || row.subject || "Gümrük"}
                    </td>
                    <td>
                      {renderStatusBadge(row.status, row.statusKey)}
                    </td>
                    <td className="font-mono text-sm text-muted">
                      {row.serviceDate || row.date || "23.06.2025"}
                    </td>
                    {showActions && (
                      <td className="img1-actions-cell">
                        <button
                          type="button"
                          className="img1-action-icon-btn"
                          title="View / Inspect"
                          onClick={() => onInspect && onInspect(row)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="img1-action-icon-btn"
                          title="Download Statement"
                          onClick={() => onDownload && onDownload(row)}
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          type="button"
                          className="img1-action-icon-btn img1-btn-delete"
                          title="Delete Record"
                          onClick={() => onDelete && onDelete(row)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
