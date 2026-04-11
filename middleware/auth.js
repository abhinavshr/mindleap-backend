const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

        if (!token)
            return res.status(401).json({ message: 'Access denied. Please log in.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user    = await User.findByPk(decoded.id);

        if (!user)
            return res.status(401).json({ message: 'User not found. Please log in again.' });

        req.user = user;
        next();

    } catch (err) {
        // ── Access token expired — tell frontend to refresh ───────────────
        if (err.name === 'TokenExpiredError')
            return res.status(401).json({ message: 'Access token expired.', expired: true });

        return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) { req.user = null; return next(); }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user    = await User.findByPk(decoded.id);
        req.user = user || null;
        next();

    } catch (err) {
        req.user = null;
        next();
    }
};

module.exports = { protect, optionalAuth };