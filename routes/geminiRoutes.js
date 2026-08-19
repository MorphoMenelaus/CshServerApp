const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { generalQuestion, personaChatbot, jobMatch, explainCode } = require("../controllers/geminiController.mjs");

router.route("/question").post(generalQuestion);

router.route("/chat").post(authenticateToken, personaChatbot);

router.route("/match").post(authenticateToken, jobMatch);

router.route("/explain-code").post(authenticateToken, explainCode);

module.exports = router;
