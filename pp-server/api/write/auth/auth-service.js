const errorCodes = require("../../../constants/error-codes");
const pool = require("../../../db");
const { evaluateOtp } = require("../../../services/otp-service");

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
    console.log("user:", user);

    if (!user) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: {
          code: errorCodes.USER_NOT_FOUND,
          message: "No account found for this email",
        },
      });
    }

    if (user?.is_verified) {
      await client.query("ROLLBACK");
      return res.status(409).json({
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

    console.log({ otps });

    const result = evaluateOtp(otps[0], code);

    if (!result.ok) {
      if (result.reason === errorCodes.INVALID_CODE) {
        await client.query(
          "UPDATE email_otps SET attempts = attempts + 1 WHERE user_id = $1",
          [user.id],
        );
        await client.query("COMMIT");

        return res.status(401).json({
          error: {
            code: errorCodes.INVALID_CODE,
            message: { attemptsLeft: result.attemptsLeft },
          },
        });
      }
      await client.query("ROLLBACK");
      return res.status(401).json({
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
      error: {
        code: errorCodes.INTERNAL_ERROR,
        message: "Something went wrong. Please try again.",
      },
    });
  } finally {
    client.release();
  }
};

module.exports = {
  verifyOtp,
};
