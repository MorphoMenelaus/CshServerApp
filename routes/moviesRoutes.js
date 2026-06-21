const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getMovieSlides, getMovieData, getFavoritesByMovieIds, updateSingleMovie, getMovieFavorite, removeMovieFavorite, addMovieFavorite } = require("../controllers/moviesController");

router.route("/slides").get(getMovieSlides);

router.route("/").get(authenticateToken, getMovieData);

router.route("/").post(authenticateToken, getFavoritesByMovieIds);

router.route("/:movieId").put(authenticateToken, updateSingleMovie);

router.route("/favorites/:userId").get(authenticateToken, getMovieFavorite);

router.route("/favorites/:userId").put(authenticateToken, removeMovieFavorite);

router.route("/favorites").post(authenticateToken, addMovieFavorite);

module.exports = router;
