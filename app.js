/**
 * ATTENDANCE PORTAL - APPLICATION LOGIC
 * High Performance, Zero External Dependencies, Web Audio Synthesizer,
 * Real-time Analytics & Persistence.
 */

// --- App State ---
const state = {
  students: [...INITIAL_STUDENTS],
  attendance: {}, // { [rollNumber]: 'present' | 'absent' }
  date: new Date().toISOString().split("T")[0],
  isTutorial: false,
  period: "1",
  subject: DEFAULT_SETTINGS.courseCode + " - " + DEFAULT_SETTINGS.courseName,
  section: DEFAULT_SETTINGS.section,
  facultyName: DEFAULT_SETTINGS.facultyName,
  viewMode: "matrix", // 'matrix' | 'cards' | 'table'
  filterMode: "all", // 'all' | 'present' | 'absent'
  searchQuery: "",
  soundEnabled: localStorage.getItem("att_sound") !== "false",
  history: JSON.parse(localStorage.getItem("att_history") || "[]"),
  isSubmitted: false
};

// --- Web Audio Synthesizer for High-End Audio Feedback ---
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playCheck() {
    if (!state.soundEnabled) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playUncheck() {
    if (!state.soundEnabled) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  playSuccess() {
    if (!state.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    } catch (e) {}
  }
}

const sfx = new SoundFX();

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initInitialAttendance();
  bindUIEvents();
  renderApp();
  showToast("Attendance Portal Ready with 70 Students", "info");
});

// Initial Attendance: Start with all PRESENT (no ticks) on load/refresh
function initInitialAttendance() {
  state.students.forEach(s => {
    state.attendance[s.roll] = "present";
  });
  state.isSubmitted = false;
  const summarySection = document.getElementById("submissionSummarySection");
  if (summarySection) summarySection.style.display = "none";
}

// --- Rendering Logic ---
function renderApp() {
  renderStudentView();
  // If already submitted once, keep summary updated in real time
  if (state.isSubmitted) {
    updateSummaryData();
  }
}

function getFilteredStudents() {
  let list = state.students;

  // Filter by Status
  if (state.filterMode === "present") {
    list = list.filter(s => state.attendance[s.roll] === "present");
  } else if (state.filterMode === "absent") {
    list = list.filter(s => state.attendance[s.roll] === "absent");
  }

  // Filter by Search Query
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    list = list.filter(s => 
      s.roll.toLowerCase().includes(q) || 
      (s.name && s.name.toLowerCase().includes(q))
    );
  }

  return list;
}

