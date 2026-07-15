const express = require("express");
const router = express.Router();
const { body } = require('express-validator');
const { sendContactMail, sendVerificationMail } = require("../controllers/mailController");

router.route("/").post(
	[
		body('name').trim().escape().notEmpty().withMessage('Name is required'),
		body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
		body('subject').trim().escape().notEmpty().withMessage('Subject is required'),
		body('message').trim().escape().notEmpty().withMessage('Message is required')
	],
	sendContactMail);

router.route("/verify").post(sendVerificationMail);

module.exports = router;
