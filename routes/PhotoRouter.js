const express = require("express");
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const verifyToken = require("../middleware/auth");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const router = express.Router();

// config storage images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// api

router.get("/photosOfUser/:id", verifyToken, async function (req, res) {
  const user_id = req.params.id;
  try {
    const photos = await Photo.find({ user_id: user_id });
    const result = await Promise.all(
      photos.map(async (photo) => {
        const comments = await Promise.all(
          photo.comments.map(async (it) => {
            const user = await User.findById(it.user_id);
            return {
              comment: it.comment,
              date_time: it.date_time,
              user: user,
            };
          })
        );

        return {
          id: photo._id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          user_id: photo.user_id,
          comments: comments,
        };
      })
    );
    return res.json({ photos: result });
  } catch (error) {
    console.log(error);
  }
});

router.post(
  "/commentsOfPhoto/:photo_id",
  verifyToken,
  async function (req, res) {
    const photo_id = req.params.photo_id;
    const { user_id, comment } = req.body;
    try {
      if (!comment || !user_id) {
        return res.status(400).json({ message: "Bad Request" });
      }
      const photo = await Photo.findById(photo_id);
      if (!photo) {
        return res.status(400).json({ message: "Bad Request" });
      }
      const newComment = {
        comment: comment,
        user_id: user_id,
      };
      photo.comments.push(newComment);
      await photo.save();
      return res.status(200).json({ message: "Succeed" });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(
  "/photos/new",
  verifyToken,
  upload.single("file"),
  async function (req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Bad Request" });
      }

      const newPhoto = new Photo({
        file_name: req.file.filename,
        createdAt: new Date(),
        user_id: req.user_id,
        comments: [],
      });

      await newPhoto.save();
      return res
        .status(200)
        .json({ message: "Ảnh đã được thêm.", photo: newPhoto });
    } catch (error) {
      console.log(error);
    }
  }
);

module.exports = router;
