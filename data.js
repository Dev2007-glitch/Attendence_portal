/**
 * Attendance Portal - Student Roster & Sections Data
 * Official VFSTR Vadlamudi: B.Tech Computer Science & Engineering, III Year - I Semester
 * Total: 1,511 Students across 22 Sections
 */

import allStudentsRaw from "./src/data/all_students.js";
import sectionsMetaRaw from "./src/data/sections_meta.js";

export const ALL_STUDENTS = allStudentsRaw;
export const SECTIONS = sectionsMetaRaw.sections;
export const COUNSELLORS = sectionsMetaRaw.counsellors;

// Backward-compatibility: Section 1 Students (72 students)
export const INITIAL_STUDENTS = ALL_STUDENTS.filter(
  (s) => s.sectionNum === 1 || s.section === "Section 1"
);

// Helper function to get students by section number or section string
export function getStudentsBySection(sectionKey) {
  if (!sectionKey || sectionKey === "ALL") return ALL_STUDENTS;
  const num = typeof sectionKey === "number" ? sectionKey : parseInt(String(sectionKey).replace(/\D/g, ""), 10);
  if (!num || isNaN(num)) return ALL_STUDENTS;
  return ALL_STUDENTS.filter((s) => s.sectionNum === num);
}

// Helper function to get students by counsellor
export function getStudentsByCounsellor(counsellorName) {
  if (!counsellorName || counsellorName === "ALL") return ALL_STUDENTS;
  const q = counsellorName.toLowerCase().trim();
  return ALL_STUDENTS.filter((s) => s.counsellor && s.counsellor.toLowerCase().includes(q));
}

export const DEFAULT_SETTINGS = {
  institution: "VFSTR :: Vadlamudi",
  program: "B.Tech, Computer Science & Engineering, III Year - I Semester",
  courseCode: "21CS204",
  courseName: "Design & Analysis of Algorithms",
  academicYear: "2026-2027",
  semester: "III Year - 5th Semester",
  section: "Section 1",
  soundEnabled: true,
  theme: "light"
};

export default INITIAL_STUDENTS;