function renderStudentView() {
  const container = document.getElementById("studentViewContainer");
  if (!container) return;

  const studentsToRender = getFilteredStudents();

  if (studentsToRender.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.25rem; font-weight: 600;">No students match your filter/search.</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">Try clearing the search query or status filter.</p>
      </div>
    `;
    return;
  }

  if (state.viewMode === "matrix") {
    renderMatrixView(container, studentsToRender);
  } else if (state.viewMode === "cards") {
    renderCardsView(container, studentsToRender);
  } else if (state.viewMode === "table") {
    renderTableView(container, studentsToRender);
  }
}

// 1. Classic Matrix View (6 Columns matching university portal - Tick means ABSENT)
function renderMatrixView(container, students) {
  let html = `<div class="matrix-grid">`;
  
  students.forEach((student, index) => {
    const isAbsent = state.attendance[student.roll] === "absent"; // Tick = ABSENT
    html += `
      <div class="portal-item ${isAbsent ? 'checked' : ''}" 
           data-roll="${student.roll}" 
           title="${index + 1}. ${student.name} (${student.roll}) - Click to toggle Absent"
           tabindex="0"
           role="checkbox"
           aria-checked="${isAbsent}">
        <input type="checkbox" 
               class="student-checkbox" 
               data-roll="${student.roll}" 
               ${isAbsent ? 'checked' : ''} 
               tabindex="-1" />
        <div class="portal-roll-details">
          <span class="portal-roll-text">${student.roll}</span>
          <span class="portal-name-text">${student.name}</span>
        </div>
        <span class="student-seq">#${index + 1}</span>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
  bindStudentItemListeners(container);
}

// 2. Modern Card Grid View
function renderCardsView(container, students) {
  let html = `<div class="card-grid">`;

  students.forEach(student => {
    const isPresent = state.attendance[student.roll] === "present";
    const initials = student.name.split(" ").map(n => n[0]).slice(0, 2).join("");

    html += `
      <div class="student-card ${isPresent ? 'is-present' : 'is-absent'}" 
           data-roll="${student.roll}">
        <div class="card-top">
          <div class="card-avatar">${initials}</div>
          <div class="card-details">
            <span class="card-roll">${student.roll}</span>
            <span class="card-name">${student.name}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="status-badge ${isPresent ? 'badge-present' : 'badge-absent'}">
            ${isPresent ? 'Present' : 'Absent'}
          </span>
          <button class="btn btn-sm ${isPresent ? 'btn-danger' : 'btn-success'} toggle-card-btn" 
                  data-roll="${student.roll}">
            ${isPresent ? 'Mark Absent' : 'Mark Present'}
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
  bindStudentItemListeners(container);
}

// 3. Table View
function renderTableView(container, students) {
  let html = `
    <div class="table-container">
      <table class="attendance-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th style="width: 70px;">Status</th>
            <th>Roll Number</th>
            <th>Student Name</th>
            <th>Section</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
  `;

  students.forEach((student, i) => {
    const isPresent = state.attendance[student.roll] === "present";
    html += `
      <tr class="${isPresent ? 'row-present' : ''}">
        <td style="font-family: var(--font-mono); color: var(--text-muted);">${i + 1}</td>
        <td>
          <input type="checkbox" 
                 class="student-checkbox" 
                 data-roll="${student.roll}" 
                 ${isPresent ? 'checked' : ''} 
                 style="width: 18px; height: 18px; cursor: pointer;" />
        </td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: ${isPresent ? 'var(--portal-blue)' : 'var(--text-primary)'};">
          ${student.roll}
        </td>
        <td>${student.name}</td>
        <td><span class="badge" style="background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${student.section}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-sm ${isPresent ? 'btn-secondary' : 'btn-primary'} toggle-table-btn" 
                  data-roll="${student.roll}">
            ${isPresent ? 'Mark Absent' : 'Mark Present'}
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
  bindStudentItemListeners(container);
}

// Event bindings for rendered items - Guaranteed responsive tap on entire box
function bindStudentItemListeners(container) {
  // Tap anywhere in the entire matrix box (Ticking marks Absent)
  container.querySelectorAll(".portal-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      const roll = item.dataset.roll;
      const currentlyAbsent = state.attendance[roll] === "absent";
      toggleAttendance(roll, !currentlyAbsent); // If currently not absent, make absent (tick)
    });

    item.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const roll = item.dataset.roll;
        const currentlyAbsent = state.attendance[roll] === "absent";
        toggleAttendance(roll, !currentlyAbsent);
      }
    });
  });

  // Card toggle
  container.querySelectorAll(".student-card").forEach(card => {
    card.addEventListener("click", () => {
      const roll = card.dataset.roll;
      const currentlyAbsent = state.attendance[roll] === "absent";
      toggleAttendance(roll, !currentlyAbsent);
    });
  });

  // Table toggle buttons
  container.querySelectorAll(".toggle-table-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const roll = btn.dataset.roll;
      const currentlyAbsent = state.attendance[roll] === "absent";
      toggleAttendance(roll, !currentlyAbsent);
    });
  });
}

// --- Attendance State Modification (Tick means Absent) ---
function toggleAttendance(roll, shouldBeAbsent) {
  state.attendance[roll] = shouldBeAbsent ? "absent" : "present";

  if (shouldBeAbsent) {
    sfx.playUncheck();
  } else {
    sfx.playCheck();
  }

  // Update in matrix view smoothly
  const portalItem = document.querySelector(`.portal-item[data-roll="${roll}"]`);
  if (portalItem) {
    portalItem.classList.toggle("checked", shouldBeAbsent);
    portalItem.setAttribute("aria-checked", shouldBeAbsent);
    const chk = portalItem.querySelector("input");
    if (chk) chk.checked = shouldBeAbsent;
  } else {
    renderStudentView();
  }

  if (state.isSubmitted) {
    updateSummaryData();
  }
}

// --- Bulk Actions ---
function markAll(status) {
  state.students.forEach(s => {
    state.attendance[s.roll] = status;
  });
  if (status === "present") sfx.playSuccess();
  else sfx.playUncheck();

  renderApp();
  showToast(status === "present" ? "Marked all as Present (Unticked all)" : "Marked all as Absent (Ticked all)", status === "present" ? "success" : "info");
}

function invertSelection() {
  state.students.forEach(s => {
    state.attendance[s.roll] = state.attendance[s.roll] === "present" ? "absent" : "present";
  });
  sfx.playCheck();
  renderApp();
  showToast("Inverted attendance selection", "info");
}

