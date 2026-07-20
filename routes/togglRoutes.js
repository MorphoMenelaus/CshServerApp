const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUserData, getTimeEntries, getCurrentTimeEntries, getProjects, startTime, stopTime } = require("../controllers/togglController");

router.route("/user").get(authenticateToken, getUserData);

router.route("/entries").get(authenticateToken, getTimeEntries);

router.route("/entries/current").get(authenticateToken, getCurrentTimeEntries);

router.route("/projects").get(authenticateToken, getProjects);

router.route("/start").post(authenticateToken, startTime);

router.route("/stop").patch(authenticateToken, stopTime);

module.exports = router;
