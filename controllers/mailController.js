const crypto = require('crypto');
const pool = require("../connection/dbConnection");
const nodemailer = require('nodemailer');
const { verifyHandler } = require('../services/userService');
const { validationResult } = require('express-validator');

/**
 * Send contact email to a single systemAdmin account from user.
 * Also, inserts a record into the contacs database.
 * 
 * @name sendContactMail
 * @route {POST} /api/mail
 * @access Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const sendContactMail = async (req, res) => {
	const senderIp = req.ip;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			code: 400,
			message: "See Errors Array",
			success: false,
			errors: errors.array()
		});
	}

	const { token, name, email, phone, subject, message } = req.body;

	if (phone && phone.length > 12) {
		return res.status(400).json({
			code: 400,
			message: "Phone number is too long.",
			success: false,
		});
	}

	const conn = await pool.getConnection();

	const adminEmail = req.tenant.emails.admin;
	const apiKey = req.tenant.recaptcha.secretKey;
	const siteKey = req.tenant.recaptcha.siteKey;
	const hostName = req.tenant.hostName;

	// Create a reusable transporter using secure SMTP configuration
	const transporter = nodemailer.createTransport({
		host: req.tenant.smtp.host,
		port: Number(process.env.SMTP_PORT),
		secure: true, // true for port 465, false for other ports like 587
		auth: {
			user: req.tenant.smtp.user,
			pass: req.tenant.smtp.pass,
		},
	});

	try {

		let body = {
			event: {
				token: token,
				siteKey: siteKey,
				expectedAction: "sendEmail" // Must match the action string used in frontend component
			}
		}

		const apiUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${apiKey}&response=${token}`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		const data = await response.json();

		if (!data?.success) {
			return res.status(500).json({
				code: 500,
				success: false,
				message: "Google Recaptcha assessment failed"
			});
		}

		// Check if the assessment verdict is safe
		if (data?.score >= 0.5 && data?.hostname === hostName) {

			const mailOptions = {
				from: `"CSH App System" <${req.tenant.smtp.user}>`,
				to: `${adminEmail}`,
				subject: `${subject}`,
				text: `${message}`, // Plain text fallback
				html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
				<h1>Thanks for reaching out!</h1>
				<h2 style="color: #4f84d9;">${subject}</h2>
				<h3>${name}</h3>
				<p>
				<span>${email}</span>
				<br />
				<span>${phone}</span>
				</p>
				<p>${message}</p>
				<hr />
				<small style="color: #777;">Sent automatically by the CSH Application.</small>
				</div>`,
			};

			const info = await transporter.sendMail(mailOptions);

			// Insert contacts record for emails sent
			const queryText = `
			INSERT INTO contacts 
			(name, 
            email, 
            phone, 
            subject, 
            message, 
			senderIp) 
			VALUES (?, ?, ?, ?, ?, ?)
			`;

			const values = [
				name,
				email,
				phone,
				subject,
				message,
				senderIp,
			];

			await conn.execute(queryText, values);
			await conn.commit();

			res.status(200).json({
				code: 200,
				message: "Email sent successfully",
				success: true,
				info: info
			});
		} else {
			// Block the request
			res.status(400).json({
				code: 400,
				message: "Bot activity detected.",
				success: false,
			});
		}
	} catch {
		res.status(500).json({
			code: 500,
			message: "Send Email Failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

/**
 * Send account verification email to a single user.
 * Also, inserts a verificationCode into the users database.
 * 
 * @name sendVerificationMail
 * @route {POST} /api/mail/verify
 * @access Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const sendVerificationMail = async (req, res) => {

	try {

		const verify = await verifyHandler(req, res);

		if (!verify.success) {
			res.status(204).json({
				code: 204,
				message: "User code not sent",
				success: false,
			});
		} else {
			res.status(201).json({
				code: 201,
				message: "Verification email sent successfully",
				success: true,
			});
		}

	} catch {
		res.status(500).json({
			error: error,
			code: 500,
			message: "Verification send Failed",
			success: false,
		});
	}
}

module.exports = { sendContactMail, sendVerificationMail };