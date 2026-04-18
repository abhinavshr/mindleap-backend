const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             100,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
        status:  429,
        message: 'Too many requests. Please try again after 15 minutes.',
    },
});

const authLimiter = rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             10,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
        status:  429,
        message: 'Too many login attempts. Please try again after 15 minutes.',
    },
});

const guessLimiter = rateLimit({
    windowMs:        60 * 1000,
    max:             20,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
        status:  429,
        message: 'Too many guesses. Please slow down.',
    },
});

module.exports = { generalLimiter, authLimiter, guessLimiter };