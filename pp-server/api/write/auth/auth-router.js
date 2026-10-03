const express = require("express");
const { verifyOtp, resendOtp, loginUser } = require("./auth-service");

const authRouter = express.Router();

authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/resend-otp", resendOtp);
authRouter.post("/login", loginUser);

module.exports = authRouter;
