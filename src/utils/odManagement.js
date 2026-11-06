/**
 * On-Duty (OD) Application & Counsellor Notification Manager
 * Handles student OD exemption submissions, counsellor notifications, and status approvals.
 */

const LOCAL_OD_KEY = "vfstr_od_applications";

// Initial demo OD applications for demonstration and backward compatibility
const INITIAL_DEMO_OD = [
  {
    id: "od_demo_1",
    studentRoll: "241FA04035",
    studentName: "SIKHA SRUJANA",
    studentSection: "Section 1",
    sectionNum: 1,
    counsellorName: "Mr. Gujjula Murali",
    date: "2026-11-05",
    reason: "Technical Symposium / Hackathon Participation",
    description: "Attending Smart India Hackathon zonal round at Hyderabad campus",
    periods: "All Scheduled Periods",
    status: "Pending Counsellor Review",
    submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notificationMessage: "Your counselling student SIKHA SRUJANA (241FA04035, Section 1) applied for OD on 2026-11-05 due to Technical Symposium / Hackathon Participation. Description: Attending Smart India Hackathon zonal round at Hyderabad campus [Official Supporting Document Attached: SIH_2026_Shortlisting_Letter.pdf]",
    isReadByCounsellor: false,
    counsellorRemarks: "",
    reviewedAt: null,
    hasVerificationDoc: true,
    documentName: "SIH_2026_Shortlisting_Letter.pdf",
    documentType: "application/pdf",
    documentSize: "248 KB",
    verificationRef: "SIH-2026-HYD-0419",
    documentData: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23ffffff' stroke='%23000000' stroke-width='4'/><rect x='20' y='20' width='560' height='360' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><text x='300' y='70' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000000'>VFSTR UNIVERSITY - ON DUTY VERIFICATION PROOF</text><text x='300' y='110' font-family='sans-serif' font-size='14' text-anchor='middle' fill='%23475569'>SMART INDIA HACKATHON 2026 - OFFICIAL INVITATION LETTER</text><line x1='60' y1='130' x2='540' y2='130' stroke='%23000000' stroke-width='2'/><text x='70' y='170' font-family='sans-serif' font-size='13' fill='%23000000'>Student: SIKHA SRUJANA (241FA04035)</text><text x='70' y='200' font-family='sans-serif' font-size='13' fill='%23000000'>Branch: CSE - Section 1</text><text x='70' y='230' font-family='sans-serif' font-size='13' fill='%23000000'>Event: SIH 2026 Grand Finale, Hyderabad Hub</text><text x='70' y='260' font-family='sans-serif' font-size='13' fill='%23000000'>Verification Ref: SIH-2026-HYD-0419</text><text x='70' y='290' font-family='sans-serif' font-size='13' fill='%2316a34a' font-weight='bold'>Authenticity Status: VALID & VERIFIED INSTITUTIONAL RECORD</text><rect x='410' y='280' width='130' height='60' fill='%23ffffff' stroke='%2316a34a' stroke-width='2'/><text x='475' y='315' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%2316a34a'>SEAL VERIFIED</text></svg>"
  },
  {
    id: "od_demo_2",
    studentRoll: "241FA04054",
    studentName: "TADIBOINA MOUNIKA",
    studentSection: "Section 1",
    sectionNum: 1,
    counsellorName: "Mr. Gujjula Murali",
    date: "2026-11-06",
    reason: "Inter-University Sports Meet / NCC / NSS",
    description: "Representing VFSTR in South Zone Inter-University Basketball Tournament",
    periods: "All Scheduled Periods",
    status: "Approved",
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notificationMessage: "Your counselling student TADIBOINA MOUNIKA (241FA04054, Section 1) applied for OD on 2026-11-06 due to Inter-University Sports Meet / NCC / NSS. Description: Representing VFSTR in South Zone Inter-University Basketball Tournament [Official Supporting Document Attached: Basketball_Tournament_Relief_Order.pdf]",
    isReadByCounsellor: true,
    counsellorRemarks: "Approved. Verified with Physical Education Director.",
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
    hasVerificationDoc: true,
    documentName: "Basketball_Tournament_Relief_Order.pdf",
    documentType: "application/pdf",
    documentSize: "185 KB",
    verificationRef: "VFSTR-SPORTS-2026-88",
    documentData: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23ffffff' stroke='%23000000' stroke-width='4'/><rect x='20' y='20' width='560' height='360' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><text x='300' y='70' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000000'>DEPARTMENT OF PHYSICAL EDUCATION - VFSTR</text><text x='300' y='110' font-family='sans-serif' font-size='14' text-anchor='middle' fill='%23475569'>OFFICIAL RELIEF ORDER & ON-DUTY CERTIFICATE</text><line x1='60' y1='130' x2='540' y2='130' stroke='%23000000' stroke-width='2'/><text x='70' y='170' font-family='sans-serif' font-size='13' fill='%23000000'>Candidate: TADIBOINA MOUNIKA (241FA04054)</text><text x='70' y='200' font-family='sans-serif' font-size='13' fill='%23000000'>Tournament: South Zone Inter-University Basketball Championship</text><text x='70' y='230' font-family='sans-serif' font-size='13' fill='%23000000'>Verification Ref: VFSTR-SPORTS-2026-88</text><text x='70' y='270' font-family='sans-serif' font-size='13' fill='%2316a34a' font-weight='bold'>Authenticity Status: OFFICIAL SPORTS DIRECTORATE ATTESTED</text><rect x='410' y='280' width='130' height='60' fill='%23ffffff' stroke='%2316a34a' stroke-width='2'/><text x='475' y='315' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%2316a34a'>ATTESTED</text></svg>"
  }
];

