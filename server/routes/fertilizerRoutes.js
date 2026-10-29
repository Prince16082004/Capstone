const express = require("express");
const router = express.Router();
const { calculateFertilizer } = require("../controllers/fertilizerController");

router.post("/calculate", calculateFertilizer);

module.exports = router;
