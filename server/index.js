import app from "./app.js";
import { connectDB } from "./db/connection.js";
import { seedDatabase } from "./db/seed.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("[API Server] Connecting to MongoDB Community Server...");
    await connectDB();
    await seedDatabase(false);

    app.listen(PORT, () => {
      console.log(`[API Server] Running at http://localhost:${PORT}`);
      console.log(`[API Server] Database: VFSTR_CSE_Attendance_DB (mongodb://127.0.0.1:27017)`);
      console.log(`[API Server] Health: http://localhost:${PORT}/api/health`);
      console.log(`[API Server] Students: http://localhost:${PORT}/api/students`);
      console.log(`[API Server] Audit Logs: http://localhost:${PORT}/api/audit/logs`);
    });
  } catch (err) {
    console.error("[API Server Fatal] Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
}

startServer();
