const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const errorHandler = require("./middleware/errorHandler");
const app = express();
app.use(express.json());

app.use((req, res, next) => {
	// *******************************************
	// REMOVE "*" BEFORE PRODUCTION
	// res.setHeader("Access-Control-Allow-Origin", "*");
	// Works fine for testing but not secure for production
	// *******************************************

	res.setHeader("Access-Control-Allow-Origin", process.env.ORIGIN); // This line is for production
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

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});	
