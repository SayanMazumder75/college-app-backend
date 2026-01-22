import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import User from "../models/User.js";

const router = express.Router();

/* ================= REGISTER (ADMIN / FACULTY ONLY) ================= */
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, role } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      firstName,
      lastName,
      phone,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "faculty",
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN (ADMIN + FACULTY + STUDENT) ================= */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    // 🔐 normalize email
    email = email.toLowerCase();

    // 1️⃣ ADMIN / FACULTY
    let account = await User.findOne({ email }).select("+password");
    let roleSource = "user";

    // 2️⃣ STUDENT
    if (!account) {
      account = await Student.findOne({ email }).select("+password");
      roleSource = "student";
    }

    if (!account) {
      return res.status(400).json({ message: "User not found" });
    }

    // 3️⃣ PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
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

    // 5️⃣ RESPONSE
    res.json({
      token,
      role: roleSource === "student" ? "student" : account.role,
      user:
        roleSource === "student"
          ? { name: account.name }
          : {
              _id: account._id,
              firstName: account.firstName,
              lastName: account.lastName,
            },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
