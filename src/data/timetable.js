/**
 * Official Timetable & Faculty Contacts for Section 1 [Room N-407]
 * Extracted from Google Sheets:
 * https://docs.google.com/spreadsheets/d/18OgeBzSUhcd9dsBVSHxFNDWrmhq-yYFU/edit?pli=1&gid=607885332#gid=607885332
 */

export const SECTION_1_FACULTIES = [
  {
    id: "fac_ml",
    name: "Dr. P. Siva Prasad (Class Teacher & ML)",
    phone: "+919000443503",
    subjectKey: "ML"
  },
  {
    id: "fac_cn",
    name: "Dr. J. Vijitha Ananthi (Computer Networks)",
    phone: "+919790628946",
    subjectKey: "CN"
  },
  {
    id: "fac_mfef",
    name: "Mr Kalyan Babu (Modern Front-End)",
    phone: "+919347389313",
    subjectKey: "MFEF"
  },
  {
    id: "fac_ot",
    name: "DR. M. PADMA DEVI (Optimization Tech)",
    phone: "+919502227314",
    subjectKey: "OT"
  },
  {
    id: "fac_ce",
    name: "Ms. Neeli Sarvani (Computing Ethics)",
    phone: "+918790776273",
    subjectKey: "CE"
  },
  {
    id: "fac_pclab",
    name: "Dr. P. Vijayababu (PC LAB)",
    phone: "+919985333934",
    subjectKey: "PC_LAB"
  },
  {
    id: "fac_cc",
    name: "Sk Sai Hussen (CC / Competitive Coding)",
    phone: "+919490467919",
    subjectKey: "CC"
  },
  {
    id: "fac_training",
    name: "MR. MUBARAK / Sk Sai Hussen (Training)",
    phone: "+919490467919",
    subjectKey: "TRAINING"
  },
  {
    id: "fac_nptel",
    name: "M. Phanindra Chowdary (NPTEL)",
    phone: "+919701927457",
    subjectKey: "NPTEL"
  }
];

export const SECTION_1_SUBJECTS = [
  {
    id: "ML",
    code: "24CS306",
    name: "Machine Learning (ML-24CS306)",
    facultyName: "Dr. P. Siva Prasad",
    phone: "+919000443503",
    color: "#2563eb"
  },
  {
    id: "CN",
    code: "24CS303",
    name: "Computer Networks (24CS303)",
    facultyName: "Dr. J. Vijitha Ananthi",
    phone: "+919790628946",
    color: "#059669"
  },
  {
    id: "MFEF",
    code: "24CS304",
    name: "Modern Front-End Frameworks (MFEF)",
    facultyName: "Mr Kalyan Babu",
    phone: "+919347389313",
    color: "#7c3aed"
  },
  {
    id: "OT",
    code: "24BS301",
    name: "Optimization Techniques (OT)",
    facultyName: "DR. M. PADMA DEVI",
    phone: "+919502227314",
    color: "#d97706"
  },
  {
    id: "CE",
    code: "24CS305",
    name: "Computing Ethics (24CS305)",
    facultyName: "Ms. Neeli Sarvani",
    phone: "+918790776273",
    color: "#0891b2"
  },
  {
    id: "PC_LAB",
    code: "24CS307",
    name: "PC LAB",
    facultyName: "Dr. P. Vijayababu",
    phone: "+919985333934",
    color: "#4f46e5"
  },
  {
    id: "CC",
    code: "24CS308",
    name: "Competitive Coding (CC)",
    facultyName: "Sk Sai Hussen",
    phone: "+919490467919",
    color: "#ea580c"
  },
  {
    id: "TRAINING",
    code: "TRAIN",
    name: "TRAINING-(N-415)",
    facultyName: "MR. MUBARAK",
    phone: "+919490467919",
    color: "#dc2626"
  },
  {
    id: "NPTEL",
    code: "NPTEL",
    name: "NPTEL",
    facultyName: "M. Phanindra Chowdary",
    phone: "+919701927457",
    color: "#475569"
  }
];

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

