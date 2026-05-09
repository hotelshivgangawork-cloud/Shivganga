import EmailOTP from "../models/EmailOTP.model.js";
import { sendEmailOTP } from "../services/mail.service.js";

export const sendOTPToEmail = async (req, res, next) => {
  console.log(">>> [OTP] Request received for:", req.body.email);
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      console.log(">>> [OTP] No email provided");
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(">>> [OTP] Generated OTP:", otp);

    await EmailOTP.deleteMany({ email });
    await EmailOTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
    });
    console.log(">>> [OTP] Record created in database");

    console.log(`[DEV] OTP for ${email}: ${otp}`);

    try {
      console.log(">>> [OTP] Attempting to dispatch email...");
      await sendEmailOTP({ email, otp });
      console.log(">>> [OTP] Email dispatched successfully");
    } catch (mailError) {
      console.error(">>> [OTP] FAILED TO DISPATCH EMAIL:", mailError.message);
      
      // In production, we still want to inform the user/admin about the mail failure
      // instead of just throwing a generic 500 error.
      if (process.env.NODE_ENV !== "development") {
        return res.status(400).json({ 
          success: false, 
          message: `Email service failure: ${mailError.message}. Please check Brevo API Key and Sender Email configuration.` 
        });
      }
      console.log(">>> [OTP] Continuing despite email failure (Dev Mode)");
    }

    console.log(">>> [OTP] Sending success response to client");
    res.json({
      success: true,
      message: "OTP sent to email"
    });
  } catch (error) {
    console.error(">>> [OTP] CRITICAL ERROR:", error);
    next(error);
  }
};

export const verifyEmailOTP = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp } = req.body;

    if (process.env.NODE_ENV === "development" && otp === "000000") {
      await EmailOTP.findOneAndUpdate(
        { email },
        { email, otp, verified: true, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        message: "Email verified successfully (Bypass Mode)"
      });
    }

    const record = await EmailOTP.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    record.verified = true;
    await record.save();

    res.json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    next(error);
  }
};
