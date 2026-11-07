/**
 * VFSTR CSE Attendance Portal V2.4
 * Device GPS Location Tracking Service (Phase 5)
 * 
 * Uses HTML5 navigator.geolocation API to obtain real device coordinates
 * with explicit user consent, disclosure, battery-friendly throttling, and revocation.
 */

import { apiStartLocationSharing, apiStopLocationSharing, apiSendLocationUpdate } from "./api.js";

let watchId = null;
let lastPushedCoords = null;
let lastPushedTime = 0;

// Throttling thresholds
const MIN_DISTANCE_METERS = 5; // only send update if user moves > 5m
const MIN_INTERVAL_MS = 15000; // minimum 15 seconds between backend pushes

/**
 * Calculates distance in meters between two coordinates
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if browser supports Geolocation API
 */
export function isGeolocationSupported() {
  return typeof window !== "undefined" && "geolocation" in navigator;
}

/**
 * Starts device GPS tracking with explicit user consent (Phase 5)
 * 
 * @param {Object} currentUser - Current authenticated user
 * @param {Function} onLocationChange - Callback receiving genuine GPS location
 * @param {Function} onError - Error callback
 */
export async function startDeviceLocationTracking(currentUser, onLocationChange = () => {}, onError = () => {}) {
  if (!isGeolocationSupported()) {
    const err = new Error("Geolocation is not supported by your browser or device.");
    onError(err);
    throw err;
  }

  const userId = currentUser.roll || currentUser.id || currentUser.userId;
  const role = currentUser.role || "student";
  const name = currentUser.name || userId;

  // 1. Tell backend user opted in
  await apiStartLocationSharing(userId, role, name);
  localStorage.setItem(`loc_sharing_active_${userId}`, "true");

  // 2. Clear any prior active watcher
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  // 3. Initiate watchPosition for live device movement
  return new Promise((resolve, reject) => {
    let initialResolved = false;

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const now = Date.now();

        const currentCoords = {
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          accuracy: Math.round(accuracy),
          timestamp: new Date(position.timestamp || now).toISOString()
        };

        // Determine if movement threshold or time interval was met
        let shouldPush = false;
        if (!lastPushedCoords) {
          shouldPush = true;
        } else {
          const dist = getDistanceMeters(
            lastPushedCoords.latitude,
            lastPushedCoords.longitude,
            currentCoords.latitude,
            currentCoords.longitude
          );
          const timeSince = now - lastPushedTime;
          if (dist >= MIN_DISTANCE_METERS || timeSince >= MIN_INTERVAL_MS) {
            shouldPush = true;
          }
        }

        if (shouldPush) {
          lastPushedCoords = currentCoords;
          lastPushedTime = now;
          try {
            await apiSendLocationUpdate(userId, role, name, currentCoords);
          } catch (e) {
            console.warn("Failed to push GPS update to backend:", e);
          }
        }

        onLocationChange(currentCoords);

        if (!initialResolved) {
          initialResolved = true;
          resolve(currentCoords);
        }
      },
      (geoError) => {
        let msg = "Unable to retrieve device GPS location.";
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          msg = "GPS signal is currently unavailable. Ensure device location is turned on.";
        } else if (geoError.code === geoError.TIMEOUT) {
          msg = "GPS location request timed out.";
        }

        const err = new Error(msg);
        err.code = geoError.code;
        onError(err);
        if (!initialResolved) {
          initialResolved = true;
          reject(err);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  });
}

/**
 * Stops device GPS tracking immediately (Phase 5)
 */
export async function stopDeviceLocationTracking(currentUser) {
  if (watchId !== null && isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  const userId = currentUser?.roll || currentUser?.id || currentUser?.userId;
  const role = currentUser?.role || "student";

  if (userId) {
    localStorage.removeItem(`loc_sharing_active_${userId}`);
    await apiStopLocationSharing(userId, role);
  }

  lastPushedCoords = null;
  lastPushedTime = 0;
}

/**
 * Checks if user had an active location sharing session stored in localStorage
 */
export function isLocationSharingActiveLocally(userId) {
  if (!userId) return false;
  return localStorage.getItem(`loc_sharing_active_${userId}`) === "true";
}

