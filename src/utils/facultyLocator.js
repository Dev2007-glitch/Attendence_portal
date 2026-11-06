/**
 * Faculty Location & Timetable Locator Service
 * Computes live real-time location, classroom, lab, cabin status,
 * and weekly schedules for all CSE faculty across all 22 sections.
 */

import { ALL_SECTION_TIMETABLES, PERIOD_TIME_SLOTS } from "../data/timetable.js";
import SECTIONS_META from "../data/sections_meta.js";

function cleanName(raw) {
  if (!raw) return "";
  return raw
    .replace(/\[\d+\]/g, "")
    .replace(/\(\d+\)/g, "")
    .replace(/(mon|tue|wed|thu|fri|sat)\s*-\s*/gi, "")
    .replace(/^[,\s/]+|[,\s/]+$/g, "")
    .trim();
}

// Fixed/Known cabins for prominent department leaders and faculties
const KNOWN_CABINS = {
  "Dr. P. Siva Prasad": "Cabin N-312, 3rd Floor, N-Block",
  "Dr. J. Vijitha Ananthi": "Cabin N-314, 3rd Floor, N-Block",
  "Mr Kalyan Babu": "Cabin N-316, 3rd Floor, N-Block",
  "Mr. Allamudi Kalyan Babu": "Cabin N-316, 3rd Floor, N-Block",
  "DR. M. PADMA DEVI": "Cabin N-318, 3rd Floor, N-Block",
  "Dr. M. Padma Devi": "Cabin N-318, 3rd Floor, N-Block",
  "Ms. Neeli Sarvani": "Cabin N-320, 3rd Floor, N-Block",
  "Dr. P. Vijayababu": "Cabin N-322, 3rd Floor, N-Block",
  "Sk Sai Hussen": "Cabin N-412, 4th Floor, N-Block",
  "M.Phanindra Chowdary": "Cabin N-324, 3rd Floor, N-Block",
  "Mr. Adnan Ahmad Khan": "Cabin N-308, 3rd Floor, N-Block",
  "Dr. R. Renugadevi": "Cabin N-310, 3rd Floor, N-Block",
  "Dr. Phanindra Thota": "Cabin N-326, 3rd Floor, N-Block",
  "Dr. M. Raja Rao": "Cabin N-328, 3rd Floor, N-Block",
  "Ms. Shaik Kareena Yashmin": "Cabin N-309, 3rd Floor, N-Block",
  "Ms. Kareena Yasmin": "Cabin N-309, 3rd Floor, N-Block"
};

/**
 * Builds and returns the comprehensive directory of all faculty members
 * indexed with their complete 6-day x 8-period teaching schedule,
 * contact info, cabin location, and subjects taught.
 */
