const { Op }                                                    = require('sequelize');
const { pickRandomWord }                                        = require('../utils/wordSelector');
const { calculateXP, calculateStreakBonus, awardXP }            = require('../utils/xpCalculator');
const { checkAndAwardBadges }                                   = require('../utils/badgeChecker');
const { assignDailyMissions, checkMissionsAfterGame }           = require('../utils/missionChecker');
const { User, Word, Game, SpeedSession, SpeedGame, SpeedLeaderboard } = require('../models');

const SPEED_TIME_LIMIT = 60;
const MAX_GUESSES      = 6;

// ─── Helper: evaluate guess ───────────────────────────────────────────────────
const evaluateGuess = (guess, answer) => {
    const result    = Array(5).fill('absent');
    const answerArr = answer.split('');
    const guessArr  = guess.split('');

    guessArr.forEach((letter, i) => {
        if (letter === answerArr[i]) {
            result[i]    = 'correct';
            answerArr[i] = null;
            guessArr[i]  = null;
        }
    });

    guessArr.forEach((letter, i) => {
        if (!letter) return;
        const foundIndex = answerArr.indexOf(letter);
        if (foundIndex !== -1) {
            result[i]             = 'present';
            answerArr[foundIndex] = null;
        }
    });

    return result;
};

// ─── Helper: save speed game ──────────────────────────────────────────────────
const saveSpeedGame = async (userId, wordId, sessionId, guesses, won, attempts, timeTaken, xpEarned) => {
    return await SpeedGame.create({
        user_id:    userId,
        word_id:    wordId,
        session_id: sessionId,
        guesses,
        won,
        attempts,
        time_taken: timeTaken,
        xp_earned:  xpEarned,
    });
};

// ─── Helper: update speed leaderboard ────────────────────────────────────────
const updateSpeedLeaderboard = async (userId, won, timeTaken, attempts, xpEarned) => {
    let board = await SpeedLeaderboard.findOne({ where: { user_id: userId } });

    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!board) {
        return await SpeedLeaderboard.create({
            user_id:           userId,
            total_speed_wins:  won ? 1 : 0,
            total_speed_games: 1,
            best_time:         won ? timeTaken : null,
            avg_time:          won ? timeTaken : 0,
            avg_attempts:      won ? attempts  : 0,
            total_xp:          xpEarned,
            current_streak:    won ? 1 : 0,
            max_streak:        won ? 1 : 0,
            last_played:       today,
        });
    }

    const newTotalGames = board.total_speed_games + 1;
    const newTotalXP    = board.total_xp + xpEarned;

    let newTotalWins   = board.total_speed_wins;
    let newBestTime    = board.best_time;
    let newAvgTime     = parseFloat(board.avg_time);
    let newAvgAttempts = parseFloat(board.avg_attempts);
    let newStreak      = board.current_streak;
    let newMaxStreak   = board.max_streak;

    if (won) {
        newTotalWins = board.total_speed_wins + 1;

        if (board.best_time === null || timeTaken < board.best_time)
            newBestTime = timeTaken;

        newAvgTime = parseFloat(
            ((board.avg_time * board.total_speed_wins + timeTaken) / newTotalWins).toFixed(2)
        );

        newAvgAttempts = parseFloat(
            ((board.avg_attempts * board.total_speed_wins + attempts) / newTotalWins).toFixed(2)
        );

        // ── Streak logic ──────────────────────────────────────────────
        const lastPlayed = board.last_played
            ? new Date(board.last_played).toISOString().split('T')[0]
            : null;

        if (lastPlayed === today) {
            // ── Already played today — keep streak as is ──────────────
            newStreak = board.current_streak;
        } else if (lastPlayed === yesterday) {
            // ── Played yesterday — continue streak ────────────────────
            newStreak = board.current_streak + 1;
        } else {
            // ── Missed days — reset streak to 1 ──────────────────────
            newStreak = 1;
        }

        newMaxStreak = Math.max(board.max_streak, newStreak);
    } else {
        // ── Lost — reset streak ───────────────────────────────────────
        newStreak = 0;
    }

    await board.update({
        total_speed_wins:  newTotalWins,
        total_speed_games: newTotalGames,
        best_time:         newBestTime,
        avg_time:          newAvgTime,
        avg_attempts:      newAvgAttempts,
        total_xp:          newTotalXP,
        current_streak:    newStreak,
        max_streak:        newMaxStreak,
        last_played:       today,
        updated_at:        new Date(),
    });

    return board;
};

