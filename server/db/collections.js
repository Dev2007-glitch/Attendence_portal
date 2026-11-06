/**
 * VFSTR CSE Attendance Portal V2.4
 * Master Collections Constants
 */

export const DB_NAME = "VFSTR_CSE_Attendance_DB";

export const COLLECTIONS = {
  // A. Identity and User Management
  USERS: "users",
  STUDENTS: "students",
  STUDENT_PROFILES: "student_profiles",
  FACULTY: "faculty",
  FACULTY_PROFILES: "faculty_profiles",
  COUNSELLORS: "counsellors",
  ADMINS: "admins",
  USER_ROLES: "user_roles",
  USER_PERMISSIONS: "user_permissions",
  USER_PREFERENCES: "user_preferences",

  // B. Authentication and Security
  LOGIN_HISTORY: "login_history",
  LOGOUT_HISTORY: "logout_history",
  ACTIVE_SESSIONS: "active_sessions",
  SECURITY_EVENTS: "security_events",

  // C. Attendance Management
  ATTENDANCE_SESSIONS: "attendance_sessions",
  ATTENDANCE_RECORDS: "attendance_records",
  ATTENDANCE_SUBMISSIONS: "attendance_submissions",
  ATTENDANCE_APPROVALS: "attendance_approvals",
  ATTENDANCE_REJECTIONS: "attendance_rejections",
  ATTENDANCE_CORRECTIONS: "attendance_corrections",
  ATTENDANCE_EDIT_HISTORY: "attendance_edit_history",
  ATTENDANCE_DAILY_SUMMARY: "attendance_daily_summary",

  // D. Academic Management
  DEPARTMENTS: "departments",
  CLASS_SECTIONS: "class_sections",
  COURSES: "courses",
  TIMETABLES: "timetables",
  STUDENT_ENROLLMENTS: "student_enrollments",

  // E. Counsellor Management
  OD_APPLICATIONS: "od_applications",
  COUNSELLING_RECORDS: "counselling_records",
  COUNSELLING_NOTES: "counselling_notes",
  COUNSELLING_ACTIONS: "counselling_actions",

  // F. Admin Management
  ADMIN_ACTIONS: "admin_actions",
  ADMIN_SETTINGS: "admin_settings",

  // G. Search and Filter
  SEARCH_ACTIVITY: "search_activity",
  STUDENT_SEARCH_HISTORY: "student_search_history",
  FACULTY_SEARCH_HISTORY: "faculty_search_history",

  // H. Notifications & Emails
  NOTIFICATIONS: "notifications",
  NOTIFICATION_DELIVERY_LOGS: "notification_delivery_logs",
  SYNCED_INBOXES: "synced_inboxes",

  // I. File and Document Management
  UPLOADED_FILES: "uploaded_files",
  FILE_METADATA: "file_metadata",
  FILE_DOWNLOAD_HISTORY: "file_download_history",
  GENERATED_REPORTS: "generated_reports",

  // J. Audit and Event Trail
  AUDIT_LOGS: "audit_logs",
  ACTIVITY_LOGS: "activity_logs",

  // K. Calendar & Notes
  CALENDAR_NOTES: "calendar_notes",
  CALENDAR_REMINDERS: "calendar_reminders",

  // L. Application Configuration & Backups
  APPLICATION_SETTINGS: "application_settings",
  DATABASE_MIGRATION_HISTORY: "database_migration_history",
  DATABASE_BACKUPS: "database_backups"
};

