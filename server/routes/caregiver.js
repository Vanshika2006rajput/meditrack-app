const express = require("express");
const Caregiver = require("../models/Caregiver");
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const MedicineLog = require("../models/MedicineLog");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE CAREGIVER-PATIENT CONNECTION
router.post("/connect", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({
        message: "Patient ID is required"
      });
    }

    if (req.user.role !== "caregiver") {
      return res.status(403).json({
        message: "Only caregivers can create a connection"
      });
    }

    const patient = await User.findOne({
      _id: patientId,
      role: "patient"
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found"
      });
    }

    const existingConnection = await Caregiver.findOne({
      caregiverId: req.user.userId,
      patientId
    });

    if (existingConnection) {
      return res.status(400).json({
        message: "Caregiver is already connected to this patient"
      });
    }

    const connection = await Caregiver.create({
      caregiverId: req.user.userId,
      patientId
    });

    res.status(201).json({
      message: "Caregiver connected to patient successfully",
      connection
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to connect caregiver",
      error: error.message
    });
  }
});

// GET PATIENTS CONNECTED TO LOGGED-IN CAREGIVER
router.get("/patients", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({
        message: "Only caregivers can access connected patients"
      });
    }

    const connections = await Caregiver.find({
      caregiverId: req.user.userId
    }).populate("patientId", "name email");

    res.json({
      patients: connections
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch connected patients",
      error: error.message
    });
  }
});

// GET MEDICINES OF A CONNECTED PATIENT
router.get(
  "/patients/:patientId/medicines",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "caregiver") {
        return res.status(403).json({
          message: "Only caregivers can access patient medicines"
        });
      }

      const { patientId } = req.params;

      const connection = await Caregiver.findOne({
        caregiverId: req.user.userId,
        patientId
      });

      if (!connection) {
        return res.status(403).json({
          message: "You are not connected to this patient"
        });
      }

      const medicines = await Medicine.find({
        userId: patientId
      }).sort({ createdAt: -1 });

      res.json({
        patientId,
        medicines
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch patient medicines",
        error: error.message
      });
    }
  }
);

// GET MEDICINE LOGS OF A CONNECTED PATIENT
router.get(
  "/patients/:patientId/logs",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "caregiver") {
        return res.status(403).json({
          message: "Only caregivers can access patient medicine logs"
        });
      }

      const { patientId } = req.params;

      const connection = await Caregiver.findOne({
        caregiverId: req.user.userId,
        patientId
      });

      if (!connection) {
        return res.status(403).json({
          message: "You are not connected to this patient"
        });
      }

      const logs = await MedicineLog.find({
        userId: patientId
      })
        .populate("medicineId", "name dosage")
        .sort({ date: -1, scheduledTime: -1 });

      res.json({
        patientId,
        logs
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch patient medicine logs",
        error: error.message
      });
    }
  }
);

// GET ADHERENCE OF A CONNECTED PATIENT
router.get(
  "/patients/:patientId/adherence",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "caregiver") {
        return res.status(403).json({
          message: "Only caregivers can access patient adherence"
        });
      }

      const { patientId } = req.params;

      const connection = await Caregiver.findOne({
        caregiverId: req.user.userId,
        patientId
      });

      if (!connection) {
        return res.status(403).json({
          message: "You are not connected to this patient"
        });
      }

      const logs = await MedicineLog.find({
        userId: patientId
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
        patientId,
        totalScheduled,
        totalTaken,
        totalMissed,
        adherencePercentage
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to calculate patient adherence",
        error: error.message
      });
    }
  }
);

module.exports = router;