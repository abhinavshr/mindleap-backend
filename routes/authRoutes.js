const express = require('express');
const router  = express.Router();

const { register, verifyEmail, refreshToken, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);

router.get  ('/verify-email', verifyEmail); 

router.post('/refresh-token', refreshToken);

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', protect, getMe);

module.exports = router;