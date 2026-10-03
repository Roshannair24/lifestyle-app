const express = require("express");
const { verifyOtp, resendOtp } = require("./auth-service");

const authRouter = express.Router();

authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/resend-otp", resendOtp);

module.exports = authRouter;
