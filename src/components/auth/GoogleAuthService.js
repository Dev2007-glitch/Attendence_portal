/**
 * Google Identity Services & Auth Helper for Attendance Portal
 * Decodes Google JWT tokens, manages client-side Google OAuth2 lifecycle,
 * and handles authentic Google Account selection for all students and faculty.
 */

// Decode JWT token from Google Identity Services
export function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse Google JWT credential", e);
    return null;
  }
}

// Retrieve configured Google Client ID from environment or localStorage
export function getGoogleClientId() {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim() !== "") return envId.trim();
  try {
    const saved = localStorage.getItem("attendance_google_client_id");
    if (saved && saved.trim() !== "") return saved.trim();
  } catch {
    // ignore
  }
  return "";
}

export function saveGoogleClientId(clientId) {
  try {
    if (clientId && clientId.trim()) {
      localStorage.setItem("attendance_google_client_id", clientId.trim());
    } else {
      localStorage.removeItem("attendance_google_client_id");
    }
  } catch {
    // ignore
  }
}

// Trigger real Google OAuth2 Token Client popup (Google native browser popup)
export function triggerRealGoogleOAuth(clientId, onSuccess, onError) {
  if (!window.google?.accounts?.oauth2) {
    if (onError) onError("Google Identity Services script not loaded yet. Please try again in a moment.");
    return false;
  }

  try {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile openid",
      callback: async (tokenResponse) => {
        if (tokenResponse?.access_token) {
          try {
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const profile = await res.json();
            if (profile && profile.email) {
              onSuccess({
                name: profile.name || profile.given_name || "Google User",
                email: profile.email,
                photo: profile.picture,
                authProvider: "google"
              });
            } else {
              if (onError) onError("Could not retrieve Google profile.");
            }
          } catch (err) {
            console.error("Error fetching Google userinfo:", err);
            if (onError) onError(err.message || "Error fetching Google user profile");
          }
        } else if (tokenResponse?.error) {
          console.warn("Google OAuth token response error:", tokenResponse.error);
          if (onError) onError(tokenResponse.error);
        }
      }
    });
    client.requestAccessToken({ prompt: "select_account" });
    return true;
  } catch (err) {
    console.error("Error in triggerRealGoogleOAuth:", err);
    if (onError) onError(err.message || "Failed to start Google OAuth");
    return false;
  }
}

// Exact Google Accounts matching the user's authentic Google OAuth screenshot
export const DEFAULT_GOOGLE_PRESETS = [
  {
    name: "VFSTR University Admin",
    email: "deviraghuveerabaib@gmail.com",
    initials: "B.",
    bg: "#6d4c41",
    picture: null,
    roleHint: "admin",
    description: "Administrator / Faculty"
  },
  {
    name: "devi bondili",
    email: "vu.241fa04b57@gmail.com",
    initials: "d",
    bg: "#546e7a",
    picture: null,
    roll: "241FA04B57",
    roleHint: "student",
    description: "Student (Roll: 241FA04B57, Section 18)"
  },
  {
    name: "Dev",
    email: "dev090247@gmail.com",
    initials: "D",
    bg: "#ad1457",
    picture: null,
    signedOut: true,
    roleHint: "faculty",
    description: "Signed out"
  },
  {
    name: "bhimana lakshmialekhya",
    email: "vu.241fa04633@gmail.com",
    initials: "b",
    bg: "#37474f",
    picture: null,
    signedOut: true,
    roll: "241FA04633",
    roleHint: "student",
    description: "Student (Roll: 241FA04633, Section 18) • Signed out"
  },
  {
    name: "bhimana lakshmialekhya",
    email: "bhimanalakshmialekhya@gmail.com",
    initials: "b",
    bg: "#37474f",
    picture: null,
    signedOut: true,
    roleHint: "student",
    description: "Personal Google Account • Signed out"
  },
  {
    name: "Abid Baig",
    email: "abidbaig786123@gmail.com",
    initials: "A",
    bg: "#2e4057",
    picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    roleHint: "faculty",
    description: "Faculty / Academic Member"
  },
  {
    name: "Ms. Shaik Kareena Yashmin",
    email: "kareenayashmin@vignan.ac.in",
    initials: "K",
    bg: "#7b1fa2",
    picture: null,
    roleHint: "faculty",
    description: "Faculty Member & Counsellor (Section 18)"
  }
];
