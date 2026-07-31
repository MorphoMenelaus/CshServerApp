const express = require("express");
const router = express.Router();
const { login, refresh, logout, checkToken, checkIfExpired } = require("../controllers/authenticationController");

router.route("/login").post(login);

router.route("/refresh").post(refresh);

router.route("/logout").post(logout);

router.route("/tokencheck").post(checkToken);

router.route("/tokenexpired").post(checkIfExpired);

module.exports = router;
