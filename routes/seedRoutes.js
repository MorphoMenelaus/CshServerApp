const express = require("express")
const router = express.Router()
const { getSlides, getProto, getTechMarketing, getPdfMarkup } = require("../controllers/seedController")

router.route("/slides").get(getSlides)

router.route("/proto").get(getProto)

router.route("/tech").get(getTechMarketing)

router.route("/pdf").get(getPdfMarkup)

module.exports = router
