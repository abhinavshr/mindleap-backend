const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ message: 'All fields are required.' });

        if (await User.findOne({ where: { email } }))
            return res.status(409).json({ message: 'Email already registered.' });

        if (await User.findOne({ where: { username } }))
            return res.status(409).json({ message: 'Username already taken.' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password:    hashedPassword,
            is_verified: false,
        });

        // Send email with user ID in the link
        await sendVerificationEmail(email, username, user.id);

        return res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: { id: user.id, username: user.username, email: user.email },
        });

    } catch (err) {
        console.error('Register error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Verify Email (just ID, no token) ─────────────────────────────────────────
const verifyEmail = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id)
            return res.status(400).json({ message: 'User ID is missing.' });

        const user = await User.findByPk(id);

        if (!user)
            return res.status(404).json({ message: 'User not found.' });

        if (user.is_verified)
            return res.status(200).json({ message: 'Email is already verified.' });

        // ── Directly set is_verified = true ──────────────────────────────
        await user.update({ is_verified: true });

        // Redirect to your frontend login page after verification
        return res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);

    } catch (err) {
        console.error('VerifyEmail error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: 'Email and password are required.' });

        const user = await User.findOne({ where: { email } });
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password.' });

        // Block login if email is not verified
        if (!user.is_verified)
            return res.status(403).json({ message: 'Your email is not verified. Please check your inbox and verify your email before logging in.' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge:   7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id:          user.id,
                username:    user.username,
                email:       user.email,
                is_verified: user.is_verified,
            },
        });

    } catch (err) {
        console.error('Login error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = (req, res) => {
    try {
        const authHeader  = req.headers['authorization'];
        const headerToken = authHeader && authHeader.split(' ')[1];

        if (!headerToken && !req.cookies?.token)
            return res.status(401).json({ message: 'No token provided.' });

        res.clearCookie('token', {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return res.status(200).json({ message: 'Logged out successfully.' });

    } catch (err) {
        console.error('Logout error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'email', 'is_verified', 'created_at'],
        });

        if (!user)
            return res.status(404).json({ message: 'User not found.' });

        return res.status(200).json({ user });

    } catch (err) {
        console.error('GetMe error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { register, verifyEmail, login, logout, getMe };