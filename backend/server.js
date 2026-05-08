import "./init.js";
import express from "express";
import { config } from "./configs/env.js";
import { connectDB } from "./configs/db.js";

const PORT = process.env.PORT || config.PORT || 5000;

// Create a minimal bootstrap app to satisfy Render's port scan instantly
const serverApp = express();

// Basic health check for the bootstrap phase
serverApp.get("/health", (req, res) => res.status(200).json({ status: "booting" }));
serverApp.get("/", (req, res) => res.status(200).send("Server is starting up... Please refresh in a moment."));

const startServer = async () => {
  try {
    console.log(`🚀 Bootstrap sequence started on port ${PORT}...`);

    // 1. Start listening IMMEDIATELY (Before any heavy imports)
    const server = serverApp.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Port ${PORT} is now open and detectable by Render.`);
    });

    // 2. Connect to Database
    console.log("⏳ Connecting to database...");
    await connectDB();
    console.log("✅ Database connection established.");

    // 3. Dynamically import the heavy main application
    console.log("⏳ Loading main application (routes, middleware, services)...");
    const { default: realApp } = await import("./app.js");
    
    // 4. Hot-swap the bootstrap app with the real application
    // We remove the old request listeners and attach the real express app
    server.removeAllListeners('request');
    server.on('request', realApp);
    
    console.log("✨ MAIN APPLICATION IS NOW FULLY LIVE AND READY! ✨");

  } catch (error) {
    console.error("❌ CRITICAL DEPLOYMENT ERROR:", error);
    process.exit(1);
  }
};

startServer();

// Catch unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION AT BOOT:", reason);
});