import express from "express";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import bcrypt from "bcryptjs";

const router = express.Router();

/* =========================================================
   ADMIN: GET ALL STUDENTS
   GET /api/students
========================================================= */
router.get(
  "/",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const students = await Student.find()
        .select(
          "name email course department semester phone academicStatus createdAt isActive"
        )
        .sort({ createdAt: -1 });

      res.json(students);
    } catch (err) {
      console.error("GET STUDENTS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================================================
   ADMIN: ADD STUDENT
   POST /api/students
========================================================= */
router.post(
  "/",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        course,
        department,
        semester,
        section,
        academicStatus,
        bloodGroup,
        category,
        alternatePhone,
        fatherName,
        fatherPhone,
        guardianName,
        guardianPhone,
        medicalConditions,
        emergencyContactName,
        emergencyContactPhone,
      } = req.body;

      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      const exists =
        (await Student.findOne({ email })) ||
        (await User.findOne({ email }));

      if (exists) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // 🔐 AUTO PASSWORD
      const namePart = firstName.replace(/\s+/g, "").substring(0, 5).toLowerCase();
      const phonePart = phone.slice(-4);
      const rawPassword = `${namePart}@${phonePart}`;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const student = await Student.create({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        course,
        department,
        semester,
        section,
        academicStatus,
        bloodGroup,
        category,
        alternatePhone,
        fatherName,
        fatherPhone,
        guardianName,
        guardianPhone,
        medicalConditions,
        emergencyContactName,
        emergencyContactPhone,
      });

      res.status(201).json({
        message: "Student added successfully",
        generatedPassword: rawPassword, // ⚠️ show once
        student: {
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
        },
      });
    } catch (err) {
      console.error("ADD STUDENT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);



/* =========================================================
   ADMIN: DASHBOARD STATS
   GET /api/students/stats
========================================================= */
router.get(
  "/stats",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const students = await Student.countDocuments();
      const faculties = await User.countDocuments({ role: "faculty" });
      const subjects = await Subject.countDocuments();

      res.json({
        students,
        faculties,
        subjects,
      });
    } catch (err) {
      console.error("ADMIN STATS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


/* =========================================================
   ADMIN: UPDATE STUDENT (SAFE UPDATE)
   PUT /api/students/:id
========================================================= */
router.put(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const allowedFields = [
        "firstName",
        "lastName",
        "email",
        "course",
        "department",
        "semester",
        "section",
        "academicStatus",
        "bloodGroup",
        "category",
        "phone",
        "alternatePhone",
        "fatherName",
        "fatherPhone",
        "guardianName",
        "guardianPhone",
        "medicalConditions",
        "emergencyContactName",
        "emergencyContactPhone",
        "isActive",
      ];

      const updates = {};
      allowedFields.forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      });

      const updated = await Student.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      ).select("-password");

      if (!updated) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error("UPDATE STUDENT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================================================
   ADMIN: GET SINGLE STUDENT
   GET /api/students/:id
========================================================= */
router.get(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id).select("-password");

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(student);
    } catch (err) {
      console.error("GET STUDENT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================================================
   ADMIN: DELETE STUDENT
   DELETE /api/students/:id
========================================================= */
router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      await Student.findByIdAndDelete(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (err) {
      console.error("DELETE STUDENT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================================================
   ADMIN: RESET STUDENT PASSWORD
   POST /api/students/:id/reset-password
========================================================= */
router.post(
  "/:id/reset-password",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);

      if (!student || !student.phone) {
        return res.status(404).json({ message: "Student not found" });
      }

      const namePart = student.firstName
        .replace(/\s+/g, "")
        .substring(0, 5)
        .toLowerCase();

      const phonePart = student.phone.slice(-4);

      const newPassword = `${namePart}@${phonePart}`;
      student.password = await bcrypt.hash(newPassword, 10);
      await student.save();

      res.json({
        message: "Password reset successful",
        newPassword, // admin only
      });
    } catch (err) {
      console.error("RESET STUDENT PASSWORD ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);



export default router;
