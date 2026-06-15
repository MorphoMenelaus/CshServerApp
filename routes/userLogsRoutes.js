const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUserLogs, addUserLogs, getClockLog, logSimpleClock, getMovieData } = require("../controllers/userLogsController");

router.route("/").get(authenticateToken, getUserLogs);

router.route("/").post(authenticateToken, addUserLogs);

router.route("/clock/log").get(authenticateToken, getClockLog);

router.route("/clock/").post(authenticateToken, logSimpleClock);

router.route("/movies/").get(getMovieData);

module.exports = router;
