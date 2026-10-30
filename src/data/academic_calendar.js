/**
 * Official VFSTR Vadlamudi Academic Calendar 2026-27
 * Bachelor of Technology - AGE 2nd, 3rd & 4th Year :: Semester - I
 * Release date: 03-Jun-2026
 * Approved by: Asst. Dean-AAA, HoD (04/06/2026), Dean-AAA&FA
 */

export const ACADEMIC_SEMESTER_INFO = {
  institution: "Vignan's Foundation for Science, Technology and Research :: Vadlamudi",
  program: "Bachelor of Technology - AGE 2nd, 3rd & 4th Year",
  academicYear: "2026-27",
  semester: "Semester - I",
  releaseDate: "03-Jun-2026",
  startDate: "2026-07-05",
  endDate: "2026-12-19",
  totalWeeks: 24
};

// Official Academic Calendar Events from Document (with exact categories & colors)
// Colors match document:
// - cyan: Commencement of Module
// - green: Formative Assessments (FA-1, FA-2)
// - orange: Holidays & Festivals
// - yellow: Preparation & Summative Assessment (P-Based)
// - purple: Summative Assessment (L-Based)
export const OFFICIAL_CALENDAR_EVENTS = [
  // Module 1 Commencement
  {
    date: "2026-07-10",
    title: "Commencement of Module-1 (I-Sem)",
    category: "COMMENCEMENT",
    color: "cyan",
    badge: "MODULE-1",
    description: "Official start of Module-1 classwork and laboratory sessions for Semester-I.",
    isImportant: true,
    week: 1
  },

  // Module 1 FA-1
  {
    date: "2026-08-05",
    title: "M-1 FA-1 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-1 EXAM",
    description: "Formative Assessment-1 for Module-1 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 5
  },
  {
    date: "2026-08-06",
    title: "M-1 FA-1 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-1 EXAM",
    description: "Formative Assessment-1 for Module-1 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 5
  },

  // Independence Day Holiday
  {
    date: "2026-08-15",
    title: "Independence Day Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "NATIONAL HOLIDAY",
    description: "National Holiday - Independence Day Celebrations at VFSTR Campus.",
    isImportant: true,
    week: 6
  },

  // Milad-un-Nabi Holiday
  {
    date: "2026-08-25",
    title: "Milad-un-Nabi Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "HOLIDAY",
    description: "University Holiday on occasion of Milad-un-Nabi.",
    isImportant: true,
    week: 8
  },

  // Module 1 FA-2 & Krishnashtami
  {
    date: "2026-09-03",
    title: "M-1 FA-2 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-2 EXAM",
    description: "Formative Assessment-2 for Module-1 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 9
  },
  {
    date: "2026-09-04",
    title: "Krishnashtami Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "FESTIVAL HOLIDAY",
    description: "University Holiday on occasion of Krishnashtami.",
    isImportant: true,
    week: 9
  },
  {
    date: "2026-09-05",
    title: "M-1 FA-2 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-2 EXAM",
    description: "Formative Assessment-2 for Module-1 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 9
  },
  {
    date: "2026-09-07",
    title: "M-1 FA-2 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-2 EXAM",
    description: "Formative Assessment-2 for Module-1 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 10
  },

  // Module 2 Commencement
  {
    date: "2026-09-08",
    title: "Commencement of Module-2",
    category: "COMMENCEMENT",
    color: "cyan",
    badge: "MODULE-2",
    description: "Official start of Module-2 curriculum, project allocations, and classwork.",
    isImportant: true,
    week: 10
  },

  // Vinayaka Chavathi Holiday
  {
    date: "2026-09-14",
    title: "Vinayaka Chavathi Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "FESTIVAL HOLIDAY",
    description: "University Holiday on occasion of Vinayaka Chavathi.",
    isImportant: true,
    week: 11
  },

  // Gandhi Jayanthi Holiday
  {
    date: "2026-10-02",
    title: "Gandhi Jayanthi Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "NATIONAL HOLIDAY",
    description: "National Holiday - Mahatma Gandhi Jayanthi.",
    isImportant: true,
    week: 13
  },

  // Module 2 FA-1
  {
    date: "2026-10-06",
    title: "M-2 FA-1 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-1 EXAM",
    description: "Formative Assessment-1 for Module-2 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 14
  },
  {
    date: "2026-10-07",
    title: "M-2 FA-1 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-1 EXAM",
    description: "Formative Assessment-1 for Module-2 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 14
  },
  {
    date: "2026-10-08",
    title: "M-2 FA-1 (2nd)",
    category: "EXAM",
    color: "green",
    badge: "FA-1 EXAM",
    description: "Formative Assessment-1 for Module-2 (2nd Year B.Tech).",
    isImportant: true,
    week: 14
  },

  // Dasara Holidays
  {
    date: "2026-10-18",
    title: "Durgaastami Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "DASARA VACATION",
    description: "University Holiday on Durgaastami.",
    isImportant: true,
    week: 16
  },
  {
    date: "2026-10-19",
    title: "Dasara Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "DASARA VACATION",
    description: "Dasara Vacation Holiday.",
    isImportant: true,
    week: 16
  },
  {
    date: "2026-10-20",
    title: "Vijaya Dasami Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "DASARA VACATION",
    description: "University Holiday on Vijaya Dasami.",
    isImportant: true,
    week: 16
  },
  {
    date: "2026-10-21",
    title: "Dasara Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "DASARA VACATION",
    description: "Dasara Vacation Holiday.",
    isImportant: true,
    week: 16
  },

  // Deepavali Holiday
  {
    date: "2026-11-08",
    title: "Deepavali Holiday",
    category: "HOLIDAY",
    color: "orange",
    badge: "FESTIVAL HOLIDAY",
    description: "University Festival Holiday on occasion of Deepavali.",
    isImportant: true,
    week: 19
  },

  // Module 2 FA-2
  {
    date: "2026-11-11",
    title: "M-2 FA-2 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-2 EXAM",
    description: "Formative Assessment-2 for Module-2 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 19
  },
  {
    date: "2026-11-12",
    title: "M-2 FA-2 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-2 EXAM",
    description: "Formative Assessment-2 for Module-2 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 19
  },
  {
    date: "2026-11-13",
    title: "M-2 FA-2 (2nd & 3rd)",
    category: "EXAM",
    color: "green",
    badge: "FA-2 EXAM",
    description: "Formative Assessment-2 for Module-2 (2nd and 3rd Year B.Tech).",
    isImportant: true,
    week: 19
  },

  // Preparation & Summative Assessment (P-Based)
  {
    date: "2026-11-14",
    title: "Preparation & Summative Assessment (P-Based)",
    category: "ASSESSMENT",
    color: "yellow",
    badge: "P-BASED ASSESSMENT",
    description: "Practical / Project Preparation & Summative Assessment evaluations.",
    isImportant: true,
    week: 19
  },
  {
    date: "2026-11-16",
    title: "Preparation & Summative Assessment (P-Based)",
    category: "ASSESSMENT",
    color: "yellow",
    badge: "P-BASED ASSESSMENT",
    description: "Practical / Project Preparation & Summative Assessment evaluations.",
    isImportant: true,
    week: 20
  },
  {
    date: "2026-11-17",
    title: "Preparation & Summative Assessment (P-Based)",
    category: "ASSESSMENT",
    color: "yellow",
    badge: "P-BASED ASSESSMENT",
    description: "Practical / Project Preparation & Summative Assessment evaluations.",
    isImportant: true,
    week: 20
  },
  {
    date: "2026-11-18",
    title: "Preparation & Summative Assessment (P-Based)",
    category: "ASSESSMENT",
    color: "yellow",
    badge: "P-BASED ASSESSMENT",
    description: "Practical / Project Preparation & Summative Assessment evaluations.",
    isImportant: true,
    week: 20
  },
  {
    date: "2026-11-19",
    title: "Preparation & Summative Assessment (P-Based)",
    category: "ASSESSMENT",
    color: "yellow",
    badge: "P-BASED ASSESSMENT",
    description: "Practical / Project Preparation & Summative Assessment evaluations.",
    isImportant: true,
    week: 20
  },
  {
    date: "2026-11-20",
    title: "Preparation & Summative Assessment (P-Based)",
    category: "ASSESSMENT",
    color: "yellow",
    badge: "P-BASED ASSESSMENT",
    description: "Practical / Project Preparation & Summative Assessment evaluations.",
    isImportant: true,
    week: 20
  },

  // Summative Assessment (L-Based)
  {
    date: "2026-11-21",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Laboratory & Theory Summative Assessment (Semester End Examinations).",
    isImportant: true,
    week: 20
  },
  {
    date: "2026-11-23",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 21
  },
  {
    date: "2026-11-24",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 21
  },
  {
    date: "2026-11-25",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 21
  },
  {
    date: "2026-11-26",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 21
  },
  {
    date: "2026-11-27",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 21
  },
  {
    date: "2026-11-28",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 21
  },
  {
    date: "2026-11-30",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 22
  },
  {
    date: "2026-12-01",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 22
  },
  {
    date: "2026-12-02",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 22
  },
  {
    date: "2026-12-03",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 22
  },
  {
    date: "2026-12-04",
    title: "Summative Assessment (L-Based)",
    category: "SUMMATIVE",
    color: "purple",
    badge: "SEMESTER END EXAM",
    description: "Semester End Examinations - Summative Assessment (L-Based).",
    isImportant: true,
    week: 22
  },

  // Semester II Commencement
  {
    date: "2026-12-14",
    title: "Commencement of II Semester",
    category: "COMMENCEMENT",
    color: "cyan",
    badge: "SEMESTER-II",
    description: "Official re-opening and commencement of Semester-II classwork.",
    isImportant: true,
    week: 24
  }
];

