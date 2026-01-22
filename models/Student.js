import mongoose from "mongoose";
import bcrypt from "bcryptjs";

if (mongoose.models.Student) {
  delete mongoose.models.Student;
}

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

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
      minlength: 6,
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

/* 🔐 HASH PASSWORD */
studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* 🔐 COMPARE PASSWORD */
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Student", studentSchema);
