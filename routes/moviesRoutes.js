const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getMovieData, updateSingleMovie } = require("../controllers/moviesController");

router.route("/").get(authenticateToken, getMovieData);

router.route("/:movieId").put(authenticateToken, updateSingleMovie);

module.exports = router;
