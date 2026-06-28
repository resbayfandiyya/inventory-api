const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET dashboard stats (protected)
router.get(
  "/stats",
  authMiddleware,
  async (req, res) => {
    try {
      const [[users]] = await db.query(
        "SELECT COUNT(*) AS totalUsers FROM users"
      );

      const [[products]] = await db.query(
        "SELECT COUNT(*) AS totalProducts FROM inventory"
      );

      const [[lowStock]] = await db.query(
        "SELECT COUNT(*) AS lowStock FROM inventory WHERE stock <= 20"
      );

      const [[inventoryValue]] = await db.query(`
        SELECT SUM(stock * price) AS totalValue
        FROM inventory
      `);

      res.json({
        totalUsers: users.totalUsers,
        totalProducts: products.totalProducts,
        lowStock: lowStock.lowStock,
        totalValue: inventoryValue.totalValue || 0,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// GET revenue (protected)
router.get(
  "/revenue",
  authMiddleware,
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          YEAR(created_at) AS year,
          MONTH(created_at) AS month_number,
          DATE_FORMAT(MIN(created_at), '%b') AS month,
          SUM(total_amount) AS revenue
        FROM sales
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY YEAR(created_at), MONTH(created_at)
      `);

      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// Example POST route (protected, as requested)
router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    // Implement your POST logic here
    res.status(501).json({ message: "Not implemented" });
  }
);

module.exports = router;