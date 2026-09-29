const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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


    next()
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

module.exports = {
  registerUserMiddleware,
};
