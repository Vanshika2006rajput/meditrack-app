const express = require("express");
const MedicineLog = require("../models/MedicineLog");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET ADHERENCE FOR LOGGED-IN USER
router.get("/", authMiddleware, async (req, res) => {
  try {
    const logs = await MedicineLog.find({
      userId: req.user.userId
    });

    const totalScheduled = logs.length;

    const totalTaken = logs.filter(
      (log) => log.status === "taken"
    ).length;

    const totalMissed = logs.filter(
      (log) => log.status === "missed"
    ).length;

    const adherencePercentage =
      totalScheduled === 0
        ? 0
        : Math.round((totalTaken / totalScheduled) * 100);

    res.json({
      totalScheduled,
      totalTaken,
      totalMissed,
      adherencePercentage
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to calculate adherence",
      error: error.message
    });
  }
});

module.exports = router;