import Membership from "../models/Membership.model.js";
import User from "../models/User.model.js";
/* ================= CREATE / UPDATE ================= */
export const upsertMembership = async (req, res, next) => {
  try {
    const {
      name,
      discountType,
      discountValue,
      isActive = true
    } = req.body;

    if (!discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: "Discount type and value are required"
      });
    }

    if (discountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative"
      });
    }

    // Only one membership allowed
    const membership = await Membership.findOneAndUpdate(
      {},
      {
        name,
        discountType,
        discountValue,
        isActive,
        createdBy: req.user?._id
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Membership saved successfully",
      data: membership
    });
  } catch (error) {
    next(error);
  }
};

// 4 march
/* ================= DELETE MEMBERSHIP (ADMIN) ================= */
export const deleteMembership = async (req, res, next) => {
  try {
    // Only one membership is supported; safest is remove all docs.
    await Membership.deleteMany({});

    res.status(200).json({
      success: true,
      message: "Membership deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GET ACTIVE MEMBERSHIP ================= */
export const getActiveMembership = async (req, res, next) => {
  try {
    const membership = await Membership.findOne({ isActive: true });

    res.status(200).json({
      success: true,
      data: membership
    });
  } catch (error) {
    next(error);
  }
};

/* ================= ENABLE / DISABLE ================= */
export const toggleMembershipStatus = async (req, res, next) => {
  try {
    const membership = await Membership.findOne();
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found"
      });
    }

    membership.isActive = !membership.isActive;
    await membership.save();

    res.status(200).json({
      success: true,
      message: `Membership ${membership.isActive ? "activated" : "deactivated"}`,
      data: membership
    });
  } catch (error) {
    next(error);
  }
};


export const updateMembership = async (req, res, next) => {
  try {
    const {
      name,
      discountType,
      discountValue,
      isActive
    } = req.body;

    const membership = await Membership.findOne();

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found"
      });
    }

    /* ================= VALIDATION ================= */
    if (discountType && !["PERCENT", "FLAT"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type"
      });
    }

    if (discountValue !== undefined && discountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative"
      });
    }

    /* ================= UPDATE FIELDS ================= */
    if (name !== undefined) membership.name = name;
    if (discountType !== undefined) membership.discountType = discountType;
    if (discountValue !== undefined) membership.discountValue = discountValue;
    if (isActive !== undefined) membership.isActive = isActive;

    membership.createdBy = req.user?._id;

    await membership.save();

    res.status(200).json({
      success: true,
      message: "Membership updated successfully",
      data: membership
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GET MEMBERSHIP (ADMIN) ================= */
export const getMembershipForAdmin = async (req, res, next) => {
  try {
    const membership = await Membership.findOne(); // ❗ no isActive filter

    res.status(200).json({
      success: true,
      data: membership
    });
  } catch (error) {
    next(error);
  }
};


// GET /user/by-email?email=abc@gmail.com
export const getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.query; // ✅ FIX

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    return res.status(200).json({
      success: true,
      isMember: user?.isMember === true
    });
  } catch (error) {
    next(error);
  }
};



/* ================= GET MEMBERS (ADMIN) ================= */
export const getMembershipMembers = async (req, res, next) => {
  try {
    const members = await User.find({ isMember: true })
      .select("firstName lastName email phoneNumber createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

