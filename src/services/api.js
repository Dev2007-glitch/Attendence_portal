const API_BASE = "/api";

import { ALL_STUDENTS, SECTIONS, COUNSELLORS, INITIAL_STUDENTS, DEFAULT_SETTINGS } from "../../data.js";

export const FALLBACK_STUDENTS = ALL_STUDENTS;
export { ALL_STUDENTS, SECTIONS, COUNSELLORS, INITIAL_STUDENTS, DEFAULT_SETTINGS };

export async function fetchStudents(section, counsellor) {
  try {
    let url = `${API_BASE}/students`;
    const params = new URLSearchParams();
    if (section && section !== "ALL") params.append("section", section);
    if (counsellor && counsellor !== "ALL") params.append("counsellor", counsellor);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Backend response error");
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return json.data;
    }
    return ALL_STUDENTS;
  } catch (err) {
    console.warn("Using local fallback students list:", err);
    return ALL_STUDENTS;
  }
}

export async function fetchSessions() {
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    if (!res.ok) throw new Error("Backend response error");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("Using local storage for sessions:", err);
    const saved = localStorage.getItem("att_history");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveSession(session) {
  // Always update localStorage as backup
  try {
    const localHistory = JSON.parse(localStorage.getItem("att_history") || "[]");
    const updated = [session, ...localHistory.filter(s => s.id !== session.id)];
    localStorage.setItem("att_history", JSON.stringify(updated.slice(0, 50)));
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session)
    });
    if (!res.ok) throw new Error("Save error");
    return await res.json();
  } catch (err) {
    console.warn("Saved to localStorage fallback (Backend unreachable)");
    return { success: true, data: session, fallback: true };
  }
}

export async function deleteSession(id) {
  try {
    const localHistory = JSON.parse(localStorage.getItem("att_history") || "[]");
    const updated = localHistory.filter(s => String(s.id) !== String(id));
    localStorage.setItem("att_history", JSON.stringify(updated));
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/sessions/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete error");
    return await res.json();
  } catch (err) {
    return { success: true, fallback: true };
  }
}

export async function fetchFacultyContacts() {
  try {
    const res = await fetch(`${API_BASE}/faculty`);
    if (!res.ok) throw new Error("Backend response error");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("Using local storage fallback for faculty contacts:", err);
    const saved = localStorage.getItem("faculty_whatsapp_contacts_v3");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveFacultyContacts(contacts) {
  try {
    localStorage.setItem("faculty_whatsapp_contacts_v3", JSON.stringify(contacts));
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contacts)
    });
    if (!res.ok) throw new Error("Save faculty contacts error");
    return await res.json();
  } catch (err) {
    console.warn("Saved faculty contacts to localStorage fallback");
    return { success: true, data: contacts, fallback: true };
  }
}

