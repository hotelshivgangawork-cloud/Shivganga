import express from "express";
import rateLimit from "express-rate-limit";
import { createContact } from "../controllers/contact.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createContactSchema } from "../validators/contact.validator.js";
import { verifyTurnstile } from "../middlewares/turnstile.middleware.js";
import { validateContactForm } from "../middlewares/validate-input.middleware.js";

const router = express.Router();

// Rate limiting for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many contact submissions, please try again later.",
});

router.post(
  "/contact",
  contactLimiter,
  // verifyTurnstile,          // Verify Turnstile token
  validateContactForm,      // Validate & sanitize inputs
  validateBody(createContactSchema), // Additional Joi validation
  createContact
);

export default router;
