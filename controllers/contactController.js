const pool = require("../connection/dbConnection");

// @desc GET all contacts
// @route GET /api/contacts
// @access public
const getContacts = async (req, res) => {
	let conn;
	try {
		// Get a connection from the pool
		conn = await pool.getConnection();

		// Execute the query
		const rows = await conn.query("SELECT * FROM users ORDER BY userName DESC LIMIT 10");

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

// @desc Create new contacts
// @route POST /api/contacts
// @access public
const createContact = async (req, res) => {

	const { userName, password } = req.body;
	let conn;
	try {
		// Validate inputs
		// if (!userName || !password) {
		// 	res.status(400);
		// 	throw new Error("All fields are requied");
		// }

		// Get a connection from the pool
		conn = await pool.getConnection();

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

// @desc GET contacts
// @route GET /api/contacts/:id
// @access public
const getContact = (req, res) => {
	res.status(200).json({ message: `Get contact for ${req.params.id}` });
}

// @desc Update contacts
// @route PUT /api/contacts/:id
// @access public
const updateContact = (req, res) => {
	res.status(200).json({ message: `Update contact for ${req.params.id}` });
}

// @desc Delete contacts
// @route DELETE  /api/contacts/:id
// @access public
const deleteContact = (req, res) => {
	res.status(200).json({ message: `Contact deleted for ${req.params.id}` });
}

module.exports = { getContacts, createContact, getContact, updateContact, deleteContact }