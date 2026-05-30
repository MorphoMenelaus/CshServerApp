const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const errorHandler = require("./middleware/errorHandler");
const app = express();
app.use(express.json());

app.use((req, res, next) => {
	// Need to find a working alternative to "*"
	// Works fine for testing but might not be secure for production
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("Access-Control-Allow-Credentials", true);
	next();
});

app.use("/api/contacts", require("./routes/contactRoutes"));
app.use(errorHandler);

const port = process.env.port || 3000;

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});	