function resetToSnapshot() {
  initInitialAttendance();
  sfx.playCheck();
  renderApp();
  showToast("Reset all to Present (Unticked all)", "info");
}

// --- SUBMIT ATTENDANCE & DISPLAY SUMMARY WITH ROLL NUMBERS ---
function submitAttendance() {
  state.isSubmitted = true;
  updateSummaryData();

  // Reveal Summary Container with Smooth Scroll
  const summarySection = document.getElementById("submissionSummarySection");
  if (summarySection) {
    summarySection.style.display = "flex";
    setTimeout(() => {
      summarySection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  // Auto-save silently to history
  saveCurrentSession(true);

  const presentCount = Object.values(state.attendance).filter(v => v === "present").length;
  const absentCount = state.students.length - presentCount;

  sfx.playSuccess();
  showToast(`Attendance Submitted! ${presentCount} Present, ${absentCount} Absent`, "success");
}

function updateSummaryData() {
  const total = state.students.length;
  const presentStudents = state.students.filter(s => state.attendance[s.roll] === "present");
  const absentStudents = state.students.filter(s => state.attendance[s.roll] === "absent");
  const presentCount = presentStudents.length;
  const absentCount = absentStudents.length;
  const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : "0.0";

  // 1. Update Metrics Cards
  const statTotal = document.getElementById("statTotal");
  const statPresent = document.getElementById("statPresent");
  const statAbsent = document.getElementById("statAbsent");
  const statPercentage = document.getElementById("statPercentage");

  if (statTotal) statTotal.textContent = total;
  if (statPresent) statPresent.textContent = presentCount;
  if (statAbsent) statAbsent.textContent = absentCount;
  if (statPercentage) statPercentage.textContent = `${percentage}%`;

  // Update Progress Donut
  const circle = document.getElementById("progressCircle");
  if (circle) {
    const circumference = 2 * Math.PI * 18; // radius = 18
    const offset = circumference - (parseFloat(percentage) / 100) * circumference;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
  }

  // 2. Update Session Metadata Subtext
  const sessionMeta = document.getElementById("summarySessionMeta");
  if (sessionMeta) {
    sessionMeta.textContent = `Date: ${state.date} • Period ${state.period} ${state.isTutorial ? '(Tutorial)' : ''} • ${state.subject} • ${state.section} • Faculty: ${state.facultyName}`;
  }

  // 3. Populate Absent Roll Chips ("with their numbers & names")
  const absentContainer = document.getElementById("absentRollChips");
  const absentCountEl = document.getElementById("absentRollsCount");
  if (absentCountEl) absentCountEl.textContent = absentCount;

  if (absentContainer) {
    if (absentStudents.length === 0) {
      absentContainer.innerHTML = `<div class="empty-chips-msg">🎉 Zero Absentees! All ${total} students are present.</div>`;
    } else {
      absentContainer.innerHTML = absentStudents.map(s => `
        <span class="roll-chip roll-chip-absent" title="${s.name} (${s.roll})">
          <span>❌</span>
          <span style="font-weight: 700;">${s.roll}</span>
          <span style="opacity: 0.85; font-size: 0.8em; margin-left: 0.35rem;">(${s.name})</span>
        </span>
      `).join("");
    }
  }
}

function editAttendance() {
  const container = document.getElementById("studentViewContainer");
  if (container) {
    container.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("You can modify checkboxes and click Submit when done", "info");
  }
}

function copyOnlyAbsentNumbers() {
  const absentees = state.students
    .filter(s => state.attendance[s.roll] === "absent")
    .map(s => s.roll);

  if (absentees.length === 0) {
    showToast("No absentees to copy! 🎉", "info");
    return;
  }

  const textToCopy = absentees.join(", ");
  navigator.clipboard.writeText(textToCopy).then(() => {
    sfx.playSuccess();
    showToast(`📋 Copied ${absentees.length} Absent Numbers to clipboard!`, "success");
  }).catch(() => {
    showToast("Failed to copy", "error");
  });
}

function copyOnlyPresentNumbers() {
  const presentees = state.students
    .filter(s => state.attendance[s.roll] === "present")
    .map(s => s.roll);

  if (presentees.length === 0) {
    showToast("No present students to copy!", "info");
    return;
  }

  navigator.clipboard.writeText(presentees.join(", ")).then(() => {
    sfx.playSuccess();
    showToast(`Copied ${presentees.length} Present Numbers`, "success");
  });
}

// --- Rapid Key-In & Callout Input Parser ---
function handleRapidInput(text) {
  if (!text.trim()) return;

  const tokens = text.split(/[\s,]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
  let matchedCount = 0;

  tokens.forEach(token => {
    const found = state.students.find(s => {
      if (s.roll.toUpperCase() === token) return true;
      if (s.roll.toUpperCase().endsWith(token)) return true;
      if (s.roll.toUpperCase().includes(token) && token.length >= 2) return true;
      return false;
    });

    if (found) {
      const currentlyAbsent = state.attendance[found.roll] === "absent";
      toggleAttendance(found.roll, !currentlyAbsent);
      matchedCount++;
    }
  });

  if (matchedCount > 0) {
    showToast(`Toggled attendance for ${matchedCount} student(s)`, "success");
  } else {
    showToast(`No student found matching "${text}"`, "error");
  }
}

// --- WhatsApp / SMS Copy Generator ---
function copyAbsenteeList() {
  const absentees = state.students.filter(s => state.attendance[s.roll] === "absent");
  const presentCount = state.students.length - absentees.length;
  const percentage = ((presentCount / state.students.length) * 100).toFixed(1);

  const rollOnlyList = absentees.map(s => s.roll).join(", ");
  const detailedList = absentees.length > 0
    ? absentees.map((s, i) => `${i + 1}. ${s.roll} - ${s.name}`).join("\n")
    : "None (100% Present! 🎉)";

  const text = 
`📌 *VFSTR :: Vadlamudi - ATTENDANCE REPORT*
🏫 *B.Tech CSE - III Year I Sem (Section 1)*
📅 *Date:* ${state.date} | *Period:* ${state.period} ${state.isTutorial ? '(Tutorial)' : ''}
📚 *Course:* ${state.subject}
📊 *Total:* ${state.students.length} | *Present:* ${presentCount} | *Absent:* ${absentees.length} (${percentage}%)

❌ *ABSENT ROLL NUMBERS (${absentees.length}):*
${rollOnlyList || "None"}

📋 *STUDENT NAME BREAKDOWN:*
${detailedList}

_Generated via Faculty Attendance Portal_`;

  navigator.clipboard.writeText(text).then(() => {
    sfx.playSuccess();
    showToast("📋 Absentee list copied for WhatsApp/SMS!", "success");
  }).catch(() => {
    showToast("Failed to copy to clipboard", "error");
  });
}

function copyPresentList() {
  const presentees = state.students
    .filter(s => state.attendance[s.roll] === "present");

  const formattedList = presentees.map((s, i) => `${i + 1}. ${s.roll} - ${s.name}`).join("\n");

  const text = 
`✅ *PRESENT STUDENTS LIST (${presentees.length}/${state.students.length})*
🏫 *VFSTR - B.Tech CSE III-I Sec 1*
📅 Date: ${state.date} | Period: ${state.period} | Course: ${state.subject}

${formattedList}`;

  navigator.clipboard.writeText(text).then(() => {
    sfx.playSuccess();
    showToast("📋 Present list copied to clipboard!", "success");
  });
}

// --- Exact CSV Export matching the template (Register Number, Name, PERIOD No :, P/A) ---
function exportCSV() {
  const headers = ["Register Number", "Name", "PERIOD No :", "P/A"];

  const studentRows = state.students.map(s => {
    const isPresent = state.attendance[s.roll] === "present";
    const statusCode = isPresent ? "P" : "A";
    return [
      `"${s.roll}"`,
      `"${s.name}"`,
      `"${state.period}"`,
      `"${statusCode}"`
    ].join(",");
  });

  const fullCsv = "\uFEFF" + headers.map(h => `"${h}"`).join(",") + "\n" + studentRows.join("\n");
  
  const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Attendance_${state.date}_Period${state.period}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  sfx.playSuccess();
  showToast("📥 Exported CSV (Register Number, Name, PERIOD No :, P/A)!", "success");
}

// --- Native Excel (.xls) Export matching the exact Excel format from screenshot ---
function exportExcel() {
  const tableRows = state.students.map(s => {
    const isPresent = state.attendance[s.roll] === "present";
    const statusCode = isPresent ? "P" : "A";
    return `
      <tr>
        <td style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; border: 1px solid #d4d4d4; padding: 4px 8px; mso-number-format:'\\@';">${s.roll}</td>
        <td style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; border: 1px solid #d4d4d4; padding: 4px 8px;">${s.name}</td>
        <td style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; border: 1px solid #d4d4d4; padding: 4px 8px; text-align: center;">${state.period}</td>
        <td style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; border: 1px solid #d4d4d4; padding: 4px 8px; text-align: center; font-weight: bold; color: ${isPresent ? '#006100' : '#c00000'};">${statusCode}</td>
      </tr>
    `;
  }).join("");

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
        th {
          background-color: #174b75 !important;
          color: #ffffff !important;
          font-family: Calibri, 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          font-weight: bold;
          border: 1px solid #0d3353;
          padding: 6px 12px;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th style="background-color: #174b75; color: #ffffff; width: 160px;">Register Number</th>
            <th style="background-color: #174b75; color: #ffffff; width: 320px;">Name</th>
            <th style="background-color: #174b75; color: #ffffff; width: 130px; text-align: center;">PERIOD No :</th>
            <th style="background-color: #174b75; color: #ffffff; width: 80px; text-align: center;">P/A</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Attendance_${state.date}_Period${state.period}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  sfx.playSuccess();
  showToast("📊 Exported Official Excel (.xls) matching the table format!", "success");
}

// --- Session History & Persistence ---
function saveCurrentSession(silent = false) {
  const record = {
    id: "att_" + Date.now(),
    date: state.date,
    period: state.period,
    isTutorial: state.isTutorial,
    subject: state.subject,
    section: state.section,
    timestamp: new Date().toLocaleString(),
    attendance: { ...state.attendance },
    presentCount: Object.values(state.attendance).filter(v => v === "present").length,
    totalCount: state.students.length
  };

  const existingIdx = state.history.findIndex(h => h.date === record.date && h.period === record.period);
  if (existingIdx >= 0) {
    state.history[existingIdx] = record;
  } else {
    state.history.unshift(record);
  }

  localStorage.setItem("att_history", JSON.stringify(state.history));
  if (!silent) {
    sfx.playSuccess();
    showToast(`💾 Session saved for ${state.date} (Period ${state.period})`, "success");
  }
}

function openHistoryModal() {
  const modal = document.getElementById("historyModal");
  const list = document.getElementById("historyList");
  if (!modal || !list) return;

  if (state.history.length === 0) {
    list.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No saved history records found.</p>`;
  } else {
    list.innerHTML = state.history.map(item => `
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <div style="font-weight: 700; font-size: 0.95rem;">📅 ${item.date} — Period ${item.period} ${item.isTutorial ? '(Tutorial)' : ''}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${item.subject} | ${item.section}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Saved on ${item.timestamp}</div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
          <span style="font-weight: 800; font-family: var(--font-mono); color: var(--present-color);">
            ${item.presentCount}/${item.totalCount} (${((item.presentCount/item.totalCount)*100).toFixed(1)}%)
          </span>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-sm btn-primary restore-history-btn" data-id="${item.id}">Restore</button>
            <button class="btn btn-sm btn-danger delete-history-btn" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".restore-history-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = state.history.find(h => h.id === btn.dataset.id);
        if (item) {
          state.date = item.date;
          state.period = item.period;
          state.isTutorial = item.isTutorial;
          state.attendance = { ...item.attendance };
          document.getElementById("dateInput").value = item.date;
          document.getElementById("periodSelect").value = item.period;
          document.getElementById("tutorialCheckbox").checked = item.isTutorial;
          renderApp();
          closeModal("historyModal");
          showToast(`Restored record for ${item.date} Period ${item.period}`, "success");
        }
      });
    });

    list.querySelectorAll(".delete-history-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.history = state.history.filter(h => h.id !== btn.dataset.id);
        localStorage.setItem("att_history", JSON.stringify(state.history));
        openHistoryModal();
        showToast("Record deleted", "info");
      });
    });
  }

  modal.classList.add("active");
}

