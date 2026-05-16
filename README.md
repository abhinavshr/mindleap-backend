# MindLeap Backend 🧠

A powerful REST API backend for MindLeap — a competitive word guessing game with classic mode, speed mode, XP system, levels, badges, daily missions, weekly missions, and streak milestones.

---

## 🚀 Tech Stack

| Technology     | Purpose                        |
|----------------|-------------------------------|
| Node.js        | Runtime environment            |
| Express.js     | Web framework                  |
| MySQL          | Relational database            |
| Sequelize      | ORM for database operations    |
| JWT            | Authentication (access tokens) |
| bcryptjs       | Password hashing               |
| nodemailer     | Email verification             |
| uuid           | Guest session tokens           |
| express-rate-limit | API rate limiting          |
| dotenv         | Environment variables          |
| nodemon        | Development auto-restart       |

---

## 📁 Project Structure
mindleap-backend/
├── config/
│   ├── db.js                    ← Sequelize connection
│   └── mailer.js                ← Nodemailer setup
├── controllers/
│   ├── authController.js        ← Register, login, logout, getMe
│   ├── gameController.js        ← Classic mode game logic
│   ├── speedController.js       ← Speed mode game logic
│   ├── leaderboardController.js ← Classic leaderboard
│   ├── levelController.js       ← XP, levels, badges, rewards
│   └── missionController.js     ← Daily and weekly missions
├── middleware/
│   ├── auth.js                  ← protect + optionalAuth
│   └── rateLimiter.js           ← Rate limiting
├── models/
│   ├── index.js                 ← Central associations
│   ├── User.js
│   ├── Word.js
│   ├── Game.js
│   ├── Leaderboard.js
│   ├── GuestSession.js
│   ├── SpeedSession.js
│   ├── SpeedGame.js
│   ├── SpeedLeaderboard.js
│   ├── Level.js
│   ├── UserXpLog.js
│   ├── UserBadge.js
│   ├── UserReward.js
│   ├── DailyMission.js
│   └── StreakMilestone.js
├── routes/
│   ├── authRoutes.js
│   ├── gameRoutes.js
│   ├── leaderboardRoutes.js
│   ├── speedRoutes.js
│   ├── levelRoutes.js
│   └── missionRoutes.js
├── utils/
│   ├── wordSelector.js          ← Word assignment logic
│   ├── xpCalculator.js          ← XP calculation + awardXP
│   ├── levelCalculator.js       ← 50 level definitions
│   ├── badgeChecker.js          ← Badge award logic
│   ├── missionChecker.js        ← Daily + weekly missions
│   ├── streakMilestones.js      ← Streak milestone rewards
│   └── sendEmail.js             ← Email verification
├── .env
├── .gitignore
├── index.js                     ← App entry point
└── package.json

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/abhinavshr/mindleap-backend.git
cd mindleap-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mindleap

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=15m

# Client
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# Email
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 4. Create MySQL database
```sql
CREATE DATABASE mindleap;
USE mindleap;
```

