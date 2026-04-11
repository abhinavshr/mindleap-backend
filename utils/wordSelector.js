const Word = require('../models/Word');
const Game = require('../models/Game');

// ─── Get word for authenticated user ─────────────────────────────────────────
const getWordForUser = async (userId) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Check if user already has a game today
        const existingGame = await Game.findOne({
            where: { user_id: userId },
            include: [{
                model: Word,
                required: true,
            }],
            order: [['played_at', 'DESC']],
        });

        if (existingGame) {
            const gameDate = new Date(existingGame.played_at).toISOString().split('T')[0];
            if (gameDate === today) {
                return existingGame.Word;
            }
        }

        // No game today — pick a random unused word
        return await pickRandomWord();

    } catch (err) {
        console.error('getWordForUser error:', err.message);
        throw err;
    }
};

// ─── Get word for guest (by session token) ────────────────────────────────────
const getWordForGuest = async (sessionToken) => {
    try {
        const GuestSession = require('../models/GuestSession');

        // Check if guest already has a word today
        const today    = new Date().toISOString().split('T')[0];
        const existing = await GuestSession.findOne({
            where: { session_token: sessionToken },
            include: [{ model: Word, required: true }],
        });

        if (existing) {
            const sessionDate = new Date(existing.played_at).toISOString().split('T')[0];
            if (sessionDate === today) {
                return existing.Word;
            }

            // Old session — delete and assign new word
            await existing.destroy();
        }

        // Pick a new random word for this guest
        const word = await pickRandomWord();

        await GuestSession.create({
            session_token: sessionToken,
            word_id:       word.id,
        });

        return word;

    } catch (err) {
        console.error('getWordForGuest error:', err.message);
        throw err;
    }
};

// ─── Pick a random unused word ────────────────────────────────────────────────
const pickRandomWord = async () => {
    const unusedWords = await Word.findAll({ where: { is_used: 0 } });

    if (unusedWords.length === 0) {
        // All words used — reset and reuse
        await Word.update({ is_used: 0 }, { where: {} });
        const allWords   = await Word.findAll();
        const randomIndex = Math.floor(Math.random() * allWords.length);
        return allWords[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    const chosen      = unusedWords[randomIndex];

    await chosen.update({ is_used: 1 });
    return chosen;
};

module.exports = { getWordForUser, getWordForGuest, pickRandomWord };