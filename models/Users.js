const mariadb = require('mariadb');

const userSchema = {
	userId: {
		type: String,
		unique: true
	},
	userName: {
		type: String,
		required: [true, "Please add the user name"]
	},
	isAdmin: {
		type: Boolean,
	},
	siteAdmin: {
		type: Boolean,
	},
	siteEditor: {
		type: Boolean,
	},
	isContributor: {
		type: Boolean,
	},
	userNotes: {
		type: String
	}
}

const userPreferencesSchema = {
	userId: {
		type: String,
		unique: true
	},
	userName: {
		type: String,
		required: [true, "Please add the user name"]
	},
	email: {
		type: String,
	},
	lastName: {
		type: String,
	},
	firstName: {
		type: String,
	},
	uiDarkMode: {
		type: Boolean,
	},
}