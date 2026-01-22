import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ADMIN → GET ALL FACULTY
router.get(
  "/faculty",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const faculty = await User.find({ role: "faculty" }).select(
        "_id name"
      );
      res.json(faculty);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
