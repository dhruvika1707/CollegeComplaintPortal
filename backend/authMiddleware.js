const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Please login."
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.mfaPending) {
      return res.status(401).json({
        message: "MFA verification pending. Complete MFA verification to gain access."
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token."
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      message: "Access denied. Admins only."
    });
  }
};

module.exports = {
  protect,
  adminOnly
};
