import cron from "node-cron";
import Coupon from "../models/Coupon.model.js";

console.log("⏳ Scheduling Coupon Cron job...");
cron.schedule("*/30 * * * *", async () => {
  const now = new Date();


  await Coupon.updateMany(
    {
      isActive: false,
      startDate: { $lte: now },
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }]
    },
    { $set: { isActive: true } }
  );


  await Coupon.updateMany(
    {
      isActive: true,
      expiryDate: { $lt: now }
    },
    { $set: { isActive: false } }
  );


  await Coupon.updateMany(
    {
      usageLimit: { $ne: null },
      $expr: { $gte: ["$usageCount", "$usageLimit"] }
    },
    { $set: { isActive: false } }
  );

  console.log("Coupon cron executed");
});
