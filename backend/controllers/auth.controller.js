import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import Admin from "../models/Admin.model.js";
import Receptionist from "../models/Receptionist.model.js";
import LoginActivity from "../models/LoginActivity.model.js";

import { config } from "../configs/env.js";
import { sendResetPasswordMail } from "../services/mail.service.js";


const generateToken = (id, role) => {
  return jwt.sign({ id, role }, config.JWT_SECRET, {
    expiresIn: "7d",
  });
};


export const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, secretKey } = req.body;

    if (secretKey !== config.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin secret key",
      });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await Admin.findOne({ email }).select("+password");
    let role = "admin";

    if (!user) {
      user = await Receptionist.findOne({ email }).select("+password");
      role = "receptionist";
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      if (user) {
        await LoginActivity.create({
          userId: user._id,
          role,
          ip: req.ip,
          device: req.headers["user-agent"] || "Unknown",
          browser: req.headers["user-agent"] || "Unknown",
          status: "FAILED",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await LoginActivity.create({
      userId: user._id,
      role,
      ip: req.ip,
      device: req.headers["user-agent"] || "Unknown",
      browser: req.headers["user-agent"] || "Unknown",
      status: "SUCCESS",
    });

    const token = generateToken(user._id, role);

    res.status(200).json({
      success: true,
      token,
      role,
    });

  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Only admin can reset password",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await admin.save({ validateBeforeSave: false });

    await sendResetPasswordMail(admin.email, resetToken);

    res.status(200).json({
      success: true,
      message: "Reset password link sent",
    });
  } catch (error) {
    next(error);
  }
};


export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};
