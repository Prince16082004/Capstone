const express    = require('express');
const router     = express.Router();
const { getCropRecommendation } = require('../controllers/cropController');
const { mlRecommend }           = require('../controllers/mlCropController');

// Existing rule-based crop recommendation (unchanged)
router.post('/recommend', getCropRecommendation);

// New ML-based crop recommendation (proxied to FastAPI)
router.post('/ml-recommend', mlRecommend);

module.exports = router;
