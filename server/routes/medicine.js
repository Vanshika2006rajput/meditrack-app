const express = require("express");
const mongoose = require("mongoose");

const Medicine = require("../models/Medicine");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const MAX_NAME_LENGTH = 120;
const MAX_DOSAGE_LENGTH = 100;
const MAX_FREQUENCY_LENGTH = 100;
const MAX_INSTRUCTIONS_LENGTH = 1000;
const MAX_TIMES = 12;

const TIME_PATTERN =
  /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const isNonEmptyString = (
  value,
  maxLength
) => {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
};

const isValidTime = (value) => {
  return (
    typeof value === "string" &&
    TIME_PATTERN.test(value)
  );
};

const isValidTimes = (times) => {
  if (!Array.isArray(times)) {
    return false;
  }

  if (
    times.length < 1 ||
    times.length > MAX_TIMES
  ) {
    return false;
  }

  return times.every(isValidTime);
};

const isValidDateValue = (value) => {
  if (
    typeof value !== "string" &&
    !(value instanceof Date)
  ) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(
    date.getTime()
  );
};

const validateMedicineFields = ({
  name,
  dosage,
  frequency,
  times,
  startDate,
  endDate,
  instructions,
  requireStartDate = true
}) => {
  if (
    requireStartDate &&
    !isValidDateValue(startDate)
  ) {
    return "A valid start date is required";
  }

  if (
    startDate !== undefined &&
    startDate !== null &&
    !isValidDateValue(startDate)
  ) {
    return "Start date is invalid";
  }

  if (
    endDate !== undefined &&
    endDate !== null &&
    endDate !== "" &&
    !isValidDateValue(endDate)
  ) {
    return "End date is invalid";
  }

  if (
    startDate !== undefined &&
    startDate !== null &&
    endDate !== undefined &&
    endDate !== null &&
    endDate !== ""
  ) {
    const parsedStartDate =
      new Date(startDate);

    const parsedEndDate =
      new Date(endDate);

    if (
      parsedEndDate < parsedStartDate
    ) {
      return "End date cannot be before start date";
    }
  }

  if (
    name !== undefined &&
    !isNonEmptyString(
      name,
      MAX_NAME_LENGTH
    )
  ) {
    return `Medicine name must be between 1 and ${MAX_NAME_LENGTH} characters`;
  }

  if (
    dosage !== undefined &&
    !isNonEmptyString(
      dosage,
      MAX_DOSAGE_LENGTH
    )
  ) {
    return `Dosage must be between 1 and ${MAX_DOSAGE_LENGTH} characters`;
  }

  if (
    frequency !== undefined &&
    !isNonEmptyString(
      frequency,
      MAX_FREQUENCY_LENGTH
    )
  ) {
    return `Frequency must be between 1 and ${MAX_FREQUENCY_LENGTH} characters`;
  }

  if (
    times !== undefined &&
    !isValidTimes(times)
  ) {
    return `Times must contain between 1 and ${MAX_TIMES} valid times in HH:MM format`;
  }

  if (
    instructions !== undefined &&
    instructions !== null &&
    instructions !== "" &&
    (
      typeof instructions !== "string" ||
      instructions.trim().length >
        MAX_INSTRUCTIONS_LENGTH
    )
  ) {
    return `Instructions cannot exceed ${MAX_INSTRUCTIONS_LENGTH} characters`;
  }

  return null;
};

// ADD MEDICINE
router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        dosage,
        frequency,
        times,
        startDate,
        endDate,
        instructions
      } = req.body;

      const validationError =
        validateMedicineFields({
          name,
          dosage,
          frequency,
          times,
          startDate,
          endDate,
          instructions,
          requireStartDate: true
        });

      if (validationError) {
        return res.status(400).json({
          message: validationError
        });
      }

      const medicine =
        await Medicine.create({
          userId: req.user.userId,
          name: name.trim(),
          dosage: dosage.trim(),
          frequency:
            frequency.trim(),
          times: times.map((time) =>
            time.trim()
          ),
          startDate:
            new Date(startDate),
          endDate:
            endDate
              ? new Date(endDate)
              : undefined,
          instructions:
            typeof instructions ===
              "string"
              ? instructions.trim()
              : instructions
        });

      return res.status(201).json({
        message:
          "Medicine added successfully",
        medicine
      });
    } catch (error) {
      console.error(
        "Failed to add medicine:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to add medicine"
      });
    }
  }
);

// GET ALL MEDICINES FOR LOGGED-IN USER
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const medicines =
        await Medicine.find({
          userId: req.user.userId
        }).sort({
          createdAt: -1
        });

      return res.json({
        medicines
      });
    } catch (error) {
      console.error(
        "Failed to fetch medicines:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch medicines"
      });
    }
  }
);

// UPDATE MEDICINE
router.put(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const medicineId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          medicineId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid medicine ID"
        });
      }

      const {
        name,
        dosage,
        frequency,
        times,
        startDate,
        endDate,
        instructions
      } = req.body;

      const medicine =
        await Medicine.findOne({
          _id: medicineId,
          userId: req.user.userId
        });

      if (!medicine) {
        return res.status(404).json({
          message:
            "Medicine not found"
        });
      }

      const nextStartDate =
        startDate !== undefined
          ? startDate
          : medicine.startDate;

      const nextEndDate =
        endDate !== undefined
          ? endDate
          : medicine.endDate;

      const validationError =
        validateMedicineFields({
          name,
          dosage,
          frequency,
          times,
          startDate:
            nextStartDate,
          endDate:
            nextEndDate,
          instructions,
          requireStartDate: true
        });

      if (validationError) {
        return res.status(400).json({
          message: validationError
        });
      }

      if (name !== undefined) {
        medicine.name =
          name.trim();
      }

      if (dosage !== undefined) {
        medicine.dosage =
          dosage.trim();
      }

      if (
        frequency !== undefined
      ) {
        medicine.frequency =
          frequency.trim();
      }

      if (times !== undefined) {
        medicine.times =
          times.map((time) =>
            time.trim()
          );
      }

      if (
        startDate !== undefined
      ) {
        medicine.startDate =
          new Date(startDate);
      }

      if (
        endDate !== undefined
      ) {
        medicine.endDate =
          endDate
            ? new Date(endDate)
            : undefined;
      }

      if (
        instructions !== undefined
      ) {
        medicine.instructions =
          typeof instructions ===
            "string"
            ? instructions.trim()
            : instructions;
      }

      await medicine.save();

      return res.json({
        message:
          "Medicine updated successfully",
        medicine
      });
    } catch (error) {
      console.error(
        "Failed to update medicine:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update medicine"
      });
    }
  }
);

// DELETE MEDICINE
router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const medicineId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          medicineId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid medicine ID"
        });
      }

      const medicine =
        await Medicine.findOneAndDelete({
          _id: medicineId,
          userId: req.user.userId
        });

      if (!medicine) {
        return res.status(404).json({
          message:
            "Medicine not found"
        });
      }

      return res.json({
        message:
          "Medicine deleted successfully"
      });
    } catch (error) {
      console.error(
        "Failed to delete medicine:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to delete medicine"
      });
    }
  }
);

module.exports = router;