const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const {
  analyzeMedicineLabel
} = require("../services/geminiService");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          "Only JPG, PNG, and WebP images are supported."
        )
      );
    }

    callback(null, true);
  }
});

router.post(
  "/analyze",
  authMiddleware,
  upload.single("labelImage"),
  async (req, res) => {
    try {
      console.log(
        "Medicine label upload received"
      );

      if (!req.file) {
        return res.status(400).json({
          message:
            "Medicine label image is required."
        });
      }

      console.log(
        "Uploaded file:",
        req.file.originalname
      );

      console.log(
        "Uploaded MIME type:",
        req.file.mimetype
      );

      console.log(
        "Uploaded file size:",
        req.file.size
      );

      const imageBase64 =
        req.file.buffer.toString("base64");

      console.log(
        "Base64 image created"
      );

      const analysis =
        await analyzeMedicineLabel({
          imageBase64,
          mimeType: req.file.mimetype
        });

      console.log(
        "Medicine label analysis completed"
      );

      res.json({
        message:
          "Medicine label analyzed successfully.",
        analysis
      });
    } catch (error) {
      console.error(
        "Medicine label analysis failed:"
      );

      console.error(
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to analyze the medicine label."
      });
    }
  }
);

module.exports = router;