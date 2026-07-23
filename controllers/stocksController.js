const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');

/**
 * Retrieves server version.
 * 
 * @name getStocks
 * @route {GET} /api/stocks
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getStocks = async (req, res) => {
	const { start, end, limit, offset, series_id } = req.query;

	const dateValidate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
	const validStart = start && dateValidate.test(start);
	const validEnd = end && dateValidate.test(end);
	const cleanLimit = limit && limit < 100000 ? limit : 1000; // Capped at 100,000 observations per request
	const cleanOffset = offset ? offset : 0;

	if (!validStart || !validEnd) {
		let message = "Start and end dates are required and in the format of YYYY-MM-DD";
		res.status(400).json({
			code: 400,
			message: message,
			success: false,
		});
		throw new Error(message);
	}

	const cleanSeries = series_id ? series_id : "SP500";
	const observation_start = start;
	const observation_end = end;

	// The Federal Reserve Bank of St. Louis (FRED) does not enforce a strict daily limit for free API calls.
	// Instead, the free API restricts usage to 120 requests per minute.
	const api_token = process.env.FRED_API_KEY;

	try {

		let stocksData = [];

		const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${cleanSeries}&api_key=${api_token}&file_type=json&observation_start=${observation_start}&observation_end=${observation_end}&limit=${cleanLimit}&offset=${cleanOffset}`;

		const response = await fetch(fredUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("FRED server Rejected Request:", errorText);
			return res.status(response.status).json({
				code: response.status,
				success: false,
				error: `FRED server responded with: ${errorText}`
			});
		}

		const data = await response.json();

		res.status(200).json({
			code: 200,
			message: "Stock data success",
			success: true,
			stocks: data,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			code: 500,
			message: `Server not responding: ${error.message}`,
			success: false,
		});
	}
}

module.exports = { getStocks };