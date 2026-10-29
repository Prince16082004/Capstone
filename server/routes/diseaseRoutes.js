const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { detectDisease } = require("../controllers/diseaseController");

router.post("/detect", upload.single("image"), detectDisease);

module.exports = router;
