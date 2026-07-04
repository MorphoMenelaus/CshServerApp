const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');

/**
 * Retrieves slideshow images and data.
 * 
 * @name getMovieSlides
 * @route {GET} /api/movies/slides
 * @access Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getMovieSlides = async (req, res) => {
	// Get a connection from the pool
	const conn = await pool.getConnection();

	const resultLimit = req.query.limit || 5;
	const resultOffset = req.query.offset || 0;

	try {

		// Execute the query
		const query = `SELECT * FROM carousel LIMIT ? OFFSET ?`;
		const rows = await conn.execute(query, [resultLimit, resultOffset]);

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: "Movie slides query success",
			success: true,
			slides: rows,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Database query failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Retrieves logs all movies, if authenticated via an access token.
 * 
 * @name getMovieData
 * @route {GET} /api/movies
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getMovieData = async (req, res) => {

	const resultLimit = req.query.limit || process.env.LIST_LIMIT_DEFAULT;
	const resultOffset = req.query.offset || 0;
	const sortBy = req.query.sort;
	const order = req.query.order;
	const searchTerms = req.query.keyword || '';

	const allowedSortColumns = ['title', 'rating', 'audience_rating', 'year', 'tags_director', 'tags_genre'];
	const allowedOrderDirections = ['ASC', 'DESC'];
	const cleanSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'year';
	const cleanOrder = allowedOrderDirections.includes(order?.toUpperCase()) ? order.toUpperCase() : 'DESC';

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {
		// Clear snapshot cache to prevent stale data (forces a fresh read)
		await conn.query("COMMIT");

		const columns = [
			"movieId",
			"title",
			"original_title",
			"tagline",
			"summary",
			"studio",
			"rating",
			"content_rating",
			"duration",
			"tags_genre",
			"tags_director",
			"tags_writer",
			"tags_star",
			"year",
			"tags_country",
			"audience_rating",
			"slug",
		]

		const query = `SELECT ${columns} FROM metadata_items WHERE title LIKE ? ORDER BY ${cleanSortBy} ${cleanOrder} LIMIT ? OFFSET ?`;
		const rows = await conn.query(query, ['%' + searchTerms + '%', Number(resultLimit), Number(resultOffset)]);

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: "Movies query success",
			success: true,
			movies: rows,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Database query failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Retrieves all favorite movies by movieId, if authenticated via an access token.
 * 
 * @name getFavoritesByMovieIds
 * @route {POST} /api/movies
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getFavoritesByMovieIds = async (req, res) => {
	const { movieIds } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		const columns = [
			"movieId",
			"title",
			"original_title",
			"tagline",
			"summary",
			"studio",
			"rating",
			"content_rating",
			"duration",
			"tags_genre",
			"tags_director",
			"tags_writer",
			"tags_star",
			"year",
			"tags_country",
			"audience_rating",
			"slug",
		]

		const placeholders = movieIds.map(() => '?').join(', ');

		const query = `SELECT ${columns} FROM metadata_items WHERE movieId IN (${placeholders})`;
		const rows = await conn.query(query, [...movieIds]);

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: "Favories query success",
			success: true,
			movies: rows,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Database query failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Update movie metadata, must be authenticated via an access token.
 * 
 * @name updateSingleMovie
 * @route {PUT} /api/movies/:movieId
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const updateSingleMovie = async (req, res) => {
	const {
		title,
		original_title,
		tagline,
		summary,
		studio,
		rating,
		content_rating,
		duration,
		tags_genre,
		tags_director,
		tags_writer,
		tags_star,
		year,
		tags_country,
		audience_rating,
		slug,
	} = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Placeholders (?) to securely neutralize SQL injection risks
		const queryText = `
		UPDATE metadata_items 
		SET 
			title = ?, 
			original_title = ?, 
			tagline = ?, 
			summary = ?, 
			studio = ?, 
			rating = ?, 
			content_rating = ?, 
			duration = ?, 
			tags_genre = ?, 
			tags_director = ?, 
			tags_writer = ?, 
			tags_star = ?, 
			year = ?, 
			tags_country = ?, 
			audience_rating = ?, 
			slug = ? 
		WHERE movieId = ?
	`;

		const values = [
			title,
			original_title,
			tagline,
			summary,
			studio,
			rating,
			content_rating,
			duration,
			tags_genre,
			tags_director,
			tags_writer,
			tags_star,
			year,
			tags_country,
			audience_rating,
			slug,
			req.params.movieId
		];

		await conn.query(queryText, values);

		await conn.commit();

		res.status(201).json({
			code: 201,
			message: "Movie updated successfully",
			success: true,
		});

	} catch {
		res.status(500).json({
			code: 500,
			message: "Update failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Gets (array)movieFavorites associated with user by userId, if authenticated via an access token.
 * Array contains all movies by movieId.
 * 
 * @name getMovieFavorite
 * @route {GET} /api/movies/favorites/:userId
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getMovieFavorite = async (req, res) => {
	const userId = req.params.userId;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		const usersData = await conn.query(`SELECT movieFavorites FROM userStore WHERE userId = '${userId}'`);
		if (!usersData?.length > 0) {
			res.status(201).json({
				code: 201,
				message: `userStore does not exist or favorites list is empty`,
				success: true,
				userFavorites: [],
			});
		}
		const userFavorites = usersData[0].movieFavorites;

		res.status(201).json({
			code: 201,
			message: `Movie favorites retrieved successfully`,
			success: true,
			userFavorites,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Get movie favorites failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Removes a movieId from (array)movieFavorites in userStore by userId, if authenticated via an access token.
 * 
 * @name removeMovieFavorite
 * @route {PUT} /api/movies/favorites/:movieId
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const removeMovieFavorite = async (req, res) => {
	const userId = req.params.userId;
	const { movieId } = req.body;


	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Placeholders (?) to securely neutralize SQL injection risks
		const query = `
			UPDATE userStore 
			SET movieFavorites = JSON_REMOVE(
				movieFavorites, 
				JSON_UNQUOTE(JSON_SEARCH(movieFavorites, 'one', ?))
			) 
			WHERE userId = ? 
			AND JSON_SEARCH(movieFavorites, 'one', ?) IS NOT NULL
			`;

		const values = [movieId, userId, movieId];

		await conn.execute(query, values);

		res.status(201).json({
			code: 201,
			message: `Movie favorite removed successfully`,
			success: true,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Remove favorite failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Adds a movieId to (array)movieFavorites in userStore by userId, if authenticated via an access token.
 * 
 * @name addMovieFavorite
 * @route {POST} /api/movies/favorites
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const addMovieFavorite = async (req, res) => {
	const { userId, movieId } = req.body;


	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Add userStore record if one doesn't exist
		const usersData = await conn.query(`SELECT * FROM userStore WHERE userId = '${userId}'`);

		if (usersData?.length === 0) {
			const result = await conn.query(
				"INSERT INTO userStore (userId) VALUES (?)",
				[userId]
			);
			await conn.commit();
		}

		// Placeholders (?) to securely neutralize SQL injection risks
		const query = `
			UPDATE userStore 
			SET movieFavorites = JSON_ARRAY_APPEND(COALESCE(movieFavorites, '[]'), '$', ?) 
			WHERE userId = ? 
			AND NOT JSON_CONTAINS(COALESCE(movieFavorites, '[]'), ?, '$')
		`;

		const values = [movieId, userId, movieId];

		await conn.execute(query, values);

		res.status(201).json({
			code: 201,
			message: `Movie favorite added successfully`,
			success: true,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Insert favorite failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

module.exports = { getMovieSlides, getMovieData, getFavoritesByMovieIds, updateSingleMovie, getMovieFavorite, removeMovieFavorite, addMovieFavorite };