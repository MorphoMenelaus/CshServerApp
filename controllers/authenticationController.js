const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Login to an existing user account.
 * 
 * @name login
 * @route {POST} /api/auth/login
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const login = async (req, res) => {
	const { userName, password } = req.body;

	// Get a connection from the pool
	let conn = await pool.getConnection();

	try {
		// Get user record
		const users = await conn.query(`SELECT * FROM users WHERE userName = '${userName}'`);
		let singleUser = users[0];

		// const user = users.find(u => u.userName === userName);

		const isBcryptHash = singleUser.password.startsWith('$2b$') || singleUser.password.startsWith('$2a$');

		// Compare hashed password if bcrypt hashed
		let isPasswordValid;
		if (isBcryptHash) {
			isPasswordValid = await bcrypt.compare(password, singleUser.password);
		}

		if (!isPasswordValid) return res.status(400).json({
			code: 400,
			message: "Invalid credentials",
			success: false,
		});

		// restructure user data before returning with auth codes
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

		// Generate stateless token with identity payload
		// Set the accessToken expireTime for 1 hour
		const token = jwt.sign(
			{ userName: singleUser.userName },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1h' }
		);

		// Set the refreshToken expireTime for 1 week
		const refreshToken = jwt.sign(
			{ userName: singleUser.userName },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		);

		// Save refresh token and last login into user record
		const lastLoginTime = new Date().toISOString().slice(0, 23);
		const userIp = req.ip;
		const saveRefreshToken = await conn.query(`UPDATE users 
			SET refreshToken = '${refreshToken}', lastLogin = '${lastLoginTime}', lastIp = '${userIp}' 
			WHERE userName = '${singleUser.userName}'`);

		let date = new Date();
		const expireTime = date.setHours(date.getHours() + 1);
		const authorization = {
			accessToken: token,
			accessTokenExpiration: expireTime,
			refreshToken: refreshToken,
			user: singleUser,
			success: true
		}

		if (!singleUser.verified) return res.status(200).json({
			code: 200,
			message: "Login success",
			success: true,
			authorization: authorization,
		});

		res.status(200).json({
			code: 200,
			message: "",
			success: true,
			authorization: authorization
		});
	} catch {
		res.status(500).json({
			code: 500,
			message: "Login failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Refreshes an expired authentication token if the refresh token is valid and is no more than a week old.
 * 
 * @name refresh
 * @route {POST} /api/auth/refresh
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const refresh = async (req, res) => {
	const { accessToken, refreshToken } = req.body;

	// Get a connection from the pool
	let conn = await pool.getConnection();

	try {

		// Match active refresh token and get user record
		const users = await conn.query(`SELECT * FROM users WHERE refreshToken = '${refreshToken}'`);
		let singleUser = users[0];
		let userName = singleUser?.userName;

		if (singleUser?.refreshToken !== refreshToken) {
			res.status(403).json({
				code: 403,
				message: "Account is already logged into on another device",
				success: false,
			});
			throw new Error("Account is already logged into on another device");
		}

		// Verify the token integrity
		jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, userName) => {
			if (err) return res.status(403).json({
				code: 403,
				message: "Token verification failed.",
				success: false,
			});
		});

		// Generate stateless token with identity payload
		// Set the accessToken expireTime for 1 hour
		const newToken = jwt.sign(
			{ userName: singleUser.userName },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1h' }
		);

		// Issue a new refresh token
		// Set the refreshToken expireTime for 1 week
		const newRefreshToken = jwt.sign(
			{ userName: singleUser.userName },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		);

		// Save refresh token and last login into user record
		const lastLoginTime = new Date().toISOString().slice(0, 23);
		const saveRefreshToken = await conn.query(`UPDATE users 
			SET refreshToken = '${newRefreshToken}', lastLogin = '${lastLoginTime}' 
			WHERE userName = '${singleUser.userName}'`);

		// Set the accessToken expireTime for 1 hour
		let date = new Date();
		const expireTime = date.setHours(date.getHours() + 1);
		const newAuthorization = {
			accessToken: newToken,
			accessTokenExpiration: expireTime,
			refreshToken: newRefreshToken,
			success: true
		}

		res.status(200).json({
			code: 200,
			message: "Token refreshed successfully",
			success: true,
			authorization: newAuthorization
		});

	} catch {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Logs a user out of the system and deletes the refresh token from the user account record.
 * 
 * @name logout
 * @route {POST} /api/auth/logout
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const logout = async (req, res) => {
	const { userName } = req.body;

	let conn = await pool.getConnection();

	try {
		// Remove refresh token from user record
		const removeRefreshToken = await conn.query(`UPDATE users SET refreshToken = '' WHERE userName = '${userName}'`);

		const logoutJson = {
			accessToken: "",
			accessTokenExpiration: "",
			refreshToken: "",
		}

		res.status(200).json({
			code: 200,
			message: "Logged out successfully",
			success: true,
			logout: logoutJson
		});

	} catch {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Check if the refresh token is valid and is no more than a week old.
 * 
 * @name checkToken
 * @route {POST} /api/auth/checkToken
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - If there is no 500 internal error, returns code 200 with a Boolean for tokenValid.
 * @returns {Promise<void>}
 */
const checkToken = async (req, res) => {
	const { accessToken, refreshToken } = req.body;

	// Get a connection from the pool
	let conn = await pool.getConnection();

	try {

		// Match active refresh token and get user record
		const users = await conn.query(`SELECT * FROM users WHERE refreshToken = '${refreshToken}'`);
		let singleUser = users[0];
		let userName = singleUser?.userName;

		if (singleUser?.refreshToken !== refreshToken) {
			res.status(200).json({
				code: 200,
				tokenValid: false,
				success: false,
			});
		}

		jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, userName) => {
			if (err) return res.status(200).json({
				code: 200,
				tokenValid: false,
				success: false,
			});
		});

		res.status(200).json({
			code: 200,
			tokenValid: true,
			success: true,
		});

	} catch {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error",
			success: false,
		});
	} finally {
		if (conn) conn.release();
	}
}

module.exports = { login, refresh, logout, checkToken };