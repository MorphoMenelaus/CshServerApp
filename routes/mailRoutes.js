const express = require("express");
const router = express.Router();
const { sendContactMail, sendVerificationMail } = require("../controllers/mailController");

router.route("/").post(sendContactMail);

router.route("/verify").post(sendVerificationMail);

module.exports = router;
