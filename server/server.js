const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const authRoutes =
  require("./routes/auth");

const medicineRoutes =
  require("./routes/medicine");

const medicineLogRoutes =
  require("./routes/medicineLog");

const adherenceRoutes =
  require("./routes/adherence");

const caregiverRoutes =
  require("./routes/caregiver");

const medicineLabelRoutes =
  require("./routes/medicineLabel");

const authMiddleware =
  require("./middleware/authMiddleware");

const app = express();

const allowedOrigin =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);

app.use(express.json());

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/medicines",
  medicineRoutes
);

app.use(
  "/api/medicine-logs",
  medicineLogRoutes
);

app.use(
  "/api/adherence",
  adherenceRoutes
);

app.use(
  "/api/caregiver",
  caregiverRoutes
);

app.use(
  "/api/medicine-label",
  medicineLabelRoutes
);

app.get("/", (req, res) => {
  res.json({
    message:
      "Medicine Reminder API is running"
  });
});

app.get(
  "/api/protected",
  authMiddleware,
  (req, res) => {
    res.json({
      message:
        "You accessed a protected route successfully",
      user: req.user
    });
  }
);

const PORT =
  process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });