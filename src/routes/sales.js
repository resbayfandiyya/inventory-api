const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET sales (protected with authMiddleware)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const offset = (page - 1) * limit;

    const searchQuery = `%${search}%`;

    let whereClause = `
      WHERE (
        s.invoice_number LIKE ?
        OR s.customer_name LIKE ?
      )
    `;

    const params = [searchQuery, searchQuery];

    if (startDate && endDate) {
      whereClause += `
        AND DATE(s.created_at)
        BETWEEN ? AND ?
      `;
      params.push(startDate, endDate);
    }

    const [[totalData]] = await db.query(
      `
      SELECT COUNT(DISTINCT s.id) AS total
      FROM sales s
      ${whereClause}
      `,
      params
    );

    const [rows] = await db.query(
      `
      SELECT
        s.id,
        s.invoice_number,
        s.customer_name,
        s.payment_method,
        s.total_amount,
        s.created_at,
        GROUP_CONCAT(i.name SEPARATOR ', ') AS products
      FROM sales s
      LEFT JOIN sale_items si
        ON s.id = si.sale_id
      LEFT JOIN inventory i
        ON si.product_id = i.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      total: totalData.total,
      page,
      limit,
      totalPages: Math.ceil(
        totalData.total / limit
      ),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// POST sales (protected with authMiddleware)
router.post("/", authMiddleware, async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      customer_name,
      payment_method,
      items,
    } = req.body;

    let totalAmount = 0;

    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }

    const invoiceNumber = `INV-${Date.now()}`;

    const [saleResult] = await connection.query(
      `
      INSERT INTO sales (
        invoice_number,
        customer_name,
        total_amount,
        payment_method
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        invoiceNumber,
        customer_name,
        totalAmount,
        payment_method,
      ]
    );

    const saleId = saleResult.insertId;

    for (const item of items) {
      const subtotal = item.price * item.quantity;

      await connection.query(
        `
        INSERT INTO sale_items (
          sale_id,
          product_id,
          quantity,
          price,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          saleId,
          item.product_id,
          item.quantity,
          item.price,
          subtotal,
        ]
      );

      await connection.query(
        `
        UPDATE inventory
        SET stock = stock - ?
        WHERE id = ?
        `,
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Transaction created successfully",
      invoice_number: invoiceNumber,
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      message: error.message,
    });
  } finally {
    connection.release();
  }
});

//delete sales
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [items] = await connection.query(
      `
      SELECT product_id, quantity
      FROM sale_items
      WHERE sale_id = ?
      `,
      [id]
    );

    if (items.length === 0) {
      throw new Error("Transaction not found");
    }

    for (const item of items) {
      await connection.query(
        `
        UPDATE inventory
        SET stock = stock + ?
        WHERE id = ?
        `,
        [item.quantity, item.product_id]
      );
    }

    await connection.query(
      `
      DELETE FROM sale_items
      WHERE sale_id = ?
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM sales
      WHERE id = ?
      `,
      [id]
    );

    await connection.commit();

    res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      message: error.message,
    });
  } finally {
    connection.release();
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[sale]] = await db.query(
      `
      SELECT *
      FROM sales
      WHERE id = ?
      `,
      [id]
    );

    if (!sale) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const [items] = await db.query(
      `
      SELECT
        si.id,
        si.quantity,
        si.price,
        si.subtotal,
        i.name AS product_name,
        i.category
      FROM sale_items si
      JOIN inventory i
        ON si.product_id = i.id
      WHERE si.sale_id = ?
      `,
      [id]
    );

    res.json({
      ...sale,
      items,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;