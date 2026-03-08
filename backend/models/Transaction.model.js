import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null
    },

    type: {
      type: String,
      enum: ["BOOKING_PAYMENT", "REFUND", "OFFLINE_BOOKING_PAYMENT"],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING"
    },
    coupon: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    paymentGateway: {
      type: String,
      enum: ["RAZORPAY"],
      default: "RAZORPAY"
    },

    razorpayOrderId: {
      type: String
    },

    razorpayPaymentId: {
      type: String
    },

    razorpaySignature: {
      type: String
    },

    notes: {
      type: String
    },
    paymentType: {
      type: String,
      enum: ["FULL", "PARTIAL"],
      required: true
    },
    membershipDiscount: {
      type: Number,
      default: 0
    },

    paidAmount: {
      type: Number,
      required: true
    }

  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);