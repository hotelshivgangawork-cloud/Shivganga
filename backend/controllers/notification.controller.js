// import Notification from "../models/Notification.model.js";

// export const getReceptionistNotifications = async (req, res) => {
//   try {
//     const notifications = await Notification.find({
//       role: { $in: ["receptionist", "admin"] },
//     })
//       .populate("guest")
//       .populate({
//         path: "booking",
//         populate: [
//           // FIX: was { path: "room", model: "Room" } — booking has no singular "room" field
//           // Must populate the nested rooms.room path instead
//           { path: "rooms.room", model: "Room" },
//           { path: "user", model: "User" },
//         ],
//       })
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       data: notifications,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// export const getUnreadNotificationCount = async (req, res, next) => {
//   try {
//     const count = await Notification.countDocuments({
//       role: "receptionist",
//       isRead: false,
//     });

//     res.status(200).json({
//       success: true,
//       unreadCount: count,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const markNotificationAsRead = async (req, res, next) => {
//   try {
//     const { notificationId } = req.params;

//     const notification = await Notification.findById(notificationId);
//     if (!notification) {
//       return res.status(404).json({
//         success: false,
//         message: "Notification not found",
//       });
//     }

//     notification.isRead = true;
//     await notification.save();

//     res.status(200).json({
//       success: true,
//       message: "Notification marked as read",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const markAllNotificationsAsRead = async (req, res, next) => {
//   try {
//     await Notification.updateMany(
//       { role: "receptionist", isRead: false },
//       { $set: { isRead: true } },
//     );

//     res.status(200).json({
//       success: true,
//       message: "All notifications marked as read",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const markNotificationAsUnread = async (req, res, next) => {
//   try {
//     const { notificationId } = req.params;

//     const notification = await Notification.findById(notificationId);
//     if (!notification) {
//       return res.status(404).json({
//         success: false,
//         message: "Notification not found",
//       });
//     }

//     notification.isRead = false;
//     await notification.save();

//     res.status(200).json({
//       success: true,
//       message: "Notification marked as unread",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const deleteNotification = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const notification = await Notification.findByIdAndDelete(id);

//     if (!notification) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Notification not found" });
//     }

//     res
//       .status(200)
//       .json({ success: true, message: "Notification deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error", error });
//   }
// };

import Notification from "../models/Notification.model.js";

export const getReceptionistNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      role: { $in: ["receptionist", "admin"] },
    })
      .populate("guest")
      .populate({
        path: "booking",
        populate: [
          { path: "rooms.room", model: "Room" }, // This is correct for nested rooms
          { path: "user", model: "User" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      role: "receptionist",
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { role: "receptionist", isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsUnread = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = false;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as unread",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};