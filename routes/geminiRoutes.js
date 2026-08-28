const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const authorizeRoles = require("../middleware/rolesHandler");
const { generalQuestion, personaChatbot, jobMatch, explainCode } = require("../controllers/geminiController.mjs");

router.route("/question").post(authenticateToken, authorizeRoles("admin", "siteAdmin"), generalQuestion);

router.route("/chat").post(authenticateToken, authorizeRoles("admin", "siteAdmin"), personaChatbot);

router.route("/match").post(authenticateToken, authorizeRoles("admin", "siteAdmin"), jobMatch);

router.route("/explain-code").post(authenticateToken, authorizeRoles("admin", "siteAdmin"), explainCode);

module.exports = router;
