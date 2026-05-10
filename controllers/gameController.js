const { Op }                                                 = require('sequelize');
const { getWordForUser, getWordForGuest }                    = require('../utils/wordSelector');
const { calculateClassicXP, calculateStreakBonus, awardXP }  = require('../utils/xpCalculator');
const { checkAndAwardBadges }                                = require('../utils/badgeChecker');
const { assignDailyMissions, checkMissionsAfterGame }        = require('../utils/missionChecker');
const { v4: uuidv4 }                                         = require('uuid');
const { User, Word, Game, Leaderboard, SpeedGame }           = require('../models');

// ─── Helper: get or create guest session token ────────────────────────────────
const getGuestToken = (req, res) => {
    let token = req.cookies?.guestToken;
    if (!token) {
        token = uuidv4();
        res.cookie('guestToken', token, {
            httpOnly: true,
            maxAge:   7 * 24 * 60 * 60 * 1000,
        });
    }
    return token;
};

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

// ─── Helper: update leaderboard ───────────────────────────────────────────────
const updateLeaderboard = async (userId, won, attempts) => {
    let board = await Leaderboard.findOne({ where: { user_id: userId } });

    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!board) {
        return await Leaderboard.create({
            user_id:        userId,
            total_wins:     won ? 1 : 0,
            total_games:    1,
            current_streak: won ? 1 : 0,
            max_streak:     won ? 1 : 0,
            avg_attempts:   attempts,
            last_played:    new Date(),
        });
    }

    const newTotalGames = board.total_games + 1;
    const newTotalWins  = board.total_wins + (won ? 1 : 0);
    const newAvg        = parseFloat(
        ((board.avg_attempts * board.total_games + attempts) / newTotalGames).toFixed(2)
    );

    // ── Streak logic ──────────────────────────────────────────────────
    let newStreak = 0;

    if (won) {
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
    } else {
        // ── Lost — reset streak ───────────────────────────────────────
        newStreak = 0;
    }

    const newMaxStreak = Math.max(board.max_streak, newStreak);

    await board.update({
        total_wins:     newTotalWins,
        total_games:    newTotalGames,
        current_streak: newStreak,
        max_streak:     newMaxStreak,
        avg_attempts:   newAvg,
        last_played:    new Date(),
    });

    return board;
};