export function getAllFacultyDirectory() {
  const facultyMap = new Map();

  // Helper to ensure faculty entry exists
  const getOrCreate = (name, phone = "") => {
    const clean = cleanName(name);
    if (!clean || clean.length < 2) return null;

    if (!facultyMap.has(clean)) {
      // Generate deterministic cabin number if not in KNOWN_CABINS
      let cabin = KNOWN_CABINS[clean];
      if (!cabin) {
        let hash = 0;
        for (let i = 0; i < clean.length; i++) hash = (hash << 5) - hash + clean.charCodeAt(i);
        const cabinNum = 301 + (Math.abs(hash) % 40);
        cabin = `Cabin N-${cabinNum}, ${cabinNum < 320 ? "3rd" : "4th"} Floor, N-Block (CSE Dept)`;
      }

      facultyMap.set(clean, {
        id: "fac_" + clean.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        name: clean,
        phone: phone || "+919000443503",
        cabin,
        department: "Department of Computer Science & Engineering (VFSTR)",
        subjects: new Set(),
        sections: new Set(),
        sectionNums: new Set(),
        schedule: {
          Monday: {},
          Tuesday: {},
          Wednesday: {},
          Thursday: {},
          Friday: {},
          Saturday: {}
        }
      });
    }

    const record = facultyMap.get(clean);
    if (phone && (!record.phone || record.phone === "+919000443503")) {
      record.phone = phone;
    }
    return record;
  };

  // 1. Ingest all Section Timetables
  Object.entries(ALL_SECTION_TIMETABLES).forEach(([secNumStr, secData]) => {
    const secNum = parseInt(secNumStr, 10);
    const secName = secData.sectionName || `Section ${secNum}`;
    const secRoom = secData.room || `Room N-40${secNum}`;

    // Section Class Teacher
    if (secData.classTeacher?.name) {
      const ct = getOrCreate(secData.classTeacher.name, secData.classTeacher.phone);
      if (ct) {
        ct.sections.add(secName);
        ct.sectionNums.add(secNum);
        ct.isClassTeacher = true;
        ct.classTeacherSection = secName;
      }
    }

    // Section faculties dictionary
    if (secData.faculties) {
      Object.entries(secData.faculties).forEach(([sKey, facInfo]) => {
        if (!facInfo || !facInfo.name || sKey === "OTHER") return;
        const facNames = facInfo.name.split(/[,/]/).map(cleanName).filter((n) => n.length > 2);
        facNames.forEach((name) => {
          const facRecord = getOrCreate(name, facInfo.phone);
          if (facRecord) {
            if (facInfo.subjectTitle) facRecord.subjects.add(facInfo.subjectTitle);
            facRecord.sections.add(secName);
            facRecord.sectionNums.add(secNum);
          }
        });
      });
    }

    // Timetable periods
    if (secData.timetable) {
      Object.entries(secData.timetable).forEach(([day, periods]) => {
        if (!periods) return;
        Object.entries(periods).forEach(([pNum, pInfo]) => {
          if (!pInfo || !pInfo.faculty) return;
          const facNames = pInfo.faculty.split(/[,/]/).map(cleanName).filter((n) => n.length > 2);
          facNames.forEach((name) => {
            const facRecord = getOrCreate(name, pInfo.phone);
            if (facRecord) {
              if (pInfo.subject) facRecord.subjects.add(pInfo.subject);
              facRecord.sections.add(secName);
              facRecord.sectionNums.add(secNum);

              if (!facRecord.schedule[day]) {
                facRecord.schedule[day] = {};
              }

              // Specific room or section room
              const room = pInfo.room || secRoom;

              facRecord.schedule[day][pNum] = {
                period: pNum,
                time: pInfo.time || getSlotTime(pNum),
                subject: pInfo.subject || "Academic Class",
                subjectKey: pInfo.subjectKey || sKeyFromSubject(pInfo.subject),
                room: room.startsWith("Room") || room.startsWith("PC") ? room : `Room ${room}`,
                section: secName,
                sectionNum: secNum
              };
            }
          });
        });
      });
    }
  });

  // 2. Ingest Counsellors from sections_meta if not already present
  if (SECTIONS_META && Array.isArray(SECTIONS_META.sections)) {
    SECTIONS_META.sections.forEach((sec) => {
      if (Array.isArray(sec.counsellors)) {
        sec.counsellors.forEach((cName) => {
          const rec = getOrCreate(cName);
          if (rec) {
            rec.sections.add(sec.section);
            rec.sectionNums.add(sec.sectionNum);
            rec.isCounsellor = true;
          }
        });
      }
    });
  }

  // Format array sorted alphabetically
  const result = Array.from(facultyMap.values()).map((f) => ({
    ...f,
    subjectsList: Array.from(f.subjects),
    sectionsList: Array.from(f.sections).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, "") || "0", 10);
      const nb = parseInt(b.replace(/\D/g, "") || "0", 10);
      return na - nb;
    }),
    sectionNumsList: Array.from(f.sectionNums)
  }));

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function sKeyFromSubject(subj = "") {
  const upper = subj.toUpperCase();
  if (upper.includes("ML") || upper.includes("MACHINE")) return "ML";
  if (upper.includes("CN") || upper.includes("NETWORK")) return "CN";
  if (upper.includes("MFEF") || upper.includes("FRONT-END")) return "MFEF";
  if (upper.includes("OT") || upper.includes("OPTIMIZATION")) return "OT";
  if (upper.includes("CE") || upper.includes("ETHICS")) return "CE";
  if (upper.includes("CC") || upper.includes("COMPETITIVE")) return "CC";
  if (upper.includes("TRAIN")) return "TRAINING";
  if (upper.includes("PC LAB") || upper.includes("PCLAB")) return "PC_LAB";
  if (upper.includes("NPTEL")) return "NPTEL";
  return "CLASS";
}

export function getSlotTime(periodNum) {
  const slot = PERIOD_TIME_SLOTS.find((s) => s.period === String(periodNum));
  return slot ? slot.time : "";
}

/**
 * Period timetable timing breakdown in minutes from midnight
 */
