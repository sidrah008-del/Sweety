
const pool = require("../config/db");

// Validate YYYY-MM-DD
const isValidReportDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

// Validate and resolve report date
const resolveReportDate = (date) => {
  const today = getToday();

  if (date === undefined || date === "") {
    return today;
  }

  if (!isValidReportDate(date)) {
    return null;
  }

  if (date > today) {
    return null;
  }

  return date;
};

// GET GLUCOSE REPORTS
const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date;

    // Validate selected date
    if (
      selectedDate !== undefined &&
      selectedDate !== "" &&
      !isValidReportDate(selectedDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Please use YYYY-MM-DD format.",
      });
    }

    const reportDate = resolveReportDate(selectedDate);

    if (!reportDate) {
      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed.",
      });
    }

    console.log("REPORT DEBUG:", {
      userId,
      selectedDate,
      reportDate,
    });

    // DAILY REPORT
    const dailyResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total_readings,
         ROUND(AVG(value), 1) AS average,
         MAX(value) AS highest,
         MIN(value) AS lowest
       FROM readings
       WHERE user_id = $1
         AND reading_date = $2::date`,
      [userId, reportDate]
    );

    // MONTH-TO-DATE REPORT
    const monthlyResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total_readings,
         ROUND(AVG(value), 1) AS average,
         MAX(value) AS highest,
         MIN(value) AS lowest
       FROM readings
       WHERE user_id = $1
         AND reading_date >= DATE_TRUNC('month', $2::date)::date
         AND reading_date <= $2::date`,
      [userId, reportDate]
    );

    // PREVIOUS CALENDAR MONTH
    const previousMonthResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total_readings,
         ROUND(AVG(value), 1) AS average,
         MAX(value) AS highest,
         MIN(value) AS lowest
       FROM readings
       WHERE user_id = $1
         AND reading_date >= (
           DATE_TRUNC('month', $2::date) - INTERVAL '1 month'
         )::date
         AND reading_date < DATE_TRUNC('month', $2::date)::date`,
      [userId, reportDate]
    );

    return res.status(200).json({
      success: true,
      reports: {
        daily: dailyResult.rows[0],
        monthly: monthlyResult.rows[0],
        previousMonth: previousMonthResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate reports",
    });
  }
};

// GET GLUCOSE TREND (LAST 30 DAYS FROM SELECTED DATE)
const getGlucoseTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date;

    if (
      selectedDate !== undefined &&
      selectedDate !== "" &&
      !isValidReportDate(selectedDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Please use YYYY-MM-DD format.",
      });
    }

    const reportDate = resolveReportDate(selectedDate);

    if (!reportDate) {
      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed.",
      });
    }

    const result = await pool.query(
      `SELECT
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         ROUND(AVG(value), 1) AS average,
         MIN(value) AS lowest,
         MAX(value) AS highest,
         COUNT(*)::int AS total_readings
       FROM readings
       WHERE user_id = $1
         AND reading_date >= ($2::date - INTERVAL '29 days')::date
         AND reading_date <= $2::date
       GROUP BY reading_date
       ORDER BY reading_date ASC`,
      [userId, reportDate]
    );

    return res.status(200).json({
      success: true,
      trend: result.rows,
    });
  } catch (error) {
    console.error("Get glucose trend error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch glucose trend",
    });
  }
};

module.exports = {
  getReports,
  getGlucoseTrend,
};
