const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');

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
	const sortBy = req.query.sort || 'title';
	const searchTerms = req.query.keyword || '';

	// const allowedColumns = ['title', 'rating', 'year', 'tags_director', 'tags_genre'];
	// // const allowedDirections = ['ASC', 'DESC'];

	// const sortBy = allowedColumns.includes(req.query.sort)
	// 	? req.query.sort
	// 	: 'title';

	// const direction = allowedDirections.includes(req.query.dir?.toUpperCase())
	// 	? req.query.dir.toUpperCase()
	// 	: 'DESC';

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

		// Execute the query
		// const query = `SELECT ${columns} FROM metadata_items ORDER BY 
		// CASE WHEN @sortBy = 'title' THEN title END, 
		// CASE WHEN @sortBy = 'rating' THEN rating END, 
		// CASE WHEN @sortBy = 'year' THEN year END`;
		const query = `SELECT ${columns} FROM metadata_items WHERE title LIKE ? ORDER BY ? ASC LIMIT ? OFFSET ?`;
		const rows = await conn.query(query, ['%' + searchTerms + '%', sortBy, Number(resultLimit), Number(resultOffset)]);

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: "User logs query success",
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

module.exports = { getMovieData, updateSingleMovie };