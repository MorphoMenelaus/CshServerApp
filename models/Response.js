const mariadb = require('mariadb');

const appStatusSchema = {
	code: {
		type: Number,
	},
	message: {
		type: String
	},
	success: {
		type: Boolean,
	},
	userMustDismiss: {
		type: Boolean,
	}
}
