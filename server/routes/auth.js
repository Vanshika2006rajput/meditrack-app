const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const getCookieOptions = () => {
  const isProduction =
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000
  };
};

const getClearCookieOptions = () => {
  const isProduction =
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/"
  };
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail
      });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    if (
      role !== "patient" &&
      role !== "caregiver"
    ) {
      return res.status(400).json({
        message: "Invalid account role"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    return res.status(201).json({
      message:
        "User registered successfully",
      userId: user._id
    });
  } catch (error) {
    console.error(
      "Registration failed:",
      error
    );

    return res.status(500).json({
      message: "Registration failed"
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required"
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail
      });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid email or password"
      });
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message:
          "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.cookie(
      "meditrack_token",
      token,
      getCookieOptions()
    );

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(
      "Login failed:",
      error
    );

    return res.status(500).json({
      message: "Login failed"
    });
  }
});

// CURRENT SESSION
router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).select(
          "_id name email role"
        );

      if (!user) {
        res.clearCookie(
          "meditrack_token",
          getClearCookieOptions()
        );

        return res.status(401).json({
          message:
            "User account no longer exists"
        });
      }

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error(
        "Session lookup failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to restore session"
      });
    }
  }
);

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie(
    "meditrack_token",
    getClearCookieOptions()
  );

  return res.json({
    message: "Logout successful"
  });
});

module.exports = router;