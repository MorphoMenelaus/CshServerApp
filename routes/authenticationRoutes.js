const express = require("express");
const router = express.Router();
const { registerUser, login, refresh, logout } = require("../controllers/authenticationController");

router.route("/register").post(registerUser);

router.route("/login").post(login);

router.route("/refresh").post(refresh);

router.route("/logout").post(logout);

module.exports = router;
