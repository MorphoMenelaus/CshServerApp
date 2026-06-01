const express = require("express");
const router = express.Router();
const { getVersion } = require("../controllers/serverInfoController");

router.route("/").get(getVersion);

module.exports = router;