export const COLLEGE_PERIOD_INTERVALS = [
  { period: "1", label: "Period 1", startMin: 8 * 60 + 15, endMin: 9 * 60 + 5, time: "8.15 - 9.05 AM" },
  { period: "2", label: "Period 2", startMin: 9 * 60 + 5, endMin: 9 * 60 + 55, time: "9.05 - 9.55 AM" },
  { period: "3", label: "Period 3", startMin: 9 * 60 + 55, endMin: 10 * 60 + 45, time: "9.55 - 10.45 AM" },
  { type: "BREAK", label: "Morning Tea Break", startMin: 10 * 60 + 45, endMin: 11 * 60, time: "10.45 - 11.00 AM" },
  { period: "4", label: "Period 4", startMin: 11 * 60, endMin: 11 * 60 + 50, time: "11.00 - 11.50 AM" },
  { period: "5", label: "Period 5", startMin: 11 * 60 + 50, endMin: 12 * 60 + 40, time: "11.50 - 12.40 PM" },
  { type: "LUNCH", label: "Lunch Break", startMin: 12 * 60 + 40, endMin: 13 * 60 + 30, time: "12.40 - 1.30 PM" },
  { period: "6", label: "Period 6", startMin: 13 * 60 + 30, endMin: 14 * 60 + 20, time: "1.30 - 2.20 PM" },
  { period: "7", label: "Period 7", startMin: 14 * 60 + 20, endMin: 15 * 60 + 10, time: "2.20 - 3.10 PM" },
  { period: "8", label: "Period 8", startMin: 15 * 60 + 10, endMin: 16 * 60, time: "3.10 - 4.00 PM" }
];

/**
 * Computes the real-time live location or simulated location of a faculty member
 *
 * @param {Object} faculty - Faculty record from getAllFacultyDirectory()
 * @param {string|Date} [targetDate] - Optional date or day name
 * @param {string|null} [forcedPeriod] - Optional period number "1".."8" (for simulator mode)
 */
