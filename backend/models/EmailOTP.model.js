import mongoose from "mongoose";

const emailOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export default mongoose.model("EmailOTP", emailOTPSchema);
