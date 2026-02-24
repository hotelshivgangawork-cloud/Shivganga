
import Razorpay from "razorpay";
import crypto from "crypto";
import Room from "../models/Room.model.js";
import Booking from "../models/Booking.model.js";
import Transaction from "../models/Transaction.model.js";
import User from "../models/User.model.js";
import { config } from "../configs/env.js";
import { sendBookingConfirmationMail } from "../services/mail.service.js";
import { generateGuestId } from "../utils/generateGuestId.js";
import { generateBookingReference } from "../utils/generateBookingReference.js";
import Coupon from "../models/Coupon.model.js";
import { notifyReceptionistPaymentCompleted } from "../services/notification.service.js";
import EmailOTP from "../models/EmailOTP.model.js";
// import axios from "axios";
import Membership from "../models/Membership.model.js";

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_SECRET,
});

const ADD_ONS_PRICE_MAP = {
  "River Rafting": 2500,
  "Bungee Jumping": 4000,
  "Ganga Aarti": 0,
  "Yoga Session": 1500,
};


export const createPaymentOrder = async (req, res, next) => {
  try {
    const {
      rooms,
      checkInDate,
      checkOutDate,
      adults,
      children,
      addOns,
      firstName,
      lastName,
      email,
      phoneNumber,
      specialRequest,
      isMember,
      // captchaToken,
    } = req.body;

    // ================= CLOUDLFARE TURNSTILE CAPTCHA VERIFICATION =================
    // if (!captchaToken) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Please complete the CAPTCHA verification",
    //   });
    // }

    // Use axios for Turnstile verification
    // const axios = (await import("axios")).default;
    // const verifyResponse = await axios.post(
    //   "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    //   new URLSearchParams({
    //     secret: process.env.TURNSTILE_SECRET_KEY,
    //     response: captchaToken,
    //   }),
    //   {
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //   }
    // );

    // if (!verifyResponse.data.success) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "CAPTCHA verification failed",
    //     turnstileError: verifyResponse.data.error_codes || [],
    //   });
    // }


    const roomDetails = [];

    for (const r of rooms) {

      const room = await Room.findById(r.roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: `Room not found: ${r.roomId}`,
        });
      }

      if (room.status === "Maintenance") {
        return res.status(400).json({
          success: false,
          message: `Room ${room.roomNumber} under maintenance`,
        });
      }

      const overlappingBooking = await Booking.findOne({
        "rooms.room": r.roomId,
        bookingStatus: "confirmed",
        isCheckedOut: { $ne: true },
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gt: new Date(checkInDate) },
      });

      if (overlappingBooking) {
        return res.status(400).json({
          success: false,
          message: `Room ${room.roomNumber} already booked`,
        });
      }

      roomDetails.push({
        roomId: room._id,
        roomNumber: room.roomNumber,
        quantity: r.quantity,
        plan: r.plan
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const frontendFinalAmount = Number(req.body.finalAmount);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }

    // if (room.status === "Booked" || room.status === "Occupied") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Room is not available"
    //   });
    // }

    const bypassEmailVerification = req.body.bypassEmailVerification === true;
    if (!bypassEmailVerification) {
      const otpRecord = await EmailOTP.findOne({
        email,
        verified: true,
      });

      if (!otpRecord) {
        return res.status(403).json({
          success: false,
          message: "Email not verified",
        });
      }
    }
    // const selectedPlan = req.body.plan || "ep";

    // const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);

    // const planPrice =
    //   room.priceDetails?.[selectedPlan] || room.pricePerNight;

    // const roomAmount = nights * planPrice;

    // const addOnsAmount = (addOns || []).reduce((sum, item) => {
    //   const price = ADD_ONS_PRICE_MAP[item.name] || 0;
    //   const qty = Number(item.quantity) || 1;
    //   return sum + price * qty;
    // }, 0);

    // const totalAmount = roomAmount + addOnsAmount;

    const paymentType = req.body.paymentType || "FULL";

    let discountAmount = 0;
    let appliedCoupon = null;

    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({
        code: req.body.couponCode.toUpperCase(),
        isActive: true,
      });
      const now = new Date();
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive coupon",
        });
      }

      if (coupon.startDate && now < coupon.startDate) {
        return res.status(400).json({
          success: false,
          message: "Coupon not active yet",
        });
      }

      if (coupon.expiryDate && coupon.expiryDate < now) {
        return res.status(400).json({
          success: false,
          message: "Coupon expired",
        });
      }
      discountAmount = Math.round((frontendFinalAmount * coupon.discountPercent) / 100);

      appliedCoupon = {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountAmount,
      };
    }

    /* ================= MEMBERSHIP DISCOUNT ================= */
    let membershipDiscountAmount = 0;

    if (isMember === true) {
      const membership = await Membership.findOne({ isActive: true });

      if (membership) {
        if (membership.discountType === "PERCENT") {
          membershipDiscountAmount =
            (frontendFinalAmount * membership.discountValue) / 100;
        } else if (membership.discountType === "FLAT") {
          membershipDiscountAmount = membership.discountValue;
        }
      }
    }

    const finalAmount = Number(req.body.finalAmount);

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount"
      });
    }

    if (finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount after discount",
      });
    }

    const totalAmountForBooking = finalAmount;

    // const amountInPaiseProvided =
    //   req.body.amountInPaise != null && Number(req.body.amountInPaise) > 0;

    // let payableNow;
    // let razorpayAmountPaise;

    // // Minimum 30% for partial payments
    // const minPartialAmount = Math.round(finalAmount * MIN_PARTIAL_PAYMENT_PERCENTAGE);

    // if (amountInPaiseProvided) {
    //   razorpayAmountPaise = Math.round(Number(req.body.amountInPaise));
    //   payableNow = razorpayAmountPaise / 100;

    //   if (razorpayAmountPaise < 100) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Minimum payment amount is ₹1",
    //     });
    //   }

    //   if (payableNow > totalAmountForBooking + 5) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Amount exceeds booking total",
    //     });
    //   }

    //   if (paymentType === "PARTIAL" && payableNow < minPartialAmount) {
    //     return res.status(400).json({
    //       success: false,
    //       message: `Minimum partial payment amount is ₹${minPartialAmount} (${Math.round(MIN_PARTIAL_PAYMENT_PERCENTAGE * 100)}% of total)`,
    //     });
    //   }
    // } else {
    //   payableNow = finalAmount;
    //   if (paymentType === "PARTIAL") {
    //     const requestedPartial = Number(req.body.partialAmount) || 0;

    //     // Use requested partial if valid, otherwise default to minimum 30%
    //     payableNow = requestedPartial > 0 ? requestedPartial : minPartialAmount;

    //     if (payableNow < minPartialAmount) {
    //       return res.status(400).json({
    //         success: false,
    //         message: `Minimum partial payment amount is ₹${minPartialAmount} (${Math.round(MIN_PARTIAL_PAYMENT_PERCENTAGE * 100)}% of total)`,
    //       });
    //     }

    //     if (payableNow > totalAmountForBooking) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Partial payment cannot exceed total amount",
    //       });
    //     }
    //   }
    //   razorpayAmountPaise = Math.round(payableNow * 100);
    // }
    let payableNow;
    let razorpayAmountPaise;

    // Minimum 30% for partial payments
    const FIXED_PARTIAL_AMOUNT = 1000; // ₹1000 fixed partial

    if (paymentType === "PARTIAL") {
      payableNow = Math.min(1000, frontendFinalAmount);
    } else {
      payableNow = frontendFinalAmount;
    }

    razorpayAmountPaise = Math.round(payableNow * 100);

    const order = await razorpay.orders.create({
      amount: razorpayAmountPaise,
      currency: "INR",
      receipt: `booking_${Date.now()}`,
    });

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        specialRequest,
        isMember, // 👈 from frontend
      });
    } else if (isMember) {
      user.isMember = true; // 👈 upgrade existing user
      await user.save();
    }

    const transactionData = {
      user: user._id,
      type: "BOOKING_PAYMENT",
      paymentType,
      paidAmount: payableNow,
      amount: finalAmount,
      razorpayOrderId: order.id,
      status: "PENDING",
      membershipDiscount: membershipDiscountAmount,
    };

    if (appliedCoupon) {
      transactionData.coupon = appliedCoupon;
    }

    const transaction = await Transaction.create(transactionData);

    res.status(200).json({
      success: true,
      order,
      transactionId: transaction._id,
      bookingPayload: {
        rooms: roomDetails,
        checkInDate,
        checkOutDate,
        adults,
        children,
        addOns,
        coupon: appliedCoupon,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
      bookingPayload,
    } = req.body;

    /* ================= TRANSACTION ================= */
    const transaction =
      await Transaction.findById(transactionId).session(session);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status === "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Transaction already processed",
      });
    }

    /* ================= SIGNATURE VERIFY ================= */
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      transaction.status = "FAILED";
      await transaction.save({ session });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    /* ================= USER & ROOM ================= */
    const user = await User.findById(transaction.user).session(session);

    const rooms = bookingPayload.rooms || [];
    const roomDocs = [];

    for (const r of rooms) {

      const room = await Room.findById(r.roomId).session(session);

      if (!room) {
        throw new Error(`Room not found ${r.roomId}`);
      }

      roomDocs.push(room);
    }

    if (!user) {
      throw new Error("User not found");
    }

    // const overlapping = await Booking.findOne({
    //   room: room._id,
    //   bookingStatus: "confirmed",
    //   isCheckedOut: { $ne: true },
    //   checkInDate: { $lt: bookingPayload.checkOutDate },
    //   checkOutDate: { $gt: bookingPayload.checkInDate },
    // }).session(session);

    for (const r of rooms) {
      const overlapping = await Booking.findOne({
        "rooms.room": r.roomId,
        bookingStatus: "confirmed",
        isCheckedOut: { $ne: true },
        checkInDate: { $lt: bookingPayload.checkOutDate },
        checkOutDate: { $gt: bookingPayload.checkInDate },
      }).session(session);

      if (overlapping) {
        throw new Error(`Room already booked: ${r.roomId}`);
      }
    }

    /* ================= MARK TRANSACTION SUCCESS ================= */
    transaction.status = "SUCCESS";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    await transaction.save({ session });

    /* ================= PAYMENT CALC ================= */
    const paidAmount = transaction.paidAmount;
    const pendingAmount = transaction.amount - paidAmount;

    /* ================= CREATE BOOKING ================= */
    const bookingPayloadData = {
      guestId: generateGuestId(),
      rooms: rooms.map(r => ({
        room: r.roomId,
        quantity: r.quantity || 1,
        plan: r.plan || "ep"
      })),
      user: user._id,
      membershipDiscount: transaction.membershipDiscount || 0,

      checkInDate: bookingPayload.checkInDate,
      checkOutDate: bookingPayload.checkOutDate,
      adults: bookingPayload.adults,
      children: bookingPayload.children,

      addOns: bookingPayload.addOns || [],

      totalAmount: transaction.amount,
      paymentType: transaction.paymentType,
      paidAmount,
      pendingAmount,

      paymentStatus: pendingAmount > 0 ? "pending" : "paid",
      bookingStatus: "confirmed",

      id: user.id,
      idDocument: user.idDocument,
    };

    // Booking Reference (consistent with frontend)
    bookingPayloadData.bookingReference = generateBookingReference({
      checkInDate: bookingPayload.checkInDate,
      checkOutDate: bookingPayload.checkOutDate,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

    if (
      transaction.coupon &&
      typeof transaction.coupon === "object" &&
      Object.keys(transaction.coupon).length > 0
    ) {
      bookingPayloadData.coupon = transaction.coupon;
    }

    const booking = await Booking.create([bookingPayloadData], { session });

    /* ================= UPDATE ROOM STATUS ================= */

    transaction.booking = booking[0]._id;
    await transaction.save({ session });

    /* ================= COMMIT ================= */
    await session.commitTransaction();
    session.endSession();


    // EMAIL & NOTIFICATION (NON BLOCKING)
    const bookingDoc = booking[0];
    const checkIn = new Date(bookingDoc.checkInDate);
    const checkOut = new Date(bookingDoc.checkOutDate);
    const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    // Notify receptionist
    notifyReceptionistPaymentCompleted({ booking: bookingDoc, user, rooms: roomDocs }).catch((err) => {
      console.error("Receptionist notification failed:", err.message);
    });

    // Prepare activities for email
    const normalizeKey = (s) => (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
    const normalizedPriceMap = Object.fromEntries(
      Object.entries(ADD_ONS_PRICE_MAP || {}).map(([k, v]) => [normalizeKey(k), v]),
    );
    const activities = (bookingDoc.addOns || [])
      .filter((a) => (a?.name || "").toString().trim())
      .map((a) => {
        const qty = Math.max(0, Number(a?.quantity || 0));
        const name = (a?.name || "").toString().trim();
        const key = normalizeKey(name);
        const unit =
          (ADD_ONS_PRICE_MAP && ADD_ONS_PRICE_MAP[name]) ??
          normalizedPriceMap[key] ??
          (Number(a?.price || 0) || 0);
        return {
          name,
          quantity: qty,
          unitPrice: unit,
          totalPrice: unit * qty,
        };
      });

    sendBookingConfirmationMail({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      roomNumber: roomDocs.map(r => r.roomNumber).join(", "),
      guestId: bookingDoc.guestId,
      bookingReference: bookingDoc.bookingReference,
      checkInDate: checkIn.toDateString(),
      checkOutDate: checkOut.toDateString(),
      nights,
      totalAmount: bookingDoc.totalAmount,
      paidAmount: bookingDoc.paidAmount,
      pendingAmount: bookingDoc.pendingAmount,
      coupon: bookingDoc.coupon,
      activities,
      priceBreakdown: req?.body.priceBreakdown,
    }).catch((err) => {
      console.error("Booking confirmation email failed:", err.message);
    });

    /* ================= OTP CLEANUP ================= */
    await EmailOTP.deleteMany({ email: user.email });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully, booking confirmed",
      booking: bookingDoc,
    });
  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    if (req.body.transactionId) {
      await Transaction.findByIdAndUpdate(req.body.transactionId, {
        status: "FAILED",
      });
    }

    next(error);
  }
};

