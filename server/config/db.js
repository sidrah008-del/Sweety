
const { Pool } = require("pg");
require("dotenv").config();

// Use Render DATABASE_URL in production.
// Use individual DB variables for local development.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({
  ...poolConfig,
  max: 5,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
  console.log("PostgreSQL connected successfully!");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err.message);
});

module.exports = pool;
