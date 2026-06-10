const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUserLogs, addUserLogs } = require("../controllers/userLogsController");

router.route("/").get(authenticateToken, getUserLogs);

router.route("/").post(authenticateToken, addUserLogs);

module.exports = router;
