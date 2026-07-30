const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {

	// Extract the Authorization header
	const authHeader = req.headers["authorization"];

	// Parse the Bearer token scheme
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({
			code: 401,
			message: "Access token missing or invalid",
			success: false
		});
	}

	try {

		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
			// If verification fails (expired, altered token, etc.), return 403 Forbidden
			if (err) {
				return res.status(403).json({
					code: 403,
					message: "Token is invalid or expired",
					success: false
				});
			}

			req.userName = decodedPayload;

			next();
		});
		
	} catch {
		return res.status(403).json({
			code: 403,
			message: "Invalid or Expired Token",
			success: false
		});
	}
}

module.exports = authenticateToken;