import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Compass,
  Navigation,
  Clock,
  Radio,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { VFSTR_CAMPUS_CENTER, VFSTR_BUILDINGS } from "../../utils/campusGeofence.js";

// Fix Leaflet's default icon image asset path in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

/**
 * Creates custom HTML Pin Markers for Leaflet
 */
function createCustomMarkerIcon(role = "student", isLive = true, label = "") {
  const isFaculty = role === "faculty" || role === "counsellor";
  const bg = isFaculty ? "#000000" : "#2563eb";
  const border = isLive ? (isFaculty ? "#f59e0b" : "#22c55e") : "#94a3b8";

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      ${
        isLive
          ? `<div style="position: absolute; top: -6px; width: 38px; height: 38px; border-radius: 50%; background: ${border}33; border: 2px solid ${border}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : ""
      }
      <div style="background: ${bg}; color: #ffffff; border: 2px solid ${border}; padding: 3px 8px; font-weight: 800; font-size: 11px; white-space: nowrap; box-shadow: 2px 2px 0px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; border-radius: 0px;">
        <span>${isFaculty ? "👔" : "🎓"}</span>
        <span>${label ? label.slice(0, 15) : isFaculty ? "Faculty" : "Student"}</span>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${border}; margin-top: -1px;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-marker",
    iconSize: [80, 42],
    iconAnchor: [40, 40]
  });
}

export default function RoleLocationMap({
  targetUser = null, // { name, id, roll, role, location: { latitude, longitude, accuracy, building, shortName, updatedAt, isLive } }
  status = "LIVE", // "LIVE" | "STALE" | "NOT_ENABLED" | "OFFLINE" | "UNAUTHORIZED"
  statusMessage = "",
  height = "380px",
  onRefresh = () => {},
  showCampusBlocks = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const coords = targetUser?.location?.latitude && targetUser?.location?.longitude
    ? [targetUser.location.latitude, targetUser.location.longitude]
    : [VFSTR_CAMPUS_CENTER.latitude, VFSTR_CAMPUS_CENTER.longitude];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: coords,
      zoom: 18,
      zoomControl: false,
      attributionControl: true
    });

    // Add OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &bull; VFSTR Vadlamudi'
    }).addTo(map);

    // Add Zoom Control at top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Add Campus Landmark Geofence Markers
    if (showCampusBlocks) {
      VFSTR_BUILDINGS.forEach((bld) => {
        const buildingIcon = L.divIcon({
          html: `
            <div style="background: rgba(15, 23, 42, 0.88); color: #ffffff; border: 2px solid ${bld.badgeColor}; padding: 3px 6px; font-size: 10px; font-weight: 800; border-radius: 0px; box-shadow: 0 0 10px ${bld.badgeColor}55; white-space: nowrap;">
              <span style="color: ${bld.badgeColor}; font-weight: 900;">${bld.code}</span> &bull; ${bld.shortName}
            </div>
          `,
          className: "leaflet-building-label",
          iconSize: [90, 24],
          iconAnchor: [45, 12]
        });

        L.marker([bld.latitude, bld.longitude], { icon: buildingIcon, interactive: false }).addTo(map);
        L.circle([bld.latitude, bld.longitude], {
          radius: bld.radiusMeters,
          color: bld.badgeColor,
          weight: 1,
          dashArray: "4, 6",
          fillColor: bld.badgeColor,
          fillOpacity: 0.06,
          interactive: false
        }).addTo(map);
      });
    }

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update or fly to target position when location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    // Only place marker if location is available and authorized
    if (
      targetUser?.location?.latitude &&
      targetUser?.location?.longitude &&
      status !== "NOT_ENABLED" &&
      status !== "UNAUTHORIZED" &&
      status !== "OFFLINE"
    ) {
      const latLng = [targetUser.location.latitude, targetUser.location.longitude];
      const isLive = status === "LIVE";
      const icon = createCustomMarkerIcon(targetUser.role || "student", isLive, targetUser.name);

      const marker = L.marker(latLng, { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
          <strong style="font-size: 13px; color: #000;">${targetUser.name || "User"}</strong>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">ID: ${targetUser.roll || targetUser.id || "N/A"}</div>
          <div style="background: ${isLive ? "#dcfce7" : "#fef3c7"}; color: ${isLive ? "#166534" : "#92400e"}; padding: 2px 6px; font-weight: 700; margin-bottom: 4px; font-size: 11px;">
            ${isLive ? "🟢 LIVE GPS" : "🟡 LAST KNOWN"}
          </div>
          <div style="font-weight: 600;">${targetUser.location.shortName || targetUser.location.badge || "Campus"}</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 4px;">Precision: &plusmn;${targetUser.location.accuracy || 10}m</div>
        </div>
      `);

      markerRef.current = marker;

      // Accuracy radius circle
      const circle = L.circle(latLng, {
        radius: Math.max(targetUser.location.accuracy || 15, 10),
        color: isLive ? "#16a34a" : "#d97706",
        weight: 1,
        fillColor: isLive ? "#22c55e" : "#f59e0b",
        fillOpacity: 0.15
      }).addTo(map);
      circleRef.current = circle;

      // Smoothly pan to location
      map.flyTo(latLng, 18, { duration: 1.2 });
    }
  }, [targetUser, status, mapReady]);

  const hasLocation = Boolean(targetUser?.location?.latitude && targetUser?.location?.longitude);
  const isLive = status === "LIVE";
  const isStale = status === "STALE";

  return (
    <div
      style={{
        border: "2px solid #000000",
        boxShadow: "4px 4px 0px #000000",
        background: "#ffffff",
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* Top Map Action Bar */}
      <div
        style={{
          background: "#000000",
          color: "#ffffff",
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.78rem",
          fontWeight: 700
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Navigation size={14} color="#f59e0b" />
          <span>Interactive Campus GPS Map</span>

          {/* Status Indicator Chip */}
          {hasLocation && (isLive || isStale) && (
            <span
              style={{
                background: isLive ? "#16a34a" : "#d97706",
                color: "#ffffff",
                padding: "1px 6px",
                fontSize: "0.68rem",
                borderRadius: "0px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              {isLive ? <Radio size={10} className="animate-pulse" /> : <Clock size={10} />}
              <span>{isLive ? "LIVE GPS" : "LAST KNOWN"}</span>
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {hasLocation && (
            <a
              href={`https://www.google.com/maps?q=${targetUser.location.latitude},${targetUser.location.longitude}`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#f59e0b",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "0.72rem"
              }}
            >
              <span>Google Maps</span>
              <ExternalLink size={11} />
            </a>
          )}
          <button
            type="button"
            onClick={onRefresh}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              fontWeight: 700
            }}
            title="Refresh GPS coordinates"
          >
            <RotateCcw size={12} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Map Container Element */}
      <div ref={mapContainerRef} style={{ width: "100%", height, background: "#f8fafc" }} />

      {/* Empty / Error / Warning Overlays */}
      {status === "UNAUTHORIZED" && (
        <div
          style={{
            position: "absolute",
            inset: "36px 0 0 0",
            background: "rgba(255, 255, 255, 0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "2px solid #000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px"
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <h4 style={{ margin: "0 0 4px 0", fontWeight: 800 }}>Access Restricted</h4>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", maxWidth: "380px" }}>
            {statusMessage || "You are not authorized to view this user's location."}
          </p>
        </div>
      )}

      {status === "NOT_ENABLED" && (
        <div
          style={{
            position: "absolute",
            inset: "36px 0 0 0",
            background: "rgba(255, 255, 255, 0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "#f1f5f9",
              color: "#475569",
              border: "2px solid #000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px"
            }}
          >
            <MapPin size={24} />
          </div>
          <h4 style={{ margin: "0 0 4px 0", fontWeight: 800 }}>Location Sharing Not Enabled</h4>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", maxWidth: "380px" }}>
            Location sharing is not enabled by this user.
          </p>
        </div>
      )}

      {status === "OFFLINE" && (
        <div
          style={{
            position: "absolute",
            inset: "36px 0 0 0",
            background: "rgba(255, 255, 255, 0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "#fef3c7",
              color: "#d97706",
              border: "2px solid #000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px"
            }}
          >
            <Clock size={24} />
          </div>
          <h4 style={{ margin: "0 0 4px 0", fontWeight: 800 }}>Location Currently Unavailable</h4>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", maxWidth: "380px" }}>
            Student location currently unavailable. The mobile device is offline or location sharing has paused.
          </p>
        </div>
      )}

      {/* Stale Warning Banner when location is not fresh */}
      {isStale && hasLocation && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            right: "8px",
            background: "rgba(254, 243, 199, 0.96)",
            border: "1px solid #d97706",
            padding: "6px 12px",
            fontSize: "0.75rem",
            color: "#92400e",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 1000
          }}
        >
          <AlertTriangle size={14} color="#d97706" />
          <span>Last known location – not currently live. (Updated {new Date(targetUser.location.updatedAt).toLocaleTimeString()})</span>
        </div>
      )}
    </div>
  );
}

