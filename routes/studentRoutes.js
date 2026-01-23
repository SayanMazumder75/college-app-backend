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
        name,
        email,
        password,
        course,
        department,
        semester,
        section,
        academicStatus,
        bloodGroup,
        category,
        phone,
        alternatePhone,
        fatherName,
        fatherPhone,
        guardianName,
        guardianPhone,
        medicalConditions,
        emergencyContactName,
        emergencyContactPhone,
      } = req.body;

      // ✅ BASIC VALIDATION
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // ✅ CHECK EMAIL IN BOTH COLLECTIONS
      const emailExists =
        (await Student.findOne({ email })) ||
        (await User.findOne({ email }));

      if (emailExists) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // 🔐 HASH PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      const student = await Student.create({
        name,
        email,
        password: hashedPassword,
        course,
        department,
        semester,
        section,
        academicStatus,
        bloodGroup,
        category,
        phone,
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
        student: {
          _id: student._id,
          name: student.name,
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
        "name",
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

export default router;
