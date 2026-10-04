const bcrypt = require("bcryptjs");
const pool = require("../../../db");
const {
  assignOtp,
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
} = require("../../../services/otp-service");
const { sendOtpEmail } = require("../../../services/email-service");
const errorCodes = require("../../../constants/error-codes");

const SALT_ROUNDS = 12;

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

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
          code: errorCodes.EMAIL_TAKEN,
          message: "An account with this email already exists",
        },
      });
    }

    console.error("registerUser failed:", error);
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

const updateUserProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, mobile, address, businessName } = req.body;

    if (!name || !mobile || !address || !businessName) {
      return res.status(401).json({
        ok: false,
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: "Invalid Input.",
        },
      });
    }
    await client.query("BEGIN");

    const userResult = await client.query(
      "UPDATE users SET profile_completed = true, updated_at = now() WHERE id = $1",
      [req.userId],
    );
    console.log({ userResult });

    if (userResult?.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        error: {
          code: errorCodes.UNAUTHORIZED,
          message: "Please log in again",
        },
      });
    }

    // Insert on first save, update on later saves
    const { rows } = await client.query(
      `INSERT INTO profiles (user_id, name, mobile, address, business_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
         SET name = EXCLUDED.name,
             mobile = EXCLUDED.mobile,
             address = EXCLUDED.address,
             business_name = EXCLUDED.business_name,
             updated_at = now()
       RETURNING name, mobile, address, business_name, updated_at`,
      [req.userId, name, mobile, address, businessName],
    );

    console.log(" rows", rows);

    await client.query("COMMIT");
    return res.status(201).json({
      ok: true,
      data: rows?.[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.log("Error at updateUserProfile()", error);
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

const saveUsertasks = async (req, res) => {
    const client = await pool.connect();
  try {
    const { taskIds = [] } = req.body;

    if (!taskIds?.length) {
      return res.status(401).json({
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: "Select atleast one task.",
        },
      });
    }

    const uniqueTaskIds = [...new Set(taskIds)];

    await client.query("BEGIN");

    // Every ID must exist in the catalogue
    const { rows: found } = await client.query(
      "SELECT id FROM tasks WHERE id = ANY($1::int[])",
      [uniqueTaskIds],
    );
    if (found.length !== uniqueTaskIds.length) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message:
            "Some selected tasks are no longer available. Please refresh and try again.",
        },
      });
    }

    // Remove any tasks the user had picked that aren't in their new selection
    await client.query(
      `
  DELETE FROM user_tasks
  WHERE user_id = $1
    AND NOT (task_id = ANY($2::int[]))
  `,
      [req.userId, uniqueTaskIds],
    );

    // Add newly selected tasks; skip ones the user already has
    await client.query(
      `
  INSERT INTO user_tasks (user_id, task_id)
  SELECT $1::int, task_id
  FROM unnest($2::int[]) AS task_id
  ON CONFLICT (user_id, task_id) DO NOTHING
  `,
      [req.userId, uniqueTaskIds],
    );

    await client.query("COMMIT");
    return res.status(200).json({ ok: true, count: uniqueTaskIds.length });
  } catch (error) {
    console.log("Error at saveUsertasks():", error);

    await client.query("ROLLBACK").catch(() => {});
    // 23503 = foreign key violation: the user from the token no longer exists
    if (error.code === "23503") {
      return res.status(401).json({
        ok: false,
        error: {
          code: errorCodes.UNAUTHORIZED,
          message: "Please log in again",
        },
      });
    }

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

module.exports = {
  registerUser,
  updateUserProfile,
  saveUsertasks,
};
