const express = require("express");
const { registerUser } = require("./user-service");
const { registerUserMiddleware } = require("./user-middleware");
const userRouter = express.Router();

userRouter.post("/register", registerUserMiddleware, registerUser);

module.exports = userRouter;
