import express from "express"
import app from "./app.js"
import {config} from "./configs/env.js"
import {connectDB} from "./configs/db.js"

const PORT = process.env.PORT || config.PORT || 5000;

const startServer = async () => {
  try {
    console.log(`🚀 Starting server in ${process.env.NODE_ENV || 'development'} mode...`);

    // Start listening as soon as possible to avoid Render's port scan timeout
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server is listening on port: ${PORT}`);
      console.log(`🌐 Accessible at 0.0.0.0:${PORT}`);
    });

    // Then connect to the database
    await connectDB();

  } catch (error) {
    console.error("❌ FAILED TO START SERVER:", error);
    process.exit(1);
  }
};

startServer();