// ─── Helper: get today's game counts ─────────────────────────────────────────
const getTodayCounts = async (userId) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totalSpeedGamesToday = await SpeedGame.count({
        where: {
            user_id:   userId,
            played_at: { [Op.gte]: todayStart },
        },
    });

    const totalClassicGamesToday = await Game.count({
        where: {
            user_id:   userId,
            played_at: { [Op.gte]: todayStart },
        },
    });

    const classicWonToday = await Game.findOne({
        where: {
            user_id:   userId,
            won:       1,
            played_at: { [Op.gte]: todayStart },
        },
    });

    const speedWonToday = await SpeedGame.findOne({
        where: {
            user_id:   userId,
            won:       true,
            played_at: { [Op.gte]: todayStart },
        },
    });

    return {
        totalSpeedGamesToday,
        totalClassicGamesToday,
        totalGamesToday: totalSpeedGamesToday + totalClassicGamesToday,
        classicWonToday: !!classicWonToday,
        speedWonToday:   !!speedWonToday,
    };
};

// ─── Start Speed Session ──────────────────────────────────────────────────────
const startSpeedSession = async (req, res) => {
    try {
        const userId = req.user.id;

        await assignDailyMissions(userId);

        const existingSession = await SpeedSession.findOne({
            where:   { user_id: userId, status: 'active' },
            include: [{ model: Word }],
        });

        if (existingSession) {
            const now      = new Date();
            const started  = new Date(existingSession.started_at);
            const elapsed  = Math.floor((now - started) / 1000);
            const timeLeft = SPEED_TIME_LIMIT - elapsed;

            if (elapsed > SPEED_TIME_LIMIT) {
                await existingSession.update({ status: 'expired' });
            } else {
                return res.status(200).json({
                    sessionId:  existingSession.id,
                    timeLeft,
                    wordLength: 5,
                    maxGuesses: MAX_GUESSES,
                    resumed:    true,
                });
            }
        }

        const word = await pickRandomWord();
        if (!word)
            return res.status(503).json({ message: 'No words available. Please try again.' });

        const session = await SpeedSession.create({
            user_id:    userId,
            word_id:    word.id,
            started_at: new Date(),
            status:     'active',
        });

        return res.status(201).json({
            sessionId:  session.id,
            timeLeft:   SPEED_TIME_LIMIT,
            wordLength: 5,
            maxGuesses: MAX_GUESSES,
            resumed:    false,
        });

    } catch (err) {
        console.error('StartSpeedSession error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Expire Speed Session (timer hit zero) ───────────────────────────────────
const expireSpeedSession = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId)
            return res.status(400).json({ message: 'sessionId is required.' });

        const session = await SpeedSession.findOne({
            where:   { id: sessionId, user_id: req.user.id },
            include: [{ model: Word }],
        });

        if (!session)
            return res.status(404).json({ message: 'Session not found.' });

        if (session.status !== 'active') {
            return res.status(200).json({
                timeUp: session.status === 'expired',
                secret: session.Word?.word,
                status: session.status,
            });
        }

        const now     = new Date();
        const started = new Date(session.started_at);
        const elapsed = Math.floor((now - started) / 1000);

        if (elapsed < SPEED_TIME_LIMIT) {
            return res.status(200).json({
                timeUp:   false,
                timeLeft: SPEED_TIME_LIMIT - elapsed,
            });
        }

        await session.update({ status: 'expired' });
        await awardXP(req.user.id, 'speed_lose', 5, 'Speed mode time up');

        return res.status(200).json({
            timeUp: true,
            secret: session.Word.word,
        });

    } catch (err) {
        console.error('ExpireSpeedSession error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Submit Speed Guess ───────────────────────────────────────────────────────
const submitSpeedGuess = async (req, res) => {
    try {
        const { sessionId, guess, attempts } = req.body;

        if (!sessionId || !guess || !attempts)
            return res.status(400).json({ message: 'sessionId, guess and attempts are required.' });

        if (guess.length !== 5)
            return res.status(400).json({ message: 'Guess must be exactly 5 letters.' });

        if (!/^[a-zA-Z]+$/.test(guess))
            return res.status(400).json({ message: 'Guess must contain only letters.' });

        const normalizedGuess = guess.toLowerCase().trim();

        const validWord = await Word.findOne({ where: { word: normalizedGuess } });
        if (!validWord)
            return res.status(400).json({ message: 'Not a valid word. Please try again.' });

        const session = await SpeedSession.findOne({
            where:   { id: sessionId, user_id: req.user.id },
            include: [{ model: Word }],
        });

        if (!session)
            return res.status(404).json({ message: 'Session not found.' });

        if (session.status !== 'active')
            return res.status(400).json({ message: 'Session already ended.', status: session.status });

        const now     = new Date();
        const started = new Date(session.started_at);
        const elapsed = Math.floor((now - started) / 1000);

        if (elapsed > SPEED_TIME_LIMIT) {
            await session.update({ status: 'expired' });
            await awardXP(req.user.id, 'speed_lose', 5, 'Speed mode time up');
            return res.status(200).json({
                timeUp: true,
                secret: session.Word.word,
            });
        }

        const secret    = session.Word.word.toLowerCase();
        const result    = evaluateGuess(normalizedGuess, secret);
        const won       = normalizedGuess === secret;
        const timeTaken = elapsed;

        // ── Won ───────────────────────────────────────────────────────
        if (won) {
            const xpEarned = calculateXP(timeTaken, attempts);

            await session.update({ status: 'won' });

            await saveSpeedGame(
                req.user.id,
                session.word_id,
                session.id,
                [{ guess: normalizedGuess, result }],
                true,
                attempts,
                timeTaken,
                xpEarned,
            );

            const board = await updateSpeedLeaderboard(
                req.user.id, true, timeTaken, attempts, xpEarned,
            );

            const xpResult = await awardXP(
                req.user.id,
                'speed_win',
                xpEarned,
                `Speed win in ${timeTaken}s (${attempts} attempts)`,
            );

            if (board) {
                const streakBonus = calculateStreakBonus(board.current_streak || 0);
                if (streakBonus > 0) {
                    await awardXP(
                        req.user.id,
                        'streak_bonus',
                        streakBonus,
                        `Speed streak bonus (${board.current_streak} wins)`,
                    );
                }
            }

            const user = await User.findByPk(req.user.id, {
                attributes: ['id', 'current_level'],
            });

            await checkAndAwardBadges(req.user.id, {
                won:        true,
                attempts,
                timeTaken,
                streak:     board?.current_streak    || 0,
                totalGames: board?.total_speed_games || 0,
                level:      user?.current_level      || 1,
                isSpeedWin: true,
                speedWins:  board?.total_speed_wins  || 0,
            });

            const counts = await getTodayCounts(req.user.id);

            const completedMissions = await checkMissionsAfterGame(req.user.id, {
                won:                    true,
                isSpeedMode:            true,
                timeTaken,
                attempts,
                totalGamesToday:        counts.totalGamesToday,
                totalSpeedGamesToday:   counts.totalSpeedGamesToday,
                totalClassicGamesToday: counts.totalClassicGamesToday,
                classicWonToday:        counts.classicWonToday,
                speedWonToday:          true,
                currentStreak:          board?.current_streak || 0,
            });

            return res.status(200).json({
                result,
                won:       true,
                timeTaken,
                xpEarned,
                secret,
                xp: {
                    earned:          xpResult.xpEarned,
                    totalXp:         xpResult.newXp,
                    leveledUp:       xpResult.leveledUp,
                    newLevel:        xpResult.newLevel,
                    newTitle:        xpResult.newTitle,
                    progressPercent: xpResult.progressPercent,
                    xpToNextLevel:   xpResult.xpToNextLevel,
                },
                completedMissions,
            });
        }

        // ── Lost — used all guesses ───────────────────────────────────
        if (attempts >= MAX_GUESSES) {
            await session.update({ status: 'lost' });

            await saveSpeedGame(
                req.user.id,
                session.word_id,
                session.id,
                [{ guess: normalizedGuess, result }],
                false,
                attempts,
                timeTaken,
                0,
            );

            const lostBoard = await updateSpeedLeaderboard(
                req.user.id, false, timeTaken, attempts, 0,
            );

            await awardXP(req.user.id, 'speed_lose', 5, 'Speed mode participation');

            const counts = await getTodayCounts(req.user.id);

            const completedMissions = await checkMissionsAfterGame(req.user.id, {
                won:                    false,
                isSpeedMode:            true,
                timeTaken,
                attempts,
                totalGamesToday:        counts.totalGamesToday,
                totalSpeedGamesToday:   counts.totalSpeedGamesToday,
                totalClassicGamesToday: counts.totalClassicGamesToday,
                classicWonToday:        counts.classicWonToday,
                speedWonToday:          counts.speedWonToday,
                currentStreak:          lostBoard?.current_streak || 0,
            });

            return res.status(200).json({
                result,
                won:    false,
                lost:   true,
                secret,
                completedMissions,
            });
        }

        // ── Still has guesses ─────────────────────────────────────────
        return res.status(200).json({
            result,
            won:      false,
            timeLeft: SPEED_TIME_LIMIT - elapsed,
            attempts,
        });

    } catch (err) {
        console.error('SubmitSpeedGuess error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get Speed Leaderboard ────────────────────────────────────────────────────
const getSpeedLeaderboard = async (req, res) => {
    try {
        const leaderboard = await SpeedLeaderboard.findAll({
            limit: 20,
            order: [
                ['total_speed_wins', 'DESC'],
                ['best_time',        'ASC'],
            ],
            include: [{
                model:      User,
                attributes: ['username'],
            }],
        });

        const ranked = leaderboard.map((entry, index) => ({
            rank:              index + 1,
            username:          entry.User.username,
            total_speed_wins:  entry.total_speed_wins,
            total_speed_games: entry.total_speed_games,
            best_time:         entry.best_time,
            avg_time:          entry.avg_time,
            avg_attempts:      entry.avg_attempts,
            total_xp:          entry.total_xp,
            current_streak:    entry.current_streak,
            max_streak:        entry.max_streak,
            last_played:       entry.last_played,
            win_rate:          entry.total_speed_games > 0
                ? parseFloat((entry.total_speed_wins / entry.total_speed_games * 100).toFixed(1))
                : 0,
        }));

        return res.status(200).json({ success: true, data: ranked });

    } catch (err) {
        console.error('GetSpeedLeaderboard error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get My Speed Stats ───────────────────────────────────────────────────────
const getMySpeedStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await SpeedLeaderboard.findOne({
            where: { user_id: userId },
        });

        const recentGames = await SpeedGame.findAll({
            where:   { user_id: userId },
            limit:   10,
            order:   [['played_at', 'DESC']],
            include: [{ model: Word, attributes: ['word'] }],
        });

        const allEntries = await SpeedLeaderboard.findAll({
            order: [
                ['total_speed_wins', 'DESC'],
                ['best_time',        'ASC'],
            ],
        });

        const rankIndex = allEntries.findIndex(e => e.user_id === userId);
        const myRank    = rankIndex === -1 ? null : rankIndex + 1;

        return res.status(200).json({
            rank:        myRank,
            stats:       stats || null,
            recentGames: recentGames.map(g => ({
                word:       g.Word.word,
                won:        g.won,
                attempts:   g.attempts,
                time_taken: g.time_taken,
                xp_earned:  g.xp_earned,
                played_at:  g.played_at,
            })),
        });

    } catch (err) {
        console.error('GetMySpeedStats error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = {
    startSpeedSession,
    expireSpeedSession,
    submitSpeedGuess,
    getSpeedLeaderboard,
    getMySpeedStats,
};