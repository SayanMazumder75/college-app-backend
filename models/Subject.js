import mongoose from "mongoose";

if (mongoose.models.Subject) {
  delete mongoose.models.Subject;
}

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
