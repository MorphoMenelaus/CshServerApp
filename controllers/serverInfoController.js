const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');

// @desc GET server version
// @route GET /api/version
// @access public
const getVersion = async (req, res) => {
	try {
		// Send the JSON response
		res.status(200).json({
			version: packageJson.version,
			success: true,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			code: 500,
			message: "Server not responding",
			success: false,
		});
	}
}

module.exports = { getVersion };