export function getFacultyCurrentLocation(faculty, targetDate = new Date(), forcedPeriod = null) {
  if (!faculty) return null;

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let dayName = "Monday";
  let targetMinutes = 9 * 60 + 30; // default to 9:30 AM
  let isSunday = false;

  if (typeof targetDate === "string" && daysOfWeek.includes(targetDate)) {
    dayName = targetDate;
    if (dayName === "Sunday") isSunday = true;
  } else {
    const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
    if (!isNaN(d.getTime())) {
      dayName = daysOfWeek[d.getDay()];
      targetMinutes = d.getHours() * 60 + d.getMinutes();
      if (d.getDay() === 0) isSunday = true;
    }
  }

  // Sunday Handling
  if (isSunday) {
    return {
      status: "HOLIDAY",
      statusBadge: "Sunday / Campus Holiday",
      statusColor: "#64748b",
      location: "Off Campus",
      locationDetails: "Sunday is an institutional holiday. No scheduled classes today.",
      room: "Off Campus",
      inClass: false,
      currentSlot: null,
      dayName: "Sunday",
      cabin: faculty.cabin,
      nextClassText: "Academic classes resume Monday at 8:15 AM."
    };
  }

  const daySchedule = faculty.schedule?.[dayName] || {};

  // If user forced a specific period (e.g. from the Period simulator dropdown)
  if (forcedPeriod && forcedPeriod !== "LIVE") {
    const pStr = String(forcedPeriod);
    const pSlot = COLLEGE_PERIOD_INTERVALS.find((i) => i.period === pStr);
    const classSession = daySchedule[pStr];

    if (classSession) {
      return {
        status: "IN_CLASS",
        statusBadge: `In Class • ${classSession.room}`,
        statusColor: "#10b981",
        location: classSession.room,
        locationDetails: `Teaching ${classSession.subject} to ${classSession.section}`,
        room: classSession.room,
        section: classSession.section,
        subject: classSession.subject,
        period: pStr,
        time: classSession.time || pSlot?.time,
        inClass: true,
        currentSlot: classSession,
        dayName,
        cabin: faculty.cabin,
        nextClassText: getNextClassDescription(daySchedule, parseInt(pStr, 10))
      };
    } else {
      return {
        status: "IN_CABIN",
        statusBadge: `In Cabin / Free Period`,
        statusColor: "#2563eb",
        location: faculty.cabin,
        locationDetails: `Free Period during Period ${pStr} (${pSlot?.time || ""}) • Available in cabin`,
        room: faculty.cabin,
        period: pStr,
        time: pSlot?.time,
        inClass: false,
        currentSlot: null,
        dayName,
        cabin: faculty.cabin,
        nextClassText: getNextClassDescription(daySchedule, parseInt(pStr, 10))
      };
    }
  }

  // Real-time Live Location evaluation based on targetMinutes
  const collegeStart = 8 * 60 + 15; // 8:15 AM
  const collegeEnd = 16 * 60; // 4:00 PM

  // Before College Hours
  if (targetMinutes < collegeStart) {
    const firstClass = getNextClassDescription(daySchedule, 0);
    return {
      status: "BEFORE_COLLEGE",
      statusBadge: "Before College Hours (Starts 8:15 AM)",
      statusColor: "#8b5cf6",
      location: faculty.cabin,
      locationDetails: `College hours begin at 8:15 AM. Faculty will be available in ${faculty.cabin}`,
      room: faculty.cabin,
      inClass: false,
      currentSlot: null,
      dayName,
      cabin: faculty.cabin,
      nextClassText: firstClass
    };
  }

  // After College Hours
  if (targetMinutes >= collegeEnd) {
    return {
      status: "AFTER_COLLEGE",
      statusBadge: "Classes Concluded for Today (4:00 PM)",
      statusColor: "#64748b",
      location: faculty.cabin,
      locationDetails: `Daily class schedule ended at 4:00 PM. Faculty may be working in ${faculty.cabin} or Research Lab.`,
      room: faculty.cabin,
      inClass: false,
      currentSlot: null,
      dayName,
      cabin: faculty.cabin,
      nextClassText: "Classes resume tomorrow morning at 8:15 AM."
    };
  }

  // During College Hours: Check which interval we are currently in
  const currentInterval = COLLEGE_PERIOD_INTERVALS.find(
    (inv) => targetMinutes >= inv.startMin && targetMinutes < inv.endMin
  );

  if (currentInterval?.type === "BREAK") {
    return {
      status: "BREAK",
      statusBadge: "Morning Tea Break (10:45 - 11:00 AM)",
      statusColor: "#f59e0b",
      location: faculty.cabin,
      locationDetails: `Break time (10:45 AM - 11:00 AM). Likely in ${faculty.cabin} or department staff lounge.`,
      room: faculty.cabin,
      inClass: false,
      currentSlot: null,
      dayName,
      cabin: faculty.cabin,
      nextClassText: getNextClassDescription(daySchedule, 3)
    };
  }

  if (currentInterval?.type === "LUNCH") {
    return {
      status: "LUNCH",
      statusBadge: "Lunch Break (12:40 - 1:30 PM)",
      statusColor: "#f59e0b",
      location: "Faculty Dining / Cabin",
      locationDetails: `Lunch break (12:40 PM - 1:30 PM). Classes resume at 1:30 PM (Period 6).`,
      room: faculty.cabin,
      inClass: false,
      currentSlot: null,
      dayName,
      cabin: faculty.cabin,
      nextClassText: getNextClassDescription(daySchedule, 5)
    };
  }

  if (currentInterval?.period) {
    const pNum = currentInterval.period;
    const classSession = daySchedule[pNum];
    const minsRemaining = currentInterval.endMin - targetMinutes;

    if (classSession) {
      return {
        status: "IN_CLASS",
        statusBadge: `Currently in Class • ${classSession.room}`,
        statusColor: "#10b981",
        location: classSession.room,
        locationDetails: `Teaching ${classSession.subject} to ${classSession.section}`,
        room: classSession.room,
        section: classSession.section,
        subject: classSession.subject,
        period: pNum,
        time: classSession.time || currentInterval.time,
        minutesRemaining: minsRemaining > 0 ? minsRemaining : 0,
        inClass: true,
        currentSlot: classSession,
        dayName,
        cabin: faculty.cabin,
        nextClassText: getNextClassDescription(daySchedule, parseInt(pNum, 10))
      };
    } else {
      return {
        status: "IN_CABIN",
        statusBadge: `Free Period • In Faculty Cabin`,
        statusColor: "#2563eb",
        location: faculty.cabin,
        locationDetails: `No teaching period assigned for Period ${pNum} (${currentInterval.time}) • Available to meet in cabin`,
        room: faculty.cabin,
        period: pNum,
        time: currentInterval.time,
        minutesRemaining: minsRemaining > 0 ? minsRemaining : 0,
        inClass: false,
        currentSlot: null,
        dayName,
        cabin: faculty.cabin,
        nextClassText: getNextClassDescription(daySchedule, parseInt(pNum, 10))
      };
    }
  }

  // Fallback
  return {
    status: "IN_CABIN",
    statusBadge: "Available in Cabin",
    statusColor: "#2563eb",
    location: faculty.cabin,
    locationDetails: `Available in ${faculty.cabin}`,
    room: faculty.cabin,
    inClass: false,
    currentSlot: null,
    dayName,
    cabin: faculty.cabin,
    nextClassText: "No further scheduled classes for today."
  };
}

function getNextClassDescription(daySchedule = {}, afterPeriodNum = 0) {
  for (let p = afterPeriodNum + 1; p <= 8; p++) {
    const nextSession = daySchedule[String(p)];
    if (nextSession) {
      const slotTime = getSlotTime(p);
      return `Next Class: Period ${p} (${slotTime}) in ${nextSession.section} [${nextSession.room}] for ${nextSession.subject}`;
    }
  }
  return "No further classes scheduled for today. Free for remainder of the day in cabin.";
}
