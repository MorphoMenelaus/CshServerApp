const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {

	// Extract the Authorization header
	const authHeader = req.headers["authorization"];

	// Parse the Bearer token scheme
	const token = authHeader && authHeader.split(" ")[1];

	// If no token is provided, return a 401 Unauthorized error
	if (!token) {
		return res.status(401).json({
			code: 401,
			message: "Access token missing or invalid",
			success: false
		});
	}

	try {

		// Verify the token signature and expiration against your secret key
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
			// If verification fails (expired, altered token, etc.), return 403 Forbidden
			if (err) {
				return res.status(403).json({
					code: 403,
					message: "Token is invalid or expired",
					success: false
				});
			}

			// Attach the decoded user payload to the request object for downstream routes
			req.userName = decodedPayload;

			// Pass control to the next function/route handler
			next();
		});
		
	} catch (error) {
		return res.status(403).json({
			code: 403,
			message: "Invalid or Expired Token",
			success: false
		});
	}
}

module.exports = authenticateToken;