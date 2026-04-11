const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Blocks unauthenticated users — use on protected routes
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Access denied. Please log in.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found. Please log in again.' });
        }

        req.user = user;
        next();

    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }
};

// Works for both guest and authenticated users — never blocks
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        req.user = user || null;
        next();

    } catch (err) {
        // Invalid token — treat as guest, don't block
        req.user = null;
        next();
    }
};

module.exports = { protect, optionalAuth };