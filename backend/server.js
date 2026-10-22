const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const os = require("os");
require("dotenv").config();

const app = express();

const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${os.hostname()}`;
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Identify which backend instance served each request (Round-robin verification)
app.use((req, res, next) => {
  res.setHeader("X-Backend-Instance", INSTANCE_ID);
  res.setHeader("X-Backend-Port", PORT.toString());
  next();
});

// Complaint routes
const complaintRoutes = require("./routes/complaints");
app.use("/api/complaints", complaintRoutes);

// Auth routes (Registration, Login, TOTP MFA)
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`[${INSTANCE_ID}] MongoDB connected successfully!`);
  })
  .catch((error) => {
    console.error(`[${INSTANCE_ID}] MongoDB connection failed:`, error.message);
  });

// Health & Root Status API
app.get("/", (req, res) => {
  res.json({
    message: "College Complaint Portal API is running!",
    instance: INSTANCE_ID,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    instance: INSTANCE_ID,
    port: PORT,
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`[${INSTANCE_ID}] Server running on port ${PORT}`);
});
