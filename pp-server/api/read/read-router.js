const express = require("express");
const { listTasks, getUserTasks } = require("./read-service");
const { requireAuth } = require("../middleware/middleware");

const readRouter = express.Router();

readRouter.get("/list-tasks", requireAuth, listTasks);
readRouter.get("/get-user-tasks", requireAuth, getUserTasks);

module.exports = readRouter;
