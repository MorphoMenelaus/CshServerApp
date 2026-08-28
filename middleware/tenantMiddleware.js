/**
 * Multi-tenant handler verifies that origins match an allowed list.
 * Dynamically builds the configuration object matchinng the tenantPrefix to .env file properties.
 * 
 * @name tenantConfigMiddleware
 * @route /api
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {<void>}
 */
const tenantConfigMiddleware = (req, res, next) => {
	const TENANT_MAP = {
		"https://cshardwick.com": "CSHARDWICK",
		"https://cshapp.hardwick.design": "CSHAPP",
		"https://vue3db.hardwick.design": "VUE3DB",
		"http://wavefunctioncreative.com": "WFC",
		"https://csh-react.hardwick.design": "REACT",
		"http://localhost:5173": "LOCAL"
	};

	let origin = req.headers.origin;

	// Fallback: If origin is missing, extract the base origin from the Referer header
	if (!origin && req.headers.referer) {
		try {
			const refererUrl = new URL(req.headers.referer);
			origin = refererUrl.origin;
		} catch (e) {
			return res.status(403).json({ error: "Unknown origin" });
		}
	}

	// *******************************************
	// REMOVE "*" BEFORE PRODUCTION
	// res.setHeader("Access-Control-Allow-Origin", "*");
	// Works fine for testing but not secure for production
	// *******************************************

	const tenantPrefix = TENANT_MAP[origin];

	if (!tenantPrefix) {
		// Fail early if the origin isn"t recognized or allowed.
		// Warning: Postman headers...
		// When Postman might send req.headers.host but req.headers.origin will be undefined.
		// Postman might fail this check, especially if on localhost environment.
		return res.status(403).json({ error: "Unauthorized or unknown origin" });
	}

	res.setHeader("Access-Control-Allow-Origin", process.env[`${tenantPrefix}_ORIGIN`]);
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("Access-Control-Allow-Credentials", true);

	req.tenant = {
		origin: process.env[`${tenantPrefix}_ORIGIN`],
		hostName: process.env[`${tenantPrefix}_HOSTNAME`],
		recaptcha: {
			siteKey: process.env[`${tenantPrefix}_RECAPTCHA_SITE_KEY`],
			secretKey: process.env[`${tenantPrefix}_RECAPTCHA_SECRET_KEY`]
		},
		smtp: {
			host: process.env[`${tenantPrefix}_SMTP_HOST`],
			user: process.env[`${tenantPrefix}_SMTP_USER`],
			pass: process.env[`${tenantPrefix}_SMTP_PASS`]
		},
		emails: {
			host: process.env[`${tenantPrefix}_HOST_EMAIL_ADDRESS`],
			noReply: process.env[`${tenantPrefix}_NOREPLY_EMAIL`],
			admin: process.env[`${tenantPrefix}_ADMIN_EMAIL`]
		}
	};

	next();
};

module.exports = tenantConfigMiddleware;