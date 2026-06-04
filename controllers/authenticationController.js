const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// @desc POST registerUser
// @route POST /api/auth/register
// @access public
const registerUser = async (req, res) => {

	// Might implement role in the future
	// const { email, password, role } = req.body;
	const { userName, password } = req.body;

	let conn;
	let regError;
	let regCode;

	try {
		// Validate inputs
		if (!userName || !password) {
			res.status(400);
			regCode = 400;
			regError = "All fields are requied";
			throw new Error(regError);
		}

		// Hash password with 10 salt rounds
		const hashedPassword = await bcrypt.hash(password, 10);

		// Get a connection from the pool
		conn = await pool.getConnection();

		// Verify usreName is unique
		const rows = await conn.query(`SELECT * FROM users WHERE userName = '${userName}'`);
		if (rows.length > 0) {
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
			code: regCode ? regCode : 500,
			message: regError ? regError : "Registration failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}
}

// @desc POST login
// @route POST /api/auth/login
// @access public
const login = async (req, res) => {
	const { userName, password } = req.body;

	// Get a connection from the pool
	let conn = await pool.getConnection();

	// Get user record
	const users = await conn.query(`SELECT * FROM users WHERE userName = '${userName}'`);
	let singleUser = users[0];

	const pref = await conn.query(`SELECT * FROM userPreferences WHERE userId = '${singleUser.userId}'`);
	let preferences = {};
	if (pref.length > 0) {
		preferences = pref[0];
		delete preferences.userId;
		delete preferences.userName;
	}

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

	// Might implement role in the future
	// { userName: user.userName, role: user.role },

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

	// Save refresh token into user record
	const saveRefreshToken = await conn.query(`UPDATE users SET refreshToken = '${refreshToken}' WHERE userName = '${singleUser.userName}'`);

	const date = new Date();
	const expireTime = date.setHours(date.getHours() + 1);
	const authorization = {
		accessToken: token,
		accessTokenExpiration: expireTime,
		refreshToken: refreshToken,
		preferences: preferences,
		success: true
	}

	res.status(200).json(authorization);

	// Crucial: Always release the connection back to the pool
	if (conn) conn.end();

}

// @desc POST refresh token
// @route POST /api/auth/refresh
// @access public
const refresh = async (req, res) => {
	const { accessToken, refreshToken } = req.body;

	// Get a connection from the pool
	let conn = await pool.getConnection();

	try {

		// Match active refresh token and get user record
		const users = await conn.query(`SELECT * FROM users WHERE refreshToken = '${refreshToken}'`);
		let singleUser = users[0];
		let userName = singleUser.userName;

		if (singleUser?.refreshToken !== refreshToken) {
			res.status(403).json({
				code: 403,
				message: "Refresh Tokens are not a match to the user record",
				success: false,
			});
			throw new Error("Refresh Tokens are not a match to the user record");
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

		// Save refresh token into user record
		const saveRefreshToken = await conn.query(`UPDATE users SET refreshToken = '${newRefreshToken}' WHERE userName = '${singleUser.userName}'`);

		// Set the accessToken expireTime for 1 hour
		const date = new Date();
		const expireTime = date.setHours(date.getHours() + 1);
		const newAuthorization = {
			accessToken: newToken,
			accessTokenExpiration: expireTime,
			refreshToken: newRefreshToken,
			success: true
		}

		res.status(200).json(newAuthorization);

	} catch {
		res.status(500).json({
			code: 500,
			message: "Refresh failed.",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.end();
	}
}

// @desc POST logout
// @route POST /api/auth/logout
// @access public
const logout = async (req, res) => {
	let conn = await pool.getConnection();

	const { userName } = req.body;

	// Remove refresh token from user record
	const removeRefreshToken = await conn.query(`UPDATE users SET refreshToken = '' WHERE userName = '${userName}'`);

	const logoutJson = {
		accessToken: "",
		accessTokenExpiration: "",
		refreshToken: "",
		message: "Logged out successfully",
		success: true
	}

	res.json(logoutJson);

	// Crucial: Always release the connection back to the pool
	if (conn) conn.end();
};

module.exports = { registerUser, login, refresh, logout };