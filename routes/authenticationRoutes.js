const express = require("express");
const router = express.Router();
const { getVersion } = require("../controllers/authenticationController");

router.route("/").get(getVersion);

module.exports = router;
