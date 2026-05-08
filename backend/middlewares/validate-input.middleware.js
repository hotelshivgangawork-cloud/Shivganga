/**
 * Input Validation & Sanitization Middleware
 * Prevents XSS, validates email/phone, enforces length limits
 */

import { body, validationResult } from 'express-validator';

/**
 * Handle validation result and send errors if validation fails
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(">>> [VALIDATION] Failed:", errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Contact form validation chain
 * Validates and sanitizes contact form inputs
 */
export const validateContactForm = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .escape(),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
    .escape(),
  
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 5, max: 200 }).withMessage('Subject must be 5-200 characters')
    .escape(),
  
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be 10-5000 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Booking form validation chain
 * Validates booking form inputs before payment
 */
export const validateBookingForm = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .escape(),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
    .escape(),
  
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('phoneNumber')
    .trim()
    .matches(/^[0-9\s\-\+\(\)]{7,20}$/).withMessage('Invalid phone number')
    .escape(),
  
  body('specialRequest')
    .trim()
    .isLength({ max: 1000 }).withMessage('Special request must not exceed 1000 characters')
    .escape()
    .optional(),
  
  handleValidationErrors
];

/**
 * Single email validation chain
 * Used for OTP and other email-only requests
 */
export const validateEmailOnly = [
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  handleValidationErrors
];
