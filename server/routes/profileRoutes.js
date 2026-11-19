
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { updateProfile } = require("../controllers/profileController");

// Update logged-in user's profile
router.put("/", protect, updateProfile);

module.exports = router;
