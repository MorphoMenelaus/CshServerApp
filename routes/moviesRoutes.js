const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getMovieData, updateSingleMovie, getMovieFavorite, removeMovieFavorite, addMovieFavorite } = require("../controllers/moviesController");

router.route("/").get(authenticateToken, getMovieData);

router.route("/:movieId").put(authenticateToken, updateSingleMovie);

router.route("/favorites/:userId").get(authenticateToken, getMovieFavorite);

router.route("/favorites/:userId").put(authenticateToken, removeMovieFavorite);

router.route("/favorites").post(authenticateToken, addMovieFavorite);

module.exports = router;
