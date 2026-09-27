const mariadb = require("mariadb")

// Create a connection pool
const pool = mariadb.createPool({
	host: process.env.HD_SERVER,
	user: process.env.HD_USERNAME,
	password: process.env.HD_PASSWORD,
	database: process.env.HD_DATABASE,
	connectionLimit: process.env.CONNECTION_LIMIT,
	meta: false, // Disables the driver's metadata array wrapping
})

// Export the pool to use across app
module.exports = pool
