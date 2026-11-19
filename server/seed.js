
const pool = require("./config/db");

const DEMO_USER = {
  email: "demo@sweety.com",
};

const slots = [
  { slot: "Morning (fasting)", value: 105 },
  { slot: "After breakfast", value: 145 },
  { slot: "After lunch", value: 158 },
  { slot: "After dinner", value: 132 },
];

async function seedDatabase() {
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Find existing demo account WITHOUT modifying it
    const result = await client.query(
      "SELECT id, name, email FROM users WHERE LOWER(email) = $1",
      [DEMO_USER.email]
    );

    if (result.rows.length === 0) {
      throw new Error("Existing demo account not found. No account was created.");
    }

    const user = result.rows[0];

    console.log("Existing demo account preserved:", user.email);

    let inserted = 0;

    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      const readingDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      for (const reading of slots) {
        const existing = await client.query(
          `SELECT id FROM readings
           WHERE user_id = $1
           AND reading_date = $2
           AND slot = $3`,
          [user.id, readingDate, reading.slot]
        );

        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO readings
             (user_id, reading_date, slot, value)
             VALUES ($1, $2, $3, $4)`,
            [user.id, readingDate, reading.slot, reading.value]
          );

          inserted++;
        }
      }
    }

    await client.query("COMMIT");

    console.log("\n========== SEED COMPLETE ==========");
    console.log("Database: Render PostgreSQL");
    console.log("Existing account preserved:", user.email);
    console.log("New readings:", inserted);
    console.log("===================================");

  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("SEED FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

seedDatabase();
