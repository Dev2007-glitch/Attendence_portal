/**
 * Official VFSTR Vadlamudi: B.Tech Computer Science & Engineering, III Year - I Semester
 * Daily Timetable & Faculty Contacts for All 22 Sections
 * Parsed directly from official spreadsheet: https://tinyurl.com/3rdyearTT2026
 * Spreadsheet ID: 18OgeBzSUhcd9dsBVSHxFNDWrmhq-yYFU
 */

import { ALL_SECTION_TIMETABLES } from "./all_timetables.js";

export { ALL_SECTION_TIMETABLES };

export const PERIOD_TIME_SLOTS = [
  { period: "1", time: "8.15 - 9.05" },
  { period: "2", time: "9.05 - 9.55" },
  { period: "3", time: "9.55 - 10.45" },
  { period: "4", time: "11.00 - 11.50" },
  { period: "5", time: "11.50 - 12.40" },
  { period: "6", time: "1.30 - 2.20" },
  { period: "7", time: "2.20 - 3.10" },
  { period: "8", time: "3.10 - 4.00" }
];

export const SUBJECT_METADATA = {
  ML: {
    id: "ML",
    code: "24CS306",
    name: "Machine Learning (ML-24CS306)",
    color: "#2563eb"
  },
  CN: {
    id: "CN",
    code: "24CS303",
    name: "Computer Networks (24CS303)",
    color: "#059669"
  },
  MFEF: {
    id: "MFEF",
    code: "24CS304",
    name: "Modern Front-End Frameworks (MFEF)",
    color: "#7c3aed"
  },
  OT: {
    id: "OT",
    code: "24BS301",
    name: "Optimization Techniques (OT)",
    color: "#d97706"
  },
  CE: {
    id: "CE",
    code: "24CS305",
    name: "Computing Ethics (24CS305)",
    color: "#0891b2"
  },
  CV: {
    id: "CV",
    code: "24CS307",
    name: "Computer Vision (CV)",
    color: "#9333ea"
  },
  DAV: {
    id: "DAV",
    code: "24CS308",
    name: "Data Analytics and Visualization (DAV)",
    color: "#0d9488"
  },
  API: {
    id: "API",
    code: "24CS309",
    name: "API Security and Authentication (API)",
    color: "#e11d48"
  },
  PC_LAB: {
    id: "PC_LAB",
    code: "24CS310",
    name: "PC LAB / Professional Communication",
    color: "#4f46e5"
  },
  CC: {
    id: "CC",
    code: "24CS311",
    name: "Competitive Coding (CC)",
    color: "#ea580c"
  },
  TRAINING: {
    id: "TRAINING",
    code: "TRAIN",
    name: "Technical Training (TRAINING)",
    color: "#dc2626"
  },
  NPTEL: {
    id: "NPTEL",
    code: "NPTEL",
    name: "NPTEL Online Certification",
    color: "#475569"
  },
  LIB: {
    id: "LIB",
    code: "LIB",
    name: "Library / Self Study",
    color: "#64748b"
  },
  MINORS: {
    id: "MINORS",
    code: "MINORS",
    name: "Minor Degree Courses",
    color: "#854d0e"
  },
  COUN: {
    id: "COUN",
    code: "COUN",
    name: "Mentoring & Student Counselling",
    color: "#15803d"
  },
  PROJECT: {
    id: "PROJECT",
    code: "PROJECT",
    name: "Experiential Learning / Project Work",
    color: "#0284c7"
  }
};

/**
 * Returns complete timetable data for any section (1 - 22)
 */
export function getTimetableForSection(sectionNum = 1) {
  const num = typeof sectionNum === "number" ? sectionNum : parseInt(String(sectionNum).replace(/\D/g, "") || "1", 10);
  const secData = ALL_SECTION_TIMETABLES[String(num)] || ALL_SECTION_TIMETABLES["1"];
  return secData;
}

/**
 * Returns room string for any section
 */
