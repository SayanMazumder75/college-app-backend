import bcrypt from "bcryptjs";
import express from "express";
import mongoose from "mongoose";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js"; // ✅ FIXED

const router = express.Router();

/* =========================================================
   FACULTY: GET STUDENTS FOR ATTENDANCE
   GET /api/attendance/students
========================================================= */
router.get(
  "/students",
  verifyToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const students = await Student.find({ isActive: true })
        .select("name") // 👈 ONLY NAME (important)
        .sort({ name: 1 });

      res.json(students);
    } catch (err) {
      console.error("ATTENDANCE STUDENTS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   FACULTY: MARK ATTENDANCE (DATE-WISE, NO DUPLICATES)
========================================================= */
router.post("/mark", verifyToken, allowRoles("faculty"), async (req, res) => {
  try {
    const { studentId, subject, status, date } = req.body;

    if (!studentId || !subject || !status) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    // ✅ UPSERT: update if exists, create if not
    const attendance = await Attendance.findOneAndUpdate(
      {
        studentId,
        subject,
        markedBy: req.user.id,
        date: { $gte: day, $lt: nextDay },
      },
      {
        studentId,
        subject,
        status,
        markedBy: req.user.id,
        date: day,
      },
      {
        new: true,
        upsert: true, // ⭐ KEY FIX
      },
    );

    res.status(200).json({
      message: "Attendance saved",
      attendance,
    });
  } catch (error) {
    console.error("MARK ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   STUDENT: ATTENDANCE PERCENTAGE
========================================================= */
router.get(
  "/percentage",
  verifyToken,
  allowRoles("student"),
  async (req, res) => {
    try {
      const total = await Attendance.countDocuments({
        studentId: req.user.id,
      });

      const present = await Attendance.countDocuments({
        studentId: req.user.id,
        status: "present",
      });

      res.json({
        totalClasses: total,
        presentClasses: present,
        percentage: total === 0 ? "0.00" : ((present / total) * 100).toFixed(2),
      });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   STUDENT: SUBJECT-WISE ATTENDANCE
========================================================= */
router.get(
  "/subject-wise",
  verifyToken,
  allowRoles("student"),
  async (req, res) => {
    try {
      const records = await Attendance.find({
        studentId: req.user.id,
      });

      const map = {};

      records.forEach((r) => {
        if (!map[r.subject]) {
          map[r.subject] = { total: 0, present: 0 };
        }
        map[r.subject].total++;
        if (r.status === "present") map[r.subject].present++;
      });

      const result = Object.keys(map).map((subject) => ({
        subject,
        totalClasses: map[subject].total,
        presentClasses: map[subject].present,
        percentage:
          map[subject].total === 0
            ? "0.00"
            : ((map[subject].present / map[subject].total) * 100).toFixed(2),
      }));

      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   FACULTY: TODAY'S ATTENDANCE (LIST)
========================================================= */
router.get("/today", verifyToken, allowRoles("faculty"), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const records = await Attendance.find({
      markedBy: req.user.id,
      date: { $gte: today, $lt: tomorrow },
    }).populate("studentId", "name email");

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   FACULTY: SUBJECT SUMMARY (USED BY DASHBOARD)
   ✔ Shows ALL subjects of faculty
   ✔ Even if attendance = 0
========================================================= */
router.get(
  "/faculty/today-count",
  verifyToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // 1️⃣ Subjects of faculty
      const subjects = await Subject.find({
        faculty: req.user.id,
      });

      // 2️⃣ TOTAL students (FIXED)
      const totalStudents = await Student.countDocuments({
        isActive: true,
      });

      // 3️⃣ Attendance aggregation
      const attendance = await Attendance.aggregate([
        {
          $match: {
            markedBy: new mongoose.Types.ObjectId(req.user.id),
            date: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: "$subject",
            presentToday: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
      ]);

      const attendanceMap = {};
      attendance.forEach((a) => {
        attendanceMap[a._id] = a.presentToday;
      });

      // 4️⃣ Final result
      const result = subjects.map((s) => ({
        subject: s.name,
        presentToday: attendanceMap[s.name] || 0,
        totalStudents,
      }));

      res.json(result);
    } catch (err) {
      console.error("FACULTY SUMMARY ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   STUDENT: CHECK SUBJECT ATTENDANCE BY DATE
========================================================= */
router.get(
  "/subject-date",
  verifyToken,
  allowRoles("student"),
  async (req, res) => {
    try {
      const { subject, date } = req.query;

      const day = new Date(date);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const record = await Attendance.findOne({
        studentId: req.user.id,
        subject,
        date: { $gte: day, $lt: nextDay },
      }).populate("markedBy", "name email");

      console.log("RECORD:", record); // ✅ CHECK IN BACKEND TERMINAL

      res.json(record || null);
    } catch (err) {
      console.error("SUBJECT DATE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   FACULTY: LOAD ATTENDANCE BY SUBJECT + DATE
========================================================= */
router.get(
  "/faculty/by-date",
  verifyToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const { subject, date } = req.query;

      if (!subject || !date) {
        return res.status(400).json({ message: "Missing subject or date" });
      }

      const day = new Date(date);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const records = await Attendance.find({
        markedBy: req.user.id,
        subject,
        date: { $gte: day, $lt: nextDay },
      });

      res.json(records);
    } catch (err) {
      console.error("LOAD PREVIOUS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   ADMIN: FACULTIES GET
========================================================= */
router.get("/faculties", verifyToken, allowRoles("admin"), async (req, res) => {
  const faculties = await User.find({ role: "faculty" }).select(
    "firstName lastName email phone createdAt",
  );
  res.json(faculties);
});

// ADMIN: ADD FACULTY
router.post(
  "/faculties",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;

      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ message: "All fields required" });
      }

      // 🔴 CHECK DUPLICATE EMAIL
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      const passwordPlain = `${firstName}@${phone.slice(-4)}`;
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);

      const faculty = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: "faculty",
      });

      res.status(201).json({
        message: "Faculty created",
        generatedPassword: passwordPlain,
        faculty,
      });
    } catch (err) {
      console.error("ADD FACULTY ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ADMIN: UPDATE FACULTY
router.put(
  "/faculties/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;

      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ message: "All fields required" });
      }

      // 🔴 CHECK DUPLICATE EMAIL (EXCEPT ITSELF)
      const existing = await User.findOne({
        email,
        _id: { $ne: req.params.id }, // ⭐ key line
      });

      if (existing) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      const updated = await User.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, email, phone },
        { new: true },
      ).select("_id firstName lastName email phone role");

      if (!updated) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      res.json({
        message: "Faculty updated successfully",
        faculty: updated,
      });
    } catch (err) {
      console.error("UPDATE FACULTY ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   ADMIN: RESET FACULTY PASSWORD
   POST /api/attendance/faculties/:id/reset-password
========================================================= */

router.post(
  "/faculties/:id/reset-password",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const faculty = await User.findById(req.params.id);

      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      const newPassword = `${faculty.firstName}@${faculty.phone.slice(-4)}`;
      const hashed = await bcrypt.hash(newPassword, 10);

      faculty.password = hashed;
      await faculty.save();

      res.json({
        message: "Password reset successful",
        newPassword, // show once (admin only)
      });
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* =========================================================
   ADMIN: DELETE FACULTY
   DELETE /api/attendance/faculties/:id
========================================================= */
router.delete(
  "/faculties/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const deleted = await User.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      res.json({ message: "Faculty deleted successfully" });
    } catch (err) {
      console.error("DELETE FACULTY ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
