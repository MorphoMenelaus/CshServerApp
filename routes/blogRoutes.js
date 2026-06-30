const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getBlogData } = require("../controllers/blogController");

router.route("/").get(authenticateToken, getBlogData);

module.exports = router;