export function getSectionRoom(sectionNum = 1) {
  const sec = getTimetableForSection(sectionNum);
  return sec?.room || `Room N-40${sectionNum}`;
}

/**
 * Returns class teacher for any section
 */
export function getSectionClassTeacher(sectionNum = 1) {
  const sec = getTimetableForSection(sectionNum);
  return sec?.classTeacher || { name: "Class Teacher", phone: "" };
}

/**
 * Returns list of subjects taught in that section with faculty contacts and colors
 */
export function getSectionSubjects(sectionNum = 1) {
  const sec = getTimetableForSection(sectionNum);
  if (!sec || !sec.faculties) return Object.values(SUBJECT_METADATA);

  const subjects = [];
  const addedKeys = new Set();

  Object.entries(sec.faculties).forEach(([skey, facInfo]) => {
    if (skey === "OTHER") return;
    const meta = SUBJECT_METADATA[skey] || {
      id: skey,
      code: skey,
      name: facInfo.subjectTitle || skey,
      color: "#64748b"
    };

    subjects.push({
      ...meta,
      facultyName: facInfo.name,
      phone: facInfo.phone
    });
    addedKeys.add(skey);
  });

  // Ensure standard core subjects exist if missing
  ["ML", "CN", "OT", "CE", "CC", "TRAINING"].forEach((skey) => {
    if (!addedKeys.has(skey) && SUBJECT_METADATA[skey]) {
      subjects.push({
        ...SUBJECT_METADATA[skey],
        facultyName: "Course Faculty",
        phone: "+919000443503"
      });
    }
  });

  return subjects;
}

// Backward-compatibility: Section 1 Timetable & Faculties
export const SECTION_1_TIMETABLE = ALL_SECTION_TIMETABLES["1"]?.timetable || {};
export const SECTION_1_FACULTIES = [
  { id: "fac_ml", name: "Dr. P. Siva Prasad (Class Teacher & ML)", phone: "+919000443503", subjectKey: "ML" },
  { id: "fac_cn", name: "Dr. J. Vijitha Ananthi (Computer Networks)", phone: "+919790628946", subjectKey: "CN" },
  { id: "fac_mfef", name: "Mr Kalyan Babu (Modern Front-End)", phone: "+919347389313", subjectKey: "MFEF" },
  { id: "fac_ot", name: "DR. M. PADMA DEVI (Optimization Tech)", phone: "+919502227314", subjectKey: "OT" },
  { id: "fac_ce", name: "Ms. Neeli Sarvani (Computing Ethics)", phone: "+918790776273", subjectKey: "CE" },
  { id: "fac_pclab", name: "Dr. P. Vijayababu (PC LAB)", phone: "+919985333934", subjectKey: "PC_LAB" },
  { id: "fac_cc", name: "Sk Sai Hussen (CC / Competitive Coding)", phone: "+919490467919", subjectKey: "CC" },
  { id: "fac_training", name: "MR. MUBARAK / Sk Sai Hussen (Training)", phone: "+919490467919", subjectKey: "TRAINING" },
  { id: "fac_nptel", name: "M. Phanindra Chowdary (NPTEL)", phone: "+919701927457", subjectKey: "NPTEL" },
  { id: "fac_kareena_yasmin", name: "Ms. Shaik Kareena Yashmin (Kareena Yasmin)", phone: "+917801017820", subjectKey: "API", sectionNum: 18 }
];
export const SECTION_1_SUBJECTS = getSectionSubjects(1);

/**
 * Given a day name and an optional sectionNum, returns an array of
 * period options matching that day's scheduled sessions in chronological order.
 * Consecutive periods belonging to the same lab, training, or combined session
 * are cleanly grouped into a single period slot (e.g. '1-2 (Lab)', '4-5 (Lab)').
 */
