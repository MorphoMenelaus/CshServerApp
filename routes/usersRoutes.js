const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUsers, registerUser, getUser, getUserPreferences, updateUser, deleteUser, getClockLog, logSimpleClock } = require("../controllers/usersController");

// router.use(authenticateToken);

router.route("/").get(authenticateToken, getUsers);

router.route("/register/").post(registerUser);

router.route("/:id").get(authenticateToken, getUser);

router.route("/prefs/:id").get(authenticateToken, getUserPreferences);

router.route("/:id").put(authenticateToken, updateUser);

router.route("/:id").delete(authenticateToken, deleteUser);

router.route("/clock/log").get(getClockLog);

router.route("/clock/").post(authenticateToken, logSimpleClock);

module.exports = router;