// --- Bulk Paste Absentees Modal ---
function openPasteModal() {
  const modal = document.getElementById("pasteModal");
  if (modal) modal.classList.add("active");
}

function processPastedAbsentees() {
  const textarea = document.getElementById("pasteInputText");
  if (!textarea) return;

  const text = textarea.value.trim();
  if (!text) {
    showToast("Please enter or paste roll numbers", "error");
    return;
  }

  const tokens = text.split(/[\s,;\n\t]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
  let markedCount = 0;

  tokens.forEach(token => {
    const student = state.students.find(s => 
      s.roll.toUpperCase() === token || 
      s.roll.toUpperCase().endsWith(token)
    );
    if (student) {
      state.attendance[student.roll] = "absent";
      markedCount++;
    }
  });

  renderApp();
  closeModal("pasteModal");
  textarea.value = "";
  sfx.playSuccess();
  showToast(`Marked ${markedCount} students as Absent`, "success");
}

// --- Print View Trigger ---
function printAttendanceSheet() {
  window.print();
}

// --- Modals Management ---
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// --- Toast System ---
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// --- Global UI Event Bindings ---
function bindUIEvents() {
  // Date input
  const dateInput = document.getElementById("dateInput");
  if (dateInput) {
    dateInput.value = state.date;
    dateInput.addEventListener("change", e => {
      state.date = e.target.value;
    });
  }

  // Tutorial checkbox
  const tutorialCheckbox = document.getElementById("tutorialCheckbox");
  if (tutorialCheckbox) {
    tutorialCheckbox.checked = state.isTutorial;
    tutorialCheckbox.addEventListener("change", e => {
      state.isTutorial = e.target.checked;
    });
  }

  // Period select
  const periodSelect = document.getElementById("periodSelect");
  periodSelect.value = state.period;
  periodSelect.addEventListener("change", e => {
    state.period = e.target.value;
  });

  // Sound Toggle
  const soundToggleBtn = document.getElementById("soundToggleBtn");
  if (soundToggleBtn) {
    soundToggleBtn.textContent = state.soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
    soundToggleBtn.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem("att_sound", state.soundEnabled);
      soundToggleBtn.textContent = state.soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
      showToast(state.soundEnabled ? "Audio effects enabled" : "Audio muted", "info");
    });
  }

  // Search input
  const searchInput = document.getElementById("searchInput");
  searchInput?.addEventListener("input", e => {
    state.searchQuery = e.target.value;
    renderStudentView();
  });

  // View Switchers
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.viewMode = btn.dataset.view;
      renderStudentView();
    });
  });

  // Filter Pills
  document.querySelectorAll(".pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filterMode = btn.dataset.filter;
      renderStudentView();
    });
  });

  // Bulk buttons
  document.getElementById("markAllPresentBtn").addEventListener("click", () => markAll("present"));
  document.getElementById("markAllAbsentBtn").addEventListener("click", () => markAll("absent"));
  document.getElementById("invertSelectionBtn").addEventListener("click", invertSelection);
  document.getElementById("resetSnapshotBtn").addEventListener("click", resetToSnapshot);

  // Submit Buttons
  document.getElementById("mainSubmitBtn")?.addEventListener("click", submitAttendance);
  document.getElementById("headerSubmitBtn")?.addEventListener("click", submitAttendance);
  document.getElementById("dockSubmitBtn")?.addEventListener("click", submitAttendance);

  // Summary Card Actions
  document.getElementById("summaryCopyWhatsappBtn")?.addEventListener("click", copyAbsenteeList);
  document.getElementById("summaryExportExcelBtn")?.addEventListener("click", exportExcel);
  document.getElementById("summaryExportCsvBtn")?.addEventListener("click", exportCSV);
  document.getElementById("summaryPrintBtn")?.addEventListener("click", printAttendanceSheet);
  document.getElementById("reEditBtn")?.addEventListener("click", editAttendance);
  document.getElementById("copyOnlyAbsenteesBtn")?.addEventListener("click", copyOnlyAbsentNumbers);
  document.getElementById("copyOnlyPresentBtn")?.addEventListener("click", copyOnlyPresentNumbers);

  // History & Paste
  document.getElementById("historyBtn").addEventListener("click", openHistoryModal);
  document.getElementById("pasteAbsenteesBtn").addEventListener("click", openPasteModal);

  // Absent Numbers text area auto-select
  const absentTextArea = document.getElementById("absentNumbersText");
  absentTextArea?.addEventListener("click", function() {
    this.select();
  });

  // Rapid Dock Key-In Input
  const dockInput = document.getElementById("dockInput");
  dockInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRapidInput(dockInput.value);
      dockInput.value = "";
    }
  });

  // Global Keyboard Shortcuts
  document.addEventListener("keydown", e => {
    // Focus dock input when pressing "/"
    if (e.key === "/" && document.activeElement !== dockInput && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      dockInput.focus();
      dockInput.select();
    }
    // Ctrl+S to Submit/Save session
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      submitAttendance();
    }
  });

  // Modal close handlers
  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  // Modal action buttons
  document.getElementById("applyPasteBtn")?.addEventListener("click", processPastedAbsentees);
}
