const {
  generateOtp,
  hashOtp,
  evaluateOtp,
  OTP_TTL_MS,
  MAX_ATTEMPTS,
} = require("./otp-service");

function makeRecord({
  userId = 1,
  code = "123456",
  attempts = 0,
  expiresInMs = OTP_TTL_MS,
  now = new Date(),
} = {}) {
  return {
    user_id: userId,
    code_hash: hashOtp(userId, code),
    attempts,
    expires_at: new Date(now.getTime() + expiresInMs),
  };
}

describe("generateOtp", () => {
  afterEach(() => jest.restoreAllMocks());

  test("always returns exactly 6 digits", () => {
    for (let i = 0; i < 1000; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtp", () => {
  test("same input gives the same hash", () => {
    expect(hashOtp(1, "123456")).toBe(hashOtp(1, "123456"));
  });

  test("same code for different users gives different hashes", () => {
    expect(hashOtp(1, "123456")).not.toBe(hashOtp(2, "123456"));
  });

  test("hash is 64 hex characters and does not contain the code", () => {
    const hash = hashOtp(1, "123456");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("123456");
  });
});

describe("evaluateOtp", () => {
  const now = new Date("2026-10-05T10:00:00Z");

  test("accepts the correct code before expiry", () => {
    const record = makeRecord({ now });
    expect(evaluateOtp(record, "123456", now)).toEqual({ ok: true });
  });

  test("rejects a wrong code and reports attempts left", () => {
    const record = makeRecord({ now, attempts: 0 });
    expect(evaluateOtp(record, "000000", now)).toEqual({
      ok: false,
      reason: "INVALID_CODE",
      attemptsLeft: MAX_ATTEMPTS - 1,
    });
  });

  test("the 5th wrong attempt leaves 0 attempts", () => {
    const record = makeRecord({ now, attempts: MAX_ATTEMPTS - 1 });
    expect(evaluateOtp(record, "000000", now).attemptsLeft).toBe(0);
  });

  test("after 5 wrong attempts, even the correct code is rejected", () => {
    const record = makeRecord({ now, attempts: MAX_ATTEMPTS });
    expect(evaluateOtp(record, "123456", now)).toEqual({
      ok: false,
      reason: "TOO_MANY_ATTEMPTS",
    });
  });

  test("rejects the correct code after expiry", () => {
    const record = makeRecord({ now, expiresInMs: -1000 }); // expired 1s ago
    expect(evaluateOtp(record, "123456", now)).toEqual({
      ok: false,
      reason: "CODE_EXPIRED",
    });
  });

  test("treats the exact expiry moment as expired", () => {
    const record = makeRecord({ now, expiresInMs: 0 });
    expect(evaluateOtp(record, "123456", now).reason).toBe("CODE_EXPIRED");
  });
});
