const express = require("express");
const router = express.Router();
const { getUsers, registerUser, getUser, getUserPreferences, updateUser, deleteUser, getClockLog, logSimpleClock } = require("../controllers/usersController");

router.route("/").get(getUsers);

router.route("/register/").post(registerUser);

router.route("/:id").get(getUser);

router.route("/prefs/:id").get(getUserPreferences);

router.route("/:id").put(updateUser);

router.route("/:id").delete(deleteUser);

router.route("/clock/log").get(getClockLog);

router.route("/clock/").post(logSimpleClock);

module.exports = router;
