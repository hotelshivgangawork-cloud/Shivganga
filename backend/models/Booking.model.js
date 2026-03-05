import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    rooms: [
      {
        room: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Room",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        plan: {
          type: String,
          default: "ep",
        },
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkInDate: {
      type: Date,
      required: true,
    },
    guestId: {
      type: String,
      unique: true,
      required: true,
    },
    bookingReference: {
      type: String,
      default: null,
    },

    checkOutDate: {
      type: Date,
      required: true,
    },

    adults: {
      type: Number,
      required: true,
      min: 1,
    },

    children: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedOutAt: {
      type: Date,
      default: null,
    },

    isCheckedIn: {
      type: Boolean,
      default: false,
    },

    isCheckedOut: {
      type: Boolean,
      default: false,
    },
    paymentType: {
      type: String,
      enum: ["FULL", "PARTIAL"],
      default: "FULL",
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    pendingAmount: {
      type: Number,
      default: 0,
    },
    coupon: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    id: {
      type: String,
    },

    idDocument: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    addOns: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    extraBeds: {
      count: {
        type: Number,
        default: 0,
      },
      pricePerBed: {
        type: Number,
        default: 0,
      },
      totalPrice: {
        type: Number,
        default: 0,
      },
    },
    fine: {
      amount: { type: Number, default: 0 },
      reason: String,
      status: {
        type: String,
        enum: ["PENDING", "PAID"],
        default: "PENDING",
      },
    },
    membershipDiscount: {
      type: Number,
      default: 0
    },
    priceBreakdown: {
      roomTotal: Number,
      serviceFee: Number,
      tourismLevy: Number,
      extraMattressTotal: Number,
      activityTotal: Number,
      companyDiscount: Number,
      couponDiscount: Number,
      membershipDiscount: Number,
      grandTotal: Number,
    }
  },
  { timestamps: true },
);

// Add this just before the index line

bookingSchema.virtual("computedPriceBreakdown").get(function () {
  // If priceBreakdown was already saved, return it as-is
  if (this.priceBreakdown?.grandTotal) {
    return this.priceBreakdown;
  }

  // Otherwise calculate from existing top-level fields
  const roomTotal = this.totalAmount
    - (this.serviceFee || 0)
    - (this.tourismFee || 0)
    - (this.extraBeds?.totalPrice || 0)
    + (this.membershipDiscount || 0)
    + (this.couponDiscount || 0);

  return {
    roomTotal: Math.max(0, roomTotal),
    serviceFee: this.serviceFee || 0,
    tourismLevy: this.tourismFee || 0,
    extraMattressTotal: this.extraBeds?.totalPrice || 0,
    activityTotal: 0, // not stored separately on old bookings
    companyDiscount: 0,
    couponDiscount: this.couponDiscount || 0,
    membershipDiscount: this.membershipDiscount || 0,
    grandTotal: this.totalAmount,
  };
});

// Make virtuals show up in JSON responses
bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

//INDEX (important for lookup)
bookingSchema.index({ "rooms.room": 1, checkInDate: 1, checkOutDate: 1 });


//PREVENT OVERLAPPING BOOKINGS
bookingSchema.pre("save", async function () {

  if (!this.rooms || this.rooms.length === 0) return;

  if (this.checkInDate) {
    this.checkInDate.setHours(0, 0, 0, 0);
  }

  if (this.checkOutDate) {
    this.checkOutDate.setHours(0, 0, 0, 0);
  }

  for (const r of this.rooms) {
    const overlapping = await mongoose.model("Booking").findOne({
      "rooms.room": r.room,
      bookingStatus: "confirmed",
      isCheckedOut: false,
      checkInDate: { $lt: this.checkOutDate },
      checkOutDate: { $gt: this.checkInDate },
      _id: { $ne: this._id }
    });

    if (overlapping) {
      throw new Error("Room already booked for selected dates");
    }
  }
});

export default mongoose.model("Booking", bookingSchema);