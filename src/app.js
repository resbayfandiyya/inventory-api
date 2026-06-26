require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/users");
const inventoryRoutes = require("./routes/inventory");
const dashboardRoutes = require("./routes/dashboard");
const salesRoutes = require("./routes/sales");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const path = require("path");
const notificationRoutes = require("./routes/notifications");



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/uploads", express.static( path.join(__dirname, "../uploads")));
app.use("/api/notifications", notificationRoutes);

module.exports = app;