import React, { useState } from "react";
import { generateWhatsAppMessage, openWhatsAppChat } from "../utils/whatsapp";

export default function SubmissionSummary({
  summaryRef,
  date,
  period,
  subject,
  section,
  facultyName,
  facultyPhone,
  students,
  attendance,
  onToggleStudent,
  onShowToast
}) {
  const [showPresentList, setShowPresentList] = useState(false);

  const total = students.length;
  const presentStudents = students.filter((s) => attendance[s.roll] === "present");
  const absentStudents = students.filter((s) => attendance[s.roll] === "absent");
  const presentCount = presentStudents.length;
  const absentCount = absentStudents.length;
  const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : "0.0";

  // SVG circular gauge calculation
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (parseFloat(percentage) / 100) * circumference;

  // Formatted absentee string
  const absentRollNumbers = absentStudents.map((s) => s.roll).join(", ");
  const formattedDate = date && date.includes("-") ? date.split("-").reverse().join("-") : date;

  // Complete WhatsApp message
  const fullWhatsAppMessage = generateWhatsAppMessage({
    date,
    period,
    subject,
    section,
    facultyName,
    total,
    presentCount,
    absentCount,
    absentStudents
  });

  // Recipient email addresses for all absentees: vu.<roll>@gmail.com
  const recipientEmailsList = absentStudents.map((s) => `vu.${s.roll.toLowerCase()}@gmail.com`);
  const recipientEmailsString = recipientEmailsList.join(", ");

  // Handle Send WhatsApp directly to WhatsApp Web (bypasses landing screen)
  const handleSendWhatsAppWeb = () => {
    if (!facultyPhone) {
      onShowToast("Please enter or select a Faculty WhatsApp number in the toolbar above!", "warning");
      return;
    }

    const { directWebUrl, cleanNumber, opened } = openWhatsAppChat({
      phone: facultyPhone,
      message: fullWhatsAppMessage,
      useDesktop: false
    });

    if (opened) {
      onShowToast(
        `Opening WhatsApp Web directly for ${facultyName || "Faculty"} (+${cleanNumber})!`,
        "success"
      );
    } else {
      window.location.href = directWebUrl;
    }
  };

  // Handle Send WhatsApp to installed desktop app
  const handleSendWhatsAppDesktop = () => {
    if (!facultyPhone) {
      onShowToast("Please enter or select a Faculty WhatsApp number in the toolbar above!", "warning");
      return;
    }
    const { desktopUrl } = openWhatsAppChat({
      phone: facultyPhone,
      message: fullWhatsAppMessage,
      useDesktop: true
    });
    window.location.href = desktopUrl;
    onShowToast("Opening WhatsApp Desktop application...", "info");
  };

  // Handle Send Real Email via Google Webmail directly
  const handleSendGmailDirect = () => {
    if (recipientEmailsList.length === 0) {
      onShowToast("All students are present! No absentee emails needed.", "info");
      return;
    }

    const subjectText = `[VFSTR Attendance Alert] Official Notice of Absence: Period ${period} (${subject || "Class"}) on ${formattedDate}`;
    const bodyText = `Dear Students,\n\nYou have been recorded as ABSENT for the following academic session at VFSTR (Vadlamudi):\n\n• Date: ${formattedDate}\n• Period: Period ${period}\n• Subject: ${subject || "Scheduled Class"}\n• Section: ${section || "CSE Section 1"}\n• Faculty: ${facultyName || "Course Faculty"} (${facultyPhone || "+919000443503"})\n\nATTENDANCE REGULATION NOTICE:\nUnder VFSTR University Academic Guidelines (R22 CBCS), every student must maintain a mandatory minimum of 75% aggregate attendance to remain eligible for Semester End Examinations (Summative Assessments).\n\nIf you have an approved Medical or On-Duty (OD) duty slip, please submit it to your Class Faculty or Counsellor within 48 hours.\n\nOffice of the Dean, Academic Affairs\nVignan's Foundation for Science, Technology and Research (VFSTR Vadlamudi)`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmailsList.join(","))}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;

    const win = window.open(gmailUrl, "_blank");
    if (win) {
      onShowToast(`Opening Google Gmail with ${recipientEmailsList.length} student inboxes (vu.<roll>@gmail.com)...`, "success");
    } else {
      window.location.href = `mailto:${recipientEmailsList.join(",")}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
    }
  };

  // Copy Student Email Addresses
  const handleCopyStudentEmails = () => {
    if (recipientEmailsList.length === 0) {
      onShowToast("No absent students to copy emails for.", "info");
      return;
    }
    navigator.clipboard.writeText(recipientEmailsString).then(
      () => {
        onShowToast(`Copied ${recipientEmailsList.length} student emails (vu.<roll>@gmail.com) to clipboard!`, "success");
      },
      () => {
        onShowToast("Unable to copy to clipboard", "warning");
      }
    );
  };

  // Copy Roll Numbers only
  const handleCopyRollsOnly = () => {
    const textToCopy = absentRollNumbers || "All Present (0 Absentees)";
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        onShowToast("Absent roll numbers copied to clipboard!", "success");
      },
      () => {
        onShowToast("Unable to copy to clipboard", "warning");
      }
    );
  };

  // Copy Full Message
  const handleCopyFullMessage = () => {
    navigator.clipboard.writeText(fullWhatsAppMessage).then(
      () => {
        onShowToast("Full WhatsApp Attendance Report copied to clipboard!", "success");
      },
      () => {
        onShowToast("Unable to copy to clipboard", "warning");
      }
    );
  };

  // 1. Styled Excel Export (.xls) with Absentees in Red and Presentees in Black
  const handleExportExcel = () => {
    let rowsHtml = "";
    students.forEach((s) => {
      const isAbsent = attendance[s.roll] === "absent";
      const status = isAbsent ? "Absent" : "Present";
      const statusColor = isAbsent ? "#dc2626" : "#000000";
      const fontWeight = isAbsent ? "bold" : "normal";
      const rowBg = isAbsent ? "#fff5f5" : "#ffffff";

      rowsHtml += `
        <tr style="background-color: ${rowBg};">
          <td style="mso-number-format:'\\@'; border: 1px solid #d1d5db; padding: 6px 12px; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">${s.roll}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px 12px; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">${s.name}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px 12px; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">${s.section || "CSE - Sec 1"}</td>
          <td style="color: ${statusColor}; font-weight: ${fontWeight}; border: 1px solid #d1d5db; padding: 6px 12px; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">${status}</td>
          <td style="mso-number-format:'\\@'; border: 1px solid #d1d5db; padding: 6px 12px; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">${formattedDate}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px 12px; font-family: Calibri, Arial, sans-serif; font-size: 11pt; text-align: center;">${period}</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Attendance</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #f1f5f9; color: #000000; font-weight: bold; border: 1px solid #94a3b8; padding: 8px 12px; font-family: Calibri, Arial, sans-serif; font-size: 11pt; text-align: left; }
          td { font-size: 11pt; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th style="width: 140px;">Roll Number</th>
              <th style="width: 280px;">Student Name</th>
              <th style="width: 120px;">Section</th>
              <th style="width: 100px;">Status</th>
              <th style="width: 110px;">Date</th>
              <th style="width: 80px;">Period</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Attendance_${formattedDate}_Period_${period}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast("Excel Attendance Roster downloaded (Red: Absent, Black: Present)!", "success");
  };

  // 2. Standard CSV Export
  const handleExportCSV = () => {
    let csv = "Roll Number,Student Name,Section,Status,Date,Period\n";
    students.forEach((s) => {
      const status = attendance[s.roll] === "absent" ? "Absent" : "Present";
      csv += `"${s.roll}","${s.name}","${s.section || "CSE - Sec 1"}","${status}","${formattedDate}","${period}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Attendance_${formattedDate}_Period_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast("CSV Attendance Roster downloaded!", "success");
  };

  return (
    <section ref={summaryRef} className="summary-section" aria-label="Attendance Summary">
      <div className="summary-header">
        <div className="summary-header-left">
          <span className="summary-badge">Official Record</span>
          <h2 className="summary-title">Attendance Submission Summary</h2>
          <p className="summary-subtitle">
            Date: {formattedDate} &bull; Period: {period} &bull;{" "}
            {subject || "DAA"} &bull; {section || "CSE - Sec 1"}
            {facultyPhone ? ` • WhatsApp: ${facultyName} (${facultyPhone})` : ""}
          </p>
        </div>
        <div className="summary-header-actions">
          <button
            className="btn btn-whatsapp-action btn-sm"
            onClick={handleSendWhatsAppWeb}
            title="Open WhatsApp Web directly without intermediate landing screen"
          >
            💬 WhatsApp Web
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "#ffffff", color: "#000000", border: "1px solid #ffffff", fontWeight: 700 }}
            onClick={handleSendGmailDirect}
            title="Open Google Gmail to send absence notice directly to student inboxes (vu.<roll>@gmail.com)"
          >
            📧 Send Gmail to Absentees
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportExcel}
            title="Download Excel Sheet with Absentees in Red & Presentees in Black"
          >
            📊 Excel (Colored)
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            title="Download CSV Spreadsheet"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">👥</div>
          <div className="stat-info">
            <span className="stat-value">{total}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">✓</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: "var(--present-color)" }}>
              {presentCount}
            </span>
            <span className="stat-label">Present</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-red">✕</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: "var(--absent-color)" }}>
              {absentCount}
            </span>
            <span className="stat-label">Absent</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-donut-wrapper">
            <svg className="progress-ring" width="48" height="48" viewBox="0 0 44 44">
              <circle
                className="progress-ring-bg"
                cx="22"
                cy="22"
                r={radius}
                strokeWidth="4"
              />
              <circle
                className="progress-ring-circle"
                cx="22"
                cy="22"
                r={radius}
                strokeWidth="4"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                stroke={parseFloat(percentage) >= 75 ? "#059669" : "#dc2626"}
              />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{percentage}%</span>
            <span className="stat-label">Attendance Rate</span>
          </div>
        </div>
      </div>

      {/* Absentee Details Card */}
      <div className="absentee-card">
        <div className="absentee-header">
          <h3>
            Absent Students <span className="badge-count badge-danger">{absentCount}</span>
          </h3>
          <span className="text-muted text-sm">Click any chip to toggle status</span>
        </div>

        {absentStudents.length === 0 ? (
          <div className="all-present-notice">
            🎉 All {total} students are marked <strong>PRESENT</strong>! Full attendance recorded.
          </div>
        ) : (
          <div className="chips-container">
            {absentStudents.map((student) => (
              <button
                key={student.roll}
                className="chip chip-absent"
                onClick={() => onToggleStudent(student.roll)}
                title="Click to mark Present"
              >
                <span className="chip-roll">{student.roll}</span>
                <span className="chip-name">{student.name}</span>
                <span className="chip-remove" aria-hidden="true">&times;</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Optional Present List Drawer */}
      <div className="presentee-accordion">
        <button
          className="accordion-toggle-btn"
          onClick={() => setShowPresentList(!showPresentList)}
        >
          {showPresentList ? "▼ Hide Present Students" : `▶ View Present Students (${presentCount})`}
        </button>

        {showPresentList && (
          <div className="chips-container" style={{ marginTop: "12px" }}>
            {presentStudents.map((student) => (
              <span key={student.roll} className="chip chip-present">
                <span className="chip-roll">{student.roll}</span>
                <span className="chip-name">{student.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Real Student Email Dispatch Strip */}
      <div className="email-dispatch-preview-box" style={{ padding: "1rem 1.25rem", background: "#111113", border: "1px solid #27272a", borderRadius: "12px", marginBottom: "1rem", color: "#ffffff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "1.2rem" }}>📧</span>
              <strong style={{ color: "#ffffff" }}>Official Student Email Dispatch:</strong>
              <span className="badge" style={{ background: "#ffffff", color: "#000000", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "800" }}>
                vu.&lt;roll&gt;@gmail.com
              </span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>
              {absentCount > 0 ? (
                <span>
                  Delivering absence alerts to <strong style={{ color: "#ffffff" }}>{absentCount}</strong> student inbox{absentCount > 1 ? "es" : ""}:{" "}
                  <code style={{ fontSize: "0.8rem", color: "#ffffff", background: "#18181b", padding: "2px 6px", borderRadius: "4px", border: "1px solid #27272a", wordBreak: "break-all" }}>{recipientEmailsString}</code>
                </span>
              ) : (
                <span>All {total} students present. No absence emails queued.</span>
              )}
            </div>
          </div>
          {absentCount > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                className="btn btn-sm"
                style={{ background: "#ffffff", color: "#000000", border: "1px solid #ffffff", fontWeight: 700 }}
                onClick={handleSendGmailDirect}
                title="Send real email blast directly via Google Webmail"
              >
                🚀 Send via Google Webmail
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={handleCopyStudentEmails}
                title="Copy all vu.<roll>@gmail.com recipient addresses"
              >
                📋 Copy Student Emails
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Action Strip (Bypasses intermediate prompt straight into WhatsApp Web) */}
      <div className="whatsapp-preview-box" style={{ padding: "0.85rem 1.25rem" }}>
        <div className="whatsapp-header" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>💬</span>
            <div>
              <strong>Faculty WhatsApp:</strong>{" "}
              <span className="whatsapp-target-badge">
                {facultyName || "Faculty"} ({facultyPhone || "Not Selected"})
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="btn btn-sm btn-whatsapp-action"
              onClick={handleSendWhatsAppWeb}
              title="Open directly in WhatsApp Web without landing screen"
            >
              🚀 Open WhatsApp Web (Direct)
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleSendWhatsAppDesktop}
              title="Open WhatsApp Desktop App on Windows"
            >
              💻 Desktop App
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleCopyRollsOnly}>
              📋 Copy Absent Rolls
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
