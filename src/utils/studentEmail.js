/**
 * Student Official Email & VU Mailbox Utility
 * Department of Computer Science & Engineering - VFSTR Vadlamudi
 *
 * Handles official VU email formatting and instant mailbox dispatch
 * for all 1,511 students across Sections 1 through 22.
 *
 * Email Pattern: vu.<roll_number_in_lowercase>@gmail.com
 * Example:
 *   Roll: 241FA04001 -> vu.241fa04001@gmail.com
 *   Roll: 241FA04035 -> vu.241fa04035@gmail.com
 *   Roll: 241FA04152 -> vu.241fa04152@gmail.com
 *   Roll: 241FA04B57 -> vu.241fa04b57@gmail.com
 */

const LOCAL_MAILBOX_KEY = "vfstr_student_mailbox_notices_v1";

/**
 * Resolves standard VU Student Gmail and Institutional email addresses
 */
export function getStudentVUEmail(roll) {
  const cleanRoll = String(roll || "").trim().toLowerCase();
  return {
    gmail: `vu.${cleanRoll}@gmail.com`,
    institutional: `${cleanRoll}@vignan.ac.in`,
    display: `vu.${cleanRoll}@gmail.com`
  };
}

/**
 * Dispatches an absence alert notification into the student's VU mailbox
 * both locally (0ms optimistic storage) and to the backend notification server.
 */
export async function dispatchAbsentEmailNotice({
  studentRoll,
  studentName,
  date,
  period,
  subject,
  section,
  facultyName,
  facultyPhone
}) {
  if (!studentRoll) return null;

  const rollUpper = String(studentRoll).toUpperCase().trim();
  const rollLower = String(studentRoll).toLowerCase().trim();
  const recipientEmail = `vu.${rollLower}@gmail.com`;
  const officialEmail = `${rollLower}@vignan.ac.in`;
  const currentDate = date || new Date().toISOString().split("T")[0];
  const currentPeriod = String(period || "1");
  const currentSubject = subject || "Class Attendance";
  const currentSection = section || "Section 1";

  const noticeRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: "ABSENCE_ALERT",
    studentRoll: rollUpper,
    studentName: studentName || rollUpper,
    recipientEmail,
    officialEmail,
    date: currentDate,
    period: currentPeriod,
    subject: currentSubject,
    section: currentSection,
    facultyName: facultyName || "Course Faculty",
    facultyPhone: facultyPhone || "+919000443503",
    status: "DELIVERED",
    subjectLine: `[VFSTR Attendance Alert] Official Notice of Absence: Period ${currentPeriod} (${currentSubject}) on ${currentDate}`,
    sentAt: new Date().toISOString(),
    isRead: false,
    messageBody: `Dear ${studentName || rollUpper} (${rollUpper}),

This is an automated attendance notification from Vignan's Foundation for Science, Technology and Research (VFSTR Vadlamudi).

You have been marked ABSENT for:
• Date: ${currentDate}
• Period: Period ${currentPeriod}
• Subject: ${currentSubject}
• Section: ${currentSection}
• Faculty: ${facultyName || "Course Faculty"} (${facultyPhone || "+919000443503"})

ATTENDANCE REGULATION NOTICE:
Under VFSTR Academic Regulations (R22 CBCS), students must maintain a mandatory minimum of 75% aggregate attendance to remain eligible for Semester End Examinations (Summative Assessments). Any deficit below 75% will require formal condonation review or result in exam debarment.

Please meet your Faculty or Class Counsellor immediately if you believe this absence was recorded in error or if you have an approved On-Duty (OD) / Medical exemption.

Office of the Dean, Academic Affairs
Vignan's Foundation for Science, Technology and Research :: Vadlamudi`
  };

  // 1. Optimistic Local Mailbox Storage (Immediate UI feedback with 0ms latency)
  try {
    const raw = localStorage.getItem(LOCAL_MAILBOX_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [noticeRecord, ...existing.filter((n) => n.id !== noticeRecord.id)].slice(0, 1000);
    localStorage.setItem(LOCAL_MAILBOX_KEY, JSON.stringify(updated));

    // Dispatch custom browser event for instant cross-component mailbox sync
    window.dispatchEvent(
      new CustomEvent("vu_student_mail_received", { detail: noticeRecord })
    );
  } catch (err) {
    console.warn("Could not cache student mail notice locally:", err);
  }

  // 2. Dispatch to backend API asynchronously
  try {
    fetch("/api/notifications/absent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentRoll: rollUpper,
        studentName: studentName || rollUpper,
        studentEmail: recipientEmail,
        date: currentDate,
        period: currentPeriod,
        subject: currentSubject,
        section: currentSection,
        facultyName,
        facultyPhone
      })
    }).catch(() => {});
  } catch (e) {}

  return noticeRecord;
}

/**
 * Retrieves all mailbox notices for a specific student roll number.
 */
export function getStudentMailboxNotices(studentRoll) {
  if (!studentRoll) return [];
  const rollUpper = String(studentRoll).toUpperCase().trim();

  try {
    const raw = localStorage.getItem(LOCAL_MAILBOX_KEY);
    if (raw) {
      const allNotices = JSON.parse(raw);
      if (Array.isArray(allNotices)) {
        return allNotices.filter((n) => n.studentRoll?.toUpperCase() === rollUpper);
      }
    }
  } catch (err) {}

  return [];
}

/**
 * Marks a specific notification notice as read.
 */
export function markMailNoticeAsRead(noticeId) {
  try {
    const raw = localStorage.getItem(LOCAL_MAILBOX_KEY);
    if (raw) {
      const allNotices = JSON.parse(raw);
      const updated = allNotices.map((n) => (n.id === noticeId ? { ...n, isRead: true } : n));
      localStorage.setItem(LOCAL_MAILBOX_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch (err) {}
  return [];
}
