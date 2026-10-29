const express = require("express");
const router = express.Router();
const { calculateIrrigation } = require("../controllers/irrigationController");

router.post("/calculate", calculateIrrigation);

module.exports = router;
