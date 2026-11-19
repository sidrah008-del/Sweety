
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  addReading,
  getReadings,
  getDashboardSummary,
  updateReading,
  deleteReading,
} = require("../controllers/readingController");

// All routes require authentication
router.use(protect);

// Dashboard summary
router.get("/summary", getDashboardSummary);

// Add a glucose reading
router.post("/", addReading);

// Get logged-in user's readings
router.get("/", getReadings);

// Edit a glucose reading
router.put("/:id", updateReading);

// Delete a glucose reading
router.delete("/:id", deleteReading);

module.exports = router;
