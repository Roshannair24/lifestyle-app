const bcrypt = require("bcryptjs");
const pool = require("../../../db");
const { assignOtp } = require("../../../services/otp-service");
const { sendOtpEmail } = require("../../../services/email-service");

const SALT_ROUNDS = 12;

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // const { rows } = await pool.query(
    //   `INSERT INTO users (email, password_hash)
    //    VALUES ($1, $2)
    //    RETURNING id, email, is_verified`,
    //   [email, passwordHash],
    // );
    console.log("beginning");
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, is_verified`,
      [email, passwordHash],
    );
    const user = rows[0];
    const code = await assignOtp({ db: client, userId: user?.id });
    console.log({ user, code });

    await client.query("COMMIT");
    console.log("endend");

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
    // 23505 = Postgres unique_violation (email already exists)
    if (error.code === "23505") {
      return res.status(409).json({
        error: {
          code: "EMAIL_TAKEN",
          message: "An account with this email already exists",
        },
      });
    }

    console.error("registerUser failed:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
  } finally {
    client.release();
  }
};

module.exports = {
  registerUser,
};
