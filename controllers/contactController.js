// @desc GET all contacts
// @route GET /api/contacts
// @access public
const getContacts = (req, res) => {
	// try { } catch (e) { }
	res.status(200).json({ message: "Get all contacts" });
}

// @desc Create new contacts
// @route POST /api/contacts
// @access public
const createContact = (req, res) => {
	try {
		const { name, email, phone, designation } = req.body;
		if (!name || !email || !phone || !designation) {
			res.status(400);
			throw new Error("All fields are requied");
		}
		res.status(201).json({ message: "Create new contact" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// @desc GET contacts
// @route GET /api/contacts/:id
// @access public
const getContact = (req, res) => {
	res.status(200).json({ message: `Get contact for ${req.params.id}` });
}

// @desc Update contacts
// @route PUT /api/contacts/:id
// @access public
const updateContact = (req, res) => {
	res.status(200).json({ message: `Update contact for ${req.params.id}` });
}

// @desc Delete contacts
// @route DELETE  /api/contacts/:id
// @access public
const deleteContact = (req, res) => {
	res.status(200).json({ message: `Contact deleted for ${req.params.id}` });
}

module.exports = { getContacts, createContact, getContact, updateContact, deleteContact }