export const fakeVerifyPayment = async (req, res, next) => {
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const { transactionId, bookingPayload, forceSuccess } = req.body;

    /* ================= DEV MODE CHECK ================= */
    if (process.env.NODE_ENV !== "development" || forceSuccess !== true) {
      return res.status(403).json({
        success: false,
        message: "Fake payment allowed only in development mode",
      });
    }

    /* ================= TRANSACTION ================= */
    const transaction =
      await Transaction.findById(transactionId).session(session);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    /* ================= ALREADY PROCESSED ================= */
    if (transaction.status === "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Transaction already processed",
      });
    }

    /* ================= PAYLOAD VALIDATION ================= */
    if (
      !bookingPayload?.rooms ||
      !bookingPayload?.checkInDate ||
      !bookingPayload?.checkOutDate
    ) {
      throw new Error("Invalid booking payload");
    }

    /* ================= USER & ROOM ================= */
    const user = await User.findById(transaction.user).session(session);

    const rooms = bookingPayload.rooms || [];
    const roomDocs = [];

    for (const r of rooms) {
      const room = await Room.findById(r.roomId).session(session);
      if (!room) throw new Error(`Room not found ${r.roomId}`);
      const overlapping = await Booking.findOne({
        "rooms.room": room._id,
        bookingStatus: "confirmed",
        isCheckedOut: { $ne: true },
        checkInDate: { $lt: bookingPayload.checkOutDate },
        checkOutDate: { $gt: bookingPayload.checkInDate },
      }).session(session);

      if (overlapping) {
        throw new Error("Room already booked for selected dates");
      }
      roomDocs.push(room);
    }

    if (!user) {
      throw new Error("User not found");
    }


    /* ================= MARK TRANSACTION SUCCESS ================= */
    transaction.status = "SUCCESS";
    transaction.razorpayPaymentId = "DEV_PAYMENT_ID";
    transaction.razorpaySignature = "DEV_SIGNATURE";
    await transaction.save({ session });

    /* ================= PAYMENT CALCULATION ================= */
    const paidAmount = transaction.paidAmount;
    const pendingAmount = transaction.amount - paidAmount;

    /* ================= CREATE BOOKING ================= */
    const bookingPayloadData = {
      guestId: generateGuestId(),
      rooms: bookingPayload.rooms.map(r => ({
        room: r.roomId,
        quantity: r.quantity || 1,
        plan: r.plan || "ep"
      })),
      user: user._id,

      checkInDate: bookingPayload.checkInDate,
      checkOutDate: bookingPayload.checkOutDate,
      adults: bookingPayload.adults,
      children: bookingPayload.children,

      addOns: bookingPayload.addOns || [],

      totalAmount: transaction.amount,
      paymentType: transaction.paymentType,
      paidAmount,
      pendingAmount,

      paymentStatus: pendingAmount > 0 ? "pending" : "paid",
      bookingStatus: "confirmed",

      id: user.id,
      idDocument: user.idDocument,
    };

    // Booking Reference (consistent with frontend)
    bookingPayloadData.bookingReference = generateBookingReference({
      checkInDate: bookingPayload.checkInDate,
      checkOutDate: bookingPayload.checkOutDate,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

    if (
      transaction.coupon &&
      typeof transaction.coupon === "object" &&
      Object.keys(transaction.coupon).length > 0
    ) {
      bookingPayloadData.coupon = transaction.coupon;
    }

    const booking = await Booking.create([bookingPayloadData], { session });

    /* ================= UPDATE ROOM STATUS ================= */

    transaction.booking = booking[0]._id;
    await transaction.save({ session });

    /* ================= COMMIT ================= */
    await session.commitTransaction();
    session.endSession();


    // EMAIL & NOTIFICATION (NON BLOCKING)
    const bookingDoc = booking[0];
    const checkIn = new Date(bookingDoc.checkInDate);
    const checkOut = new Date(bookingDoc.checkOutDate);
    const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    notifyReceptionistPaymentCompleted({ booking: bookingDoc, user, rooms: roomDocs }).catch((err) => {
      console.error("Receptionist notification failed:", err.message);
    });

    const normalizeKey = (s) => (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
    const normalizedPriceMap = Object.fromEntries(
      Object.entries(ADD_ONS_PRICE_MAP || {}).map(([k, v]) => [normalizeKey(k), v]),
    );
    const activities = (bookingDoc.addOns || [])
      .filter((a) => (a?.name || "").toString().trim())
      .map((a) => {
        const qty = Math.max(0, Number(a?.quantity || 0));
        const name = (a?.name || "").toString().trim();
        const key = normalizeKey(name);
        const unit =
          (ADD_ONS_PRICE_MAP && ADD_ONS_PRICE_MAP[name]) ??
          normalizedPriceMap[key] ??
          (Number(a?.price || 0) || 0);
        return {
          name,
          quantity: qty,
          unitPrice: unit,
          totalPrice: unit * qty,
        };
      });

    sendBookingConfirmationMail({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      roomNumber: roomDocs.map(r => r.roomNumber).join(", "),
      guestId: bookingDoc.guestId,
      bookingReference: bookingDoc.bookingReference,
      checkInDate: checkIn.toDateString(),
      checkOutDate: checkOut.toDateString(),
      nights,
      totalAmount: bookingDoc.totalAmount,
      paidAmount: bookingDoc.paidAmount,
      pendingAmount: bookingDoc.pendingAmount,
      coupon: bookingDoc.coupon,
      activities,
    }).catch((err) => {
      console.error("Booking confirmation email failed:", err.message);
    });

    res.status(200).json({
      success: true,
      message: "DEV MODE: Booking confirmed successfully",
      booking: booking[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (req.body.transactionId) {
      await Transaction.findByIdAndUpdate(req.body.transactionId, {
        status: "FAILED",
      });
    }

    next(error);
  }
};

export const createRemainingPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    /* ================= BOOKING ================= */
    const booking = await Booking.findById(bookingId)
      .populate("user")
      .populate("rooms.room");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /* ================= VALIDATIONS ================= */
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking already fully paid",
      });
    }

    if (booking.pendingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No pending amount found",
      });
    }

    /* ================= RAZORPAY ORDER ================= */
    const order = await razorpay.orders.create({
      amount: booking.pendingAmount * 100,
      currency: "INR",
      receipt: `remaining_${Date.now()}`,
    });

    /* ================= TRANSACTION ================= */
    const transaction = await Transaction.create({
      user: booking.user._id,
      booking: booking._id,
      type: "BOOKING_PAYMENT",
      paymentType: booking.paymentType || "PARTIAL",
      paidAmount: booking.pendingAmount,
      amount: booking.pendingAmount,
      razorpayOrderId: order.id,
      status: "PENDING",
    });

    res.status(200).json({
      success: true,
      order,
      transactionId: transaction._id,
      bookingId: booking._id,
      pendingAmount: booking.pendingAmount,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRemainingPayment = async (req, res, next) => {
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    /* ================= TRANSACTION ================= */
    const transaction =
      await Transaction.findById(transactionId).session(session);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status === "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Transaction already processed",
      });
    }

    /* ================= SIGNATURE VERIFY ================= */
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      transaction.status = "FAILED";
      await transaction.save({ session });
      throw new Error("Payment verification failed");
    }

    /* ================= BOOKING ================= */
    const booking = await Booking.findById(transaction.booking).session(
      session,
    );
    if (!booking) {
      throw new Error("Booking not found");
    }

    transaction.status = "SUCCESS";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    await transaction.save({ session });

    booking.paidAmount += transaction.paidAmount;
    booking.pendingAmount = 0;
    booking.paymentStatus = "paid";

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    const user = await User.findById(booking.user);
    const roomDocs = await Room.find({
      _id: { $in: booking.rooms.map(r => r.room) }
    });

    await notifyReceptionistPaymentCompleted({
      booking,
      user,
      rooms: roomDocs,
    });

    res.status(200).json({
      success: true,
      message: "Remaining payment verified successfully",
      booking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (req.body.transactionId) {
      await Transaction.findByIdAndUpdate(req.body.transactionId, {
        status: "FAILED",
      });
    }

    next(error);
  }
};

