const crypto = require('crypto');
const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');
const nodemailer = require('nodemailer');
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
			success: false,
			errors: errors.array()
		});

	}

	const { token, name, email, phone, subject, message } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	const adminEmail = process.env.ADMIN_EMAIL;
	const apiKey = process.env.RECAPTCHA_SECRET_KEY;
	const siteKey = process.env.RECAPTCHA_SITE_KEY;
	const hostname = process.env.HOSTNAME;

	// Create a reusable transporter using secure SMTP configuration
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT),
		secure: true, // true for port 465, false for other ports like 587
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
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
		if (data?.score >= 0.5 && data?.hostname === hostname) {

			const mailOptions = {
				from: `"CSH App System" <${process.env.SMTP_USER}>`,
				to: process.env.ADMIN_EMAIL,
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

			await conn.query(queryText, values);
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
				success: false,
				message: "Bot activity detected."
			});
		}
	} catch (error) {
		console.error(error);
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

	const { userName, email } = req.body;

	// Get a connection from the pool
	const conn = await pool.getConnection();

	const hostname = process.env.HOSTNAME;

	// Create a reusable transporter using secure SMTP configuration
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT),
		secure: true, // true for port 465, false for other ports like 587
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	// Generate a secure 6-digit OTP
	function generateOTP() {
		return crypto.randomInt(100000, 999999).toString();
	}

	try {

		const verificationCode = generateOTP();
		const verificationExpires = Date.now() + 5 * 60 * 1000;

		const mailOptions = {
			from: `"CSH App System" <${process.env.NOREPLY_EMAIL}>`,
			to: email,
			subject: `Email Verification Code`,
			html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
				<h1>Thanks for registering, ${userName}</h1>
				<h2 style="color: #4f84d9;">Please, click the link or enter the code on the login screen.</h2>
				<h3>
				<a href="https://${hostname}/verify?userName=${userName}&verificationCode=${verificationCode}">Click to verify email</a>
				</h3>
				<p>Your verification code is valid for 5 minutes:</p>
				<hr />
				<h1 style="color: #4CAF50; letter-spacing: 2px;">${verificationCode}</h1>
				<p>If you did not request this, please ignore this email.</p>
				<small style="color: #777;">Sent automatically by the CSH Application.</small>
				</div>`,
		};

		const verify = await transporter.sendMail(mailOptions);

		// Add verificationCode into users record
		const queryText = `
			UPDATE users 
			SET 
				verificationCode = ?, 
				verificationExpires = FROM_UNIXTIME(? / 1000) 
				WHERE userName = ?
			`;
		const values = [verificationCode, verificationExpires, userName];

		await conn.query(queryText, values);
		await conn.commit();

		res.status(200).json({
			code: 200,
			message: "Verification sent successfully",
			success: true,
			verify: verify
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			code: 500,
			message: "Verification send Failed",
			success: false,
		});
	} finally {
		// Crucial: Always release the connection back to the pool
		if (conn) conn.release();
	}
}

module.exports = { sendContactMail, sendVerificationMail };