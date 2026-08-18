import pool from "../connection/dbConnection.js";
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getGeminiClient = () => {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error("GEMINI_API_KEY environment variable is required.");
	}
	return new GoogleGenAI({
		apiKey,
		httpOptions: {
			headers: {
				"User-Agent": "aistudio-build",
			},
		},
	});
};

/**
 * Healthcheck endpoint.
 * 
 * @name healthCheck
 * @route {GET} /api/gemini/health
 * @access public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const healthCheck = async (req, res) => {
	try {
		const inputText = "Explain how AI works in a few words";
		const ai = getGeminiClient();
		const interaction = await ai.interactions.create({
			model: "gemini-3.6-flash",
			input: inputText,
		});
		res.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			input: inputText,
			output: interaction.output_text
		});
	} catch (error) {
		console.error("Health check error:", error);
		res.status(500).json({
			code: 500,
			success: false,
			status: "error",
			message: error.message || "Failed to perform health check.",
		});
	}
}

/**
 * AI Persona Chatbot
 * 
 * @name personaChatbot
 * @route {POST} /api/gemini/chat
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const personaChatbot = async (req, res) => {
	const conn = await pool.getConnection();
	try {
		const { message, history, profile } = req.body;
		if (!message) {
			return res
				.status(400)
				.json({ error: "Message parameter is required." });
		}

		const ai = getGeminiClient();

		const appDevDuties = await conn.query(`SELECT id, company, appName, duties FROM appDevDuties`);
		const resume = await conn.query(`SELECT id, title, company, dates, type, duties FROM resume`);

		let duitiesArray = [];
		appDevDuties.forEach(item => {
			let newItem = item.duties.join(" ");
			duitiesArray.push(newItem);
		});
		resume.forEach(item => {
			let newItem = item.duties.join(" ");
			duitiesArray.push(newItem);
		});
		const newProfile = profile + duitiesArray.join(" ");

		const candidateContext = JSON.stringify(newProfile || {});

		const systemInstruction = `You are Chris Hardwick's AI Persona Companion on Chris' interactive resume and portfolio website.
				Candidate Profile Data:
				${candidateContext}

				YOUR RESPONSIBILITIES:
				1. Speak confidently as Chris Hardwick (in first-person 'I') or as Chris' designated AI representative.
				2. Answer visitor questions (recruiters, engineering managers, developers) about Chris' work history, tech stack, architecture philosophies, key project achievements, salary/role expectations, and team culture fit.
				3. Be articulative, professional, authentic, and engaging.
				4. When relevant, reference specific metrics from Chris' history.
				5. Provide a JSON output containing your text answer, 2-3 logical follow-up prompts for the user, and section citation tags if applicable (e.g., sectionId: 'experience', 'projects', 'skills').
			`;

		const contents =
			history && Array.isArray(history) && history.length > 0
				? [
					...history.map((h) => ({
						role: h.sender === "user" ? "user" : "model",
						parts: [{ text: h.text }],
					})),
					{ role: "user", parts: [{ text: message }] },
				]
				: message;

		const response = await ai.models.generateContent({
			model: "gemini-3.6-flash",
			contents,
			config: {
				systemInstruction,
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						answer: {
							type: Type.STRING,
							description:
								"The main detailed conversational answer formatted in clean markdown.",
						},
						suggestedFollowups: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							description:
								"2 to 3 engaging follow-up questions the visitor might want to ask next.",
						},
						citations: {
							type: Type.ARRAY,
							items: {
								type: Type.OBJECT,
								properties: {
									label: { type: Type.STRING },
									sectionId: { type: Type.STRING },
								},
								required: ["label", "sectionId"],
							},
							description:
								"Any relevant resume sections referenced in the answer.",
						},
					},
					required: ["answer", "suggestedFollowups"],
				},
			},
		});

		const parsed = JSON.parse(response.text || "{}");
		res.status(200).json({
			code: 200,
			success: true,
			answer: parsed.answer || response.text,
			suggestedFollowups: parsed.suggestedFollowups || [
				"Tell me more about javaScript frameworks.",
				"What is Chris' ideal team size and role?",
				"How does Chris approach UI architecture?",
			],
			citations: parsed.citations || [],
		});
	} catch (error) {
		console.error("Chat API error:", error);
		res.status(500).json({
			code: 500,
			message: error.message || "Failed to process AI chat request.",
			success: false,
		});
	} finally {
		if (conn) conn.release();
	}
}

/**
 * AI Job Match Analysis
 * 
 * @name jobMatch
 * @route {POST} /api/gemini/match
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const jobMatch = async (req, res) => {
	const conn = await pool.getConnection();
	try {
		const { jobDescription, profile } = req.body;
		if (!jobDescription) {
			return res
				.status(400)
				.json({ error: "Job description is required." });
		}

		const ai = getGeminiClient();

		const appDevDuties = await conn.query(`SELECT id, company, appName, duties FROM appDevDuties`);
		const resume = await conn.query(`SELECT id, title, company, dates, type, duties FROM resume`);

		let duitiesArray = [];
		appDevDuties.forEach(item => {
			let newItem = item.duties.join(" ");
			duitiesArray.push(newItem);
		});
		resume.forEach(item => {
			let newItem = item.duties.join(" ");
			duitiesArray.push(newItem);
		});
		const newProfile = profile + duitiesArray.join(" ");

		const response = await ai.models.generateContent({
			model: "gemini-3.6-flash",
			contents: `Compare this Candidate Profile against the Job Description.
        
					Candidate Profile:
						${JSON.stringify(newProfile || {})}

						Job Description:
						${jobDescription}`,
			config: {
				systemInstruction: `You are an elite Web Development Recruiting Evaluator.
											Analyze the job description against the candidate's experience.
											Produce an objective, realistic evaluation JSON response with:
											- overallScore: integer percentage 0 to 100 based on core skills and experience alignment.
											- keyPitch: 2-3 sentences summarizing fit.
											- matchingSkills: 3-5 bullet points linking specific candidate achievements to job requirements.
											- gaps: list of addressable gaps or areas for growth.
											- tailoredInterviewQuestions: 3 specific technical/behavioral interview questions the hiring manager should ask Chris to highlight his expertise.
											`,
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						overallScore: { type: Type.INTEGER },
						keyPitch: { type: Type.STRING },
						matchingSkills: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
						},
						gaps: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
						},
						tailoredInterviewQuestions: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
						},
					},
					required: [
						"overallScore",
						"keyPitch",
						"matchingSkills",
						"gaps",
						"tailoredInterviewQuestions",
					],
				},
			},
		});

		const result = JSON.parse(response.text || "{}");
		res.status(200).json({
			code: 200,
			success: true,
			analysis: result
		});
	} catch (error) {
		console.error("Match API error:", error);
		res.status(500).json({
			code: 500,
			message: error.message || "Failed to analyze job match.",
			success: false,
		});
	} finally {
		if (conn) conn.release();
	}
}

/**
 * AI explain code
 * 
 * @name explainCode
 * @route {POST} /api/gemini/explain-code
 * @access Restricted (Requires Bearer Token)
 * @auth Requires JWT access token in the Authorization header.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const explainCode = async (req, res) => {
	try {
		const {
			codeSnippet,
			projectTitle,
			context,
			description,
			techStack,
		} = req.body;

		const ai = getGeminiClient();

		const response = await ai.models.generateContent({
			model: "gemini-3.6-flash",
			contents: `Project Title: ${projectTitle || "System Module"}
				Description: ${description || ""}
				Tech Stack: ${Array.isArray(techStack) ? techStack.join(", ") : techStack || ""}
				Context / Snippet: ${codeSnippet || context || ""}`,
			config: {
				systemInstruction: `You are a Principal Software Architect specializing in Vue 3, Express, SQL and NodeJS Systems.
								Provide a clear, high-level engineering audit and explanation of the project provided.
								Output JSON with:
								- architecture: Clear, scannable overview of what the system architecture accomplishes in Vue 3 & Express.
								- designChoices: 3-4 bullet points of core software engineering decisions (e.g. Composition API, WebSockets streaming, REST API Calling).
								- codeSnippet: A high-quality, realistic Vue 3 / Express TypeScript code snippet illustrating the core pattern for this project.
								`,
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						architecture: { type: Type.STRING },
						designChoices: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
						},
						codeSnippet: { type: Type.STRING },
					},
					required: [
						"architecture",
						"designChoices",
						"codeSnippet",
					],
				},
			},
		});

		const result = JSON.parse(response.text || "{}");
		res.status(200).json({
			code: 200,
			success: true,
			explanation: result
		});
	} catch (error) {
		console.error("Code explain error:", error);
		res.status(500).json({
			code: 500,
			message: error.message || "Failed to explain code snippet.",
			success: false,
		});
	}
}

export { healthCheck, personaChatbot, jobMatch, explainCode };