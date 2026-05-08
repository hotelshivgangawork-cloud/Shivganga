import express from "express";
import { validateEmailOnly } from "../middlewares/validate-input.middleware.js";
import {
  sendOTPToEmail,
  verifyEmailOTP
} from "../controllers/emailOtp.controller.js";

const router = express.Router();

router.post("/otp/send", validateEmailOnly, sendOTPToEmail);
router.post("/otp/verify", validateEmailOnly, verifyEmailOTP);

export default router;
