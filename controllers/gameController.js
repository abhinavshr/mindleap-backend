const { Op }            = require('sequelize');
const { getTodaysWord } = require('../utils/wordSelector');
const Game              = require('../models/Game');
const Leaderboard       = require('../models/Leaderboard');

// ─── Get Daily Info ───────────────────────────────────────────────────────────
const getDailyInfo = async (req, res) => {
    try {
        const word = await getTodaysWord();

        if (!word) {
            return res.status(503).json({ message: 'No word available for today. Please try again later.' });
        }

        const isAuth      = req.user !== null && req.user !== undefined;
        const MAX_GUESSES = isAuth ? 6 : 1;

        if (!isAuth) {
            return res.status(200).json({
                wordLength:       word.word.length,
                maxGuesses:       MAX_GUESSES,
                remainingGuesses: MAX_GUESSES,
                isAuth,
                date:             word.date,
            });
        }

        // ── Check if auth user already played today ───────────────────
        const existingGame = await Game.findOne({
            where: {
                user_id: req.user.id,
                word_id: word.id,
            },
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
                date:             word.date,
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
            date:             word.date,
            alreadyPlayed:    false,
        });

    } catch (err) {
        console.error('GetDailyInfo error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Helper: evaluate guess ───────────────────────────────────────────────────
const evaluateGuess = (guess, answer) => {
    const result    = Array(5).fill('absent');
    const answerArr = answer.split('');
    const guessArr  = guess.split('');
    const answerMap = {};

    // ── First pass: mark correct letters ─────────────────────────────
    guessArr.forEach((letter, i) => {
        if (letter === answerArr[i]) {
            result[i]        = 'correct';
            answerArr[i]     = null;
            guessArr[i]      = null;
        }
    });

    // ── Second pass: mark present letters ────────────────────────────
    guessArr.forEach((letter, i) => {
        if (!letter) return;
        const foundIndex = answerArr.indexOf(letter);
        if (foundIndex !== -1) {
            result[i]              = 'present';
            answerArr[foundIndex]  = null;
        }
    });

    return result;
};

// ─── Helper: update leaderboard ───────────────────────────────────────────────
const updateLeaderboard = async (userId, won, attempts) => {
    let board = await Leaderboard.findOne({ where: { user_id: userId } });

    if (!board) {
        // Create new leaderboard entry
        board = await Leaderboard.create({
            user_id:        userId,
            total_wins:     won ? 1 : 0,
            total_games:    1,
            current_streak: won ? 1 : 0,
            max_streak:     won ? 1 : 0,
            avg_attempts:   attempts,
            last_played:    new Date(),
        });
        return board;
    }

    const newTotalGames  = board.total_games + 1;
    const newTotalWins   = board.total_wins + (won ? 1 : 0);
    const newStreak      = won ? board.current_streak + 1 : 0;
    const newMaxStreak   = Math.max(board.max_streak, newStreak);
    const newAvg         = parseFloat(
        ((board.avg_attempts * board.total_games + attempts) / newTotalGames).toFixed(2)
    );

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

// ─── Submit Guess ─────────────────────────────────────────────────────────────
const submitGuess = async (req, res) => {
    try {
        const { guess } = req.body;

        // ── Validate guess ────────────────────────────────────────────
        if (!guess) {
            return res.status(400).json({ message: 'Guess is required.' });
        }

        if (guess.length !== 5) {
            return res.status(400).json({ message: 'Guess must be exactly 5 letters.' });
        }

        if (!/^[a-zA-Z]+$/.test(guess)) {
            return res.status(400).json({ message: 'Guess must contain only letters.' });
        }

        const normalizedGuess = guess.toLowerCase().trim();

        // ── Get today's word ──────────────────────────────────────────
        const word = await getTodaysWord();
        if (!word) {
            return res.status(503).json({ message: 'No word available for today.' });
        }

        const isAuth      = req.user !== null && req.user !== undefined;
        const MAX_GUESSES = isAuth ? 6 : 5;
        const answer      = word.word.toLowerCase();

        // ── Evaluate guess ────────────────────────────────────────────
        const result = evaluateGuess(normalizedGuess, answer);
        const won    = result.every(r => r === 'correct');

        // ── Guest flow ────────────────────────────────────────────────
        if (!isAuth) {
            return res.status(200).json({
                guess:            normalizedGuess,
                result,
                won,
                remainingGuesses: won ? 0 : 0,   
                isAuth:           false,
                ...(won || true ? {} : {}),        
            });
        }

        // ── Auth flow ─────────────────────────────────────────────────
        let game = await Game.findOne({
            where: {
                user_id: req.user.id,
                word_id: word.id,
            },
        });

        // ── Check already played ──────────────────────────────────────
        if (game) {
            if (game.won) {
                return res.status(400).json({ message: 'You already won today\'s game!' });
            }
            if (game.attempts >= MAX_GUESSES) {
                return res.status(400).json({
                    message: 'You have used all your guesses for today.',
                    word:    answer,
                });
            }
        }

        // ── Save or update game ───────────────────────────────────────
        const updatedGuesses  = game ? [...game.guesses, { guess: normalizedGuess, result }] : [{ guess: normalizedGuess, result }];
        const updatedAttempts = game ? game.attempts + 1 : 1;
        const isLastGuess     = updatedAttempts >= MAX_GUESSES;
        const gameOver        = won || isLastGuess;

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

        // ── Update leaderboard if game over ───────────────────────────
        if (gameOver) {
            await updateLeaderboard(req.user.id, won, updatedAttempts);
        }

        const remainingGuesses = Math.max(MAX_GUESSES - updatedAttempts, 0);

        return res.status(200).json({
            guess:            normalizedGuess,
            result,
            won,
            attempts:         updatedAttempts,
            remainingGuesses,
            gameOver,
            ...(gameOver && { word: answer }),   
        });

    } catch (err) {
        console.error('SubmitGuess error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Check Already Played ─────────────────────────────────────────────────────
const checkAlreadyPlayed = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({ alreadyPlayed: false, isAuth: false });
        }

        const word = await getTodaysWord();
        if (!word) {
            return res.status(503).json({ message: 'No word available for today.' });
        }

        const game = await Game.findOne({
            where: {
                user_id: req.user.id,
                word_id: word.id,
            },
        });

        if (!game) {
            return res.status(200).json({ alreadyPlayed: false, isAuth: true });
        }

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