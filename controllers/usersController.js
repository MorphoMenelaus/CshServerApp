const pool = require("../connection/dbConnection");
const bcrypt = require('bcrypt');

/**
 * Retrieves the full details of all users, if authenticated via an access token.
 * 
 * @name getUsers
 * @route {GET} /api/users
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getUsers = async (req, res) => {
	// Get a connection from the pool
	const conn = await pool.getConnection();

	const resultLimit = req.query.limit || process.env.LIST_LIMIT_DEFAULT;
	const resultOffset = req.query.offset || 0;

	try {

		// Clear snapshot cache to prevent stale data (forces a fresh read)
		await conn.query("COMMIT");

		// Execute the query
		const query = `SELECT * FROM users ORDER BY userName DESC LIMIT ? OFFSET ?`;
		const rows = await conn.execute(query, [resultLimit, resultOffset]);

		rows.forEach(row => {
			// password should never be shown in this response
			delete row.password;
			delete row.refreshToken;
		});

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: "User list query success",
			success: true,
			users: rows,
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
 * Refisters a new users. The userName must be unique.
 * 
 * @name registerUser
 * @route {POST} /api/users/register
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
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
			throw new Error("User name already exists");
		}

		// Placeholders (?) to securely neutralize SQL injection risks
		const result = await conn.query(
			"INSERT INTO users (userName, password) VALUES (?, ?)",
			[userName, hashedPassword]
		);

		await conn.commit();

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
		if (conn) conn.release();
	}
}

/**
 * Changes a users password. User must have a correct current passsword.
 * User must be logged in to change password
 * 
 * @name changePassword
 * @route {POST} /api/users/password
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const changePassword = async (req, res) => {

	const { userId, currentPassword, password } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {
		// Validate inputs
		if (!currentPassword || !password) {
			let message = "All fields are requied";
			res.status(400).json({
				code: 400,
				message: message,
				success: false,
			});
			throw new Error(message);
		}

		// Get user record
		const users = await conn.query(`SELECT * FROM users WHERE userId = '${userId}'`);
		let singleUser = users[0];

		const isBcryptHash = singleUser.password.startsWith('$2b$') || singleUser.password.startsWith('$2a$');

		// Compare hashed password if bcrypt hashed
		let isPasswordValid;
		if (isBcryptHash) {
			isPasswordValid = await bcrypt.compare(currentPassword, singleUser.password);
		}

		if (!isPasswordValid) return res.status(400).json({
			code: 400,
			message: "Invalid credentials",
			success: false,
		});

		// Hash password with 10 salt rounds
		const hashedPassword = await bcrypt.hash(password, 10);

		const result = await conn.query(
			`UPDATE users SET password = ? WHERE userId = '${userId}'`,
			[hashedPassword]
		);

		// Remove refresh token from user record
		const removeRefreshToken = await conn.query(`UPDATE users SET refreshToken = '' WHERE userId = '${userId}'`);

		await conn.commit();

		res.status(201).json({
			code: 201,
			message: "Password changed successfully",
			success: true,
		});

	} catch {
		res.status(500).json({
			code: 500,
			message: "Password change failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Retrieves the full details of a single user, if authenticated via an access token.
 * 
 * @name getUser
 * @route {GET} /api/users/:id
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getUser = async (req, res) => {

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Execute the query
		const rows = await conn.query(`SELECT * FROM users WHERE userId = '${req.params.id}'`);

		rows.forEach(row => {
			// password should never be shown in this response
			delete row.password;
			delete row.refreshToken;
		});

		let singleUser = rows[0];

		// Send the JSON response
		res.status(200).json({
			user: singleUser,
			code: 200,
			message: "Database query success",
			success: true,
		});

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
 * Retrieves user preferences, if authenticated via an access token.
 * 
 * @name getUserPreferences
 * @route {GET} /api/users/prefs/:id
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getUserPreferences = async (req, res) => {
	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Execute the query
		const rows = await conn.query(`SELECT * FROM userPreferences WHERE userId = "${req.params.id}"`);

		// Send the JSON response
		res.status(200).json(rows);

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
 * Update user profiles, must be authenticated via an access token.
 * 
 * @name updateUser
 * @route {PUT} /api/users/:id
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const updateUser = async (req, res) => {
	const { email, lastName, firstName, admin, siteAdmin, siteEditor, contributor, uiDarkMode, userNotes } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Placeholders (?) to securely neutralize SQL injection risks
		const queryText = `
        UPDATE users 
        SET 
            email = ?, 
            lastName = ?, 
            firstName = ?, 
            admin = ?, 
            siteAdmin = ?, 
            siteEditor = ?, 
            contributor = ?, 
            uiDarkMode = ?, 
            userNotes = ? 
        WHERE userId = ?
    `;

		const values = [
			email,
			lastName,
			firstName,
			admin,
			siteAdmin,
			siteEditor,
			contributor,
			uiDarkMode,
			userNotes,
			req.params.id
		];

		await conn.query(queryText, values);

		await conn.commit();

		res.status(201).json({
			code: 201,
			message: "User updated successfully",
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
 * Deletes a user, if authenticated via an access token.
 * Any log entries inserted by this user will remain. 
 * 
 * @name deleteUser
 * @route {DELETE} /api/users/:id
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const deleteUser = async (req, res) => {
	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		console.log(req.params.id);

		// Get user record
		const rows = await conn.query(`SELECT * FROM users WHERE userId = '${req.params.id}'`);
		let singleUser = rows[0];

		// Get user record
		const userDeleted = await conn.query(`DELETE FROM users WHERE userId = '${req.params.id}'`);

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: `Deleted user, ${singleUser.userName}`,
			success: true,
		});

	} catch (error) {
		console.error(error);
		res.status(500).json({
			code: 500,
			message: "Delete failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

module.exports = { getUsers, registerUser, changePassword, getUser, getUserPreferences, updateUser, deleteUser }