const express = require("express");
const router = express.Router();
const { login, refresh, logout } = require("../controllers/authenticationController");

router.route("/login").post(login);

router.route("/refresh").post(refresh);

router.route("/logout").post(logout);

module.exports = router;
