/**
 * VFSTR (Vignan's Foundation for Science, Technology and Research) - Vadlamudi
 * Campus Geofencing & GPS Location Engine
 * 
 * Configured with official Google Maps Satellite Coordinates:
 * https://www.google.com/maps/@16.2329402,80.5497368,534m/data=!3m1!1e3
 * Supporting A-Block, N-Block, H-Block, U-Block, and Central Library
 */

export const GOOGLE_MAPS_CAMPUS_URL = "https://www.google.com/maps/@16.2329402,80.5497368,534m/data=!3m1!1e3";

// VFSTR Vadlamudi Campus Central Reference Coordinates (Calibrated from User Satellite View)
export const VFSTR_CAMPUS_CENTER = {
  latitude: 16.2329402,
  longitude: 80.5497368,
  zoom: 18,
  radiusMeters: 650 // University campus geofence boundary
};

// University Blocks (A-Block, N-Block, H-Block, U-Block, Central Library)
export const VFSTR_BUILDINGS = [
  {
    id: "n_block",
    code: "N",
    name: "N-Block (Department of CSE & IT)",
    shortName: "N-Block",
    type: "ACADEMIC",
    latitude: 16.2336,
    longitude: 80.5508,
    radiusMeters: 65,
    floors: ["Ground Floor (Laboratories)", "1st Floor (HOD & Classrooms)", "2nd Floor (Classrooms)", "3rd Floor (Faculty Cabins)", "4th Floor (AI/ML & Cloud Labs)"],
    badgeColor: "#16a34a", // Emerald Green
    description: "CSE Department Cabins, AI/ML Labs, Cloud Computing Centers",
    icon: "Building2",
    relativeX: 62, // % on 2D radar map
    relativeY: 34
  },
  {
    id: "a_block",
    code: "A",
    name: "A-Block (Administrative & Central Block)",
    shortName: "A-Block",
    type: "ADMIN",
    latitude: 16.2324,
    longitude: 80.5496,
    radiusMeters: 65,
    floors: ["Ground Floor (Admissions & Accounts)", "1st Floor (Dean-AAA & Academic Affairs)", "2nd Floor (Vice Chancellor Secretariat)"],
    badgeColor: "#2563eb", // Blue
    description: "Main University Administrative Complex, Dean-AAA & Registrar",
    icon: "ShieldCheck",
    relativeX: 38,
    relativeY: 55
  },
  {
    id: "h_block",
    code: "H",
    name: "H-Block (Core Engineering & Student Complex)",
    shortName: "H-Block",
    type: "ACADEMIC",
    latitude: 16.2315,
    longitude: 80.5488,
    radiusMeters: 65,
    floors: ["Ground Floor (Workshops & Mech Labs)", "1st Floor (Electrical Stacks)", "2nd Floor (Faculty Rooms)", "3rd Floor (Drawing Halls)"],
    badgeColor: "#ea580c", // Orange
    description: "Engineering Core Laboratories, Innovation Centers & Student Amenities",
    icon: "Compass",
    relativeX: 20,
    relativeY: 76
  },
  {
    id: "u_block",
    code: "U",
    name: "U-Block (Sciences, Pharmacy & Interdisciplinary)",
    shortName: "U-Block",
    type: "ACADEMIC",
    latitude: 16.2343,
    longitude: 80.5501,
    radiusMeters: 65,
    floors: ["1st Floor (Basic Sciences)", "2nd Floor (Pharmacy Labs)", "3rd Floor (Research Centers)"],
    badgeColor: "#0d9488", // Teal
    description: "Freshman Engineering, Applied Physics & Computational Chemistry",
    icon: "Layers",
    relativeX: 48,
    relativeY: 18
  },
  {
    id: "central_library",
    code: "LIB",
    name: "Central Library & Digital Knowledge Center",
    shortName: "Central Library",
    type: "LIBRARY",
    latitude: 16.2330,
    longitude: 80.5516,
    radiusMeters: 55,
    floors: ["Ground Floor (Circulation Desk)", "1st Floor (Journal & E-Stacks)", "2nd Floor (Digital Research Center)"],
    badgeColor: "#9333ea", // Purple
    description: "University Library, Reference Reading Halls & Digital Resource Hub",
    icon: "BookOpen",
    relativeX: 78,
    relativeY: 48
  }
];

/**
 * Calculates Great-Circle distance between two coordinates in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Resolves a GPS fix (lat, lng, accuracy) into a specific VFSTR campus building/zone.
 */
