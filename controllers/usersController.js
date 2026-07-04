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

	const reqLimit = req.query.limit;
	const reqOffset = req.query.offset;

	try {

		const limit = reqLimit && !isNaN(reqLimit) ? Number(reqLimit) : Number(process.env.LIST_LIMIT_DEFAULT);
		const offset = reqOffset && !isNaN(reqOffset) ? Number(reqOffset) : 0;

		// Clear snapshot cache to prevent stale data (forces a fresh read)
		await conn.query("COMMIT");

		// Execute the query
		const query = `SELECT * FROM users ORDER BY userName DESC LIMIT ? OFFSET ?`;
		const rows = await conn.execute(query, [limit, offset]);

		rows.forEach(row => {
			// password should never be shown in this response
			// Also remove other things that don't need to be returned fir this.
			delete row.password;
			delete row.refreshToken;
			delete row.uiDarkMode;
			delete row.verificationCode;
			delete row.verificationExpires;
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
 * Registers a new users. The userName must be unique.
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

	const { token, userName, email, password } = req.body;

	// Validate inputs
	if (!userName || !email || !password) {
		let message = "All fields are requied";
		res.status(400).json({
			code: 400,
			message: message,
			success: false,
		});
		throw new Error(message);
	}

	const apiKey = process.env.RECAPTCHA_SECRET_KEY;
	const siteKey = process.env.RECAPTCHA_SITE_KEY;
	const hostname = process.env.HOSTNAME;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		let body = {
			event: {
				token: token,
				siteKey: siteKey,
				expectedAction: "register" // Must match the action string used in frontend component
			}
		}

		const apiUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${apiKey}&response=${token}`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		const data = await response.json();

		if (!data?.success) {
			return res.status(500).json({
				code: 500,
				success: false,
				message: "Google Recaptcha assessment failed"
			});
		}

		// Check if the assessment verdict is safe
		if (data?.score >= 0.5 && data?.hostname === hostname) {

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
				"INSERT INTO users (userName, email, password) VALUES (?, ?, ?)",
				[userName, email, hashedPassword]
			);

			await conn.commit();

			body = {
				userName: userName,
				email: email
			}

			const verifyUrl = `https://${hostname}/api/mail/verify`;

			const verifyResponse = await fetch(verifyUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const sentEmail = await verifyResponse.json();

			if (!sentEmail.success) {
				res.status(204).json({
					code: 204,
					message: "User code not sent",
					success: false,
				});

			} else {
				res.status(201).json({
					code: 201,
					message: "User created successfully",
					success: true,
				});
			}

		} else {
			// Block the request
			res.status(400).json({
				code: 400,
				success: false,
				message: "Bot activity detected."
			});
		}

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
 * Retrieves the full details of users WHERE userName LIKE %keyword%, if authenticated via an access token.
 * 
 * @name findUserByName
 * @route {GET} /api/users/name/:userName
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const findUserByName = async (req, res) => {

	const searchTerms = req.params.userName || "";

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		const query = `SELECT * FROM users WHERE userName LIKE ?`;
		const rows = await conn.query(query, ['%' + searchTerms + '%']);

		rows.forEach(row => {
			// password should never be shown in this response
			delete row.password;
			delete row.refreshToken;
		});

		res.status(200).json({
			users: rows,
			code: 200,
			message: `Database query - ${searchTerms} -  success`,
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
	const { email, lastName, firstName, admin, siteAdmin, siteEditor, contributor, uiDarkMode, userNotes, verified } = req.body;

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
            userNotes = ?, 
			verified = ? 
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
			verified,
			req.params.id
		];

		await conn.query(queryText, values);

		await conn.commit();

		const rows = await conn.query(`SELECT * FROM users WHERE userId = '${req.params.id}'`);

		let singleUser = rows[0];

		// restructure user data before returning
		let permissions = {
			admin: singleUser.admin === 1 ? true : false,
			siteAdmin: singleUser.siteAdmin === 1 ? true : false,
			siteEditor: singleUser.siteEditor === 1 ? true : false,
			contributor: singleUser.contributor === 1 ? true : false,
			verified: singleUser.verified === 1 ? true : false
		}

		singleUser.uiDarkMode = singleUser.uiDarkMode === 1 ? true : false;
		singleUser.permissions = permissions;
		delete singleUser.password;
		delete singleUser.refreshToken;
		delete singleUser.admin;
		delete singleUser.siteAdmin;
		delete singleUser.siteEditor;
		delete singleUser.contributor;
		delete singleUser.verified;

		res.status(201).json({
			code: 201,
			message: "User updated successfully",
			success: true,
			user: singleUser,
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

		// Delete user records
		await conn.query(`DELETE FROM users WHERE userId = '${req.params.id}'`);
		await conn.query(`DELETE FROM userStore WHERE userId = '${req.params.id}'`);

		// Send the JSON response
		res.status(200).json({
			code: 200,
			message: `User Deleted`,
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

/**
 * Verify a new users email address.
 * 
 * @name verifyCode
 * @route {POST} /api/users/verify
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const verifyCode = async (req, res) => {

	const userName = req.body.userName;
	const verificationCode = Number(req.body.verificationCode);

	// const userName = req.query.userName;
	// const verificationCode = Number(req.query.verificationCode);

	// Validate inputs
	if (!userName || !verificationCode) {
		let message = "All params are requied";
		res.status(400).json({
			code: 400,
			message: message,
			success: false,
		});
		throw new Error(message);
	}

	// Get a connection from the pool
	const conn = await pool.getConnection();

	try {

		// Get user record by email
		const users = await conn.query(`SELECT * FROM users WHERE userName = '${userName}'`);
		const singleUser = users[0];

		const codeValid = Date.parse(singleUser?.verificationExpires) > Date.now();

		if (Number(singleUser.verificationCode) === verificationCode && codeValid) {

			const queryText = `
			UPDATE users 
			SET 
				verified = ? 
			WHERE userName = ?
			`;
			const values = [1, userName];

			await conn.query(queryText, values);
			await conn.commit();

			res.status(201).json({
				code: 201,
				message: "Code verified successfully",
				success: true,
			});

		} else {
			res.status(403).json({
				code: 403,
				message: "Verification code not valid.",
				success: false,
			});
		}

	} catch {
		res.status(500).json({
			code: 500,
			message: "Verification failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

module.exports = { getUsers, registerUser, changePassword, getUser, findUserByName, getUserPreferences, updateUser, deleteUser, verifyCode }