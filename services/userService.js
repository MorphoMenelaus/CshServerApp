const crypto = require('crypto');
const pool = require("../connection/dbConnection");
const nodemailer = require('nodemailer');

/**
 * Generate and send a verification code and email.
 * 
 * @name verifyHandler
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const verifyHandler = async (req, res) => {

	const { userName, email } = req.body;

	const conn = await pool.getConnection();

	const hostName = req.tenant.hostName;

	try {
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

		// Generate a secure 6-digit OTP
		function generateOTP() {
			return crypto.randomInt(100000, 999999).toString();
		}

		const verificationCode = generateOTP();
		const verificationExpires = Date.now() + 5 * 60 * 1000;

		const mailOptions = {
			from: `"CSH App System" <${req.tenant.emails.noReply}>`,
			to: email,
			subject: `Email Verification Code`,
			html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
				<h1>Thanks for registering, ${userName}</h1>
				<h2 style="color: #4f84d9;">Please, click the link or enter the code on the verify page.</h2>
				<h3>
				<a href="https://${hostName}/verify?userName=${userName}&verificationCode=${verificationCode}">Click to verify email</a>
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

		await conn.execute(queryText, values);
		await conn.commit();

		res.status(200).json({
			code: 200,
			message: "Verification email sent successfully",
			success: true,
			verify: verify
		});
	}
	catch {
		res.status(500).json({
			code: 500,
			message: "Verification code send Failed",
			success: false,
		});
	}
	finally {
		if (conn) conn.release();
	}
}

module.exports = { verifyHandler }