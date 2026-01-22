import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import attendanceRoutes from "./routes/attendanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // 🔥 ADD THIS

dotenv.config();

const app = express();

/* ================= MIDDLEWARES ================= */
app.use(cors());

// ✅ IMPORTANT: skip JSON parsing for multipart
app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    return next();
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/users", userRoutes); // 🔥 ADD THIS
app.use("/api/students", studentRoutes);

/* ================= STATIC ================= */
app.use("/uploads", express.static("uploads"));

/* ================= TEST ================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* ================= SERVER ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });

