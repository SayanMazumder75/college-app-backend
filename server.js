// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import path from "path";
// import bcrypt from "bcryptjs";

// // Routes
// import authRoutes from "./routes/authRoutes.js";
// import protectedRoutes from "./routes/protectedRoutes.js";
// import attendanceRoutes from "./routes/attendanceRoutes.js";
// import noticeRoutes from "./routes/noticeRoutes.js";
// import studentRoutes from "./routes/studentRoutes.js";
// import subjectRoutes from "./routes/subjectRoutes.js";
// import userRoutes from "./routes/userRoutes.js";

// // Models
// import User from "./models/User.js";

// dotenv.config();

// const app = express();

// /* ====================== PORT (RAILWAY SAFE) ====================== */
// const PORT = process.env.PORT || 8080;
// console.log("🚀 Using PORT:", PORT);

// /* ====================== MIDDLEWARE ====================== */
// app.use(
//   cors({
//     origin: "*", // OK for mobile + APK
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* ====================== STATIC FILES ====================== */
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// /* ====================== ROUTES ====================== */
// app.use("/api/auth", authRoutes);
// app.use("/api", protectedRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/notices", noticeRoutes);
// app.use("/api/students", studentRoutes);
// app.use("/api/subjects", subjectRoutes);
// app.use("/api/users", userRoutes);

// /* ====================== HEALTH CHECK ====================== */
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok" });
// });


// /* ====================== DEFAULT ADMIN ====================== */
// const createDefaultAdmin = async () => {
//   try {
//     const adminExists = await User.findOne({ role: "admin" });
//     if (adminExists) {
//       console.log("✅ Admin already exists");
//       return;
//     }

//     const name = "Super Admin";
//     const email = "admin@gmail.com";
//     const password = "Admin@1234";

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: "admin",
//     });

//     console.log("🔥 Default Admin Created");
//     console.log("📧 Email:", email);
//     console.log("🔑 Password:", password);
//   } catch (err) {
//     console.error("❌ Admin creation failed:", err);
//   }
// };

// /* ====================== START SERVER ====================== */
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB Connected");

//     await createDefaultAdmin();

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   });

//   // 🔒 Keep Railway container alive
// process.stdin.resume();
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import bcrypt from "bcryptjs";
import os from "os";

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

/* ====================== PORT (RAILWAY SAFE) ====================== */
const PORT = process.env.PORT || 8080;
console.log("🚀 Using PORT:", PORT);

/* ====================== MIDDLEWARE ====================== */
app.use(
  cors({
    origin: "*", // OK for mobile + APK
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ====================== STATIC FILES ====================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ====================== ROUTES ====================== */
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/users", userRoutes);

/* ====================== HEALTH CHECK ====================== */
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : "disconnected";
  
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "college-app-backend",
    version: "1.0.0",
    nodeVersion: process.version,
    platform: os.platform(),
    database: dbStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

/* ====================== ROOT ENDPOINT ====================== */
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "🎓 College App Backend API",
    status: "running",
    version: "1.0.0",
    documentation: "API endpoints available at /api/*",
    health: "/health",
    time: new Date().toISOString()
  });
});

/* ====================== 404 HANDLER ====================== */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

/* ====================== ERROR HANDLER ====================== */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString()
  });
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
    console.error("❌ Admin creation failed:", err);
  }
};

/* ====================== GRACEFUL SHUTDOWN ====================== */
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

/* ====================== START SERVER ====================== */
let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected");

    // Create default admin
    await createDefaultAdmin();

    // Start server
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API root: http://localhost:${PORT}/`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

// Export for testing
export default app;