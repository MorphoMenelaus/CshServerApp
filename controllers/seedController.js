const pool = require("../connection/hdConnection")

/**
 * Retrieves all slide entries from HD Seed Database.
 *
 * @name getSlides
 * @route {GET} /api/seed/slides
 * @access public
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getSlides = async (req, res) => {
	const conn = await pool.getConnection()

	try {
		const slideImages = await conn.execute("SELECT * FROM `modelSlides`")

		res.status(200).json({
			code: 200,
			message: "Slide images query success",
			success: true,
			data: slideImages,
		})
	} catch {
		res.status(500).json({
			code: 500,
			message: "Internal server error reading slides",
			success: false,
		})
	} finally {
		if (conn) conn.release()
	}
}

/**
 * Retrieves all prototype entries from HD Seed Database.
 *
 * @name getProto
 * @route {GET} /api/seed/proto
 * @access public
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getProto = async (req, res) => {
	const conn = await pool.getConnection()

	try {
		const protoImages = await conn.execute("SELECT * FROM `protoThreeD`")

		res.status(200).json({
			code: 200,
			message: "Prototype images query success",
			success: true,
			data: protoImages,
		})
	} catch {
		res.status(500).json({
			code: 500,
			message: "Internal server error reading prototypes",
			success: false,
		})
	} finally {
		if (conn) conn.release()
	}
}

/**
 * Retrieves all tech marketing image entries from HD Seed Database.
 *
 * @name getTechMarketing
 * @route {GET} /api/seed/tech
 * @access public
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getTechMarketing = async (req, res) => {
	const conn = await pool.getConnection()

	try {
		const techImages = await conn.execute("SELECT * FROM `techMarketing`")

		res.status(200).json({
			code: 200,
			message: "Tech marketing images query success",
			success: true,
			data: techImages,
		})
	} catch {
		res.status(500).json({
			code: 500,
			message: "Internal server error reading tech marketing images",
			success: false,
		})
	} finally {
		if (conn) conn.release()
	}
}

/**
 * Retrieves all prototype entries from HD Seed Database.
 *
 * @name getPdfMarkup
 * @route {GET} /api/seed/pdf
 * @access public
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getPdfMarkup = async (req, res) => {
	const conn = await pool.getConnection()

	try {
		const pdfMarkup = await conn.execute("SELECT * FROM `html_markup` WHERE contentID = 1")
		const row = pdfMarkup[0]

		res.status(200).json({
			code: 200,
			message: "Pdf Markup query success",
			success: true,
			data: row.content,
		})
	} catch {
		res.status(500).json({
			code: 500,
			message: "Internal server error reading pdf markup",
			success: false,
		})
	} finally {
		if (conn) conn.release()
	}
}

module.exports = { getSlides, getProto, getTechMarketing, getPdfMarkup }
