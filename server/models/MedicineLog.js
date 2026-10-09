const mongoose = require("mongoose");

const medicineLogSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    scheduledTime: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["taken", "missed"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("MedicineLog", medicineLogSchema);