const express = require('express');
const router  = express.Router();

const {
    getMyLevel,
    getMyBadges,
    getMyRewards,
    getLevelDefinitions,
    getXpLeaderboard,
} = require('../controllers/levelController');

const { protect } = require('../middleware/auth');

// GET /api/level/me
router.get('/me',          protect, getMyLevel);

// GET /api/level/badges
router.get('/badges',      protect, getMyBadges);

// GET /api/level/rewards
router.get('/rewards',     protect, getMyRewards);

// GET /api/level/all
router.get('/all',                  getLevelDefinitions);

// GET /api/level/leaderboard
router.get('/leaderboard',          getXpLeaderboard);

module.exports = router;