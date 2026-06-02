const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;

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
	conn = await pool.getConnection();

	// Execute the query
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

	// Might implement role in the future
	// { userName: user.userName, role: user.role },

	// Generate stateless token with identity payload
	const token = jwt.sign(
		{ userName: singleUser.userName },
		JWT_SECRET,
		{ expiresIn: '1h' }
	);

	// Set the expireTime date/time for 1 hour
	const date = new Date();
	const expireTime = date.setHours(date.getHours() + 1);
	const authorization = {
		accessToken: token,
		accessTokenExpiration: expireTime,
		success: true
	}

	res.status(200).json(authorization);

	// Crucial: Always release the connection back to the pool
	if (conn) conn.end();

}

module.exports = { registerUser, login };