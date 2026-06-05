const mariadb = require("mariadb");

// Create a connection pool
const pool = mariadb.createPool({
	host: process.env.DB_SERVER,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	connectionLimit: process.env.CONNECTION_LIMIT
});

// Export the pool to use across app
module.exports = pool;
