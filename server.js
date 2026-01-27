import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import bcrypt from "bcryptjs";

// Routes
import authRoutes from "./routes/authRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Models
import User from "./models/User.js";

dotenv.config();

const app = express();

/* ====================== PORT DEBUGGING (RAILWAY SAFE) ====================== */
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 8080;
console.log("🔍 Environment PORT vars:", {
  PORT: process.env.PORT,
  RAILWAY_PORT: process.env.RAILWAY_PORT,
  final: PORT
});

/* ====================== MIDDLEWARE ====================== */
app.use(cors({
  origin: "*", 
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Body parser limits for Railway
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'College App Backend');
  next();
});

/* ====================== STATIC FILES ====================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ====================== RAILWAY HEALTH CHECKS (CRITICAL) ====================== */
// Root path - Railway checks this first
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "College App Backend OK", 
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

/* ====================== API ROUTES ====================== */
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/users", userRoutes);

// 404 catch-all (after routes)
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ====================== DEFAULT ADMIN ====================== */
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      console.log("✅ Admin already exists");
      return;
    }

    const name = "Super Admin";
    const email = "admin@gmail.com";
    const password = "Admin@1234";

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("🔥 Default Admin Created");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
  } catch (err) {
    console.error("❌ Admin creation failed:", err.message);
  }
};

/* ====================== START SERVER (RAILWAY OPTIMIZED) ====================== */
const startServer = () => {
  if (!PORT || isNaN(Number(PORT))) {
    console.error("❌ Invalid PORT:", PORT);
    process.exit(1);
    return;
  }

  const portNum = Number(PORT);
  
  app.listen(portNum, "0.0.0.0", (err) => {
    if (err) {
      console.error("❌ Listen error:", err);
      process.exit(1);
      return;
    }
    console.log(`✅ Server LIVE on http://0.0.0.0:${portNum}`);
    console.log(`🌐 Public URL: https://college-app-backend-production-72c8.up.railway.app`);
  });
};

// MongoDB connection (non-blocking)
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test')
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await createDefaultAdmin();
  })
  .catch((err) => {
    console.error("⚠️ MongoDB error (server continues):", err.message);
  })
  .finally(startServer);

// Graceful shutdown handlers for Railway
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received - graceful shutdown');
  mongoose.connection.close(() => {
    console.log('📤 MongoDB disconnected');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received - graceful shutdown');
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

// Keep Railway container alive
process.stdin.resume();

console.log("🚀 College App Backend initializing...");
