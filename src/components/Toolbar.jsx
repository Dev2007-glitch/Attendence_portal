import React from "react";

export default function Toolbar({
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterChange,
  viewMode,
  onViewChange,
  counts,
  onOpenQuickKey,
  onTrackStudentLive
}) {
  return (
    <section className="toolbar-section" aria-label="Filters and View Controls">
      {/* Dynamic Search Student Bar (Replaces Faculty Search in Attendance Role) */}
      <div className="search-wrapper" style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <span
          style={{
            background: "#000000",
            color: "#ffffff",
            fontSize: "0.68rem",
            fontWeight: 800,
            padding: "4px 8px",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            marginRight: "6px"
          }}
        >
          SEARCH STUDENT
        </span>
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          id="studentSearch"
          className="search-input"
          placeholder="SEARCH STUDENT (Name, Student ID, University Reg No, or Section)..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{ fontWeight: 600 }}
        />
        {searchQuery && (
          <button
            className="clear-search-btn"
            onClick={() => onSearchChange("")}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="filter-group" role="tablist" aria-label="Student Filter">
        <button
          className={`filter-btn ${filterMode === "all" ? "active" : ""}`}
          onClick={() => onFilterChange("all")}
          role="tab"
          aria-selected={filterMode === "all"}
          title="Show all students (Total Strength)"
        >
          Total Strength ({counts.total})
        </button>
        <button
          className={`filter-btn ${filterMode === "present" ? "active" : ""}`}
          onClick={() => onFilterChange("present")}
          role="tab"
          aria-selected={filterMode === "present"}
          title="Show marked present students"
        >
          Presentees ({counts.present})
        </button>
        <button
          className={`filter-btn ${filterMode === "absent" ? "active" : ""}`}
          onClick={() => onFilterChange("absent")}
          role="tab"
          aria-selected={filterMode === "absent"}
          title="Show marked absent students"
        >
          Absentees ({counts.absent})
        </button>
      </div>
    </section>
  );
}
