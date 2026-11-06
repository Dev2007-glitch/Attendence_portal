import React from "react";
import {
  Users,
  DoorClosed,
  UserCheck,
  Filter,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles
} from "lucide-react";

export default function SectionSwitcher({
  sections = [],
  activeSection = "Section 1",
  onSelectSection,
  counsellors = [],
  selectedCounsellor = "ALL",
  onSelectCounsellor,
  totalStudentsInSection = 0,
  activeRoom = "Room N-402",
  currentUser
}) {
  // Extract active section number
  const activeSecNum = parseInt(String(activeSection).replace(/\D/g, ""), 10) || 1;
  const currentSecMeta = sections.find((s) => s.sectionNum === activeSecNum) || sections[0];

  return (
    <div className="section-switcher-container">
      {/* Upper Bar: Section Badges & Quick Dropdown */}
      <div className="section-switcher-header">
        <div className="section-title-wrap">
          <div className="section-tag-badge">
            <Layers size={14} />
            <span>VFSTR CSE B.Tech &bull; III Year I Sem</span>
          </div>
          <div className="section-main-heading">
            <h2>{currentSecMeta ? currentSecMeta.section : `Section ${activeSecNum}`}</h2>
            <span className="section-room-pill">
              <DoorClosed size={13} />
              {currentSecMeta ? currentSecMeta.room : activeRoom}
            </span>
            <span className="section-count-pill">
              <Users size={13} />
              {totalStudentsInSection} Enrolled Students
            </span>
          </div>
        </div>

        {/* Section Quick Jump Dropdown */}
        <div className="section-select-control">
          <label htmlFor="secQuickSelect" className="sec-label">
            Switch Section:
          </label>
          <div className="sec-select-wrapper">
            <select
              id="secQuickSelect"
              className="sec-dropdown"
              value={activeSecNum}
              onChange={(e) => onSelectSection && onSelectSection(Number(e.target.value))}
            >
              {sections.map((sec) => (
                <option key={sec.sectionNum} value={sec.sectionNum}>
                  {sec.section} &bull; {sec.studentCount} Students ({sec.room})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="sec-arrow" />
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Section Pills (Section 1 to 22) */}
      <div className="section-pills-scroll" role="tablist" aria-label="Select Section">
        {sections.map((sec) => {
          const isActive = sec.sectionNum === activeSecNum;
          return (
            <button
              key={sec.sectionNum}
              type="button"
              className={`sec-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => onSelectSection && onSelectSection(sec.sectionNum)}
              role="tab"
              aria-selected={isActive}
              id={`secPill_${sec.sectionNum}`}
              title={`${sec.section}: ${sec.studentCount} Students, ${sec.room}`}
            >
              <span className="sec-pill-title">Sec {sec.sectionNum}</span>
              <span className="sec-pill-meta">{sec.studentCount}</span>
            </button>
          );
        })}
      </div>

      {/* Lower Bar: Section Designated Counsellors Filter */}
      {currentSecMeta && currentSecMeta.counsellors && currentSecMeta.counsellors.length > 0 && (
        <div className="section-counsellor-toolbar">
          <div className="counsellor-filter-label">
            <UserCheck size={14} />
            <span>Designated Counsellors:</span>
          </div>

          <div className="counsellor-chips">
            <button
              type="button"
              className={`counsellor-chip ${selectedCounsellor === "ALL" ? "active" : ""}`}
              onClick={() => onSelectCounsellor && onSelectCounsellor("ALL")}
            >
              All Section Students ({totalStudentsInSection})
            </button>

            {currentSecMeta.counsellors.map((cName) => {
              const isSelected = selectedCounsellor === cName;
              return (
                <button
                  key={cName}
                  type="button"
                  className={`counsellor-chip ${isSelected ? "active" : ""}`}
                  onClick={() => onSelectCounsellor && onSelectCounsellor(cName)}
                  title={`Filter students mentored by ${cName}`}
                >
                  <span className="c-dot" />
                  <span>{cName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
