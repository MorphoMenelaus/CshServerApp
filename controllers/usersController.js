const pool = require("../connection/dbConnection");

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

// @desc Create new user
// @route POST /api/users
// @access public
const createUser = async (req, res) => {

	const { userName, password } = req.body;
	let conn;

	try {
		// Validate inputs
		if (!userName || !password) {
			res.status(400);
			throw new Error("All fields are requied");
		}

		// Get a connection from the pool
		conn = await pool.getConnection();

		// Verify usreName is unique
		const rows = await conn.query(`SELECT * FROM users WHERE userName = '${userName}'`); 
		if (rows.length > 0) {
			res.status(400);
			throw new Error("User name already exists");
		}


		// Paceholders (?) to securely neutralize SQL injection risks
		const result = await conn.query(
			"INSERT INTO users (userName, password) VALUES (?, ?)",
			[userName, password]
		);

		console.log(result);

		res.status(201).json({
			message: "User created successfully",
			insertId: Number(result.insertId)
		});

		// res.status(201).json({ message: "Create new contact" });
	} catch (error) {
		res.status(500).json({ error: error.message });
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

module.exports = { getUsers, createUser, getUser, getUserPreferences, updateUser, deleteUser }