### 5. Create all tables
```sql
-- Users
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    is_verified   TINYINT(1)   NOT NULL DEFAULT 0,
    refresh_token TEXT         DEFAULT NULL,
    verify_token  VARCHAR(255) DEFAULT NULL,
    total_xp      INT          DEFAULT 0,
    current_level INT          DEFAULT 1,
    current_title VARCHAR(50)  DEFAULT 'Beginner',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Words
CREATE TABLE words (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    word    VARCHAR(100) NOT NULL UNIQUE,
    date    DATE         DEFAULT NULL,
    is_used TINYINT(1)   NOT NULL DEFAULT 0
);

-- Games
CREATE TABLE games (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT       NOT NULL,
    word_id   INT       NOT NULL,
    guesses   JSON      NOT NULL,
    won       TINYINT(1) NOT NULL DEFAULT 0,
    attempts  TINYINT   NOT NULL DEFAULT 0,
    played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- Leaderboard
CREATE TABLE leaderboard (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT          NOT NULL UNIQUE,
    total_wins     INT          NOT NULL DEFAULT 0,
    total_games    INT          NOT NULL DEFAULT 0,
    current_streak INT          NOT NULL DEFAULT 0,
    max_streak     INT          NOT NULL DEFAULT 0,
    avg_attempts   DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    last_played    TIMESTAMP    NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Guest Sessions
CREATE TABLE guest_sessions (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    word_id       INT          NOT NULL,
    played_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- Speed Sessions
CREATE TABLE speed_sessions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    word_id    INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status     ENUM('active', 'won', 'lost', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- Speed Games
CREATE TABLE speed_games (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT  NOT NULL,
    word_id    INT  NOT NULL,
    session_id INT  NOT NULL,
    guesses    JSON NOT NULL,
    won        BOOLEAN DEFAULT FALSE,
    attempts   INT DEFAULT 0,
    time_taken INT DEFAULT 0,
    xp_earned  INT DEFAULT 0,
    played_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)          ON DELETE CASCADE,
    FOREIGN KEY (word_id)    REFERENCES words(id)          ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES speed_sessions(id) ON DELETE CASCADE
);

-- Speed Leaderboard
CREATE TABLE speed_leaderboard (
    id                INT          AUTO_INCREMENT PRIMARY KEY,
    user_id           INT          UNIQUE NOT NULL,
    total_speed_wins  INT          DEFAULT 0,
    total_speed_games INT          DEFAULT 0,
    best_time         INT          DEFAULT NULL,
    avg_time          DECIMAL(5,2) DEFAULT 0.00,
    avg_attempts      DECIMAL(4,2) DEFAULT 0.00,
    total_xp          INT          DEFAULT 0,
    current_streak    INT          DEFAULT 0,
    max_streak        INT          DEFAULT 0,
    last_played       DATE         DEFAULT NULL,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Levels
CREATE TABLE levels (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    level_number    INT         UNIQUE NOT NULL,
    title           VARCHAR(50) NOT NULL,
    xp_required     INT         NOT NULL,
    total_xp_needed INT         NOT NULL,
    reward_type     VARCHAR(50),
    reward_value    VARCHAR(100)
);

-- User XP Log
CREATE TABLE user_xp_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    source      ENUM(
                    'classic_win', 'classic_lose', 'speed_win', 'speed_lose',
                    'streak_bonus', 'first_game', 'first_win', 'level_up_bonus',
                    'profile_complete', 'login_streak'
                ) NOT NULL,
    xp_amount   INT          NOT NULL,
    description VARCHAR(255),
    earned_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Badges
CREATE TABLE user_badges (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT         NOT NULL,
    badge_key  VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    earned_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Rewards
CREATE TABLE user_rewards (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    reward_type  ENUM('theme', 'title', 'badge_frame') NOT NULL,
    reward_value VARCHAR(100) NOT NULL,
    unlocked_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily Missions
CREATE TABLE daily_missions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    mission_key   VARCHAR(50)  NOT NULL,
    mission_name  VARCHAR(100) NOT NULL,
    description   VARCHAR(255) NOT NULL,
    xp_reward     INT          NOT NULL,
    mission_type  ENUM('daily', 'weekly') DEFAULT 'daily',
    progress      INT DEFAULT 0,
    target        INT DEFAULT 1,
    completed     BOOLEAN      DEFAULT FALSE,
    completed_at  TIMESTAMP    NULL DEFAULT NULL,
    assigned_date DATE         NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Streak Milestones
CREATE TABLE streak_milestones (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT          NOT NULL,
    mode            ENUM('classic', 'speed', 'combined') NOT NULL,
    streak_reached  INT          NOT NULL,
    milestone_title VARCHAR(100) NOT NULL,
    xp_awarded      INT          NOT NULL,
    reached_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 6. Seed words
```bash
node utils/seedWords.js
```

### 7. Start server
```bash
npm run server
```

---

## 🌐 API Routes

### 🔐 Auth `/api/auth`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| GET | `/verify-email?id=x` | ❌ | Verify email |
| POST | `/login` | ❌ | Login |
| POST | `/refresh-token` | ❌ | Refresh access token |
| POST | `/logout` | ✅ | Logout |
| GET | `/me` | ✅ | Get profile + stats |

### 🎮 Game `/api/game`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/daily-info` | 🔶 | Get word info + guesses left |
| POST | `/guess` | 🔶 | Submit a guess |
| GET | `/already-played` | 🔶 | Check if played today |

### ⚡ Speed `/api/speed`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/start` | ✅ | Start speed session |
| POST | `/guess` | ✅ | Submit speed guess |
| GET | `/leaderboard` | ❌ | Speed leaderboard |
| GET | `/stats` | ✅ | My speed stats |

### 🏆 Leaderboard `/api/leaderboard`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ❌ | Top 20 classic leaderboard |
| GET | `/me` | ✅ | My rank + stats |

### 📊 Level `/api/level`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/me` | ✅ | My level + XP progress |
| GET | `/badges` | ✅ | My badges (earned + locked) |
| GET | `/rewards` | ✅ | My unlocked rewards |
| GET | `/all` | ❌ | All 50 level definitions |
| GET | `/leaderboard` | ❌ | XP leaderboard |
| GET | `/streak-milestones` | ✅ | My streak milestones |

### 🎯 Missions `/api/missions`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ✅ | Today's daily + weekly missions |

---

## 🎮 Game Modes

### Classic Mode
- Each user gets their own unique word per day
- 6 guesses for auth users, 5 for guests
- Correct/present/absent feedback per letter
- XP awarded on game over
- Streak tracked daily

### Speed Mode
- 60 second timer per session
- 6 guesses within the time limit
- XP based on time taken and attempts
- Separate leaderboard and streak

---

## ⭐ XP System

