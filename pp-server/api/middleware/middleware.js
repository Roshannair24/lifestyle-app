const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  console.log({ scheme, token });

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

    console.log({ payload });

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
  requireAuth,
};