export function getTimetablePeriodsForDay(dayName, sectionNum = 1) {
  const num = typeof sectionNum === "number" ? sectionNum : parseInt(String(sectionNum).replace(/\D/g, "") || "1", 10);
  const secData = ALL_SECTION_TIMETABLES[String(num)] || ALL_SECTION_TIMETABLES["1"];
  const daySchedule = secData?.timetable?.[dayName] || SECTION_1_TIMETABLE?.[dayName];

  if (!daySchedule) {
    return [
      { value: "1", label: "Period 1 (8.15 - 9.05)" },
      { value: "2", label: "Period 2 (9.05 - 9.55)" },
      { value: "3", label: "Period 3 (9.55 - 10.45)" },
      { value: "4", label: "Period 4 (11.00 - 11.50)" },
      { value: "5", label: "Period 5 (11.50 - 12.40)" },
      { value: "6", label: "Period 6 (1.30 - 2.20)" },
      { value: "7", label: "Period 7 (2.20 - 3.10)" },
      { value: "8", label: "Period 8 (3.10 - 4.00)" }
    ];
  }

  const periods = [];
  let i = 1;
  while (i <= 8) {
    const current = daySchedule[String(i)];
    const next = i < 8 ? daySchedule[String(i + 1)] : null;

    // Check if consecutive periods are the exact same subject/session
    const isSameSession =
      next &&
      current &&
      current.subject &&
      current.subject === next.subject;

    if (isSameSession) {
      const subj = (current.subject || "").toUpperCase();
      let typeTag = "";
      if (subj.includes("LAB") || subj.includes("(P)") || current.subjectKey === "PC_LAB") {
        typeTag = " (Lab)";
      } else if (subj.includes("LIB")) {
        typeTag = " (Library)";
      } else if (subj.includes("TRAIN")) {
        typeTag = " (Lab)";
      }

      const val = `${i}-${i + 1}${typeTag}`;
      periods.push({
        value: val,
        label: val,
        startPeriod: String(i),
        endPeriod: String(i + 1),
        subject: current.subject,
        subjectKey: current.subjectKey,
        faculty: current.faculty,
        phone: current.phone,
        room: current.room
      });
      i += 2;
    } else {
      let typeTag = "";
      if (current) {
        const subj = (current.subject || "").toUpperCase();
        if (subj.includes("LIB")) {
          typeTag = " (Library)";
        } else if (subj.includes("LAB") || subj.includes("(P)")) {
          typeTag = " (Lab)";
        }
      }
      const val = `${i}${typeTag}`;
      periods.push({
        value: val,
        label: val,
        startPeriod: String(i),
        endPeriod: String(i),
        subject: current ? current.subject : "",
        subjectKey: current ? current.subjectKey : "",
        faculty: current ? current.faculty : "",
        phone: current ? current.phone : "",
        room: current ? current.room : ""
      });
      i += 1;
    }
  }

  return periods;
}

/**
 * Given a date string (YYYY-MM-DD) and sectionNum, returns the timetable periods for that day.
 */
export function getTimetablePeriodsForDate(dateStr, sectionNum = 1) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let dayName = "Monday";
  if (dateStr) {
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      dayName = days[dateObj.getDay()];
    }
  }
  return getTimetablePeriodsForDay(dayName, sectionNum);
}

/**
 * Given a day name, slot number, and sectionNum, returns the period value.
 */
export function getPeriodForSlot(dayName, slotNum, sectionNum = 1) {
  const periods = getTimetablePeriodsForDay(dayName, sectionNum);
  const num = parseInt(slotNum, 10);
  const found = periods.find((p) => {
    const start = parseInt(p.startPeriod, 10);
    const end = parseInt(p.endPeriod, 10);
    return num >= start && num <= end;
  });
  return found ? found.value : String(slotNum);
}

/**
 * Given a date string (YYYY-MM-DD), period string, and sectionNum,
 * returns the scheduled class details for that specific section.
 */
