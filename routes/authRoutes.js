import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//* ================= LOGIN (ADMIN + FACULTY + STUDENT) ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    // 1️⃣ Try admin / faculty
    let account = await User.findOne({ email }).select("+password");
    let roleSource = "user";

    // 2️⃣ If not found → try student
    if (!account) {
      account = await Student.findOne({ email }).select("+password");
      roleSource = "student";
    }

    if (!account)
      return res.status(400).json({ message: "User not found" });

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid password" });

    // 4️⃣ Create JWT
    const token = jwt.sign(
      {
        id: account._id,
        role: roleSource === "student" ? "student" : account.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5️⃣ Response
    res.json({
      token,
      role: roleSource === "student" ? "student" : account.role,
      user: {
        _id: account._id,
        name: account.name,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
