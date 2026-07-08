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
	const sortBy = req.query.sort;
	const order = req.query.order;
	const status = req.query.status;

	const allowedSortColumns = ['post_author', 'post_date', 'post_title', 'post_id'];
	const allowedOrderDirections = ['ASC', 'DESC'];
	const allowedStatus = ['publish', 'hidden'];
	const cleanSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'post_date';
	const cleanOrder = allowedOrderDirections.includes(order?.toUpperCase()) ? order.toUpperCase() : 'ASC';
	const cleanStatus = allowedStatus.includes(status) ? status : 'publish';

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
		WHERE post_status = ? 
        ORDER BY ${cleanSortBy} ${cleanOrder} 
        LIMIT ? OFFSET ?
    `;

		const rows = await conn.query(query, [cleanStatus, limit, offset]);

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

/**
 * Retrieves all resume entries.
 * 
 * @name getResumeData
 * @route {GET} /api/blog/resume
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getResumeData = async (req, res) => {

	const conn = await pool.getConnection();

	try {

		const resume = await conn.query(`SELECT id, title, company, dates, type, duties FROM resume`);

		res.status(200).json({
			code: 200,
			message: "Resume query success",
			success: true,
			resume: resume,
		});
	} catch (error) {
		console.error("Database Query Failed:", error);
		res.status(500).json({
			code: 500,
			message: "Internal server error reading resume",
			success: false,
			error: error.message
		});
	} finally {
		if (conn) conn.release();
	}
}

/**
 * Retrieves all app dev duty entries.
 * 
 * @name getAppDevDuties
 * @route {GET} /api/blog/appduties
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAppDevDuties = async (req, res) => {

	const conn = await pool.getConnection();

	try {

		const appDevDuties = await conn.query(`SELECT id, company, appName, duties FROM appDevDuties`);

		res.status(200).json({
			code: 200,
			message: "App Dev Duties query success",
			success: true,
			appDevDuties: appDevDuties,
		});
	} catch (error) {
		console.error("Database Query Failed:", error);
		res.status(500).json({
			code: 500,
			message: "Internal server error reading resume",
			success: false,
			error: error.message
		});
	} finally {
		if (conn) conn.release();
	}
}

module.exports = { getBlogData, getResumeData, getAppDevDuties };