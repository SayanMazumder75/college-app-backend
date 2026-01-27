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
  res.status(200).json({ status: "ok" });
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

/* ====================== START SERVER ====================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await createDefaultAdmin();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    // Don't exit - start server anyway for health checks
  })
  .finally(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });


  // 🔒 Keep Railway container alive
process.stdin.resume();
