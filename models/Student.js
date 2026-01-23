import mongoose from "mongoose";
import bcrypt from "bcryptjs";

if (mongoose.models.Student) {
  delete mongoose.models.Student;
}

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["student"],
      default: "student",
      immutable: true,
    },

    course: String,
    department: String,
    semester: Number,
    section: String,

    academicStatus: {
      type: String,
      enum: ["active", "suspended", "passed"],
      default: "active",
    },

    bloodGroup: String,
    category: String,

    phone: String,
    alternatePhone: String,

    fatherName: String,
    fatherPhone: String,
    guardianName: String,
    guardianPhone: String,

    medicalConditions: String,
    emergencyContactName: String,
    emergencyContactPhone: String,

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* 🔐 COMPARE PASSWORD */
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Student", studentSchema);