// 24 Weeks Schema Structure matching the exact PDF/image grid table
export const ACADEMIC_WEEKS_TABLE = [
  { week: 1, sun: "5-Jul", mon: "6-Jul", tue: "7-Jul", wed: "8-Jul", thu: "9-Jul", fri: "10-Jul (Commencement M-1)", sat: "11-Jul" },
  { week: 2, sun: "12-Jul", mon: "13-Jul", tue: "14-Jul", wed: "15-Jul", thu: "16-Jul", fri: "17-Jul", sat: "18-Jul" },
  { week: 3, sun: "19-Jul", mon: "20-Jul", tue: "21-Jul", wed: "22-Jul", thu: "23-Jul", fri: "24-Jul", sat: "25-Jul" },
  { week: 4, sun: "26-Jul", mon: "27-Jul", tue: "28-Jul", wed: "29-Jul", thu: "30-Jul", fri: "31-Jul", sat: "1-Aug" },
  { week: 5, sun: "2-Aug", mon: "3-Aug", tue: "4-Aug", wed: "5-Aug (M-1 FA-1)", thu: "6-Aug (M-1 FA-1)", fri: "7-Aug", sat: "8-Aug" },
  { week: 6, sun: "9-Aug", mon: "10-Aug", tue: "11-Aug", wed: "12-Aug", thu: "13-Aug", fri: "14-Aug", sat: "15-Aug (Independence Day)" },
  { week: 7, sun: "16-Aug", mon: "17-Aug", tue: "18-Aug", wed: "19-Aug", thu: "20-Aug", fri: "21-Aug", sat: "22-Aug" },
  { week: 8, sun: "23-Aug", mon: "24-Aug", tue: "25-Aug (Milad-un-Nabi)", wed: "26-Aug", thu: "27-Aug", fri: "28-Aug", sat: "29-Aug" },
  { week: 9, sun: "30-Aug", mon: "31-Aug", tue: "1-Sep", wed: "2-Sep", thu: "3-Sep (M-1 FA-2)", fri: "4-Sep (Krishnashtami)", sat: "5-Sep (M-1 FA-2)" },
  { week: 10, sun: "6-Sep", mon: "7-Sep (M-1 FA-2)", tue: "8-Sep (Commencement M-2)", wed: "9-Sep", thu: "10-Sep", fri: "11-Sep", sat: "12-Sep" },
  { week: 11, sun: "13-Sep", mon: "14-Sep (Vinayaka Chavathi)", tue: "15-Sep", wed: "16-Sep", thu: "17-Sep", fri: "18-Sep", sat: "19-Sep" },
  { week: 12, sun: "20-Sep", mon: "21-Sep", tue: "22-Sep", wed: "23-Sep", thu: "24-Sep", fri: "25-Sep", sat: "26-Sep" },
  { week: 13, sun: "27-Sep", mon: "28-Sep", tue: "29-Sep", wed: "30-Sep", thu: "1-Oct", fri: "2-Oct (Gandhi Jayanthi)", sat: "3-Oct" },
  { week: 14, sun: "4-Oct", mon: "5-Oct", tue: "6-Oct (M-2 FA-1)", wed: "7-Oct (M-2 FA-1)", thu: "8-Oct (M-2 FA-1)", fri: "9-Oct", sat: "10-Oct" },
  { week: 15, sun: "11-Oct", mon: "12-Oct", tue: "13-Oct", wed: "14-Oct", thu: "15-Oct", fri: "16-Oct", sat: "17-Oct" },
  { week: 16, sun: "18-Oct (Durgastami)", mon: "19-Oct (Dasara)", tue: "20-Oct (Vijaya Dasami)", wed: "21-Oct (Dasara)", thu: "22-Oct", fri: "23-Oct", sat: "24-Oct" },
  { week: 17, sun: "25-Oct", mon: "26-Oct", tue: "27-Oct", wed: "28-Oct", thu: "29-Oct", fri: "30-Oct", sat: "31-Oct" },
  { week: 18, sun: "1-Nov", mon: "2-Nov", tue: "3-Nov", wed: "4-Nov", thu: "5-Nov", fri: "6-Nov", sat: "7-Nov" },
  { week: 19, sun: "8-Nov (Deepavali)", mon: "9-Nov", tue: "10-Nov", wed: "11-Nov (M-2 FA-2)", thu: "12-Nov (M-2 FA-2)", fri: "13-Nov (M-2 FA-2)", sat: "14-Nov (P-Based Assessment)" },
  { week: 20, sun: "15-Nov", mon: "16-Nov (P-Based)", tue: "17-Nov (P-Based)", wed: "18-Nov (P-Based)", thu: "19-Nov (P-Based)", fri: "20-Nov (P-Based)", sat: "21-Nov (L-Based Summative)" },
  { week: 21, sun: "22-Nov", mon: "23-Nov (L-Based)", tue: "24-Nov (L-Based)", wed: "25-Nov (L-Based)", thu: "26-Nov (L-Based)", fri: "27-Nov (L-Based)", sat: "28-Nov (L-Based Summative)" },
  { week: 22, sun: "29-Nov", mon: "30-Nov (L-Based)", tue: "1-Dec (L-Based)", wed: "2-Dec (L-Based)", thu: "3-Dec (L-Based)", fri: "4-Dec (L-Based)", sat: "5-Dec" },
  { week: 23, sun: "6-Dec", mon: "7-Dec", tue: "8-Dec", wed: "9-Dec", thu: "10-Dec", fri: "11-Dec", sat: "12-Dec" },
  { week: 24, sun: "13-Dec", mon: "14-Dec (Commencement II-Sem)", tue: "15-Dec", wed: "16-Dec", thu: "17-Dec", fri: "18-Dec", sat: "19-Dec" }
];

export function getEventsForDate(dateStr) {
  return OFFICIAL_CALENDAR_EVENTS.filter((e) => e.date === dateStr);
}

export function getCalendarMonthData(year, monthIndex) {
  // Returns days array for given month
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = [];

  // Padding days from previous month
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      month: monthIndex - 1,
      year: monthIndex === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(monthIndex + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    const dateEvents = getEventsForDate(dateStr);
    days.push({
      day: d,
      month: monthIndex,
      year,
      dateStr,
      isCurrentMonth: true,
      events: dateEvents
    });
  }

  // Trailing days from next month
  const remaining = 42 - days.length; // 6 rows of 7
  for (let n = 1; n <= remaining; n++) {
    days.push({
      day: n,
      month: monthIndex + 1,
      year: monthIndex === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  return days;
}

export const CALENDAR_COLOR_SCHEME = {
  cyan: { label: "Commencement of Module", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  green: { label: "Formative Assessment (FA-1 / FA-2)", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  orange: { label: "Holidays & Festivals", bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
  yellow: { label: "Preparation & Summative (P-Based)", bg: "#fef9c3", color: "#854d0e", border: "#fef08a" },
  purple: { label: "Summative Assessment (L-Based)", bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff" }
};
