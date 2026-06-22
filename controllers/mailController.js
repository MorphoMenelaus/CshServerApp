const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');
const nodemailer = require('nodemailer');

/**
 * Send contact email to a single systemAdmin account from user.
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

	const { token, name, email, phone, subject, message } = req.body;

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
              <h2 style="color: #4f84d9;">${subject}</h2>
			  <h3>${name}</h3>
			  <ul>
			  <li>${email}</li>
			  <li>${phone}</li>
			  </ul>
              <p>${message}</p>
              <hr />
              <small style="color: #777;">Sent automatically by the CSH Server.</small>
             </div>`,
			};

			const info = await transporter.sendMail(mailOptions);

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
	}
}

module.exports = { sendContactMail };