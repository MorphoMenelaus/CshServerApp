const pool = require("../connection/dbConnection");

// @desc GET all user logs
// @route GET /api/userlogs
// @access public
const getUserLogs = async (req, res) => {
	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {
		// Execute the query
		const rows = await conn.query("SELECT * FROM userLogs ORDER BY entryId DESC LIMIT 10");

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

// @desc POST add user logs
// @route POST /api/userlogs
// @access public
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
			message: "Inser log failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

module.exports = { getUserLogs, addUserLogs };