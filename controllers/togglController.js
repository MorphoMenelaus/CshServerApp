const pool = require("../connection/dbConnection");
const packageJson = require('../package.json');

/**
 * Retrieves Toggl user.
 * 
 * @name getUserData
 * @route {GET} /api/toggl/user
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getUserData = async (req, res) => {

	const api_token = process.env.TOGGL_API_KEY;
	const credentials = btoa(`${api_token}:api_token`);

	try {

		const response = await fetch("https://api.track.toggl.com/api/v9/me", {
			method: "GET",
			headers: {
				"Authorization": `Basic ${credentials}`,
				"Content-Type": "application/json"
			}
		})

		const data = await response.json();

		delete data.api_token;
		delete data.email;
		delete data.toggl_accounts_id;

		res.status(200).json({
			code: 200,
			message: "User query success",
			success: true,
			users: data,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error",
			success: false,
			error: error.message
		});
	}
}

/**
 * Retrieves time entries.
 * 
 * @name getTimeEntries
 * @route {GET} /api/toggl/user
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getTimeEntries = async (req, res) => {
	const { start_date, end_date } = req.query;
	const api_token = process.env.TOGGL_API_KEY;

	if (!start_date || !end_date) {
		return res.status(400).json({
			code: 400,
			success: false,
			error: "Missing query arguments"
		});
	}

	const credentials = Buffer.from(`${api_token}:api_token`).toString('base64');

	try {

		const togglUrl = `https://api.track.toggl.com/api/v9/me/time_entries?start_date=${start_date}&end_date=${end_date}`;

		const response = await fetch(togglUrl, {
			method: "GET",
			headers: {
				"Authorization": `Basic ${credentials}`,
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Toggl Server Rejected Request:", errorText);
			return res.status(response.status).json({
				code: response.status,
				success: false,
				error: `Toggl responded with: ${errorText}`
			});
		}

		const data = await response.json();

		data.forEach(item => {
			delete item.id;
			delete item.workspace_id;
			delete item.task_id;
			delete item.billable;
			delete item.duronly;
			delete item.server_deleted_at;
		});

		res.status(200).json({
			code: 200,
			message: "Time entries success",
			success: true,
			timeEntries: data,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error",
			success: false,
			error: error.message
		});
	}
}

/**
 * Retrieves currently running time entries.
 * 
 * @name getCurrentTimeEntries
 * @route {GET} /api/toggl/entries/current
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getCurrentTimeEntries = async (req, res) => {
	
	const api_token = process.env.TOGGL_API_KEY;
	const credentials = Buffer.from(`${api_token}:api_token`).toString('base64');

	try {

		const togglUrl = `https://api.track.toggl.com/api/v9/me/time_entries/current`;

		const response = await fetch(togglUrl, {
			method: "GET",
			headers: {
				"Authorization": `Basic ${credentials}`,
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Toggl Server Rejected Request:", errorText);
			return res.status(response.status).json({
				code: response.status,
				success: false,
				error: `Toggl responded with: ${errorText}`
			});
		}

		const data = await response.json();

		// data.forEach(item => {
		// 	delete item.id;
		// 	delete item.workspace_id;
		// 	delete item.task_id;
		// 	delete item.billable;
		// 	delete item.duronly;
		// 	delete item.server_deleted_at;
		// });

		res.status(200).json({
			code: 200,
			message: "Time entries success",
			success: true,
			currentEntries: data,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error",
			success: false,
			error: error.message
		});
	}
}

/**
 * Retrieves Projects for user of the API token.
 * 
 * @name getProjects
 * @route {GET} /api/toggl/project
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getProjects = async (req, res) => {

	const api_token = process.env.TOGGL_API_KEY;

	const credentials = Buffer.from(`${api_token}:api_token`).toString('base64');

	try {

		const togglUrl = `https://api.track.toggl.com/api/v9/me/projects`;

		const response = await fetch(togglUrl, {
			method: "GET",
			headers: {
				"Authorization": `Basic ${credentials}`,
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Toggl Server Rejected Request:", errorText);
			return res.status(response.status).json({
				code: response.status,
				success: false,
				error: `Toggl responded with: ${errorText}`
			});
		}

		const data = await response.json();

		res.status(200).json({
			code: 200,
			message: "Projects success",
			success: true,
			projects: data,
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error",
			success: false,
			error: error.message
		});
	}
}

/**
 * Start Toggl tracker time
 * 
 * @name startTime
 * @route {POST} /api/toggl/start
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const startTime = async (req, res) => {

	const { project_id, created_with, description, tags, workspace_id, duration, start, stop } = req.body;
	const billable = false;
	const clean_stop = stop || null;
	const clean_created_with = created_with || "";

	try {

		if (!project_id || !description || !tags || !workspace_id || !duration || !start) {
			let message = "All fields are requied";
			res.status(400).json({
				code: 400,
				message: message,
				success: false,
			});
			throw new Error(message);
		}

		const api_token = process.env.TOGGL_API_KEY;
		const credentials = Buffer.from(`${api_token}:api_token`).toString('base64');

		const body = {
			project_id: project_id,
			created_with: clean_created_with,
			description: description,
			tags: tags || [],
			billable: billable,
			workspace_id: workspace_id,
			duration: duration,
			start: start,
			stop: clean_stop
		}

		temp = JSON.stringify(body);

		const togglUrl = `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/time_entries`;

		const response = await fetch(togglUrl, {
			method: "POST",
			headers: {
				"Authorization": `Basic ${credentials}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		});

		const data = await response.json();

		res.status(200).json({
			code: 200,
			message: "Toggl time start",
			success: true,
			startInstance: data
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error.",
			success: false,
			error: error.message
		});
	}
}

/**
 * Stop Toggl tracker time
 * 
 * @name stopTime
 * @route {POST} /api/toggl/start
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const stopTime = async (req, res) => {

	const { workspace_id, time_entry_id } = req.body;

	try {

		if (!workspace_id || !time_entry_id) {
			let message = "All fields are requied";
			res.status(400).json({
				code: 400,
				message: message,
				success: false,
			});
			throw new Error(message);
		}

		const api_token = process.env.TOGGL_API_KEY;
		const credentials = Buffer.from(`${api_token}:api_token`).toString('base64');

		const body = {
			workspace_id: workspace_id,
			time_entry_id: time_entry_id
		}

		const togglUrl = `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/time_entries/${time_entry_id}/stop`;

		const response = await fetch(togglUrl, {
			method: "PATCH",
			headers: {
				"Authorization": `Basic ${credentials}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		});

		const data = await response;

		res.status(200).json({
			code: 200,
			message: "Toggl time stop",
			success: true,
			data: data
		});

	} catch (error) {
		res.status(500).json({
			code: 500,
			message: "Internal Server Error.",
			success: false,
			error: error.message
		});
	}
}

module.exports = { getUserData, getTimeEntries, getCurrentTimeEntries, getProjects, startTime, stopTime };