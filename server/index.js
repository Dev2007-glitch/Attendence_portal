import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[API Server] Running at http://localhost:${PORT}`);
  console.log(`[API Server] Health: http://localhost:${PORT}/api/health`);
  console.log(`[API Server] Students: http://localhost:${PORT}/api/students`);
});
