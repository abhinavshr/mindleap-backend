const express = require('express');
const router  = express.Router();

const { getDailyInfo, submitGuess, checkAlreadyPlayed } = require('../controllers/gameController');
const { optionalAuth }                                   = require('../middleware/auth');

// GET  /api/game/daily-info
router.get('/daily-info',       optionalAuth, getDailyInfo);

// POST /api/game/guess
router.post('/guess',           optionalAuth, submitGuess);

// GET  /api/game/already-played
router.get('/already-played',   optionalAuth, checkAlreadyPlayed);

module.exports = router;