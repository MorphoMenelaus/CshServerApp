const mariadb = require("mariadb");

// Create a connection pool
const pool = mariadb.createPool({
	host: "localhost",
	user: "chriawjp_Vue3MeDB",
	password: "chFeWcr/tf/2\'h;EEu_G",
	database: "chriawjp_VueDbExperiment",
	connectionLimit: 5 // Adjust based on your server capacity
});

// Export the pool to use across app
module.exports = pool;
