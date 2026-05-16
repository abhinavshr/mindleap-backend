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
const levelRoutes       = require('./routes/levelRoutes');
const missionRoutes      = require('./routes/missionRoutes');

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://mindleap.live"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/speed', speedRoutes);
app.use('/api/level', levelRoutes);
app.use('/api/missions', missionRoutes);

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connected successfully');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });