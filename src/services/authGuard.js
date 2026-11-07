/**
 * VFSTR CSE Attendance Portal v2.4
 * Centralized Authentication Guard & Role-Based Routing Service
 *
 * Enforces:
 * 1. Default Landing Page: Root route '/' ALWAYS renders Login Screen for unauthenticated visitors.
 * 2. Route Protection: Unauthenticated visitors directly accessing dashboard URLs are redirected to '/'.
 * 3. Role-Based Access Control: Students cannot access Admin or Faculty dashboards; Faculty cannot access Admin.
 * 4. Session Expiration & Invalidation: Sessions expire automatically and are purged on logout.
 * 5. Clean URL Synchronization: Supports both path routing (/attendance, /counsellor, /student, /admin)
 *    and hash routing (#attendance, #counsellor, #student, #admin).
 */

export const SESSION_STORAGE_KEY = "vfstr_session_v2";
export const LEGACY_STORAGE_KEY = "portal_auth_user";
export const ACTIVE_DASHBOARD_KEY = "portal_active_dashboard";

// 2-Hour Maximum Session Duration
export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Normalizes browser pathname and hash into a clean canonical route identifier
 * Returns: "login" | "faculty" | "counsellor" | "student" | "admin" | "calendar" | "faculty-search" | "logout"
 */
export function resolveCurrentRoute() {
  if (typeof window === "undefined") return "login";

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const hash = (window.location.hash || "").toLowerCase().replace(/^#+/, "").replace(/\/+$/, "");

  // Priority 1: Check logout route
  if (pathname === "/logout" || hash === "logout") {
    return "logout";
  }

  // Priority 2: Check Hash route
  if (hash) {
    if (hash === "attendance" || hash === "faculty") return "faculty";
    if (hash === "counsellor" || hash === "counselor") return "counsellor";
    if (hash === "student") return "student";
    if (hash === "admin") return "admin";
    if (hash === "calendar") return "calendar";
    if (hash === "faculty-search") return "faculty-search";
    if (hash === "" || hash === "login") return "login";
  }

  // Priority 3: Check Pathname route
  if (pathname === "/attendance" || pathname === "/faculty") return "faculty";
  if (pathname === "/counsellor" || pathname === "/counselor") return "counsellor";
  if (pathname === "/student") return "student";
  if (pathname === "/admin") return "admin";
  if (pathname === "/calendar") return "calendar";
  if (pathname === "/faculty-search") return "faculty-search";

  // Default root / is login
  return "login";
}

/**
 * Validates and retrieves the active authenticated session.
 * Purges invalid, expired, or malformed sessions immediately.
 */
export function getAuthenticatedSession() {
  if (typeof window === "undefined") return null;

  try {
    let raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }

    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || (!session.id && !session.roll && !session.name)) {
      clearAllSessionData();
      return null;
    }

    // Validate Session Expiration
    const expiresAt = session.sessionExpiresAt || session.expiresAt;
    if (expiresAt && Date.now() > Number(expiresAt)) {
      console.warn("[Auth Guard] Session has expired. Purging session.");
      clearAllSessionData();
      return null;
    }

    return session;
  } catch (err) {
    console.warn("[Auth Guard] Corrupted session detected, clearing storage:", err);
    clearAllSessionData();
    return null;
  }
}

/**
 * Creates and persists an authenticated session with TTL and token
 */
export function createAuthenticatedSession(user) {
  const now = Date.now();
  const sessionToken = `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
  const expiresAt = now + SESSION_DURATION_MS;

  const sessionObj = {
    ...user,
    sessionToken,
    sessionCreatedAt: now,
    sessionExpiresAt: expiresAt
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(sessionObj));
  } catch (e) {
    console.error("[Auth Guard] Failed to save session:", e);
  }

  return sessionObj;
}

/**
 * Purges all authenticated session data on client and invalidates credentials
 */
export function clearAllSessionData() {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_DASHBOARD_KEY);
    localStorage.removeItem("selected_faculty_id");
  } catch (e) {}
}

/**
 * Role-Based Access Control (RBAC) permission validator
 * Rules:
 * - Admin: Full access to all dashboards
 * - Faculty: Can access Attendance, Counsellor, and Student views (cannot access Admin)
 * - Counsellor: Can access Counsellor, Attendance, and Student views (cannot access Admin)
 * - Student: Can access ONLY Student, Calendar, and Faculty Search views (strictly barred from Admin & Faculty)
 */
export function canRoleAccessRoute(userRole, targetRoute) {
  if (!userRole) return false;
  if (targetRoute === "calendar" || targetRoute === "faculty-search") return true;

  if (userRole === "admin") return true;

  if (userRole === "faculty") {
    return targetRoute === "faculty" || targetRoute === "counsellor" || targetRoute === "student";
  }

  if (userRole === "counsellor") {
    return targetRoute === "counsellor" || targetRoute === "faculty" || targetRoute === "student";
  }

  if (userRole === "student") {
    return targetRoute === "student";
  }

  return false;
}

/**
 * Maps a user's role to their designated landing dashboard
 */
export function getDefaultDashboardForRole(role) {
  if (role === "admin") return "admin";
  if (role === "counsellor") return "counsellor";
  if (role === "student") return "student";
  return "faculty"; // Attendance Dashboard for faculty
}

/**
 * Maps a canonical dashboard name to its canonical URL path
 */
export function getUrlPathForDashboard(dashboard) {
  switch (dashboard) {
    case "faculty":
      return "/attendance";
    case "counsellor":
      return "/counsellor";
    case "student":
      return "/student";
    case "admin":
      return "/admin";
    case "calendar":
      return "/calendar";
    case "faculty-search":
      return "/faculty-search";
    default:
      return "/";
  }
}

/**
 * Synchronizes the browser address bar with the active dashboard
 * Keeps both HTML5 pushState path and hash aligned without triggering full reloads
 */
export function syncBrowserUrl(dashboard, isReplace = false) {
  if (typeof window === "undefined") return;

  const path = getUrlPathForDashboard(dashboard);
  const hash = dashboard === "login" ? "" : `#${dashboard === "faculty" ? "attendance" : dashboard}`;

  try {
    if (isReplace) {
      window.history.replaceState({ dashboard }, document.title, `${path}${hash}`);
    } else {
      window.history.pushState({ dashboard }, document.title, `${path}${hash}`);
    }
  } catch (e) {
    window.location.hash = hash;
  }
}

