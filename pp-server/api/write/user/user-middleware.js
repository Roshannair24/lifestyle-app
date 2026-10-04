const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const jwt = require("jsonwebtoken");

const registerUserMiddleware = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      throw new Error("Invalid email");
    }

    if (!password || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new Error(
        "Invalid password: Password must contain at least one letter and one number",
      );
    }

    next();
  } catch (error) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        error: error?.message,
        data: req.body,
      },
    });
  }
};

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  console.log({scheme, token})

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        error: "Please log in to continue",
      },
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

console.log({payload})

    req.userId = Number(payload.sub);
    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Please log in again";

    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        error: message,
      },
    });
  }
}

module.exports = {
  registerUserMiddleware,
  requireAuth,
};
