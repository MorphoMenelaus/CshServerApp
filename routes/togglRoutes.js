const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUserData, getTimeEntries, getProjects, startTime, stopTime } = require("../controllers/togglController");

router.route("/user").get(authenticateToken, getUserData);

router.route("/entries").get(authenticateToken, getTimeEntries);

router.route("/projects").get(authenticateToken, getProjects);

router.route("/start").post(authenticateToken, startTime);

router.route("/stop").patch(authenticateToken, stopTime);

module.exports = router;
