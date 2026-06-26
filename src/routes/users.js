const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require(
  "../middleware/roleMiddleware"
);

// GET all users (menggunakan authMiddleware)
router.get("/", authMiddleware, roleMiddleware("Admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role, status FROM users ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// CREATE user (menggunakan authMiddleware)
router.post("/", authMiddleware, roleMiddleware("Admin"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      status,
    } = req.body;

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "Email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const [result] = await db.query(
      `
      INSERT INTO users (
        name,
        email,
        password,
        role,
        status
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        name,
        email,
        hashedPassword,
        role,
        status,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// UPDATE user
router.put("/:id",  authMiddleware, roleMiddleware("Admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      role,
      status,
    } = req.body;

    await db.query(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        role = ?,
        status = ?
      WHERE id = ?
      `,
      [name, email, role, status, id]
    );

    res.json({
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// DELETE user
router.delete("/:id",  authMiddleware,
  roleMiddleware("Admin"), async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


module.exports = router;