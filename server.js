BigInt.prototype.toJSON = function () {
	return this.toString();
};
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const errorHandler = require("./middleware/errorHandler");
const app = express();
app.use(express.json());

// Look at X-Forwarded-For headers instead of local proxy connections
// Only trust requests forwarded by localhost
app.set('trust proxy', '127.0.0.1');

// if having problems with server using IPv6 loopback addresses instead of standard IPv4
// app.set('trust proxy', ['127.0.0.1', '::1']);

app.use("/api", require("./middleware/tenantMiddleware"));
app.use("/api/auth", require("./routes/authenticationRoutes"));
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/api/serverInfo", require("./routes/serverInfoRoutes"));
app.use("/api/mail", require("./routes/mailRoutes"));
app.use("/api/userlogs", require("./routes/userLogsRoutes"));
app.use("/api/movies", require("./routes/moviesRoutes"));
app.use("/api/blog", require("./routes/blogRoutes"));
app.use("/api/toggl", require("./routes/togglRoutes"));
app.use("/api/stocks", require("./routes/stocksRoutes"));
app.use("/api/gemini", require("./routes/geminiRoutes"));

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
