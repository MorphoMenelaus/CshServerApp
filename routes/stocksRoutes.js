const express = require("express");
const router = express.Router();
const { getStocks } = require("../controllers/stocksController");

router.route("/").get(getStocks);

module.exports = router;
