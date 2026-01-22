import express from "express";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================================================
   ADMIN: GET ALL SUBJECTS
   GET /api/subjects
========================================================= */
router.get(
  "/",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const subjects = await Subject.find()
        .populate("faculty", "name email")
        .sort({ createdAt: -1 });

      res.json(subjects);
    } catch (err) {
      console.error("GET SUBJECTS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================================================
   ADMIN: ADD SUBJECT
   POST /api/subjects
========================================================= */
router.post(
  "/",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { name, facultyId } = req.body;

      if (!name || !facultyId) {
        return res.status(400).json({ message: "Name & faculty required" });
      }

      // 🔍 validate faculty
      const faculty = await User.findOne({
        _id: facultyId,
        role: "faculty",
      });

      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      // 🔍 prevent duplicate subject with same faculty
      const exists = await Subject.findOne({
        name: name.trim(),
        faculty: facultyId,
      });

      if (exists) {
        return res
          .status(409)
          .json({ message: "Subject already assigned to this faculty" });
      }

      const subject = await Subject.create({
        name: name.trim(),
        faculty: facultyId,
      });

      const populated = await subject.populate("faculty", "name email");

      res.status(201).json({
        message: "Subject created successfully",
        subject: populated,
      });
    } catch (err) {
      console.error("ADD SUBJECT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================================================
   ADMIN: DELETE SUBJECT (OPTIONAL)
   DELETE /api/subjects/:id
========================================================= */
router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const deleted = await Subject.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ message: "Subject not found" });
      }

      res.json({ message: "Subject deleted successfully" });
    } catch (err) {
      console.error("DELETE SUBJECT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================================================
   FACULTY: GET MY SUBJECTS
   GET /api/subjects/my
========================================================= */
router.get(
  "/my",
  verifyToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const subjects = await Subject.find({
        faculty: req.user.id,
      }).select("name");

      res.json(subjects);
    } catch (err) {
      console.error("FACULTY SUBJECT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


export default router;
