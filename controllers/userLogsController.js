const pool = require("../connection/dbConnection");

/**
 * Retrieves logs all users, if authenticated via an access token.
 * These logs are to document user actions that are tracked.
 * They are not attached to the user record and remain even after a user is deleted.
 * 
 * @name getUserLogs
 * @route {GET} /api/userlogs
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getUserLogs = async (req, res) => {

	const reqLimit = req.query.limit;
	const reqOffset = req.query.offset;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {
		const limit = reqLimit && !isNaN(reqLimit) ? Number(reqLimit) : Number(process.env.LIST_LIMIT_DEFAULT);
		const offset = reqOffset && !isNaN(reqOffset) ? Number(reqOffset) : 0;

		// Clear snapshot cache to prevent stale data (forces a fresh read)
		await conn.query("COMMIT");

		// Execute the query
		const query = `SELECT * FROM userLogs ORDER BY entryId DESC LIMIT ? OFFSET ?`;
		const rows = await conn.execute(query, [limit, offset]);

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: "User logs query success",
			success: true,
			logs: rows,
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
 * Logs any changes of all users and data associated with users, if authenticated via an access token.
 * 
 * @name addUserLogs
 * @route {POST} /api/userlogs
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const addUserLogs = async (req, res) => {
	const { userId, userName, actionPerformed } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {
		// Validate inputs
		if (!userId || !userName || !actionPerformed) {
			let message = "All fields are requied";
			res.status(400).json({
				code: 400,
				message: message,
				success: false,
			});
			throw new Error(message);
		}

		// Placeholders (?) to securely neutralize SQL injection risks
		const result = await conn.query(
			"INSERT INTO userLogs (userId, userName, actionPerformed) VALUES (?, ?, ?)",
			[userId, userName, actionPerformed]
		);

		await conn.commit();

		res.status(201).json({
			code: 201,
			message: "User event log added successfully",
			success: true,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Insert log failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Retrieves the logs for the SimpleClock component, if authenticated via an access token.
 * 
 * @name getClockLog
 * @route {GET} /api/userlogs/clock/log
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getClockLog = async (req, res) => {

	const reqLimit = req.query.limit;
	const reqOffset = req.query.offset;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		const limit = reqLimit && !isNaN(reqLimit) ? Number(reqLimit) : Number(process.env.LIST_LIMIT_DEFAULT);
		const offset = reqOffset && !isNaN(reqOffset) ? Number(reqOffset) : 0;

		// Clear snapshot cache to prevent stale data (forces a fresh read)
		await conn.query("COMMIT");

		// Execute the query
		const query = `SELECT * FROM simpleClockLog ORDER BY eventId DESC LIMIT ? OFFSET ?`;
		const rows = await conn.execute(query, [limit, offset]);

		// Convert driver-specific rows to a clean, standard JS array
		const cleanRows = Array.from(rows).map(row => {
			// Create a copy and omit userId
			const { userId, ...rest } = row;
			return rest;
		});

		res.status(200).json(cleanRows);
	} catch (error) {
		console.error(error);
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
 * Adds an entry to the logs for the SimpleClock component, if authenticated via an access token.
 * 
 * @name logSimpleClock
 * @route {POST} /api/userlogs/clock
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const logSimpleClock = async (req, res) => {
	const { userId, userName, eventType, isWakeupEvent, notes } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Paceholders (?) to securely neutralize SQL injection risks
		const result = await conn.query(
			"INSERT INTO simpleClockLog (userId, userName, eventType, isWakeupEvent, notes) VALUES (?, ?, ?, ?, ?)",
			[userId, userName, eventType, isWakeupEvent, notes]
		);

		await conn.commit();

		res.status(200).json({
			code: 200,
			message: "Log entry added",
			success: true
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			code: 500,
			message: "Insert record failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

module.exports = { getUserLogs, addUserLogs, getClockLog, logSimpleClock };