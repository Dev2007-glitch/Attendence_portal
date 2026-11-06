import React from "react";

export default function Toolbar({
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterChange,
  viewMode,
  onViewChange,
  counts,
  onOpenQuickKey
}) {
  return (
    <section className="toolbar-section" aria-label="Filters and View Controls">
      {/* Search Bar */}
      <div className="search-wrapper">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          id="studentSearch"
          className="search-input"
          placeholder="Search by student name or roll number..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
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
