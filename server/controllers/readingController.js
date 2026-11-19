
const pool = require("../config/db");

const ALLOWED_SLOTS = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];

const MAX_DAILY_READINGS = 4;
const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 1000000;

// COMMON READING VALIDATION
const validateReading = (reading_date, slot, value) => {
  if (
    !reading_date ||
    !slot ||
    value === undefined ||
    value === null
  ) {
    return "Please provide date, slot and glucose value";
  }

  if (
    typeof reading_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
  ) {
    return "Date must be in YYYY-MM-DD format";
  }

  const [year, month, day] = reading_date.split("-").map(Number);

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return "Please provide a valid date";
  }

  if (!ALLOWED_SLOTS.includes(slot)) {
    return "Invalid reading slot";
  }

  if (
    !Number.isInteger(value) ||
    value < 40 ||
    value > 600
  ) {
    return "Glucose value must be a whole number between 40 and 600 mg/dL";
  }

  return null;
};

// SAFE TRANSACTION ROLLBACK
const safeRollback = async (client, transactionStarted) => {
  if (!client || !transactionStarted) return;

  try {
    await client.query("ROLLBACK");
  } catch (error) {
    console.error("Transaction rollback error:", error.message);
  }
};

// VALIDATE READING ID
const isValidReadingId = (id) => {
  return (
    typeof id === "string" &&
    /^[1-9]\d*$/.test(id) &&
    Number.isSafeInteger(Number(id))
  );
};

// STRICT PAGINATION VALIDATION
const validatePagination = (req) => {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  console.log("PAGINATION DEBUG:", {
    url: req.originalUrl,
    query: req.query,
    rawPage,
    rawLimit,
  });

  // Validate page
  if (rawPage !== undefined) {
    if (
      typeof rawPage !== "string" ||
      !/^[1-9]\d*$/.test(rawPage) ||
      !Number.isSafeInteger(Number(rawPage)) ||
      Number(rawPage) > MAX_PAGE
    ) {
      return {
        error: "Invalid page number",
      };
    }
  }

  // Validate limit
  if (rawLimit !== undefined) {
    if (
      typeof rawLimit !== "string" ||
      !/^[1-9]\d*$/.test(rawLimit) ||
      !Number.isSafeInteger(Number(rawLimit)) ||
      Number(rawLimit) > MAX_PAGE_SIZE
    ) {
      return {
        error: "Limit must be between 1 and 100",
      };
    }
  }

  const page = rawPage === undefined ? 1 : Number(rawPage);
  const limit = rawLimit === undefined ? 20 : Number(rawLimit);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

// ADD GLUCOSE READING
const addReading = async (req, res) => {
  const { reading_date, slot, value } = req.body;
  const user_id = req.user.id;

  const validationError = validateReading(reading_date, slot, value);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE",
      [user_id]
    );

    const futureCheck = await client.query(
      "SELECT $1::date > CURRENT_DATE AS is_future",
      [reading_date]
    );

    if (futureCheck.rows[0].is_future) {
      await safeRollback(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed",
      });
    }

    const countResult = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [user_id, reading_date]
    );

    if (countResult.rows[0].total >= MAX_DAILY_READINGS) {
      await safeRollback(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Maximum 4 readings allowed per day",
      });
    }

    const result = await client.query(
      `INSERT INTO readings (
        user_id, reading_date, slot, value
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id,
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
        slot,
        value,
        created_at`,
      [user_id, reading_date, slot, value]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Glucose reading added successfully",
      reading: result.rows[0],
    });

  } catch (error) {
    await safeRollback(client, transactionStarted);
    transactionStarted = false;

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this slot and date",
      });
    }

    console.error("Add reading error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to add glucose reading",
    });

  } finally {
    if (client) client.release();
  }
};

// GET READINGS WITH STRICT PAGINATION
const getReadings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const pagination = validatePagination(req);

    if (pagination.error) {
      return res.status(400).json({
        success: false,
        message: pagination.error,
      });
    }

    const { page, limit, offset } = pagination;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM readings
       WHERE user_id = $1`,
      [user_id]
    );

    const totalReadings = countResult.rows[0].total;
    const totalPages = Math.ceil(totalReadings / limit);

    const todayCountResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM readings
       WHERE user_id = $1
       AND reading_date = CURRENT_DATE`,
      [user_id]
    );

    const todayCount = todayCountResult.rows[0].total;

    const result = await pool.query(
      `SELECT
        id,
        user_id,
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
        slot,
        value,
        created_at
       FROM readings
       WHERE user_id = $1
       ORDER BY
        reading_date DESC,
        created_at DESC,
        id DESC
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );

    return res.status(200).json({
      success: true,
      readings: result.rows,
      pagination: {
        currentPage: page,
        limit,
        totalReadings,
        totalPages,
      },
      todayCount,
    });

  } catch (error) {
    console.error("Get readings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch readings",
    });
  }
};

// GET DASHBOARD SUMMARY
const getDashboardSummary = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total_readings,
        COUNT(*) FILTER (
          WHERE reading_date = CURRENT_DATE
        )::int AS today_count,
        ROUND(AVG(value), 1) AS average_glucose
       FROM readings
       WHERE user_id = $1`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      summary: result.rows[0],
    });

  } catch (error) {
    console.error("Dashboard summary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
    });
  }
};

// EDIT GLUCOSE READING
const updateReading = async (req, res) => {
  const { id } = req.params;
  const { reading_date, slot, value } = req.body;
  const user_id = req.user.id;

  if (!isValidReadingId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid reading ID",
    });
  }

  const validationError = validateReading(reading_date, slot, value);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE",
      [user_id]
    );

    const existing = await client.query(
      `SELECT id
       FROM readings
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [id, user_id]
    );

    if (existing.rows.length === 0) {
      await safeRollback(client, transactionStarted);
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Reading not found",
      });
    }

    const futureCheck = await client.query(
      "SELECT $1::date > CURRENT_DATE AS is_future",
      [reading_date]
    );

    if (futureCheck.rows[0].is_future) {
      await safeRollback(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed",
      });
    }

    const countResult = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM readings
       WHERE user_id = $1
       AND reading_date = $2
       AND id != $3`,
      [user_id, reading_date, id]
    );

    if (countResult.rows[0].total >= MAX_DAILY_READINGS) {
      await safeRollback(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Maximum 4 readings allowed per day",
      });
    }

    const result = await client.query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, value = $3
       WHERE id = $4 AND user_id = $5
       RETURNING
         id,
         user_id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         slot,
         value,
         created_at`,
      [reading_date, slot, value, id, user_id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: "Glucose reading updated successfully",
      reading: result.rows[0],
    });

  } catch (error) {
    await safeRollback(client, transactionStarted);
    transactionStarted = false;

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this slot and date",
      });
    }

    console.error("Update reading error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update glucose reading",
    });

  } finally {
    if (client) client.release();
  }
};

// DELETE GLUCOSE READING
const deleteReading = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    if (!isValidReadingId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reading ID",
      });
    }

    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reading not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reading deleted successfully",
    });

  } catch (error) {
    console.error("Delete reading error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete glucose reading",
    });
  }
};

module.exports = {
  addReading,
  getReadings,
  getDashboardSummary,
  updateReading,
  deleteReading,
};