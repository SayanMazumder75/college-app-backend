import express from "express";
import multer from "multer";
import Notice from "../models/Notice.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

/* ================= CREATE NOTICE ================= */
router.post(
  "/",
  verifyToken,
  allowRoles("faculty"),
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      const { title, message } = req.body;

      if (!title || !message) {
        return res.status(400).json({ message: "Title & message required" });
      }

      const notice = await Notice.create({
        title,
        message,
        postedBy: req.user.id,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });

      res.status(201).json(notice);
    } catch (err) {
      console.error("NOTICE CREATE ERROR:", err);
      res.status(500).json({ message: "Failed to create notice" });
    }
  }
);

/* ================= GET ALL NOTICES ================= */
router.get("/", verifyToken, async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("postedBy", "name")
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (err) {
    console.error("NOTICE FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch notices" });
  }
});

/* ================= DELETE OWN NOTICE ================= */
router.delete(
  "/:id",
  verifyToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const notice = await Notice.findById(req.params.id);

      // ❌ Notice not found
      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      // ❌ Faculty trying to delete someone else's notice
      if (notice.postedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // ✅ Authorized → delete
      await notice.deleteOne();

      res.json({ message: "Notice deleted successfully" });
    } catch (err) {
      console.error("NOTICE DELETE ERROR:", err);
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

export default router;
