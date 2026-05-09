const express = require('express');
const router  = express.Router();

const { getMyMissions } = require('../controllers/missionController');
const { protect }       = require('../middleware/auth');

// GET /api/missions
router.get('/', protect, getMyMissions);

module.exports = router;