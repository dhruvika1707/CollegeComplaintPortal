const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateSecret, generateURI, verifySync } = require("otplib");
const qrcode = require("qrcode");

const User = require("../models/User");
const { protect } = require("../authMiddleware");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
      isMfaEnabled: false,
      mfaSecret: null
    });

    res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isMfaEnabled: user.isMfaEnabled
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Registration failed.",
      error: error.message
    });
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Check if user has MFA enabled
    if (user.isMfaEnabled) {
      const tempToken = jwt.sign(
        {
          id: user._id,
          mfaPending: true
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "5m"
        }
      );

      return res.json({
        message: "MFA required. Enter TOTP authenticator code.",
        mfaRequired: true,
        tempToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "Login successful!",
      mfaRequired: false,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isMfaEnabled: user.isMfaEnabled || false
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Login failed.",
      error: error.message
    });
  }
});


// MFA STEP 1: Generate TOTP Setup Secret & QR Code
router.post("/mfa/setup", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const secret = generateSecret();
    const uri = generateURI({
      issuer: "CampusDesk",
      label: user.email,
      secret: secret
    });

    const qrCodeDataUrl = await qrcode.toDataURL(uri);

    // Save temporary secret to user for verification step
    user.mfaSecret = secret;
    await user.save();

    res.json({
      message: "MFA setup initialized. Scan the QR code or enter secret into Google/Microsoft Authenticator, then call /api/auth/mfa/verify.",
      secret,
      qrCodeDataUrl,
      uri
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to setup MFA.",
      error: error.message
    });
  }
});


// MFA STEP 2: Verify TOTP Code to Enable MFA
router.post("/mfa/verify", protect, async (req, res) => {
  try {
    const { totpCode } = req.body;
    if (!totpCode) {
      return res.status(400).json({ message: "totpCode is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ message: "MFA setup has not been initiated for this user." });
    }

    const verification = verifySync({
      token: totpCode.toString().trim(),
      secret: user.mfaSecret
    });

    if (!verification || !verification.valid) {
      return res.status(400).json({
        message: "Invalid TOTP verification code. Please try again with current code from authenticator app."
      });
    }

    user.isMfaEnabled = true;
    await user.save();

    res.json({
      message: "Multi-Factor Authentication enabled successfully!",
      isMfaEnabled: true
    });
  } catch (error) {
    res.status(500).json({
      message: "MFA verification failed.",
      error: error.message
    });
  }
});


// MFA LOGIN VERIFY: Validate TOTP during login flow
router.post("/mfa/login-verify", async (req, res) => {
  try {
    const { tempToken, totpCode } = req.body;

    if (!tempToken || !totpCode) {
      return res.status(400).json({
        message: "tempToken and totpCode are required."
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired temporary MFA token. Please log in again."
      });
    }

    if (!decoded.mfaPending) {
      return res.status(400).json({
        message: "Invalid token type for MFA verification."
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isMfaEnabled || !user.mfaSecret) {
      return res.status(400).json({
        message: "MFA is not configured for this account."
      });
    }

    const verification = verifySync({
      token: totpCode.toString().trim(),
      secret: user.mfaSecret
    });

    if (!verification || !verification.valid) {
      return res.status(401).json({
        message: "Invalid or expired TOTP code. Access denied."
      });
    }

    // Issue full access JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "MFA authentication successful! Login complete.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isMfaEnabled: true
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "MFA login verification failed.",
      error: error.message
    });
  }
});


// MFA DISABLE
router.post("/mfa/disable", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isMfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    res.json({
      message: "MFA disabled successfully.",
      isMfaEnabled: false
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to disable MFA.",
      error: error.message
    });
  }
});

module.exports = router;