export function getStoredOdApplications() {
  try {
    const raw = localStorage.getItem(LOCAL_OD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read OD applications:", err);
  }
  // Initialize default if empty
  saveOdApplications(INITIAL_DEMO_OD);
  return INITIAL_DEMO_OD;
}

export function saveOdApplications(list) {
  try {
    localStorage.setItem(LOCAL_OD_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Failed to save OD applications:", err);
  }
}

/**
 * Submits an OD application from a student and generates a notification for their counsellor.
 */
export function submitOdApplication({
  studentRoll,
  studentName,
  studentSection,
  sectionNum = 1,
  counsellorName,
  date,
  reason,
  description = "",
  periods = "All Scheduled Periods",
  documentName = "",
  documentType = "",
  documentData = "",
  documentSize = "",
  verificationRef = ""
}) {
  const rollUpper = String(studentRoll || "").toUpperCase().trim();
  const descClean = (description || "").trim();
  const safeName = studentName || rollUpper;
  const safeSection = studentSection || `Section ${sectionNum || 1}`;
  const safeCounsellor = counsellorName || "Designated Counsellor";
  const hasDoc = Boolean(documentData && documentName);

  // Exact required notification format:
  // "Your counselling student [Student Name] ([Roll No], [Section]) applied for OD on [Date] due to [Reason]. Description: [Description]"
  const descPart = descClean ? ` Description: ${descClean}` : "";
  const docPart = hasDoc ? ` [Official Supporting Document Attached: ${documentName}]` : "";
  const notificationMessage = `Your counselling student ${safeName} (${rollUpper}, ${safeSection}) applied for OD on ${date} due to ${reason}.${descPart}${docPart}`;

  const newOd = {
    id: `od_${Date.now()}_${rollUpper}`,
    studentRoll: rollUpper,
    studentName: safeName,
    studentSection: safeSection,
    sectionNum: Number(sectionNum) || 1,
    counsellorName: safeCounsellor,
    date,
    reason,
    description: descClean,
    periods,
    status: "Pending Counsellor Review",
    submittedAt: new Date().toISOString(),
    notificationMessage,
    isReadByCounsellor: false,
    counsellorRemarks: "",
    reviewedAt: null,
    hasVerificationDoc: hasDoc,
    documentName: documentName || "",
    documentType: documentType || "",
    documentData: documentData || "",
    documentSize: documentSize || "",
    verificationRef: verificationRef || `VFSTR-OD-${Date.now().toString().slice(-6)}`
  };

  const current = getStoredOdApplications();
  const updated = [newOd, ...current.filter((item) => item.id !== newOd.id)];
  saveOdApplications(updated);

  // Dispatch custom browser event for instant live synchronization across components/tabs
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("vu_counsellor_od_notification", { detail: newOd })
    );
  }

  // Also submit to server API if available
  try {
    fetch("/api/od-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOd)
    }).catch(() => {});
  } catch (e) {}

  return newOd;
}

/**
 * Retrieves all OD applications assigned to a particular counsellor.
 */
export function getOdApplicationsForCounsellor(counsellorName) {
  const all = getStoredOdApplications();
  if (!counsellorName || counsellorName === "ALL") return all;
  const q = counsellorName.toLowerCase().trim();
  return all.filter((item) => item.counsellorName && item.counsellorName.toLowerCase().includes(q));
}

/**
 * Retrieves all OD applications submitted by a particular student.
 */
export function getOdApplicationsForStudent(studentRoll) {
  if (!studentRoll) return [];
  const rollUpper = String(studentRoll).toUpperCase().trim();
  const all = getStoredOdApplications();
  return all.filter((item) => item.studentRoll?.toUpperCase() === rollUpper);
}

/**
 * Updates the status of an OD application (e.g. Approved or Rejected by the counsellor).
 */
export function updateOdApplicationStatus(id, newStatus, counsellorRemarks = "") {
  const all = getStoredOdApplications();
  let updatedRecord = null;
  const updated = all.map((item) => {
    if (item.id === id) {
      updatedRecord = {
        ...item,
        status: newStatus,
        counsellorRemarks,
        reviewedAt: new Date().toISOString(),
        isReadByCounsellor: true
      };
      return updatedRecord;
    }
    return item;
  });
  saveOdApplications(updated);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("vu_counsellor_od_status_updated", { detail: updatedRecord })
    );
  }

  try {
    fetch(`/api/od-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, counsellorRemarks })
    }).catch(() => {});
  } catch (e) {}

  return updated;
}

/**
 * Marks an OD notification as acknowledged/read by the counsellor.
 */
export function markOdAsRead(id) {
  const all = getStoredOdApplications();
  const updated = all.map((item) => (item.id === id ? { ...item, isReadByCounsellor: true } : item));
  saveOdApplications(updated);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("vu_counsellor_od_status_updated", { detail: { id, isReadByCounsellor: true } })
    );
  }
  return updated;
}
