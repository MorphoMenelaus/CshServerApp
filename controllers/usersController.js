const pool = require("../connection/dbConnection");
const bcrypt = require('bcrypt');

// @desc GET all users
// @route GET /api/users
// @access public
const getUsers = async (req, res) => {
	let conn;
	try {
		// Get a connection from the pool
		conn = await pool.getConnection();

		// Execute the query
		const rows = await conn.query("SELECT * FROM users ORDER BY userName DESC LIMIT 10");

		rows.forEach(row => {
			// password should never be shown in this response
			delete row.password;
			delete row.refreshToken;
		});

		// Send the JSON response
		res.status(200).json(rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Database query failed" });
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}
}

// @desc POST registerUser
// @route POST /api/users/register
// @access public
const registerUser = async (req, res) => {

	const { userName, password } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {
		// Validate inputs
		if (!userName || !password) {
			let msg = "All fields are requied";
			res.status(400).json({
				code: 400,
				message: msg,
				success: false,
			});
			throw new Error(msg);
		}

		// Hash password with 10 salt rounds
		const hashedPassword = await bcrypt.hash(password, 10);

		// Verify usreName is unique
		const rows = await conn.query(`SELECT * FROM users WHERE userName = '${userName}'`);
		if (rows?.length > 0) {
			res.status(400).json({
				code: 400,
				message: "User name already exists",
				success: false,
			});
		}

		// Paceholders (?) to securely neutralize SQL injection risks
		const result = await conn.query(
			"INSERT INTO users (userName, password) VALUES (?, ?)",
			[userName, hashedPassword]
		);

		res.status(201).json({
			code: 201,
			message: "User created successfully",
			success: true,
		});

	} catch {
		res.status(500).json({
			code: 500,
			message: "Registration failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}
}

// @desc GET user
// @route GET /api/users/:id
// @access public
const getUser = async (req, res) => {
	let conn;
	try {
		// Get a connection from the pool
		conn = await pool.getConnection();

		console.log(req.params.id);

		// Execute the query
		const rows = await conn.query(`SELECT * FROM users WHERE userId = '${req.params.id}'`);

		rows.forEach(row => {
			// password should never be shown in this response
			delete row.password;
			delete row.refreshToken;
		});

		// Send the JSON response
		res.status(200).json(rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Database query failed" });
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}
	// res.status(200).json({ message: `Get contact for ${req.params.id}` });
}

// @desc GET user preferences
// @route GET /api/users/prefs/:id
// @access public
const getUserPreferences = async (req, res) => {
	let conn;
	try {
		// Get a connection from the pool
		conn = await pool.getConnection();

		console.log(req.params.id);

		// Execute the query
		const rows = await conn.query(`SELECT * FROM userPreferences WHERE userId = "${req.params.id}"`);

		// Send the JSON response
		res.status(200).json(rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Database query failed" });
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}
	// res.status(200).json({ message: `Get contact for ${req.params.id}` });
}

// @desc Update user
// @route PUT /api/users/:id
// @access public
const updateUser = (req, res) => {
	res.status(200).json({ message: `Update contact for ${req.params.id}` });
}

// @desc Delete user
// @route DELETE  /api/users/:id
// @access public
const deleteUser = (req, res) => {
	res.status(200).json({ message: `Contact deleted for ${req.params.id}` });
}

// @desc GET getClockLog
// @route GET /api/users/clock/log
// @access public
const getClockLog = async (req, res) => {
	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Execute the query
		const rows = await conn.query("SELECT * FROM simpleClockLog ORDER BY eventId DESC LIMIT 10");

		res.status(200).json(rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false });
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}
}

// @desc POST logSimpleClock
// @route POST /api/users/clock
// @access public
const logSimpleClock = async (req, res) => {
	let conn;
	const { userId, userName, isWakeupEvent, notes } = req.body;

	try {	// Get a connection from the pool
		conn = await pool.getConnection();

		// Paceholders (?) to securely neutralize SQL injection risks
		const result = await conn.query(
			"INSERT INTO simpleClockLog (userId, userName, isWakeupEvent, notes) VALUES (?, ?, ?, ?)",
			[userId, userName, isWakeupEvent, notes]
		);

		res.status(200).json({ success: true });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false });
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}

}

module.exports = { getUsers, registerUser, getUser, getUserPreferences, updateUser, deleteUser, getClockLog, logSimpleClock }