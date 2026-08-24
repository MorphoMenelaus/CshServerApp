const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const authorizeRoles = require("../middleware/rolesHandler");
const { getBlogData, getResumeData, getAppDevDuties } = require("../controllers/blogController");

router.route("/").get(authenticateToken, authorizeRoles("admin", "siteAdmin"), getBlogData);

router.route("/resume/").get(getResumeData);

router.route("/appduties/").get(getAppDevDuties);

module.exports = router;
