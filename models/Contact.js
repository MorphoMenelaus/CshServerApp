const mariadb = require('mariadb');

const contactSchema = {
	name: {
		type: String,
		required: [true, "Please add the contact name"]
	},
	email: {
		type: String,
		unique: true,
		required: [true, "Please add the contact email"]
	}
	,
	phone: {
		type: String,
		required: [true, "Please add the contact phone"]
	}
	,
	designation: {
		type: String,
		required: [true, "Please add the contact designation"]
	}
	,
	name: {
		type: String,
		required: [true, "Please add the contact name"]
	}
}