### Classic Mode XP
| Result | XP |
|--------|----|
| Win in 1 guess | 150 XP |
| Win in 2 guesses | 120 XP |
| Win in 3 guesses | 100 XP |
| Win in 4 guesses | 80 XP |
| Win in 5 guesses | 60 XP |
| Win in 6 guesses | 40 XP |
| Lose | 10 XP |

### Speed Mode XP
| Time | Base XP |
|------|---------|
| 0–15s | 150 XP |
| 16–30s | 120 XP |
| 31–45s | 90 XP |
| 46–60s | 60 XP |
| Lost/Time up | 0–5 XP |

### Attempt Bonus (Speed)
| Attempts | Bonus |
|----------|-------|
| 1 | +50 XP |
| 2 | +30 XP |
| 3 | +20 XP |
| 4 | +10 XP |

### Streak Bonus
| Streak | Bonus |
|--------|-------|
| 3 days | +20 XP |
| 7 days | +50 XP |
| 30 days | +150 XP |

---

## 📈 Level System

50 levels from Beginner to MindLeap Master. Each level requires progressively more XP.

| Range | Title |
|-------|-------|
| 1–10 | Beginner → Sharpshooter |
| 11–19 | Veteran I–IX |
| 20 | Elite |
| 21–29 | Master I–IX |
| 30 | Legend |
| 31–39 | Grandmaster I–IX |
| 40 | Champion |
| 41–49 | Mythic I–IX |
| 50 | MindLeap Master |

---

## 🔥 Streak Milestones

### Classic Mode
| Streak | Title | XP | Reward |
|--------|-------|----|--------|
| 3 | Warm Up 🔥 | +20 | — |
| 7 | On Fire 🔥🔥 | +50 | Fire badge |
| 14 | Unstoppable 💪 | +100 | Unstoppable badge |
| 21 | Obsessed 😤 | +150 | Neon theme |
| 30 | Legendary 👑 | +300 | Gold title |
| 50 | Mythic ⚡ | +500 | Mythic theme |
| 100 | MindLeap God 🧠 | +1000 | Exclusive frame |
| 365 | Eternal Master 🌟 | +5000 | Hall of Fame |

### Speed Mode
| Streak | Title | XP | Reward |
|--------|-------|----|--------|
| 3 | Speed Starter ⚡ | +30 | — |
| 7 | Lightning ⚡⚡ | +60 | Lightning badge |
| 14 | Blazing 🔥 | +120 | Blazing badge |
| 30 | Sonic 🚀 | +400 | Speed theme |
| 60 | Hypersonic 💫 | +800 | Hypersonic title |
| 100 | Speed Legend 🌟 | +1500 | Rarest badge |

---

## 🎯 Daily Missions

3 rotating missions every day (resets at midnight):
- 1 Classic mission
- 1 Speed mission
- 1 Combined mission

Missions rotate based on date seed — all users get same 3 missions per day.

## 📅 Weekly Missions

2 weekly missions (reset every Monday):
- Win 5 games this week → +200 XP
- Maintain a 7 day streak → +300 XP

---

## 🛡️ Rate Limiting

| Route | Window | Max Requests |
|-------|--------|--------------|
| All routes | 15 min | 100 |
| `/api/auth/*` | 15 min | 10 |
| `/api/game/guess` | 1 min | 20 |

---

## 🔒 Authentication

- Access token expires in **15 minutes** (JWT)
- Refresh token expires in **365 days** (stored in DB + HTTP-only cookie)
- Token rotation on every refresh
- Email verification required before login

---

## 🌿 Git Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production ready |
| `dev` | Active development |
| `feature/auth` | Auth system |
| `feature/game` | Game logic |
| `feature/leaderboard` | Leaderboard |
| `feature/levels-system` | XP + levels |
| `feature/daily-missions` | Missions |
| `feature/streak-milestones` | Streak rewards |
| `feature/streak-fix` | Streak bug fix |

---

## 📦 Scripts

```bash
npm run server    # Start with nodemon
npm start         # Start without nodemon
node utils/seedWords.js    # Seed word database
```

---

## 🗃️ Database Tables Summary

| Table | Purpose |
|-------|---------|
| `users` | Auth + level + XP |
| `words` | Word bank |
| `games` | Classic mode results |
| `leaderboard` | Classic leaderboard |
| `guest_sessions` | Guest play tracking |
| `speed_sessions` | Speed mode active sessions |
| `speed_games` | Speed mode results |
| `speed_leaderboard` | Speed leaderboard |
| `levels` | Level definitions (1–50) |
| `user_xp_log` | Full XP history per user |
| `user_badges` | Earned badges per user |
| `user_rewards` | Unlocked themes and titles |
| `daily_missions` | Daily + weekly missions |
| `streak_milestones` | Streak milestone history |

---

## 👤 Author

**Abhinav Shrestha**
GitHub: [@abhinavshr](https://github.com/abhinavshr)

---

## 📄 License
MIT License
