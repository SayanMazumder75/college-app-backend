import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

import attendanceRoutes from "./routes/attendanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.ADMIN_PHONE || "9999999999";

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ Admin credentials not set in env");
      return;
    }

    const existingAdmin = await User.findOne({
      email: adminEmail,
      role: "admin",
    });

    if (existingAdmin) {
      console.log("✅ Default admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      firstName: "Super",
      lastName: "Admin",
      phone: adminPhone,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("🔥 Default admin created successfully");
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
  }
};



dotenv.config();

const app = express();

/* ================= PORT (🔥 FIXED) ================= */
const PORT = process.env.PORT || 5000;

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
app.use("/api/users", userRoutes);
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
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // 👇 CREATE ADMIN HERE
    await createDefaultAdmin();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });
