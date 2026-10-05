const express = require("express");
const { listTasks, getUserTasks, getUserProfile } = require("./read-service");
const { requireAuth } = require("../middleware/middleware");

const readRouter = express.Router();

readRouter.get("/list-tasks", requireAuth, listTasks);
readRouter.get("/get-user-tasks", requireAuth, getUserTasks);
readRouter.get("/get-user-profile", requireAuth, getUserProfile);

module.exports = readRouter;
