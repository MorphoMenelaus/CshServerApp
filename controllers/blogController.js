const pool = require("../connection/dbConnection");

/**
 * Retrieves all blog entries, if authenticated via an access token.
 * 
 * @name getBlogData
 * @route {GET} /api/blog
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getBlogData = async (req, res) => {

	const reqLimit = req.query.limit || process.env.LIST_LIMIT_DEFAULT;
	const reqOffset = req.query.offset || 0;
	const sortBy = req.query.sort || "post_title";
	const order = req.query.order || "ASC";

	const conn = await pool.getConnection();

	try {
		const limit = reqLimit && !isNaN(reqLimit) ? Number(reqLimit) : Number(process.env.LIST_LIMIT_DEFAULT);
		const offset = reqOffset && !isNaN(reqOffset) ? Number(reqOffset) : 0;

		const query = `
        SELECT 
            post_id, post_author, post_date, post_date_gmt, 
            post_content, post_title, post_excerpt, post_status, 
            post_password, post_name, post_modified, post_modified_gmt 
        FROM blogPosts 
        ORDER BY ${sortBy} ${order} 
        LIMIT ? OFFSET ?
    `;

		const rows = await conn.query(query, [limit, offset]);

		res.status(200).json({
			code: 200,
			message: "Blog query success",
			success: true,
			posts: rows,
		});
	} catch (error) {
		console.error("Database Query Failed:", error);
		res.status(500).json({
			code: 500,
			message: "Internal server error reading blog posts",
			success: false,
			error: error.message
		});
	} finally {
		if (conn) conn.release();
	}
}

module.exports = { getBlogData };