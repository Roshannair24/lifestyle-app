const crypto = require("crypto");

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

function generateOtp() {
  // Cryptographically secure, 000000–999999
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashOtp(userId, code) {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(`${userId}:${code}`)
    .digest("hex");
}

const assignOtp = async ({ db, userId, now = new Date() }) => {
  try {
    const code = generateOtp();
    console.log("code=>", code);

    await db.query(
      `INSERT INTO email_otps (user_id, code_hash, expires_at, attempts, last_sent_at)
     VALUES ($1, $2, $3, 0, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET code_hash = EXCLUDED.code_hash,
           expires_at = EXCLUDED.expires_at,
           attempts = 0,
           last_sent_at = EXCLUDED.last_sent_at`,
      [
        userId,
        hashOtp(userId, code),
        new Date(now.getTime() + OTP_TTL_MS),
        now,
      ],
    );
    return code;
  } catch (error) {
    console.log("Error at assignOtp()", error);
  }
};

module.exports = {
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
  generateOtp,
  assignOtp,
};
