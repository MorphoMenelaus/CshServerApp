const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const authorizeRoles = require("../middleware/rolesHandler");
const { getUserData, getTimeEntries, getCurrentTimeEntries, getProjects, startTime, stopTime } = require("../controllers/togglController");

router.route("/user").get(authenticateToken, authorizeRoles("admin", "siteAdmin"), getUserData);

router.route("/entries").get(authenticateToken, authorizeRoles("admin", "siteAdmin"), getTimeEntries);

router.route("/entries/current").get(authenticateToken, authorizeRoles("admin", "siteAdmin"), getCurrentTimeEntries);

router.route("/projects").get(authenticateToken, authorizeRoles("admin", "siteAdmin"), getProjects);

router.route("/start").post(authenticateToken, authorizeRoles("admin", "siteAdmin"), startTime);

router.route("/stop").patch(authenticateToken, authorizeRoles("admin", "siteAdmin"), stopTime);

module.exports = router;
