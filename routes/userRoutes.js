import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ADMIN → GET ALL FACULTY
// GET ALL FACULTY (ADMIN)
router.get(
  "/faculty",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const faculties = await User.find({ role: "faculty" }).select(
        "_id firstName lastName email"
      );

      res.json(faculties);
    } catch (err) {
      console.error("GET FACULTY ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
