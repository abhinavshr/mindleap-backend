const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if email or username already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(409).json({ message: 'Username already taken.' });
        }

        // Hash password
        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        return res.status(201).json({
            message: 'Registration successful.',
            user: {
                id:       user.id,
                username: user.username,
                email:    user.email,
            },
        });

    } catch (err) {
        console.error('Register error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Sign JWT
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // Set in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge:   7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Login successful.',
            token,                          // ← returned in body for Postman use
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
        const authHeader = req.headers['authorization'];
        const headerToken = authHeader && authHeader.split(' ')[1];

        if (!headerToken && !req.cookies?.token) {
            return res.status(401).json({ message: 'No token provided.' });
        }

        // Clear the cookie
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

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ user });

    } catch (err) {
        console.error('GetMe error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { register, login, logout, getMe };