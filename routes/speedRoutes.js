const express    = require('express');
const router     = express.Router();

const {
    startSpeedSession,
    expireSpeedSession,
    submitSpeedGuess,
    getSpeedLeaderboard,
    getMySpeedStats,
} = require('../controllers/speedController');

const { protect } = require('../middleware/auth');

router.post('/start',       protect, startSpeedSession);

router.post('/expire',      protect, expireSpeedSession);

router.post('/guess',       protect, submitSpeedGuess);

router.get('/leaderboard',           getSpeedLeaderboard);

router.get('/stats',        protect, getMySpeedStats);

module.exports = router;