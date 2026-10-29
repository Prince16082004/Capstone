const express = require("express");
const router = express.Router();
const { submitContact, getContacts } = require("../controllers/contactController");

router.route("/").post(submitContact).get(getContacts);

module.exports = router;
