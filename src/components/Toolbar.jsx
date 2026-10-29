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
        >
          All ({counts.total})
        </button>
        <button
          className={`filter-btn ${filterMode === "present" ? "active" : ""}`}
          onClick={() => onFilterChange("present")}
          role="tab"
          aria-selected={filterMode === "present"}
        >
          Present ({counts.present})
        </button>
        <button
          className={`filter-btn ${filterMode === "absent" ? "active" : ""}`}
          onClick={() => onFilterChange("absent")}
          role="tab"
          aria-selected={filterMode === "absent"}
        >
          Absent ({counts.absent})
        </button>
      </div>

      {/* View Switcher & Rapid Key-In Button */}
      <div className="view-switcher" role="radiogroup" aria-label="View Modes">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenQuickKey}
          title="Rapidly mark absent by typing roll numbers"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          ⌨️ <span className="btn-text">Key-In Absent</span>
        </button>

        <div className="view-mode-buttons">
          <button
            className={`view-btn ${viewMode === "matrix" ? "active" : ""}`}
            onClick={() => onViewChange("matrix")}
            title="6-Column Portal Matrix View"
          >
            ▦ Matrix
          </button>
          <button
            className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
            onClick={() => onViewChange("cards")}
            title="Modern Card Grid View"
          >
            📇 Cards
          </button>
          <button
            className={`view-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => onViewChange("table")}
            title="Detailed Table View"
          >
            📋 Table
          </button>
        </div>
      </div>
    </section>
  );
}