export async function saveStudent(student) {
  try {
    const res = await fetch(`${API_BASE}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });
    if (!res.ok) throw new Error("Save student error");
    return await res.json();
  } catch (err) {
    console.warn("Save student fallback locally", err);
    return { success: true, data: student, fallback: true };
  }
}

export async function deleteStudent(roll) {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(roll)}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Delete student error");
    return await res.json();
  } catch (err) {
    console.warn("Delete student error", err);
    return { success: true, fallback: true };
  }
}

export async function fetchOverviewStats() {
  try {
    const res = await fetch(`${API_BASE}/stats/overview`);
    if (!res.ok) throw new Error("Stats error");
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true };
  }
}

export async function fetchStudentMailbox(roll) {
  if (!roll) return [];
  const rollClean = String(roll).trim().toUpperCase();

  try {
    const res = await fetch(`${API_BASE}/notifications/mailbox/${encodeURIComponent(rollClean)}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn("Backend mailbox fetch error, reading local mailbox cache:", err);
  }

  try {
    const cached = localStorage.getItem("vfstr_student_mailbox_notices_v1");
    if (cached) {
      const list = JSON.parse(cached);
      return list.filter((n) => n.studentRoll?.toUpperCase() === rollClean);
    }
  } catch (e) {}

  return [];
}

export async function markNoticeRead(id) {
  try {
    await fetch(`${API_BASE}/notifications/mailbox/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
  } catch (err) {}
}

export async function searchFaculty(params = {}, signal) {
  try {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.name) query.append("name", params.name);
    if (params.id) query.append("id", params.id);
    if (params.department && params.department !== "ALL") query.append("department", params.department);
    if (params.subject && params.subject !== "ALL") query.append("subject", params.subject);
    if (params.cabin) query.append("cabin", params.cabin);
    if (params.limit) query.append("limit", params.limit);
    if (params.page) query.append("page", params.page);

    const url = `${API_BASE}/faculty/search?${query.toString()}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.warn("API searchFaculty failed, falling back to local search:", err);
    // Local fallback using facultyLocator
    const { getAllFacultyDirectory } = await import("../utils/facultyLocator.js");
    const list = getAllFacultyDirectory();
    const q = (params.q || "").toLowerCase().trim();
    const name = (params.name || "").toLowerCase().trim();
    const id = (params.id || "").toLowerCase().trim();
    const dept = (params.department && params.department !== "ALL" ? params.department : "").toLowerCase().trim();
    const subj = (params.subject && params.subject !== "ALL" ? params.subject : "").toLowerCase().trim();

    const filtered = list.filter((f) => {
      if (id && !f.id.toLowerCase().includes(id)) return false;
      if (name && !f.name.toLowerCase().includes(name)) return false;
      if (dept && !f.department.toLowerCase().includes(dept)) return false;
      if (subj && !f.subjectsList?.some((s) => s.toLowerCase().includes(subj))) return false;
      if (q) {
        const match =
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          f.cabin.toLowerCase().includes(q) ||
          f.subjectsList?.some((s) => s.toLowerCase().includes(q)) ||
          f.sectionsList?.some((sec) => sec.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    return {
      success: true,
      total: filtered.length,
      count: filtered.length,
      data: filtered
    };
  }
}

export async function fetchFacultyDepartments() {
  try {
    const res = await fetch(`${API_BASE}/faculty/departments`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) return json.data;
    }
  } catch (e) {}
  return ["Computer Science & Engineering (CSE)"];
}

export async function fetchFacultySubjects() {
  try {
    const res = await fetch(`${API_BASE}/faculty/subjects`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) return json.data;
    }
  } catch (e) {}
  return [];
}

export async function fetchFacultyById(id) {
  if (!id) return null;
  try {
    const res = await fetch(`${API_BASE}/faculty/${encodeURIComponent(id)}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {}
  return null;
}

// =========================================================================
// ROLE-BASED LIVE LOCATION APIS (PHASE 10)
// =========================================================================

export async function apiStartLocationSharing(userId, role, name) {
  try {
    const res = await fetch(`${API_BASE}/location/share/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role, name })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function apiStopLocationSharing(userId, role) {
  try {
    const res = await fetch(`${API_BASE}/location/share/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function apiSendLocationUpdate(userId, role, name, coords) {
  try {
    const res = await fetch(`${API_BASE}/location/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        role,
        name,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy
      })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function apiGetLocationPermissions(userId) {
  try {
    const res = await fetch(`${API_BASE}/location/permissions?userId=${encodeURIComponent(userId)}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: false, data: { isEnabled: false } };
}

export async function apiSearchStudentsLocation(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/location/students?${query}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: false, data: [] };
}

export async function apiGetStudentLocation(studentRoll, viewerParams = {}) {
  try {
    const query = new URLSearchParams(viewerParams).toString();
    const res = await fetch(`${API_BASE}/location/students/${encodeURIComponent(studentRoll)}?${query}`);
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function apiSearchFacultyLocation(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/location/faculty?${query}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: false, data: [] };
}

export async function apiGetFacultyLocation(facultyId, viewerParams = {}) {
  try {
    const query = new URLSearchParams(viewerParams).toString();
    const res = await fetch(`${API_BASE}/location/faculty/${encodeURIComponent(facultyId)}?${query}`);
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function apiGetAdminLocationOverview() {
  try {
    const res = await fetch(`${API_BASE}/location/admin/overview`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: false, summary: {} };
}

export async function apiGetLocationAccessHistory(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/location/access-history?${query}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: false, logs: [] };
}


