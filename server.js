const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const errorHandler = require("./middleware/errorHandler");
const app = express();
app.use(express.json());

// Look at X-Forwarded-For headers instead of local proxy connections
app.set('trust proxy', '127.0.0.1'); // Only trust requests forwarded by localhost

const allowedDomains = [
	process.env.ORIGIN,
	process.env.STAGING_ORIGIN,
	process.env.REACT_ORIGIN
];

app.use((req, res, next) => {
	// *******************************************
	// REMOVE "*" BEFORE PRODUCTION
	// res.setHeader("Access-Control-Allow-Origin", "*");
	// Works fine for testing but not secure for production
	// *******************************************
	const origin = req.headers.origin;
	if (allowedDomains.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
	}
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("Access-Control-Allow-Credentials", true);
	next();
});

// app.use(cors({
// 	// *******************************************
// 	// REMOVE BEFORE PRODUCTION
// 	// *******************************************
// 	origin: 'http://localhost:5173', // Your Vue localhost URL
// 	methods: ['GET', 'PUT', 'OPTIONS'],
// 	allowedHeaders: ['Authorization', 'Content-Type'] // Explicitly allow Authorization
// }));

app.use("/api/auth", require("./routes/authenticationRoutes"));
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/api/serverInfo", require("./routes/serverInfoRoutes"));
app.use("/api/mail", require("./routes/mailRoutes"));
app.use("/api/userlogs", require("./routes/userLogsRoutes"));
app.use("/api/movies", require("./routes/moviesRoutes"));
app.use("/api/blog", require("./routes/blogRoutes"));
app.use("/api/toggl", require("./routes/togglRoutes"));
app.use("/api/stocks", require("./routes/stocksRoutes"));

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});	
