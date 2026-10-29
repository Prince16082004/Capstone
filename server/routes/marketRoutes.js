const express = require("express");
const router = express.Router();
const { getMarketPrices } = require("../controllers/marketController");

router.get("/", getMarketPrices);

module.exports = router;
