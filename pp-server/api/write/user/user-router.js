const express = require("express");
const { registerUser, updateUserProfile } = require("./user-service");
const { registerUserMiddleware } = require("./user-middleware");
const { requireAuth } = require("../../middleware/middleware");
const userRouter = express.Router();

userRouter.post("/register", registerUserMiddleware, registerUser);
userRouter.post("/update-user-profile", requireAuth, updateUserProfile);

module.exports = userRouter;
