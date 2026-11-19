
const pool = require("../config/db");

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate name
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    const updatedName = name.trim();

    const result = await pool.query(
      `UPDATE users
       SET name = $1
       WHERE id = $2
       RETURNING id, name, email`,
      [updatedName, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

module.exports = { updateProfile };
