import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";

const router = express.Router();

/* =========================================================
   REGISTER (ADMIN / FACULTY ONLY)
   POST /api/auth/register
========================================================= */
router.post("/register", async (req, res) => {
  try {
    let { firstName, lastName, phone, email, password, role } = req.body;

    // 🔴 Validation
    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    email = email.toLowerCase();

    // 🔴 Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      role: role || "faculty",
    });

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   LOGIN (ADMIN + FACULTY + STUDENT)
   POST /api/auth/login
========================================================= */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    email = email.toLowerCase();

    // 1️⃣ Admin / Faculty
    let account = await User.findOne({ email }).select("+password");
    let roleSource = "user";

    // 2️⃣ Student (⚠️ MUST SELECT PASSWORD)
    if (!account) {
      account = await Student.findOne({ email }).select("+password");
      roleSource = "student";
    }

    if (!account || !account.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4️⃣ JWT
    const token = jwt.sign(
      {
        id: account._id,
        role: roleSource === "student" ? "student" : account.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: roleSource === "student" ? "student" : account.role,
      user: {
        _id: account._id,
        firstName:
          roleSource === "student" ? account.firstName : account.firstName,
        lastName:
          roleSource === "student" ? account.lastName : account.lastName,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
