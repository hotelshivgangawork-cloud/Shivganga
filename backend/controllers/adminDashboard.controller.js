import Booking from "../models/Booking.model.js";
import Receptionist from "../models/Receptionist.model.js";
import Room from "../models/Room.model.js";
import User from "../models/User.model.js";
import { exportBookingsToSheet } from "../services/googleSheet.service.js";

export const getTotalBookings = async (req, res) => {
  try {
    const total = await Booking.countDocuments({
      bookingStatus: "confirmed",
    });

    res.json({
      success: true,
      totalBookings: total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch total bookings",
    });
  }
};

export const getTodaysCheckIns = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const count = await Booking.countDocuments({
    checkInDate: { $gte: today, $lt: tomorrow },
    bookingStatus: "confirmed",
  });

  res.json({
    success: true,
    todaysCheckIns: count,
  });
};
export const getAllBookingsForAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("rooms.room", "roomNumber name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings"
    });
  }
};
export const getOccupancy = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const totalRooms = await Room.countDocuments();

  const occupiedRooms = await Booking.countDocuments({
    bookingStatus: "confirmed",
    checkInDate: { $lte: tomorrow },
    checkOutDate: { $gt: today },
  });

  const occupancy =
    totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);

  res.json({
    success: true,
    occupancy,
    occupiedRooms,
    totalRooms,
  });
};

export const getTotalRevenue = async (req, res) => {
  const revenue = await Booking.aggregate([
    {
      $match: { paymentStatus: "paid" },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  res.json({
    success: true,
    totalRevenue: revenue[0]?.total || 0,
  });
};

export const getMonthlyRevenue = async (req, res) => {
  const monthlyData = await Booking.aggregate([
    {
      $match: { paymentStatus: "paid" },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedData = months.map((month, index) => {
    const found = monthlyData.find((m) => m._id === index + 1);
    return {
      month,
      revenue: found ? found.revenue : 0,
    };
  });

  res.json({
    success: true,
    data: formattedData,
  });
};

export const getOccupancyTrends = async (req, res) => {
  const rawData = await Booking.aggregate([
    {
      $match: { bookingStatus: "confirmed" },
    },
    {
      $group: {
        _id: { $dayOfWeek: "$checkInDate" },
        count: { $sum: 1 },
      },
    },
  ]);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const formattedData = days.map((day, index) => {
    const found = rawData.find((d) => d._id === index + 1);
    return {
      day,
      count: found ? found.count : 0,
    };
  });

  res.json({
    success: true,
    data: formattedData,
  });
};

// export const getRecentActivities = async (req, res) => {
//   const bookings = await Booking.find({ bookingStatus: "confirmed" })
//     .sort({ updatedAt: -1 })
//     .limit(10)
//     .populate("rooms.room", "name roomNumber")
//     .populate("user", "firstName lastName");

//   let activities = [];

//   bookings.forEach((b) => {
//     const base = {
//       room: b.rooms
//         .map(r => `${r.room?.name} · Room ${r.room?.roomNumber}`)
//         .join(", "),
//       user: `${b.user.firstName} ${b.user.lastName}`,
//     };

//     // 🆕 Booking Created
//     activities.push({
//       type: "BOOKING",
//       title: "New Booking",
//       description: base.room,
//       user: base.user,
//       amount: b.totalAmount,
//       createdAt: b.createdAt,
//     });

//     // ✅ Guest Checked In
//     if (b.isCheckedIn) {
//       activities.push({
//         type: "CHECK_IN",
//         title: "Guest Checked In",
//         description: base.room,
//         user: base.user,
//         icon: "checkin",
//         createdAt: b.checkedInAt,
//       });
//     }

//     // 🚪 Guest Checked Out
//     if (b.isCheckedOut) {
//       activities.push({
//         type: "CHECK_OUT",
//         title: "Guest Checked Out",
//         description: base.room,
//         user: base.user,
//         icon: "checkout",
//         createdAt: b.checkedOutAt,
//       });
//     }
//   });

//   // Latest activity first
//   activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//   res.json({
//     success: true,
//     activities: activities.slice(0, 10),
//   });
// };

// 4 march 11.58 pm
export const getRecentActivities = async (req, res) => {
  const bookings = await Booking.find({ bookingStatus: "confirmed" })
    .sort({ updatedAt: -1 })
    .limit(10)
    .populate("room", "name roomNumber")
    .populate("user", "firstName lastName");

  let activities = [];

  bookings.forEach((b) => {
    const base = {
      room: `${b.room.name} · Room ${b.room.roomNumber}`,
      user: `${b.user.firstName} ${b.user.lastName}`,
    };

    // 🆕 Booking Created
    activities.push({
      type: "BOOKING",
      title: "New Booking",
      description: base.room,
      user: base.user,
      amount: b.totalAmount,
      createdAt: b.createdAt,
    });

    // ✅ Guest Checked In
    if (b.isCheckedIn) {
      activities.push({
        type: "CHECK_IN",
        title: "Guest Checked In",
        description: base.room,
        user: base.user,
        icon: "checkin",
        createdAt: b.checkedInAt,
      });
    }

    // 🚪 Guest Checked Out
    if (b.isCheckedOut) {
      activities.push({
        type: "CHECK_OUT",
        title: "Guest Checked Out",
        description: base.room,
        user: base.user,
        icon: "checkout",
        createdAt: b.checkedOutAt,
      });
    }
  });

  // Latest activity first
  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    activities: activities.slice(0, 10),
  });
};

export const exportBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate("user").populate("rooms.room");

    await exportBookingsToSheet(bookings);

    res.json({
      success: true,
      message: "Bookings exported to Google Sheet",
    });
  } catch (error) {
    next(error);
  }
};

export const getReceptionistStatus = async (req, res) => {
  const receptionists = await Receptionist.find({ role: "receptionist" })
    .select("firstName lastName email employeeId isActive createdAt")
    .sort({ createdAt: -1 });

  const formatted = receptionists.map((r) => ({
    name: `${r?.firstName} ${r?.lastName}`,
    employeeId: r?.employeeId,
    email: r?.email,
    status: r?.isActive ? "Active" : "Inactive",
    isActive: r?.isActive,
  }));

  res.json({
    success: true,
    total: formatted.length,
    active: formatted.filter((r) => r.isActive).length,
    inactive: formatted.filter((r) => !r.isActive).length,
    data: formatted,
  });
};

export const getRoomStatusSummary = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();

    const availableRooms = await Room.countDocuments({
      status: "Available",
    });

    const occupiedRooms = await Room.countDocuments({
      status: "Occupied",
    });

    const maintenanceRooms = await Room.countDocuments({
      status: "Maintenance",
    });

    res.json({
      success: true,
      data: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch room status summary",
    });
  }
};