import express from "express";
import rateLimit from "express-rate-limit";
import { verifyCaptcha } from "../middlewares/captcha.middleware.js";
import { validateBookingForm, validateEmailOnly } from "../middlewares/validate-input.middleware.js";
import {
  createPaymentOrder,
  verifyPayment,
  fakeVerifyPayment,
  createRemainingPaymentOrder,
  verifyRemainingPayment,
  fakeVerifyRemainingPayment,
} from "../controllers/onlineBooking.controller.js";

const router = express.Router();

// Rate limiting for booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Increased for testing/dev
  message: "Too many booking attempts, please try again later.",
});

router.post("/online-booking/create-order", bookingLimiter, validateBookingForm, createPaymentOrder);
router.post("/online-booking/verify", bookingLimiter, verifyPayment);
router.post("/online-booking/fake-verify", bookingLimiter, fakeVerifyPayment);

router.post(
  "/online-booking/remaining/create-order",
  bookingLimiter,
  validateBookingForm,
  createRemainingPaymentOrder,
);
router.post("/online-booking/remaining/verify", bookingLimiter, verifyRemainingPayment);
router.post(
  "/online-booking/remaining/fake-verify",
  bookingLimiter,
  fakeVerifyRemainingPayment,
);

// Test endpoint for debugging
router.post("/online-booking/test-email", validateEmailOnly, async (req, res) => {
  try {
    const { email } = req.body;
    const EmailOTP = (await import("../models/EmailOTP.model.js")).default;

    const otpRecord = await EmailOTP.findOne({
      email,
      verified: true,
    });

    res.status(200).json({
      success: true,
      email,
      verified: !!otpRecord,
      otpRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;

// router.post(
//   "/online-booking/remaining/create-order",
//   createRemainingPaymentOrder
// );

// router.post(
//   "/online-booking/remaining/verify",
//   verifyRemainingPayment
// );

// router.post(
//   "/online-booking/remaining/fake-verify",
//   fakeVerifyRemainingPayment
// );

// export default router;
