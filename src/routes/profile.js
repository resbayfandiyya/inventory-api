const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

const db = require("../config/db");
const upload = require("../config/upload");
const authMiddleware = require(
  "../middleware/authMiddleware"
);

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `
        SELECT
          id,
          name,
          email,
          role,
          avatar,
          status
        FROM users
        WHERE id = ?
        `,
        [req.user.id]
      );

      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.put(
    "/",
    authMiddleware,
    upload.single("avatar"),
    async (req, res) => {
      try {
        const { name, email } = req.body;
  
        let avatar = null;
  
        if (req.file) {
          avatar = req.file.filename;
        }
  
        const query = avatar
          ? `
            UPDATE users
            SET
              name = ?,
              email = ?,
              avatar = ?
            WHERE id = ?
          `
          : `
            UPDATE users
            SET
              name = ?,
              email = ?
            WHERE id = ?
          `;
  
        const values = avatar
          ? [name, email, avatar, req.user.id]
          : [name, email, req.user.id];
  
        await db.query(query, values);
  
        const [rows] = await db.query(
          `
          SELECT
            id,
            name,
            email,
            role,
            avatar
          FROM users
          WHERE id = ?
          `,
          [req.user.id]
        );
  
        res.json(rows[0]);
      } catch (error) {
        res.status(500).json({
          message: error.message,
        });
      }
    }
  );

module.exports = router;