export const SECTION_1_TIMETABLE = {
  Monday: {
    "1": { subject: "TRAINING-(N-415)", subjectKey: "TRAINING", room: "N-415", faculty: "MR. MUBARAK", phone: "+919490467919" },
    "2": { subject: "TRAINING-(N-415)", subjectKey: "TRAINING", room: "N-415", faculty: "MR. MUBARAK", phone: "+919490467919" },
    "3": { subject: "OT (L)-(N-415)", subjectKey: "OT", room: "N-415", faculty: "DR. M. PADMA DEVI", phone: "+919502227314" },
    "4": { subject: "CC", subjectKey: "CC", room: "N-407", faculty: "Patan Hashmi", phone: "+919490467919" },
    "5": { subject: "ML (L)", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "6": { subject: "CN (P)-(N-412)", subjectKey: "CN", room: "N-412", faculty: "Dr. J. Vijitha Ananthi", phone: "+919790628946" },
    "7": { subject: "CN (P)-(N-412)", subjectKey: "CN", room: "N-412", faculty: "Dr. J. Vijitha Ananthi", phone: "+919790628946" },
    "8": { subject: "EXPERIENTIAL LEARNING / PROJECT", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" }
  },
  Tuesday: {
    "1": { subject: "TRAINING-(N-415)", subjectKey: "TRAINING", room: "N-415", faculty: "MR. MUBARAK", phone: "+919490467919" },
    "2": { subject: "TRAINING-(N-415)", subjectKey: "TRAINING", room: "N-415", faculty: "MR. MUBARAK", phone: "+919490467919" },
    "3": { subject: "MFEF (T)(N-415)", subjectKey: "MFEF", room: "N-415", faculty: "Mr Kalyan Babu", phone: "+919347389313" },
    "4": { subject: "CN (T)", subjectKey: "CN", room: "N-407", faculty: "Dr. J. Vijitha Ananthi", phone: "+919790628946" },
    "5": { subject: "SELF STUDY", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "6": { subject: "OT (T)[N-301]", subjectKey: "OT", room: "N-301", faculty: "DR. M. PADMA DEVI", phone: "+919502227314" },
    "7": { subject: "OT (T)[N-301]", subjectKey: "OT", room: "N-301", faculty: "DR. M. PADMA DEVI", phone: "+919502227314" },
    "8": { subject: "FREE", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" }
  },
  Wednesday: {
    "1": { subject: "OT (L)", subjectKey: "OT", room: "N-407", faculty: "DR. M. PADMA DEVI", phone: "+919502227314" },
    "2": { subject: "MFEF (P)-(N-406)", subjectKey: "MFEF", room: "N-406", faculty: "Mr Kalyan Babu", phone: "+919347389313" },
    "3": { subject: "MFEF (P)-(N-406)", subjectKey: "MFEF", room: "N-406", faculty: "Mr Kalyan Babu", phone: "+919347389313" },
    "4": { subject: "ML (L)", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "5": { subject: "CC", subjectKey: "CC", room: "N-407", faculty: "Harshini Priyanka", phone: "+919490467919" },
    "6": { subject: "LIB (Library)", subjectKey: "ML", room: "LIB", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "7": { subject: "MINORS", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "8": { subject: "FREE", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" }
  },
  Thursday: {
    "1": { subject: "PC LAB", subjectKey: "PC_LAB", room: "PC-LAB", faculty: "Dr. P. Vijayababu", phone: "+919985333934" },
    "2": { subject: "PC LAB", subjectKey: "PC_LAB", room: "PC-LAB", faculty: "Dr. P. Vijayababu", phone: "+919985333934" },
    "3": { subject: "CN (L)", subjectKey: "CN", room: "N-407", faculty: "Dr. J. Vijitha Ananthi", phone: "+919790628946" },
    "4": { subject: "ML", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "5": { subject: "ML", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "6": { subject: "MFEF (T)", subjectKey: "MFEF", room: "N-407", faculty: "Mr Kalyan Babu", phone: "+919347389313" },
    "7": { subject: "MINORS", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "8": { subject: "FREE", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" }
  },
  Friday: {
    "1": { subject: "TRAINING-(N-415)", subjectKey: "TRAINING", room: "N-415", faculty: "MR. MUBARAK", phone: "+919490467919" },
    "2": { subject: "TRAINING-(N-415)", subjectKey: "TRAINING", room: "N-415", faculty: "MR. MUBARAK", phone: "+919490467919" },
    "3": { subject: "MFEF (L)(N-415)", subjectKey: "MFEF", room: "N-415", faculty: "Mr Kalyan Babu", phone: "+919347389313" },
    "4": { subject: "CE (T)", subjectKey: "CE", room: "N-407", faculty: "Ms. Neeli Sarvani", phone: "+918790776273" },
    "5": { subject: "SELF STUDY", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "6": { subject: "CC", subjectKey: "CC", room: "N-407", faculty: "Sk Sai Hussen", phone: "+919490467919" },
    "7": { subject: "COUN (Counselling)", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "8": { subject: "EXPERIENTIAL LEARNING / PROJECT", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" }
  },
  Saturday: {
    "1": { subject: "ML (P)[N-411]", subjectKey: "ML", room: "N-411", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "2": { subject: "ML (P)[N-411]", subjectKey: "ML", room: "N-411", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" },
    "3": { subject: "CN[N-411]", subjectKey: "CN", room: "N-411", faculty: "Dr. J. Vijitha Ananthi", phone: "+919790628946" },
    "4": { subject: "NPTEL", subjectKey: "NPTEL", room: "N-407", faculty: "M. Phanindra Chowdary", phone: "+919701927457" },
    "5": { subject: "NPTEL", subjectKey: "NPTEL", room: "N-407", faculty: "M. Phanindra Chowdary", phone: "+919701927457" },
    "6": { subject: "CC", subjectKey: "CC", room: "N-407", faculty: "Sk Sai Hussen", phone: "+919490467919" },
    "7": { subject: "MFEF (L)", subjectKey: "MFEF", room: "N-407", faculty: "Mr Kalyan Babu", phone: "+919347389313" },
    "8": { subject: "FREE", subjectKey: "ML", room: "N-407", faculty: "Dr. P. Siva Prasad", phone: "+919000443503" }
  }
};

/**
 * Given a day name (e.g. "Monday", "Thursday"), returns an array of
 * period options matching that day's scheduled sessions in chronological order.
 * Consecutive periods belonging to the same lab, training, library, or combined session
 * are cleanly grouped into a single period slot (e.g. '1-2 (Lab)', '2-3 (Lab)', '4-5').
 */
export function getTimetablePeriodsForDay(dayName) {
  const daySchedule = SECTION_1_TIMETABLE[dayName];
  if (!daySchedule) {
    return [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
      { value: "7", label: "7" },
      { value: "8", label: "8" }
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
      } else if (subj.includes("(T)") || subj.includes("TUTORIAL")) {
        typeTag = "";
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
 * Given a date string (YYYY-MM-DD), returns the timetable periods for that day of the week.
 */
export function getTimetablePeriodsForDate(dateStr) {
  if (!dateStr) return getTimetablePeriodsForDay("Monday");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateObj = new Date(dateStr);
  const dayName = days[dateObj.getDay()];
  return getTimetablePeriodsForDay(dayName);
}

/**
 * Given a day name and a single period number (e.g. '1', '2', '4'),
 * returns the period value (e.g. '1-2 (Lab)' or '4-5' or '3') containing that slot.
 */
export function getPeriodForSlot(dayName, slotNum) {
  const periods = getTimetablePeriodsForDay(dayName);
  const num = parseInt(slotNum, 10);
  const found = periods.find((p) => {
    const start = parseInt(p.startPeriod, 10);
    const end = parseInt(p.endPeriod, 10);
    return num >= start && num <= end;
  });
  return found ? found.value : String(slotNum);
}

/**
 * Given a date string (YYYY-MM-DD) and a period ('1', '2', '1-2 (Lab)', etc.),
 * returns the scheduled class details for Section 1.
 */
export function getScheduledClass(dateStr, periodStr) {
  if (!dateStr) return null;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateObj = new Date(dateStr);
  const dayName = days[dateObj.getDay()];

  if (!SECTION_1_TIMETABLE[dayName]) return null;

  // Extract first number if period is "1-2 (Lab)", "6 (Library)" etc.
  const periodNum = String(periodStr).split(/[^0-9]/)[0] || "1";
  const slot = SECTION_1_TIMETABLE[dayName][periodNum];

  if (!slot) return null;

  const subjectMeta = SECTION_1_SUBJECTS.find((s) => s.id === slot.subjectKey) || {
    name: slot.subject,
    facultyName: slot.faculty,
    phone: slot.phone
  };

  return {
    dayName,
    periodNum,
    subjectTitle: slot.subject,
    subjectMeta,
    room: slot.room,
    facultyName: slot.faculty,
    facultyPhone: slot.phone
  };
}

