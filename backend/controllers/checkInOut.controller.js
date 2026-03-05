import Booking from "../models/Booking.model.js";
import Room from "../models/Room.model.js";
import User from "../models/User.model.js";
import { sendWhatsAppDocument } from "../services/sendWhatsappDocument.js"
import { generateInvoicePDFBuffer } from "../services/invoice.service.js"
import { uploadToCloudinary } from "../services/cloudinary.service.js"
import { notifyReceptionistCheckInOut } from "../services/notification.service.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "../configs/env.js";
import BookingPolicy from "../models/BookingPolicy.model.js";


// export const checkInBooking = async (req, res, next) => {
//   try {
//     const { bookingId } = req.params;

//     const booking = await Booking.findById(bookingId)
//       .populate("user", "firstName lastName email phoneNumber")
//       .populate("room", "roomNumber name");

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found"
//       });
//     }

//     if (booking.paymentStatus !== "paid" || booking.bookingStatus !== "confirmed") {
//       return res.status(400).json({
//         success: false,
//         message: "Booking is not eligible for check-in"
//       });
//     }
// if (new Date() < booking.checkInDate) {
//   return res.status(400).json({
//     success: false,
//     message: "Cannot check-in before booking check-in date"
//   });
// }

//     if (booking.isCheckedIn) {
//       return res.status(400).json({
//         success: false,
//         message: "Guest already checked in"
//       });
//     }

//     const policy = await BookingPolicy.findOne({ isActive: true });

//     const now = new Date();
//     const checkInTime = new Date(booking.checkInDate);
//     const [h, m] = policy.checkInTime.split(":");
//     checkInTime.setHours(h, m, 0, 0);

//     if (now < checkInTime && policy.earlyCheckInFee > 0) {
//       booking.fine = {
//         amount: policy.earlyCheckInFee,
//         reason: "EARLY_CHECK_IN",
//         status: "PENDING"
//       };

//       booking.pendingAmount += policy.earlyCheckInFee;
//       booking.paymentStatus = "pending";
//     }

//     booking.isCheckedIn = true;
//     booking.isCheckedOut = false; 
//     booking.checkedInAt = now;
//     booking.checkedOutAt = null; 
//     await booking.save();

//     const room = await Room.findById(booking.room);
//     room.status = "Occupied";
//     await room.save();

//     await notifyReceptionistCheckInOut({
//       type: "CHECK_IN",
//       booking,
//       user: booking.user,
//       room
//     });

//     res.json({
//       success: true,
//       message: booking.fine?.status === "PENDING"
//         ? "Guest checked in with early check-in fine"
//         : "Guest checked in successfully",
//       booking
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// export const roomCheckIn = async (req, res, next) => {
//   try {
//     const { roomId } = req.params;

//     if (!roomId) {
//       return res.status(400).json({
//         message: "RoomId is not provided"
//       });
//     }

//     const startOfToday = new Date();
//     startOfToday.setHours(0, 0, 0, 0);

//     const endOfToday = new Date();
//     endOfToday.setHours(23, 59, 59, 999);

//     const booking = await Booking.findOne({
//       "rooms.room": roomId,
//       bookingStatus: "confirmed",
//       isCheckedIn: false,
//       checkInDate: { $lte: endOfToday },
//       checkOutDate: { $gt: startOfToday }
//     });

//     if (!booking) {
//       return res.status(400).json({
//         data: roomId,
//         message: "No valid booking found for today❌"
//       });
//     }

//     // FULL payment rule
//     if (
//       booking.paymentType === "FULL" &&
//       booking.paymentStatus !== "paid"
//     ) {
//       return res.status(400).json({
//         message: "Full payment required before check-in"
//       });
//     }
//     if (booking.isCheckedIn) {
//       return res.status(400).json({
//         message: "Guest already checked in"
//       });
//     }

//     booking.isCheckedIn = true;
//     booking.checkedInAt = new Date();
//     await booking.save();

//     res.json({
//       success: true,
//       message: "Guest checked in successfully",
//       booking
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const roomCheckIn = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const booking = await Booking.findOne({
      "rooms.room": roomId,
      bookingStatus: "confirmed",
      isCheckedIn: false,
      checkInDate: { $lte: endOfToday },
      checkOutDate: { $gt: startOfToday }
    });

    if (!booking) {
      return res.status(400).json({
        message: "No valid booking found for today"
      });
    }

    booking.isCheckedIn = true;
    booking.checkedInAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: "Guest checked in successfully",
      booking
    });

  } catch (error) {
    next(error);
  }
};