export function getScheduledClass(dateStr, periodStr, sectionNum = 1) {
  if (!dateStr) return null;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateObj = new Date(dateStr);
  const dayName = !isNaN(dateObj.getTime()) ? days[dateObj.getDay()] : "Monday";

  const num = typeof sectionNum === "number" ? sectionNum : parseInt(String(sectionNum).replace(/\D/g, "") || "1", 10);
  const secData = ALL_SECTION_TIMETABLES[String(num)] || ALL_SECTION_TIMETABLES["1"];
  const daySchedule = secData?.timetable?.[dayName];

  if (!daySchedule) return null;

  // Extract first number if period is "1-2 (Lab)", "6 (Library)" etc.
  const periodNum = String(periodStr).split(/[^0-9]/)[0] || "1";
  const slot = daySchedule[periodNum];

  if (!slot) return null;

  const sectionSubjects = getSectionSubjects(num);
  const subjectMeta = sectionSubjects.find((s) => s.id === slot.subjectKey) || {
    id: slot.subjectKey,
    name: slot.subject,
    facultyName: slot.faculty,
    phone: slot.phone
  };

  return {
    dayName,
    periodNum,
    subjectTitle: slot.subject,
    subjectMeta,
    room: slot.room || secData.room,
    facultyName: slot.faculty,
    facultyPhone: slot.phone
  };
}

/**
 * Returns a Set of marked period numbers (e.g. Set {"1", "2"}) and matching session objects
 * for a specific date and section.
 */
export function getMarkedPeriodsForDateAndSection(dateStr, sectionNum = 1, sessionsList = []) {
  const markedSet = new Set();
  const sessionsMap = new Map();
  if (!dateStr || !sessionsList || !Array.isArray(sessionsList)) {
    return { markedSet, sessionsMap };
  }

  const num = typeof sectionNum === "number" ? sectionNum : parseInt(String(sectionNum).replace(/\D/g, "") || "1", 10);
  const secName = `Section ${num}`;

  sessionsList.forEach((sess) => {
    if (!sess || sess.date !== dateStr) return;
    const sessSecNum = typeof sess.sectionNum === "number"
      ? sess.sectionNum
      : parseInt(String(sess.section || "").replace(/\D/g, ""), 10);

    if (sessSecNum === num || sess.section === secName) {
      const pStr = String(sess.period || "");
      markedSet.add(pStr);
      sessionsMap.set(pStr, sess);
      const digits = pStr.match(/\d+/g);
      if (digits) {
        digits.forEach((d) => {
          markedSet.add(d);
          if (!sessionsMap.has(d)) sessionsMap.set(d, sess);
        });
      }
    }
  });

  return { markedSet, sessionsMap };
}

/**
 * Given a date, sectionNum, and recorded sessions list,
 * automatically determines the next period that should be marked.
 * For example:
 * - If Period 1 & 2 are marked, returns "3"
 * - If no periods are marked, returns "1"
 * - If 1, 2, 3 are marked, returns "4"
 */
export function getNextUnmarkedPeriod(dateStr, sectionNum = 1, sessionsList = []) {
  const num = typeof sectionNum === "number" ? sectionNum : parseInt(String(sectionNum).replace(/\D/g, "") || "1", 10);
  const options = getTimetablePeriodsForDate(dateStr, num);
  if (!options || options.length === 0) return "1";

  const { markedSet } = getMarkedPeriodsForDateAndSection(dateStr, num, sessionsList);

  // Find first scheduled period option that has NOT been marked
  const nextOption = options.find((p) => {
    const isMarked =
      markedSet.has(p.value) ||
      (p.startPeriod && markedSet.has(p.startPeriod)) ||
      (p.endPeriod && markedSet.has(p.endPeriod));
    return !isMarked;
  });

  if (nextOption) {
    return nextOption.value;
  }

  // If all periods are marked for today, return the last period
  return options[options.length - 1]?.value || "1";
}

export default ALL_SECTION_TIMETABLES;

