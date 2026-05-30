const mariadb = require('mariadb');
const pool = mariadb.createPool({
	host: process.env.DB_SERVER,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	connectionLimit: process.env.CONNECTION_LIMIT
});

const connectDB = async () => {
	try {
		const connect = await pool.getConnection();
		console.log(connect);
		const rows = await connect.query("SELECT 1 as val");
		console.log(rows); //[ {val: 1}, meta: ... ]
	} catch (err) {
		throw err;
	} finally {
		if (connect) connect.end();
	}
}

connectDB().then(() => {
	pool.end();
});

module.exports = connectDB;
