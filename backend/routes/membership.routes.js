import express from "express";
import {
  upsertMembership,
  getActiveMembership,
  toggleMembershipStatus,
  updateMembership,
  getMembershipForAdmin,
  getUserByEmail,
  getMembershipMembers,
  deleteMembership,
} from "../controllers/membership.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

/* ================= ADMIN ================= */

// CREATE / UPDATE (UPSERT)
router.post(
  "/membership",
  authMiddleware,
  roleMiddleware("admin"),
  upsertMembership
);

// UPDATE (PATCH)
router.patch(
  "/membership",
  authMiddleware,
  roleMiddleware("admin"),
  updateMembership
);

// ENABLE / DISABLE
router.patch(
  "/membership/toggle",
  authMiddleware,
  roleMiddleware("admin"),
  toggleMembershipStatus
);

// 4 march
// DELETE MEMBERSHIP (REMOVE / DISABLE COMPLETELY)
router.delete(
  "/membership",
  authMiddleware,
  roleMiddleware("admin"),
  deleteMembership,
);

// 🔥 GET MEMBERSHIP FOR ADMIN (IMPORTANT)
router.get(
  "/membership",
  authMiddleware,
  roleMiddleware("admin"),
  getMembershipForAdmin
);

// 👥 GET ALL MEMBERS
router.get(
  "/membership/members",
  authMiddleware,
  roleMiddleware("admin"),
  getMembershipMembers
);


/* ================= USER ================= */

// GET ACTIVE MEMBERSHIP (BOOKING PAGE)
router.get(
  "/membership/active",
  getActiveMembership
);

router.get("/membership/user/by-email", getUserByEmail);

export default router;
