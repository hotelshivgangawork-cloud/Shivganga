import mongoose from "mongoose"
import {config} from "./env.js"

export const connectDB = async () => {
  try {
    if (!config.MONGO_URI) {
      console.error("❌ ERROR: MONGO_URI is not defined in environment variables!");
      process.exit(1);
    }

    await mongoose.connect(config.MONGO_URI, { family: 4 });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ DATABASE CONNECTION ERROR:", error.message);
    console.error("Please check if your IP is whitelisted in MongoDB Atlas and if the credentials are correct.");
    process.exit(1);
  }
};