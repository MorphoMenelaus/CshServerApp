const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getBlogData, getResumeData } = require("../controllers/blogController");

router.route("/").get(authenticateToken, getBlogData);

router.route("/resume/").get(getResumeData);

module.exports = router;