// ─── Get Daily Info ───────────────────────────────────────────────────────────
const getDailyInfo = async (req, res) => {
    try {
        const isAuth      = req.user !== null && req.user !== undefined;
        const MAX_GUESSES = isAuth ? 6 : 5;

        let word;
        if (isAuth) {
            word = await getWordForUser(req.user.id);
        } else {
            const guestToken = getGuestToken(req, res);
            word             = await getWordForGuest(guestToken);
        }

        if (!word)
            return res.status(503).json({ message: 'No word available for today. Please try again later.' });

        if (!isAuth) {
            return res.status(200).json({
                wordLength:       word.word.length,
                maxGuesses:       MAX_GUESSES,
                remainingGuesses: MAX_GUESSES,
                isAuth,
                date:             new Date().toISOString().split('T')[0],
            });
        }

        // ── Assign daily missions ─────────────────────────────────────
        await assignDailyMissions(req.user.id);

        const existingGame = await Game.findOne({
            where: { user_id: req.user.id, word_id: word.id },
        });

        if (existingGame) {
            const usedGuesses      = existingGame.attempts;
            const remainingGuesses = existingGame.won
                ? 0
                : Math.max(MAX_GUESSES - usedGuesses, 0);

            return res.status(200).json({
                wordLength:       word.word.length,
                maxGuesses:       MAX_GUESSES,
                remainingGuesses,
                usedGuesses,
                won:              !!existingGame.won,
                guesses:          existingGame.guesses,
                isAuth,
                date:             new Date().toISOString().split('T')[0],
                alreadyPlayed:    existingGame.won || usedGuesses >= MAX_GUESSES,
            });
        }

        return res.status(200).json({
            wordLength:       word.word.length,
            maxGuesses:       MAX_GUESSES,
            remainingGuesses: MAX_GUESSES,
            usedGuesses:      0,
            won:              false,
            isAuth,
            date:             new Date().toISOString().split('T')[0],
            alreadyPlayed:    false,
        });

    } catch (err) {
        console.error('GetDailyInfo error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Submit Guess ─────────────────────────────────────────────────────────────
const submitGuess = async (req, res) => {
    try {
        const { guess } = req.body;

        if (!guess)                      return res.status(400).json({ message: 'Guess is required.' });
        if (guess.length !== 5)          return res.status(400).json({ message: 'Guess must be exactly 5 letters.' });
        if (!/^[a-zA-Z]+$/.test(guess))  return res.status(400).json({ message: 'Guess must contain only letters.' });

        const normalizedGuess = guess.toLowerCase().trim();
        const isAuth          = req.user !== null && req.user !== undefined;
        const MAX_GUESSES     = isAuth ? 6 : 5;

        // ── Validate word exists ──────────────────────────────────────
        const wordExists = await Word.findOne({ where: { word: normalizedGuess } });
        if (!wordExists)
            return res.status(400).json({ message: 'Not in word list.' });

        let word;
        if (isAuth) {
            word = await getWordForUser(req.user.id);
        } else {
            const guestToken = getGuestToken(req, res);
            word             = await getWordForGuest(guestToken);
        }

        if (!word) return res.status(503).json({ message: 'No word available for today.' });

        const answer = word.word.toLowerCase();
        const result = evaluateGuess(normalizedGuess, answer);
        const won    = result.every(r => r === 'correct');

        // ── Guest flow ────────────────────────────────────────────────
        if (!isAuth) {
            return res.status(200).json({
                guess:            normalizedGuess,
                result,
                won,
                remainingGuesses: 0,
                isAuth:           false,
                ...(won && { word: answer }),
            });
        }

        // ── Auth flow ─────────────────────────────────────────────────
        let game = await Game.findOne({
            where: { user_id: req.user.id, word_id: word.id },
        });

        if (game) {
            if (game.won)
                return res.status(400).json({ message: 'You already won today\'s game!' });
            if (game.attempts >= MAX_GUESSES)
                return res.status(400).json({ message: 'You have used all your guesses for today.', word: answer });
        }

        const updatedGuesses  = game
            ? [...game.guesses, { guess: normalizedGuess, result }]
            : [{ guess: normalizedGuess, result }];
        const updatedAttempts = game ? game.attempts + 1 : 1;
        const gameOver        = won || updatedAttempts >= MAX_GUESSES;

        if (!game) {
            game = await Game.create({
                user_id:  req.user.id,
                word_id:  word.id,
                guesses:  updatedGuesses,
                won:      won ? 1 : 0,
                attempts: updatedAttempts,
            });
        } else {
            await game.update({
                guesses:  updatedGuesses,
                won:      won ? 1 : 0,
                attempts: updatedAttempts,
            });
        }

        // ── Game over actions ─────────────────────────────────────────
        let xpResult          = null;
        let completedMissions = [];

        if (gameOver) {
            // ── Update leaderboard ────────────────────────────────────
            const board = await updateLeaderboard(req.user.id, won, updatedAttempts);

            // ── Award classic XP ──────────────────────────────────────
            const xpAmount = calculateClassicXP(won, updatedAttempts);
            xpResult = await awardXP(
                req.user.id,
                won ? 'classic_win' : 'classic_lose',
                xpAmount,
                won
                    ? `Classic win in ${updatedAttempts} attempts`
                    : 'Classic mode participation',
            );

            // ── Award streak bonus XP ─────────────────────────────────
            if (won && board) {
                const streakBonus = calculateStreakBonus(board.current_streak || 0);
                if (streakBonus > 0) {
                    await awardXP(
                        req.user.id,
                        'streak_bonus',
                        streakBonus,
                        `Classic streak bonus (${board.current_streak} wins)`,
                    );
                }
            }

            // ── Check and award badges ────────────────────────────────
            const user = await User.findByPk(req.user.id, {
                attributes: ['id', 'current_level'],
            });

            const totalWinsIn1 = await Game.count({
                where: { user_id: req.user.id, won: 1, attempts: 1 },
            });

            await checkAndAwardBadges(req.user.id, {
                won,
                attempts:     updatedAttempts,
                streak:       board?.current_streak || 0,
                totalGames:   board?.total_games    || 0,
                level:        user?.current_level   || 1,
                totalWinsIn1,
            });

            // ── Count today's games ───────────────────────────────────
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const totalClassicGamesToday = await Game.count({
                where: {
                    user_id:   req.user.id,
                    played_at: { [Op.gte]: todayStart },
                },
            });

            const totalSpeedGamesToday = await SpeedGame.count({
                where: {
                    user_id:   req.user.id,
                    played_at: { [Op.gte]: todayStart },
                },
            });

            const totalGamesToday = totalClassicGamesToday + totalSpeedGamesToday;

            const speedWonToday = await SpeedGame.findOne({
                where: {
                    user_id:   req.user.id,
                    won:       true,
                    played_at: { [Op.gte]: todayStart },
                },
            });

            const classicWonToday = await Game.findOne({
                where: {
                    user_id:   req.user.id,
                    won:       1,
                    played_at: { [Op.gte]: todayStart },
                },
            });

            // ── Check missions ────────────────────────────────────────
            completedMissions = await checkMissionsAfterGame(req.user.id, {
                won,
                isSpeedMode:            false,
                attempts:               updatedAttempts,
                totalGamesToday,
                totalClassicGamesToday,
                totalSpeedGamesToday,
                classicWonToday:        !!classicWonToday,
                speedWonToday:          !!speedWonToday,
                currentStreak:          board?.current_streak || 0,
            });
        }

        return res.status(200).json({
            guess:            normalizedGuess,
            result,
            won,
            attempts:         updatedAttempts,
            remainingGuesses: Math.max(MAX_GUESSES - updatedAttempts, 0),
            gameOver,
            ...(gameOver && { word: answer }),
            ...(gameOver && xpResult && {
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
            }),
        });

    } catch (err) {
        console.error('SubmitGuess error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Check Already Played ─────────────────────────────────────────────────────
const checkAlreadyPlayed = async (req, res) => {
    try {
        const isAuth = req.user !== null && req.user !== undefined;

        if (!isAuth)
            return res.status(200).json({ alreadyPlayed: false, isAuth: false });

        const word = await getWordForUser(req.user.id);
        if (!word) return res.status(503).json({ message: 'No word available for today.' });

        const game = await Game.findOne({
            where: { user_id: req.user.id, word_id: word.id },
        });

        if (!game) return res.status(200).json({ alreadyPlayed: false, isAuth: true });

        const MAX_GUESSES      = 6;
        const alreadyPlayed    = game.won || game.attempts >= MAX_GUESSES;
        const remainingGuesses = Math.max(MAX_GUESSES - game.attempts, 0);

        return res.status(200).json({
            alreadyPlayed,
            isAuth:           true,
            won:              !!game.won,
            attempts:         game.attempts,
            remainingGuesses,
            guesses:          game.guesses,
            ...(alreadyPlayed && { word: word.word }),
        });

    } catch (err) {
        console.error('CheckAlreadyPlayed error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { getDailyInfo, submitGuess, checkAlreadyPlayed };