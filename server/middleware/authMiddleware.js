const jwt = require("jsonwebtoken");

const getCookieValue = (
  cookieHeader,
  cookieName
) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  for (const cookie of cookies) {
    const separatorIndex =
      cookie.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name =
      cookie
        .slice(0, separatorIndex)
        .trim();

    if (name !== cookieName) {
      continue;
    }

    return decodeURIComponent(
      cookie.slice(
        separatorIndex + 1
      ).trim()
    );
  }

  return null;
};

const authMiddleware = (
  req,
  res,
  next
) => {
  try {
    const token =
      getCookieValue(
        req.headers.cookie,
        "meditrack_token"
      );

    if (!token) {
      return res.status(401).json({
        message:
          "Access denied. Authentication required."
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message:
        "Invalid or expired session"
    });
  }
};

module.exports = authMiddleware;