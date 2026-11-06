# 🎓 Faculty Attendance Portal — Full-Stack (React + Vite + Express)

A high-performance, modern web application designed for university faculty to conduct, record, and analyze student attendance with rapid roll-call workflows, instant acoustic feedback, and persistent backend storage.

---

## ⚡ Tech Stack & Architecture

- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) REST API
- **Audio Feedback**: Web Audio Synthesizer (sine & triangle oscillator tones)
- **Styling**: Vanilla CSS Design System with Glassmorphism, smooth animations & dark/light accents
- **Storage**: Persistent JSON database (`server/data/students.json` & `server/data/sessions.json`) with client-side `localStorage` resilience fallback

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Full-Stack Development Server
Starts both the Express backend API (`http://localhost:5000`) and Vite frontend (`http://localhost:3000`) concurrently:
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🧭 Application Features

1. **6-Column Portal Matrix View**:
   - Matches university faculty portal layout.
   - **Tick = Absent** convention: clicking any student marks them absent with clear visual differentiation.
2. **Multiple View Modes**:
   - **▦ Matrix**: High-speed grid with sequential `#index` and roll numbers.
   - **📇 Cards**: Visual student card view with avatar initials.
   - **📋 Table**: Tabular layout with direct action buttons.
3. **Real-Time Analytics & Donut Gauge**:
   - Dynamic SVG donut meter calculating exact attendance percentage.
   - Instant metrics for Total Strength, Present, and Absent.
4. **Post-Submission Summary**:
   - Clickable absentee chips with roll numbers and student names.
   - Expandable present student roster drawer.
   - Instant **Copy for WhatsApp** formatted report.
   - Instant **Download CSV / Excel** export.
5. **Rapid Key-In Absent Dialog**:
   - Type or paste space/comma-separated roll numbers or last 2–4 digits (e.g. `35, 54, 62`) to immediately mark them absent.
6. **Session History & Persistence**:
   - View, restore, and delete previously conducted attendance sessions.
   - Sessions sync with the Express backend REST API.
7. **Web Audio Synthesizer**:
   - Sine wave click tones on check/uncheck and success melody upon submission.
   - Sound toggle button (`🔊 Sound ON` / `🔇 Sound OFF`).

---

## 🔌 Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and uptime |
| `GET` | `/api/students` | Get all 70 students or filter by `?section=` or `?search=` |
| `POST` | `/api/students` | Add or update student details |
| `GET` | `/api/sessions` | Retrieve all saved attendance sessions |
| `GET` | `/api/sessions/:id` | Get single session details |
| `POST` | `/api/sessions` | Save a new attendance submission |
| `DELETE` | `/api/sessions/:id` | Delete an attendance session |
| `GET` | `/api/stats/overview`| Aggregate portal analytics |
