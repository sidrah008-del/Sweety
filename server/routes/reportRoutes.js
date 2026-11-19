const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getReports,
  getGlucoseTrend,
} = require("../controllers/reportController");

// All report routes require authentication
router.use(protect);

// Get glucose reports
router.get("/", getReports);

// Get glucose trend (last 30 days)
router.get("/trend", getGlucoseTrend);

module.exports = router;