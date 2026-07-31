const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');

/**
 * Retrieves server version.
 * 
 * @name getVersion
 * @route {GET} /api/version
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getVersion = async (req, res) => {
	try {
		// Send the JSON response
		res.status(200).json({
			code: 200,
			version: packageJson.version,
			success: true,
		});
	} catch {
		res.status(500).json({
			code: 500,
			message: "Server not responding",
			success: false,
		});
	}
}

module.exports = { getVersion };