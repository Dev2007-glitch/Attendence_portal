/**
 * WhatsApp Helper Utilities for Attendance Portal
 */

export function sanitizePhoneNumber(phone) {
  if (!phone) return "";
  // Strip all non-digit characters except leading plus if any
  let digits = phone.replace(/[^0-9]/g, "");

  // If 10 digits (typical Indian mobile number), prepend 91
  if (digits.length === 10) {
    digits = "91" + digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = "91" + digits.substring(1);
  }
  return digits;
}

export function getSubjectShortForm(subject) {
  if (!subject) return "";
  const s = String(subject).trim();
  const upper = s.toUpperCase();

  // Explicit mappings from Section 1 timetable
  if (upper.includes("MACHINE LEARNING") || upper.includes("(ML") || upper === "ML") return "ML";
  if (upper.includes("COMPUTER NETWORKS") || upper.includes("(CN") || upper === "CN") return "CN";
  if (upper.includes("MODERN FRONT") || upper.includes("MFEF")) return "MFEF";
  if (upper.includes("OPTIMIZATION") || upper.includes("(OT") || upper === "OT") return "OT";
  if (upper.includes("COMPUTING ETHICS") || upper.includes("(CE") || upper === "CE") return "CE";
  if (upper.includes("PC LAB") || upper.includes("PC-LAB")) return "PC LAB";
  if (upper.includes("COMPETITIVE CODING") || upper.includes("(CC") || upper === "CC") return "CC";
  if (upper.includes("TRAIN")) return "TRAINING";
  if (upper.includes("NPTEL")) return "NPTEL";
  if (upper.includes("LIB")) return "LIB";
  if (upper.includes("MINOR")) return "MINORS";

  // If there's an acronym inside parentheses, extract it (e.g. "Subject Name (SUB)")
  const parenMatch = s.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inside = parenMatch[1].split(/[-–\s]/)[0];
    if (inside.length <= 6) return inside;
  }

  // If already short, keep it
  if (s.length <= 8) return s;

  return s;
}

export function generateWhatsAppMessage({
  date,
  period,
  section,
  subject,
  absentCount = 0,
  absentStudents = []
}) {
  const formattedDate =
    date && date.includes("-") ? date.split("-").reverse().join("-") : date;

  const count = absentStudents ? absentStudents.length : absentCount;

  const absentRollsList =
    absentStudents && absentStudents.length > 0
      ? absentStudents.map((s) => s.roll || s).join(", ")
      : "None (All Present)";

  let displaySection = "1 CSE";
  if (section) {
    const s = String(section).toLowerCase();
    if (s.includes("sec 1") || s.includes("section 1") || s.includes("1 cse") || s.includes("cse 1")) {
      displaySection = "1 CSE";
    } else {
      displaySection = section;
    }
  }

  const shortSubject = getSubjectShortForm(subject);

  let msg = `ATTENDANCE REPORT\n`;
  msg += `Date: ${formattedDate}\n`;
  msg += `Period:- ${period}\n`;
  msg += `section:- ${displaySection}\n`;
  msg += `subject:- ${shortSubject}\n\n`;
  msg += `ABSENT ROLL NUMBERS (${count}):\n`;
  msg += `${absentRollsList}\n`;

  return msg;
}

export function openWhatsAppChat({ phone, message }) {
  const cleanNumber = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message);

  const url = cleanNumber
    ? `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // Attempt to open in a new tab
  const win = window.open(url, "_blank");
  return { url, cleanNumber, opened: !!win };
}
