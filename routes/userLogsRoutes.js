const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const authorizeRoles = require("../middleware/rolesHandler");
const { getUserLogs, addUserLogs, getClockLog, logSimpleClock } = require("../controllers/userLogsController");

router.route("/").get(authenticateToken, authorizeRoles(), getUserLogs);

router.route("/").post(authenticateToken, addUserLogs);

router.route("/clock/log").get(authenticateToken, authorizeRoles("admin", "siteAdmin"), getClockLog);

router.route("/clock/").post(authenticateToken, authorizeRoles("admin", "siteAdmin"), logSimpleClock);

module.exports = router;
