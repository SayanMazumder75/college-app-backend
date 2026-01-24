import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "path";

import User from "./models/User.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ THIS IS THE KEY FIX
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* ================= AUTO CREATE ADMIN ================= */
const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ role: "admin" });
  if (adminExists) return;

  const firstName = "Admin";
  const lastName = "Super";
  const phone = "0000001234";
  const email = "admin@gmail.com";

  const plainPassword = `${firstName}@${phone.slice(-4)}`;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await User.create({
    firstName,
    lastName,
    phone,
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log("🔥 Default Admin Created");
};

/* ================= START SERVER ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await createDefaultAdmin();

    app.listen(PORT, "0.0.0.0", () =>
      console.log(`✅ Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
