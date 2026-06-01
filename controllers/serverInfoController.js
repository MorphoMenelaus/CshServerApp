const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');

// @desc GET server version
// @route GET /api/version
// @access public
const getVersion = async (req, res) => {
	try {
		// Send the JSON response
		res.status(200).json({ version: packageJson.version });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server not responding" });
	}
}

module.exports = { getVersion };