export const roomCheckOut = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // const booking = await Booking.findOne({
    //   room: roomId,
    //   isCheckedIn: true,
    //   isCheckedOut: false
    // })
    const booking = await Booking.findOne({
      "rooms.room": roomId,
      isCheckedIn: true,
      isCheckedOut: false
    }).populate("user rooms.room");

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "No active check-in found for this room"
      });
    }

    if (
      booking.fine &&
      booking.fine.amount > 0 &&
      booking.fine.status === "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please clear fine before checkout"
      });
    }


    booking.isCheckedIn = false;
    booking.isCheckedOut = true;
    booking.checkedOutAt = new Date();
    booking.checkOutDate = new Date();

    await booking.save();
    await room.save();

    await notifyReceptionistCheckInOut({
      type: "CHECK_OUT",
      booking,
      room,
      user: booking.user
    });

    res.json({
      success: true,
      message: "Guest checked out successfully",
      booking
    });

  } catch (err) {
    next(err);
  }
};

export const checkOutBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("user", "firstName lastName email phoneNumber")
      .populate("rooms.room", "roomNumber name");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (!booking.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: "Guest has not checked in yet"
      });
    }


    if (booking.isCheckedOut) {
      return res.status(400).json({
        success: false,
        message: "Guest already checked out"
      });
    }

    if (booking.fine && booking.fine.amount > 0 && booking.fine.status === "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Please clear fine before checkout"
      });
    }

    booking.isCheckedIn = false;
    booking.isCheckedOut = true;
    booking.checkedOutAt = new Date();
    await booking.save();

    const room = await Room.findById(booking.room);
    await room.save();

    await notifyReceptionistCheckInOut({
      type: "CHECK_OUT",
      booking,
      user: booking.user,
      room
    });

    res.json({
      success: true,
      message: "Guest checked out successfully",
      booking
    });
  } catch (error) {
    next(error);
  }
};



export const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("rooms.room", "roomNumber")
      .populate("user", "firstName lastName email phoneNumber");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled"
      });
    }

    if (booking.isCheckedIn || booking.isCheckedOut) {
      return res.status(400).json({
        success: false,
        message: "Checked-in or completed bookings cannot be cancelled"
      });
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    const room = await Room.findById(booking.room);
    await room.save();


    await notifyReceptionistCheckInOut({
      type: "CANCELLED",
      booking,
      user: booking.user,
      room
    });
    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking
    });

  } catch (error) {
    next(error);
  }
};


export const sendInvoiceToWhatsApp = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("user")
      .populate("rooms.room");

    if (!booking.user.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "User phone number not found"
      });
    }


    const pdfBuffer = await generateInvoicePDFBuffer(booking);

    const pdfUpload = await uploadToCloudinary(
      { buffer: pdfBuffer, mimetype: "application/pdf" },
      "hotel/invoices"
    );

    await sendWhatsAppDocument({
      phone: booking.user.phoneNumber,
      documentUrl: pdfUpload.secure_url,
      filename: `Invoice-${booking.guestId}.pdf`
    });

    res.json({
      success: true,
      invoiceUrl: pdfUpload.secure_url
    });
  } catch (err) {
    next(err);
  }
};



const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_SECRET
});


export const payBookingFine = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (!booking.fine || booking.fine.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No fine applicable on this booking"
      });
    }

    if (booking.fine.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Fine already paid"
      });
    }

    const order = await razorpay.orders.create({
      amount: booking.fine.amount * 100,
      currency: "INR",
      receipt: `fine_${booking._id}`
    });

    booking.fine.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      order,
      bookingId: booking._id,
      fineAmount: booking.fine.amount
    });
  } catch (error) {
    next(error);
  }
};


export const verifyBookingFinePayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Fine payment verification failed"
      });
    }

    booking.fine.status = "PAID";
    booking.fine.razorpayPaymentId = razorpay_payment_id;
    booking.paymentStatus =
      booking.pendingAmount - booking.fine.amount <= 0
        ? "paid"
        : booking.paymentStatus;

    booking.pendingAmount = Math.max(
      booking.pendingAmount - booking.fine.amount,
      0
    );

    await booking.save();

    res.json({
      success: true,
      message: "Fine payment successful",
      booking
    });
  } catch (error) {
    next(error);
  }
};


export const fakeVerifyBookingFine = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        message: "Fake verify allowed only in development"
      });
    }

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    booking.fine.status = "PAID";
    booking.fine.razorpayPaymentId = "DEV_FINE_PAYMENT";
    booking.pendingAmount = Math.max(
      booking.pendingAmount - booking.fine.amount,
      0
    );

    if (booking.pendingAmount === 0) {
      booking.paymentStatus = "paid";
    }

    await booking.save();

    res.json({
      success: true,
      message: "DEV MODE: Fine payment marked as paid",
      booking
    });
  } catch (error) {
    next(error);
  }
};
