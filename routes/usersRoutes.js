const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUsers, registerUser, changePassword, getUser, getUserPreferences, updateUser, deleteUser } = require("../controllers/usersController");

// router.use(authenticateToken);

router.route("/").get(authenticateToken, getUsers);

router.route("/register/").post(registerUser);

router.route("/password").post(authenticateToken, changePassword);

router.route("/:id").get(authenticateToken, getUser);

router.route("/prefs/:id").get(authenticateToken, getUserPreferences);

router.route("/:id").put(authenticateToken, updateUser);

router.route("/:id").delete(authenticateToken, deleteUser);

module.exports = router;
