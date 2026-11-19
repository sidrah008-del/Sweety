
const bcrypt = require("bcrypt");
const pool = require("./config/db");

const DEMO_USER = {
  name: "Sweety Demo",
  email: "demo@sweety.com",
  password: "SweetyDemo@123",
};

const slots = [
  { slot: "Morning (fasting)", value: 105 },
  { slot: "After breakfast", value: 145 },
  { slot: "After lunch", value: 158 },
  { slot: "After dinner", value: 132 },
];

const getLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Find or create demo user
    const normalizedEmail = DEMO_USER.email.toLowerCase();

    let userResult = await client.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [normalizedEmail]
    );

    let user;

    if (userResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(
        DEMO_USER.password,
        12
      );

      userResult = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [
          DEMO_USER.name,
          normalizedEmail,
          hashedPassword,
        ]
      );

      user = userResult.rows[0];
      console.log("Demo user created successfully!");
    } else {
      user = userResult.rows[0];
      console.log("Demo user already exists.");
    }

    // 2. Generate readings for the previous 7 days
    let insertedCount = 0;

    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const readingDate = new Date();
      readingDate.setDate(readingDate.getDate() - daysAgo);

      const formattedDate = getLocalDate(readingDate);

      for (const reading of slots) {
        const result = await client.query(
          `INSERT INTO readings
            (user_id, reading_date, slot, value)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, reading_date, slot)
           DO NOTHING
           RETURNING id`,
          [
            user.id,
            formattedDate,
            reading.slot,
            reading.value,
          ]
        );

        if (result.rowCount > 0) {
          insertedCount++;
        }
      }
    }

    await client.query("COMMIT");

    console.log("\n========== SEED SUMMARY ==========");
    console.log("Demo account:", user.email);
    console.log("User ID:", user.id);
    console.log("New readings inserted:", insertedCount);
    console.log("Existing readings preserved.");
    console.log("==================================");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
