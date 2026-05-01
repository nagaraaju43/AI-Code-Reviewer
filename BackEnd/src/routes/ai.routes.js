const express = require("express");
const router = express.Router();

const aiController = require("../controllers/ai.controller");

router.post("/stream-review", aiController.streamReview);

module.exports = router;