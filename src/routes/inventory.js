const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET all inventory (with authMiddleware)
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT * FROM inventory ORDER BY id DESC"
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// POST inventory (with authMiddleware)
router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const { name, category, stock, price } = req.body;

      if (
        !name ||
        !category ||
        stock === undefined ||
        price === undefined
      ) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      const [result] = await db.query(
        `
        INSERT INTO inventory
        (name, category, stock, price)
        VALUES (?, ?, ?, ?)
        `,
        [name, category, stock, price]
      );

      res.status(201).json({
        message: "Product created successfully",
        id: result.insertId,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// PUT update inventory
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, stock, price } = req.body;

    if (
      !name ||
      !category ||
      stock === undefined ||
      price === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    await db.query(
      `
      UPDATE inventory
      SET name = ?, category = ?, stock = ?, price = ?
      WHERE id = ?
      `,
      [name, category, stock, price, id]
    );

    res.json({
      message: "Product updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// DELETE inventory
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM inventory WHERE id = ?",
      [id]
    );

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;