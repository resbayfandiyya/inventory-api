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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";

      const offset = (page - 1) * limit;

      let where = "";
      let params = [];

      if (search) {
        where = `
          WHERE
            name LIKE ?
            OR category LIKE ?
        `;

        params.push(`%${search}%`, `%${search}%`);
      }

      const [[{ total }]] = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM inventory
        ${where}
        `,
        params
      );

      const [rows] = await db.query(
        `
        SELECT *
        FROM inventory
        ${where}
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
        `,
        [...params, limit, offset]
      );

      res.json({
        data: rows,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      });

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