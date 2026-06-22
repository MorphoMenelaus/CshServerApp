const express = require("express");
const router = express.Router();
const { sendContactMail } = require("../controllers/mailController");

router.route("/").post(sendContactMail);

module.exports = router;
