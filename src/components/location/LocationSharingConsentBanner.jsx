import React, { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Radio,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  Clock
} from "lucide-react";
import {
  startDeviceLocationTracking,
  stopDeviceLocationTracking,
  isLocationSharingActiveLocally,
  isGeolocationSupported
} from "../../services/locationTrackingService.js";

export default function LocationSharingConsentBanner({
  currentUser,
  onShowToast = () => {},
  onLocationUpdate = () => {}
}) {
  const userId = currentUser?.roll || currentUser?.id || currentUser?.userId;
  const role = currentUser?.role || "student";

  const [isSharing, setIsSharing] = useState(() => isLocationSharingActiveLocally(userId));
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsSharing(isLocationSharingActiveLocally(userId));
  }, [userId]);

  const handleStartSharing = async () => {
    setIsLocating(true);
    setErrorMsg("");

    try {
      const coords = await startDeviceLocationTracking(
        currentUser,
        (updatedCoords) => {
          setCurrentCoords(updatedCoords);
          onLocationUpdate(updatedCoords);
        },
        (err) => {
          setErrorMsg(err.message);
          onShowToast(`⚠️ ${err.message}`, "warning");
        }
      );

      setCurrentCoords(coords);
      setIsSharing(true);
      setShowConsentModal(false);
      onShowToast("📍 Live location sharing enabled for authorized university staff.", "success");
    } catch (err) {
      setErrorMsg(err.message);
      onShowToast(`Location access failed: ${err.message}`, "error");
    } finally {
      setIsLocating(false);
    }
  };

  const handleStopSharing = async () => {
    await stopDeviceLocationTracking(currentUser);
    setIsSharing(false);
    setCurrentCoords(null);
    onShowToast("🛑 Live location sharing stopped immediately.", "info");
  };

  return (
    <>
      {/* Top Banner Control Strip */}
      <div
        className="location-sharing-banner"
        style={{
          background: isSharing ? "#f0fdf4" : "#f8fafc",
          borderBottom: "1px solid #000000",
          padding: "6px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.76rem",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isSharing ? "#16a34a" : "#94a3b8",
              boxShadow: isSharing ? "0 0 8px #16a34a" : "none"
            }}
          />
          <strong style={{ color: "#000000" }}>
            {isSharing ? "Live GPS Location Sharing Active" : "Location Sharing Paused"}
          </strong>
          <span style={{ color: "#64748b" }}>
            {isSharing
              ? currentCoords
                ? `(Lat: ${currentCoords.latitude}°, Lng: ${currentCoords.longitude}°, ±${currentCoords.accuracy}m)`
                : "(Transmitting real device coordinates)"
              : "(Only authorized teachers/counsellors see your location when enabled)"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isSharing ? (
            <button
              type="button"
              onClick={handleStopSharing}
              style={{
                background: "#ffffff",
                color: "#dc2626",
                border: "1px solid #dc2626",
                padding: "3px 10px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                borderRadius: "0px"
              }}
              title="Stop sharing your device location"
            >
              Stop Location Sharing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConsentModal(true)}
              style={{
                background: "#000000",
                color: "#ffffff",
                border: "1px solid #000000",
                padding: "3px 10px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                borderRadius: "0px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="Explicit opt-in to share your GPS position with authorized educators"
            >
              <Navigation size={11} color="#f59e0b" />
              <span>Enable Location Sharing</span>
            </button>
          )}
        </div>
      </div>

      {/* Consent & Disclosure Modal */}
      {showConsentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 11000,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setShowConsentModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "3px solid #000000",
              boxShadow: "8px 8px 0px #000000",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              borderRadius: "0px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#000000",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                    Enable Live Location Sharing
                  </h3>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    VFSTR University Institutional Privacy Disclosure &bull; v2.4
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: "0.82rem", color: "#334155", lineHeight: "1.5", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 10px 0" }}>
                When enabled, your device's <strong>actual GPS coordinates</strong> will be captured through your browser to determine your live campus building location (e.g. <em>N-Block, A-Block, Library</em>).
              </p>

              <div style={{ background: "#f8fafc", border: "1px solid #000000", padding: "12px", marginBottom: "12px" }}>
                <strong style={{ display: "block", marginBottom: "4px", color: "#000000" }}>Who can view your location?</strong>
                {role === "student" ? (
                  <ul style={{ margin: 0, paddingLeft: "18px" }}>
                    <li><strong>Your Assigned Faculty Counsellor</strong> for mentorship check-ins.</li>
                    <li><strong>Your Class Teachers</strong> for authorized attendance verification.</li>
                    <li><strong>Never other students</strong> (student-to-student tracking is strictly blocked).</li>
                  </ul>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "18px" }}>
                    <li><strong>Enrolled Students</strong> seeking your cabin / lecture hall for academic queries.</li>
                    <li><strong>Department Colleagues & Counsellors</strong> for inter-faculty collaboration.</li>
                  </ul>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#166534" }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span>You can revoke permission and stop sharing at any time with one click.</span>
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #dc2626",
                  color: "#991b1b",
                  padding: "8px 12px",
                  fontSize: "0.75rem",
                  marginBottom: "14px"
                }}
              >
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="btn btn-sm"
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "1px solid #000000",
                  fontWeight: 700,
                  padding: "8px 16px",
                  borderRadius: "0px"
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartSharing}
                disabled={isLocating}
                className="btn btn-sm"
                style={{
                  background: "#000000",
                  color: "#ffffff",
                  border: "1px solid #000000",
                  fontWeight: 800,
                  padding: "8px 20px",
                  borderRadius: "0px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {isLocating ? (
                  <span>Requesting Device GPS...</span>
                ) : (
                  <>
                    <Navigation size={14} color="#f59e0b" />
                    <span>Consent & Enable Sharing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

