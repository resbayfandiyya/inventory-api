const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require(
  "../middleware/authMiddleware"
);

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          id,
          name,
          stock
        FROM inventory
        WHERE stock <= 5
        ORDER BY stock ASC
      `);

      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;