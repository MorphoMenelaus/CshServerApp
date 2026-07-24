const express = require("express");
const router = express.Router();
const { searchSeries, getStocks } = require("../controllers/stocksController");

router.route("/search").get(searchSeries);

router.route("/").get(getStocks);

module.exports = router;
