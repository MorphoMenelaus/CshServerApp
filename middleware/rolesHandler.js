/**
 * Roles handler verifies that access to protected endpoints meet roles and permissions requirements.
 * Pass permission requirements to the function as a comma separated list; authorizeRoles("siteAdmin", "siteEditor", "contributor")
 * "verified" is required for all protected exdpoints and therefore assumed when this handler is being used.
 * Do not pass "verified" into this function.
 * For example, authorizeRoles("siteEditor") is assumed to also require "verified" account.
 * 
 * An unverified account will not pass this check, even if other permissions are present.
 * 
 * Public endpoints should not use this handler since a "verified" account is the base level requirement.
 * 
 * "admin" is an exception to the "verified" rule.
 * An "admin" should always have access and therefore "admin" permissions should be rare 
 * and only given to trusted agents.
 * 
 * @name authorizeRoles
 * @auth Requires JWT access token in the req header.
 * 
 * @param {Object} req object
 * @param {Function} next - Express next middleware function
 * @returns {<void>}
 */
function authorizeRoles(...requiredRoles) {
	return (req, res, next) => {

		if (!req?.userName || !req?.roles) {
			return res.status(403).json({
				code: 403,
				message: "Access denied: No role found",
				success: false
			});
		}

		console.log(requiredRoles);
		console.log(req.roles);

		const isAdmin = req.roles.includes("admin");
		if (isAdmin) return next();

		const isVerified = req.roles.includes("verified");
		if (!isVerified) {
			return res.status(403).json({
				code: 403,
				message: "Access denied: Account verification required",
				success: false
			});
		}

		// Request has already been checked for admin and verified.
		// Now check if there are any additional requirements to meet.
		if (requiredRoles.length === 0) return next();

		// Check if the user's role is in the allowed list
		const roleSet = new Set(requiredRoles);
		const hasAllowedRole = req.roles.some(item => roleSet.has(item));

		console.log(hasAllowedRole);

		if (!hasAllowedRole) {
			return res.status(403).json({
				code: 403,
				message: "Access denied: Insufficient permissions",
				success: false
			});
		}

		next();

	};
}

module.exports = authorizeRoles;