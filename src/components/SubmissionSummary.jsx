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

  // Handle Send WhatsApp
  const handleSendWhatsApp = () => {
    if (!facultyPhone) {
      onShowToast("Please enter or select a Faculty WhatsApp number in the toolbar above!", "warning");
      return;
    }

    const { url, cleanNumber, opened } = openWhatsAppChat({
      phone: facultyPhone,
      message: fullWhatsAppMessage
    });

    if (opened) {
      onShowToast(
        `Opening WhatsApp with absent rolls for ${facultyName || "Faculty"} (+${cleanNumber})!`,
        "success"
      );
    } else {
      window.location.href = url;
    }
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
            onClick={handleSendWhatsApp}
            title="Open WhatsApp to send Absent Roll Numbers"
          >
            💬 Send to WhatsApp
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportExcel}
            title="Download Excel Sheet with Absentees in Red & Presentees in Black"
          >
            📊 Download Excel (Colored)
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

      {/* WhatsApp Action Strip (Preview removed) */}
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
              onClick={handleSendWhatsApp}
              title="Open WhatsApp chat with absentee rolls pre-filled"
            >
              🚀 Open in WhatsApp
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
