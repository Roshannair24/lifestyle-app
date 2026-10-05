const errorCodes = require("../../../constants/error-codes");
const pool = require("../../../db");
const { sendOtpEmail } = require("../../../services/email-service");
const {
  evaluateOtp,
  assignOtp,
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
} = require("../../../services/otp-service");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: users } = await client.query(
      "SELECT id, is_verified FROM users WHERE email = $1",
      [email],
    );
    const user = users[0];

    if (!user) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        ok: false,
        error: {
          code: errorCodes.USER_NOT_FOUND,
          message: "No account found for this email",
        },
      });
    }

    if (user?.is_verified) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        ok: false,
        error: {
          code: errorCodes.ALREADY_VERIFIED,
          message: "This email is already verified. Please log in.",
        },
      });
    }

    const { rows: otps } = await client.query(
      "SELECT * FROM email_otps WHERE user_id = $1  FOR UPDATE",
      [Number(user?.id)],
    );

    const result = evaluateOtp(otps[0], code);

    if (!result.ok) {
      if (result.reason === errorCodes.INVALID_CODE) {
        await client.query(
          "UPDATE email_otps SET attempts = attempts + 1 WHERE user_id = $1",
          [user.id],
        );
        await client.query("COMMIT");

        return res.status(401).json({
          ok: false,
          error: {
            code: errorCodes.INVALID_CODE,
            message: { attemptsLeft: result.attemptsLeft },
          },
        });
      }
      await client.query("ROLLBACK");
      return res.status(401).json({
        ok: false,
        error: {
          code: errorCodes.INVALID_CODE,
          message: result?.reason,
        },
      });
    }

    await client.query(
      "UPDATE users SET is_verified = true, updated_at = now() WHERE id = $1",
      [user.id],
    );
    await client.query("DELETE FROM email_otps WHERE user_id = $1", [user.id]); // single use
    await client.query("COMMIT");

    return res
      .status(200)
      .json({ ok: true, message: "Email verified. You can now log in." });
  } catch (error) {
    console.log("Error at verifyOtp():", error);
    await client.query("ROLLBACK").catch(() => {});

    return res.status(500).json({
      ok: false,
      error: {
        code: errorCodes.INTERNAL_ERROR,
        message: "Something went wrong. Please try again.",
      },
    });
  } finally {
    client.release();
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: users } = await client.query(
      "SELECT id,email FROM users WHERE email = $1",
      [email],
    );

    const user = users[0];

    const code = await assignOtp({ db: client, userId: user?.id });

    if (!code) {
      await client.query("ROLLBACK");

      return res.json({
        ok: false,
        error: {
          code: errorCodes.INTERNAL_ERROR,
          message: "otp generation failed",
        },
      });
    }

    await client.query("COMMIT");

    let emailSent = false;
    try {
      await sendOtpEmail(user.email, code);
      emailSent = true;
    } catch (mailErr) {
      emailSent = false;
      console.error("sendOtpEmail failed:", mailErr);
    }

    return res.status(201).json({
      ok: true,
      user,
      data: {
        emailSent,
        expiresInSeconds: OTP_TTL_MS / 1000,
        resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK").catch((err) => {
      console.log("Error at rollback:", err);
    });

    console.log("Error at resendOtp():", error);

    return res.status(500).json({
      error: {
        code: errorCodes.INTERNAL_ERROR,
        message: "Something went wrong. Please try again.",
      },
    });
  } finally {
    client.release();
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: "Invalid email and password.",
        },
      });
    }

    const { rows } = await pool.query(
      `SELECT id, email, password_hash, is_verified, profile_completed
       FROM users
       WHERE email = $1`,
      [email],
    );
    const user = rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({
        ok: false,
        error: {
          code: errorCodes.INVALID_CREDENTIALS,
          message: "Invalid email or password.",
        },
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        ok: false,
        error: {
          code: errorCodes.INVALID_CREDENTIALS,
          message: "Invalid email or password.",
        },
      });
    }

    if (!user.is_verified) {
      return res.status(401).json({
        ok: false,
        error: {
          code: errorCodes.EMAIL_NOT_VERIFIED,
          message: "Please verify your email to continue",
        },
      });
    }

    const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        profileCompleted: user.profile_completed,
      },
    });
  } catch (error) {
    console.error("loginUser failed:", error);
    return res.status(500).json({
      ok: false,
      error: {
        code: errorCodes.INTERNAL_ERROR,
        message: "Something went wrong. Please try again.",
      },
    });
  }
};

module.exports = {
  verifyOtp,
  resendOtp,
  loginUser,
};
