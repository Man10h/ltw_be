const express = require("express");
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();

router.get("/photosOfUser/:id", async (req, res) => {
  const userId = req.params.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  try {
    // Fetch photos for the user, lean() for plain JS objects
    const photos = await Photo.find({ user_id: userId }).lean();

    // Process photos and comments concurrently
    const result = await Promise.all(
      photos.map(async (photo) => {
        const processedComments = await Promise.all(
          (photo.comments || []).map(async (comment) => {
            const user = await User.findById(comment.user_id)
              .select("_id first_name last_name")
              .lean();

            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user: user
                ? {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                  }
                : null,
            };
          })
        );

        return {
          _id: photo._id,
          user_id: photo.user_id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          comments: processedComments,
        };
      })
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching user photos:", err);
    res.status(500).json({ error: "Server error while fetching user photos." });
  }
});

module.exports = router;