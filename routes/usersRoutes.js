const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticationHandler");
const { getUsers, registerUser, getUser, getUserPreferences, updateUser, deleteUser, getClockLog, logSimpleClock } = require("../controllers/usersController");

// router.use(authenticateToken);

router.route("/").get(authenticateToken, getUsers);

router.route("/register/").post(registerUser);

router.route("/:id").get(authenticateToken, getUser);

// router.route("/:id")
// 	.all(authenticateToken)
// 	.get(getUser)
// 	.put(updateUser)
// 	.delete(deleteUser);

// 2. Protect specific HTTP methods using router.route()
// router.route("/:id")
// 	.get(authenticateToken, (req, res) => {
// 		// Express passes the req.params object across the entire lifecycle
// 		res.send(`Successfully fetched data for user ${req.params.id}`);
// 	})
// 	.put(authenticateToken, (req, res) => {
// 		res.send(`Successfully updated data for user ${req.params.id}`);
// 	});

router.route("/prefs/:id").get(authenticateToken, getUserPreferences);

// router.route("/:id").put(updateUser);

// router.route("/:id").delete(deleteUser);

router.route("/clock/log").get(getClockLog);

router.route("/clock/").post(authenticateToken, logSimpleClock);

module.exports = router;
