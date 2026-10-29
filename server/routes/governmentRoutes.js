const express = require("express");
const router = express.Router();
const { getNearbySchemes } = require("../controllers/governmentController");

router.get("/", getNearbySchemes);

module.exports = router;
