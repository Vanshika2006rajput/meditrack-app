const express = require("express");
const MedicineLog = require("../models/MedicineLog");
const Medicine = require("../models/Medicine");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// MARK MEDICINE AS TAKEN OR MISSED
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      medicineId,
      date,
      scheduledTime,
      status
    } = req.body;

    if (!medicineId || !date || !scheduledTime || !status) {
      return res.status(400).json({
        message: "All medicine log fields are required"
      });
    }

    if (!["taken", "missed"].includes(status)) {
      return res.status(400).json({
        message: "Status must be either taken or missed"
      });
    }

    const medicine = await Medicine.findOne({
      _id: medicineId,
      userId: req.user.userId
    });

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    const existingLog = await MedicineLog.findOne({
      medicineId,
      userId: req.user.userId,
      date,
      scheduledTime
    });

    if (existingLog) {
      existingLog.status = status;

      await existingLog.save();

      return res.json({
        message: `Medicine status updated to ${status}`,
        medicineLog: existingLog
      });
    }

    const medicineLog = await MedicineLog.create({
      medicineId,
      userId: req.user.userId,
      date,
      scheduledTime,
      status
    });

    res.status(201).json({
      message: `Medicine marked as ${status}`,
      medicineLog
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save medicine log",
      error: error.message
    });
  }
});

// GET ALL MEDICINE LOGS FOR LOGGED-IN USER
router.get("/", authMiddleware, async (req, res) => {
  try {
    const logs = await MedicineLog.find({
      userId: req.user.userId
    })
      .populate("medicineId", "name dosage")
      .sort({ date: -1, scheduledTime: -1 });

    res.json({
      logs
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch medicine logs",
      error: error.message
    });
  }
});

module.exports = router;