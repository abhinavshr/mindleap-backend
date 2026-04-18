const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const sequelize = require('./config/db');
require('./models');

const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const authRoutes        = require('./routes/authRoutes');
const gameRoutes        = require('./routes/gameRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const speedRoutes       = require('./routes/speedRoutes');

const app = express();

app.use(cors({
    origin:      process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);

app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/game',                     gameRoutes);
app.use('/api/leaderboard',              leaderboardRoutes);
app.use('/api/speed',                    speedRoutes);

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connected successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });