const express = require("express");
const mongoose = require("mongoose");
const User = require("../db/userModel");
const router = express.Router();

router.get("/list", async (req, res) => {
  try {
    // Fetch only required fields using select (projection)
    const users = await User.find()
      .select("_id first_name last_name")
      .lean();

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching user list:", err);
    res.status(500).json({ error: "Server error while fetching user list." });
  }
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  try {
    // Fetch user with required fields
    const user = await User.findById(userId)
      .select("_id first_name last_name location description occupation")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error while fetching user." });
  }
});

module.exports = router;