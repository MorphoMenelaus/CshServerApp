const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUsers, registerUser, changePassword, getUser, findUserByName, getUserPreferences, updateUser, deleteUser, verifyCode } = require("../controllers/usersController");

router.route("/").get(authenticateToken, getUsers);

router.route("/register/").post(registerUser);

router.route("/password").post(authenticateToken, changePassword);

router.route("/:id").get(authenticateToken, getUser);

router.route("/name/:userName").get(authenticateToken, findUserByName);

router.route("/prefs/:id").get(authenticateToken, getUserPreferences);

router.route("/:id").put(authenticateToken, updateUser);

router.route("/:id").delete(authenticateToken, deleteUser);

router.route("/verify").post(verifyCode);

module.exports = router;
