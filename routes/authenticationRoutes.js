const express = require("express");
const router = express.Router();
const { login, refresh, logout, checkToken } = require("../controllers/authenticationController");

router.route("/login").post(login);

router.route("/refresh").post(refresh);

router.route("/logout").post(logout);

router.route("/tokencheck").post(checkToken);

module.exports = router;
