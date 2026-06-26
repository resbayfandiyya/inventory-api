const mysql = require("mysql2");

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

connection.getConnection((err, conn) => {
  if (err) {
    console.log("❌ Database gagal terhubung");
    console.log(err.message);
    return;
  }

  console.log("✅ Database Railway Connected");
  conn.release();
});

module.exports = connection.promise();