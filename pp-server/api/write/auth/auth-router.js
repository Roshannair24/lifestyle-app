const express = require("express");
const { verifyOtp } = require("./auth-service");

const authRouter = express.Router();

authRouter.post("/verify-otp", verifyOtp);

module.exports = authRouter;
