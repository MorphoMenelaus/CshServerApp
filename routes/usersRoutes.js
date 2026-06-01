const express = require("express");
const router = express.Router();
const { getUsers, createUser, getUser, getUserPreferences, updateUser, deleteUser } = require("../controllers/usersController");

router.route("/").get(getUsers);

router.route("/").post(createUser);

router.route("/:id").get(getUser);

router.route("/prefs/:id").get(getUserPreferences);

router.route("/:id").put(updateUser);

router.route("/:id").delete(deleteUser);

module.exports = router;
