import React, { useState, useMemo } from "react";
import {
  MapPin,
  Compass,
  Navigation,
  Layers,
  ExternalLink,
  X,
  Building2,
  ShieldCheck,
  BookOpen,
  Radio,
  Search,
  Crosshair,
  User,
  Clock,
  Sparkles
} from "lucide-react";
import {
  VFSTR_BUILDINGS,
  VFSTR_CAMPUS_CENTER,
  GOOGLE_MAPS_CAMPUS_URL,
  getSimulatedFacultyGPS
} from "../../utils/campusGeofence.js";

export default function CampusGpsMapModal({
  isOpen,
  onClose,
  selectedFaculty = null,
  allFacultyList = [],
  onSelectFaculty = () => {}
}) {
  if (!isOpen) return null;

  const [activeBlockFilter, setActiveBlockFilter] = useState("ALL");
  const [mapMode, setMapMode] = useState("radar"); // "radar" | "google_satellite"
  const [searchQuery, setSearchQuery] = useState("");
  const [activePinFaculty, setActivePinFaculty] = useState(selectedFaculty);

  // Filter faculty for map pins
  const facultyWithGps = useMemo(() => {
    const list = allFacultyList.length > 0 ? allFacultyList : selectedFaculty ? [selectedFaculty] : [];
    return list.map((fac) => {
      const gps = fac.liveGps || getSimulatedFacultyGPS(fac.id, fac.name, fac.cabin);
      return {
        ...fac,
        liveGps: gps
      };
    });
  }, [allFacultyList, selectedFaculty]);

  const filteredPins = useMemo(() => {
    return facultyWithGps.filter((fac) => {
      if (activeBlockFilter !== "ALL") {
        const bld = VFSTR_BUILDINGS.find((b) => b.code === activeBlockFilter);
        if (bld && fac.liveGps?.buildingId !== bld.id && fac.liveGps?.blockCode !== activeBlockFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = fac.name.toLowerCase().includes(q);
        const mCabin = (fac.cabin || "").toLowerCase().includes(q);
        const mBlock = (fac.liveGps?.blockName || "").toLowerCase().includes(q);
        if (!mName && !mCabin && !mBlock) return false;
      }
      return true;
    });
  }, [facultyWithGps, activeBlockFilter, searchQuery]);

  const focusedFaculty = activePinFaculty || selectedFaculty || filteredPins[0];
  const focusedGps = focusedFaculty?.liveGps || (focusedFaculty ? getSimulatedFacultyGPS(focusedFaculty.id, focusedFaculty.name, focusedFaculty.cabin) : null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          border: "3px solid #000000",
          boxShadow: "10px 10px 0px #000000",
          width: "100%",
          maxWidth: "1250px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "0px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            background: "#000000",
            color: "#ffffff",
            padding: "16px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            borderBottom: "2px solid #000000"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#f59e0b",
                color: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900
              }}
            >
              <Navigation size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  VFSTR Vadlamudi &bull; Live Campus GPS Radar
                </h2>
                <span
                  style={{
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: "0.68rem",
                    padding: "2px 7px",
                    fontWeight: 800,
                    borderRadius: "0px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      animation: "pulse 1.5s infinite"
                    }}
                  />
                  LIVE GPS BEACON
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                16.2329402° N, 80.5497368° E &bull; Supporting A-Block, N-Block (CSE), H-Block, U-Block & Central Library
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* View Mode Toggle */}
            <div style={{ display: "flex", border: "1px solid #ffffff", background: "#18181b" }}>
              <button
                type="button"
                onClick={() => setMapMode("radar")}
                style={{
                  background: mapMode === "radar" ? "#ffffff" : "transparent",
                  color: mapMode === "radar" ? "#000000" : "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Campus Radar
              </button>
              <button
                type="button"
                onClick={() => setMapMode("google_satellite")}
                style={{
                  background: mapMode === "google_satellite" ? "#ffffff" : "transparent",
                  color: mapMode === "google_satellite" ? "#000000" : "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Google Satellite
              </button>
            </div>

            {/* Direct Google Maps Link */}
            <a
              href={GOOGLE_MAPS_CAMPUS_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#ffffff",
                color: "#000000",
                textDecoration: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                padding: "7px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                border: "1px solid #ffffff"
              }}
              title="Open full official Google Maps satellite view in new tab"
            >
              <span>Open in Google Maps</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                padding: "6px"
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Sub-Header: Campus Blocks Filter Bar */}
        <div
          style={{
            background: "#f8fafc",
            padding: "10px 18px",
            borderBottom: "2px solid #000000",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          {/* Block Selection Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#475569" }}>
              Filter Block:
            </span>
            {[
              { code: "ALL", label: "All Blocks (Campus)" },
              { code: "N", label: "N-Block (CSE & IT)", color: "#16a34a" },
              { code: "A", label: "A-Block (Admin & AAA)", color: "#2563eb" },
              { code: "U", label: "U-Block (Sciences)", color: "#0d9488" },
              { code: "H", label: "H-Block (Core Eng)", color: "#ea580c" },
              { code: "LIB", label: "Central Library", color: "#9333ea" }
            ].map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => setActiveBlockFilter(b.code)}
                style={{
                  background: activeBlockFilter === b.code ? "#000000" : "#ffffff",
                  color: activeBlockFilter === b.code ? "#ffffff" : "#000000",
                  border: "1px solid #000000",
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                {b.color && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: b.color
                    }}
                  />
                )}
                <span>{b.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find teacher on map..."
                style={{
                  padding: "4px 10px 4px 28px",
                  fontSize: "0.8rem",
                  border: "1px solid #000000",
                  borderRadius: "0px",
                  width: "190px",
                  fontWeight: 600
                }}
              />
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b"
                }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>
              {filteredPins.length} Active Pins
            </span>
          </div>
        </div>

        {/* Modal Main Body (Map + Sidebar) */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: "480px" }}>
          {/* Main Map View Area */}
          <div
            style={{
              flex: 1,
              position: "relative",
              background: "#0f172a",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {mapMode === "google_satellite" ? (
              /* Google Maps Satellite Iframe View */
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <iframe
                  title="VFSTR Vadlamudi Google Maps Satellite View"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src="https://maps.google.com/maps?q=16.2329402,80.5497368&t=k&z=18&ie=UTF8&iwloc=&output=embed"
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "16px",
                    background: "rgba(0, 0, 0, 0.85)",
                    color: "#ffffff",
                    padding: "8px 14px",
                    fontSize: "0.78rem",
                    border: "1px solid #ffffff",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <MapPin size={14} color="#f59e0b" />
                  <span>VFSTR Vadlamudi Satellite View (16.2329° N, 80.5497° E)</span>
                </div>
              </div>
            ) : (
              /* High-Tech 2D Architectural Radar Map */
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  background: "radial-gradient(circle at center, #1e293b 0%, #090d16 100%)",
                  overflow: "hidden"
                }}
              >
                {/* Radar Grid Lines */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                  }}
                />

                {/* Radar Concentric Distance Rings */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "560px",
                    height: "560px",
                    borderRadius: "50%",
                    border: "1px dashed rgba(255, 255, 255, 0.12)",
                    pointerEvents: "none"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "360px",
                    height: "360px",
                    borderRadius: "50%",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    pointerEvents: "none"
                  }}
                />

                {/* Campus Perimeter Boundary Box */}
                <div
                  style={{
                    position: "absolute",
                    left: "10%",
                    top: "10%",
                    right: "10%",
                    bottom: "10%",
                    border: "2px dashed rgba(245, 158, 11, 0.35)",
                    pointerEvents: "none"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "14px",
                      background: "#090d16",
                      color: "#f59e0b",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "0 6px",
                      letterSpacing: "0.05em"
                    }}
                  >
                    VFSTR VADLAMUDI CAMPUS GEOFENCE (850M PERIMETER)
                  </span>
                </div>

                {/* Campus Buildings Rendered on 2D Blueprint */}
                {VFSTR_BUILDINGS.map((bld) => (
                  <div
                    key={bld.id}
                    onClick={() => setActiveBlockFilter(bld.code)}
                    style={{
                      position: "absolute",
                      left: `${bld.relativeX}%`,
                      top: `${bld.relativeY}%`,
                      transform: "translate(-50%, -50%)",
                      background: activeBlockFilter === bld.code ? bld.badgeColor : "#1e293b",
                      color: "#ffffff",
                      border: `2px solid ${bld.badgeColor}`,
                      boxShadow: `0 0 16px ${bld.badgeColor}40`,
                      padding: "10px 14px",
                      borderRadius: "0px",
                      cursor: "pointer",
                      textAlign: "center",
                      minWidth: "130px",
                      zIndex: 10,
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "3px" }}>
                      <span
                        style={{
                          background: "#ffffff",
                          color: "#000000",
                          fontWeight: 900,
                          fontSize: "0.75rem",
                          width: "20px",
                          height: "20px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {bld.code}
                      </span>
                      <strong style={{ fontSize: "0.82rem" }}>{bld.shortName}</strong>
                    </div>
                    <div style={{ fontSize: "0.65rem", opacity: 0.85 }}>
                      {bld.type === "ADMIN" ? "Dean-AAA / VC" : bld.type === "LIBRARY" ? "Digital Stacks" : "Cabins & Labs"}
                    </div>
                  </div>
                ))}

                {/* Faculty GPS Pins on Map */}
                {filteredPins.map((fac, idx) => {
                  const isFocused = focusedFaculty?.id === fac.id;
                  const bld = VFSTR_BUILDINGS.find((b) => b.code === fac.liveGps?.blockCode) || VFSTR_BUILDINGS[0];

                  // Calculate position with slight dispersion around the building
                  const angle = (idx * (360 / Math.max(filteredPins.length, 1)) * Math.PI) / 180;
                  const offsetDist = isFocused ? 0 : 28 + (idx % 3) * 12;
                  const posX = bld.relativeX + (Math.cos(angle) * offsetDist) / 12;
                  const posY = bld.relativeY + (Math.sin(angle) * offsetDist) / 8;

                  return (
                    <div
                      key={fac.id}
                      onClick={() => {
                        setActivePinFaculty(fac);
                        onSelectFaculty(fac);
                      }}
                      style={{
                        position: "absolute",
                        left: `${posX}%`,
                        top: `${posY}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: isFocused ? 50 : 20,
                        cursor: "pointer"
                      }}
                      title={`${fac.name} (${fac.cabin}) • Click to inspect location`}
                    >
                      {/* Pulse Ring if Focused */}
                      {isFocused && (
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            background: "rgba(245, 158, 11, 0.3)",
                            border: "2px solid #f59e0b",
                            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                            pointerEvents: "none"
                          }}
                        />
                      )}

                      {/* Pin Marker */}
                      <div
                        style={{
                          background: isFocused ? "#f59e0b" : "#ffffff",
                          color: "#000000",
                          border: "2px solid #000000",
                          padding: "3px 8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          boxShadow: "3px 3px 0px rgba(0,0,0,0.5)",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <MapPin size={12} color={isFocused ? "#000000" : "#dc2626"} />
                        <span>{fac.name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, "").slice(0, 14)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Radar Sweep Legend */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "16px",
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid #334155",
                    padding: "8px 14px",
                    fontSize: "0.72rem",
                    color: "#94a3b8"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc", fontWeight: 700, marginBottom: "3px" }}>
                    <Crosshair size={13} color="#16a34a" />
                    <span>VFSTR High-Accuracy GPS Geofence Radar</span>
                  </div>
                  <div>Center: 16.2329402° N, 80.5497368° E &bull; Accuracy: ±8m</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Selected Faculty Inspector */}
          <div
            style={{
              width: "380px",
              background: "#ffffff",
              borderLeft: "2px solid #000000",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto"
            }}
          >
            {focusedFaculty ? (
              <div style={{ padding: "20px" }}>
                {/* Active Pin Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#000000",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "1.2rem",
                      flexShrink: 0
                    }}
                  >
                    {focusedFaculty.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                      {focusedFaculty.name}
                    </h3>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                      {focusedFaculty.designation || "Faculty Member"} &bull; CSE
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 700, marginTop: "2px" }}>
                      ID: {focusedFaculty.id}
                    </div>
                  </div>
                </div>

                {/* GPS Location Highlight Card */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "2px solid #16a34a",
                    padding: "14px",
                    marginBottom: "16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Radio size={16} color="#16a34a" />
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#166534" }}>
                      Real-Time GPS Location
                    </span>
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#14532d", marginBottom: "4px" }}>
                    {focusedGps?.badge || "Inside N-Block"}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#166534" }}>
                    {focusedGps?.description || "Located inside VFSTR CSE Department complex."}
                  </p>
                  <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #bbf7d0", fontSize: "0.72rem", color: "#15803d", display: "flex", justifyContent: "space-between" }}>
                    <span>Coordinates: {focusedGps?.latitude?.toFixed(5)}° N, {focusedGps?.longitude?.toFixed(5)}° E</span>
                    <span>Precision: ±{focusedGps?.accuracy || 8}m</span>
                  </div>
                </div>

                {/* Cabin & Timetable Context */}
                <div style={{ marginBottom: "16px", background: "#f8fafc", border: "1px solid #000000", padding: "12px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "4px" }}>
                    Official Faculty Cabin:
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#000000" }}>
                    {focusedFaculty.cabin}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                    {focusedFaculty.department}
                  </div>
                </div>

                {/* Assigned Blocks & Subjects */}
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "#64748b" }}>
                    Assigned Subjects & Sections:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {(focusedFaculty.subjects || focusedFaculty.subjectsList || ["Machine Learning", "Cloud Computing"]).slice(0, 4).map((s, i) => (
                      <span
                        key={i}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          padding: "2px 6px",
                          fontSize: "0.7rem",
                          fontWeight: 600
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Navigation Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto" }}>
                  <a
                    href={`https://www.google.com/maps?q=${focusedGps?.latitude || 16.2336},${focusedGps?.longitude || 80.5508}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      textDecoration: "none",
                      padding: "9px 14px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      border: "1px solid #000000"
                    }}
                  >
                    <Navigation size={14} />
                    <span>Navigate via Google Maps</span>
                    <ExternalLink size={12} />
                  </a>

                  {focusedFaculty.phone && (
                    <a
                      href={`https://wa.me/${focusedFaculty.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${focusedFaculty.name}, I am a VFSTR student locating you via the Attendance Portal GPS.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#25D366",
                        color: "#ffffff",
                        textDecoration: "none",
                        padding: "8px 14px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <span>WhatsApp Direct Message</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                <Compass size={32} style={{ margin: "0 auto 8px auto" }} />
                <p style={{ margin: 0, fontWeight: 700 }}>Select any faculty pin to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