export const fakeVerifyRemainingPayment = async (req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      message: "Fake remaining payment allowed only in development mode",
    });
  }

  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.body;

    const transaction =
      await Transaction.findById(transactionId).session(session);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status === "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Transaction already processed",
      });
    }

    const booking = await Booking.findById(transaction.booking).session(
      session,
    );
    if (!booking) {
      throw new Error("Booking not found");
    }

    transaction.status = "SUCCESS";
    transaction.razorpayPaymentId = "DEV_REMAINING_PAYMENT";
    transaction.razorpaySignature = "DEV_SIGNATURE";
    await transaction.save({ session });

    booking.paidAmount += transaction.paidAmount;
    booking.pendingAmount = 0;
    booking.paymentStatus = "paid";

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    const user = await User.findById(booking.user);
    const roomDocs = await Room.find({
      _id: { $in: booking.rooms.map(r => r.room) }
    });

    await notifyReceptionistPaymentCompleted({
      booking,
      user,
      rooms: roomDocs,
    });

    res.status(200).json({
      success: true,
      message: "DEV MODE: Remaining payment completed successfully",
      booking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (req.body.transactionId) {
      await Transaction.findByIdAndUpdate(req.body.transactionId, {
        status: "FAILED",
      });
    }

    next(error);
  }
};
