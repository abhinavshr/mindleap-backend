const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const sequelize    = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

// Connect to DB then start server
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('Database connected successfully');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    });