export function resolveCampusLocation(latitude, longitude, accuracyMeters = 15) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return {
      status: "UNKNOWN",
      badge: "Location Offline",
      color: "#64748b",
      building: null,
      blockCode: null,
      isOnCampus: false,
      accuracy: null,
      description: "Mobile GPS signal unavailable or not transmitted.",
      googleMapsUrl: GOOGLE_MAPS_CAMPUS_URL
    };
  }

  // 1. Check distance to VFSTR Campus Center
  const distToCenter = calculateDistanceMeters(
    latitude,
    longitude,
    VFSTR_CAMPUS_CENTER.latitude,
    VFSTR_CAMPUS_CENTER.longitude
  );

  // If outside university perimeter (> 650m)
  if (distToCenter > VFSTR_CAMPUS_CENTER.radiusMeters) {
    return {
      status: "OFF_CAMPUS",
      badge: "Off Campus",
      color: "#6b7280",
      building: null,
      blockCode: null,
      isOnCampus: false,
      distanceFromCampusMeters: distToCenter,
      description: "Outside VFSTR Vadlamudi campus perimeter.",
      googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
      lastUpdated: new Date().toISOString()
    };
  }

  // 2. Identify nearest Campus Block (A, N, H, U, Library)
  let nearestBuilding = null;
  let minDistance = Infinity;

  for (const bld of VFSTR_BUILDINGS) {
    const dist = calculateDistanceMeters(latitude, longitude, bld.latitude, bld.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestBuilding = bld;
    }
  }

  const effectiveRadius = nearestBuilding ? nearestBuilding.radiusMeters + Math.min(accuracyMeters, 25) : 55;

  if (nearestBuilding && minDistance <= effectiveRadius) {
    return {
      status: "INSIDE_BUILDING",
      badge: `Inside ${nearestBuilding.shortName}`,
      color: nearestBuilding.badgeColor,
      building: nearestBuilding.name,
      buildingId: nearestBuilding.id,
      blockCode: nearestBuilding.code,
      shortName: nearestBuilding.shortName,
      isOnCampus: true,
      distanceToBuilding: minDistance,
      accuracy: accuracyMeters,
      description: `${nearestBuilding.description} (GPS Precision: ±${Math.round(accuracyMeters)}m)`,
      googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
      lastUpdated: new Date().toISOString()
    };
  }

  // Inside campus grounds / walkways
  return {
    status: "ON_CAMPUS_GROUNDS",
    badge: `Near ${nearestBuilding ? nearestBuilding.shortName : 'N-Block'}`,
    color: "#059669",
    building: "VFSTR Campus Walkway",
    buildingId: "campus_grounds",
    blockCode: nearestBuilding?.code || "CAMPUS",
    shortName: nearestBuilding ? `Near ${nearestBuilding.shortName}` : "Campus Grounds",
    isOnCampus: true,
    distanceToNearestBuilding: minDistance,
    accuracy: accuracyMeters,
    description: `Walking across VFSTR grounds, ~${minDistance}m from ${nearestBuilding?.shortName || "Department Blocks"}`,
    googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Deterministically generates realistic demo/live coordinates on campus
 * based on faculty cabin and assigned blocks.
 */
export function getSimulatedFacultyGPS(facultyId, facultyName = "", cabin = "") {
  let defaultBlockId = "n_block";
  const cabinUpper = (cabin || "").toUpperCase();

  if (cabinUpper.includes("N-")) defaultBlockId = "n_block";
  else if (cabinUpper.includes("A-")) defaultBlockId = "a_block";
  else if (cabinUpper.includes("U-")) defaultBlockId = "u_block";
  else if (cabinUpper.includes("H-")) defaultBlockId = "h_block";
  else {
    // Hash deterministically
    let h = 0;
    const str = facultyId + facultyName;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    const blocks = ["n_block", "n_block", "n_block", "a_block", "u_block", "h_block", "central_library"];
    defaultBlockId = blocks[Math.abs(h) % blocks.length];
  }

  const bld = VFSTR_BUILDINGS.find((b) => b.id === defaultBlockId) || VFSTR_BUILDINGS[0];

  // Slight jitter within 10 meters of the block center
  let h2 = 0;
  for (let i = 0; i < facultyId.length; i++) {
    h2 = (h2 << 3) - h2 + facultyId.charCodeAt(i);
  }
  const jitterLat = ((Math.abs(h2) % 15) - 7) * 0.00004;
  const jitterLng = (((Math.abs(h2) >> 2) % 15) - 7) * 0.00004;

  const lat = Number((bld.latitude + jitterLat).toFixed(6));
  const lng = Number((bld.longitude + jitterLng).toFixed(6));
  const accuracy = 6 + (Math.abs(h2) % 6);

  const resolved = resolveCampusLocation(lat, lng, accuracy);

  return {
    latitude: lat,
    longitude: lng,
    accuracy,
    blockCode: bld.code,
    blockName: bld.shortName,
    timestamp: new Date().toISOString(),
    ...resolved
  };
}
