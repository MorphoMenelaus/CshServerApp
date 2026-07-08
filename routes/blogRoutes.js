const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getBlogData, getResumeData, getAppDevDuties } = require("../controllers/blogController");

router.route("/").get(authenticateToken, getBlogData);

router.route("/resume/").get(getResumeData);

router.route("/appduties/").get(getAppDevDuties);

module.exports = router;
