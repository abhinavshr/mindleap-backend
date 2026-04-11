const { Op } = require('sequelize');
const Word    = require('../models/Word');

const getTodaysWord = async () => {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Check if a word is already assigned for today
        const existingWord = await Word.findOne({ where: { date: today } });

        if (existingWord) {
            console.log(`Today's word already assigned: ${existingWord.word}`);
            return existingWord;
        }

        // No word for today — pick a random unused word
        const unusedWords = await Word.findAll({
            where: {
                is_used: 0,
                date:    { [Op.is]: null },
            },
        });

        if (unusedWords.length === 0) {
            console.warn('No unused words left in the database!');
            return null;
        }

        // Pick a random word from unused list
        const randomIndex = Math.floor(Math.random() * unusedWords.length);
        const chosenWord  = unusedWords[randomIndex];

        // Assign today's date and mark as used
        await chosenWord.update({
            date:    today,
            is_used: 1,
        });

        console.log(`New word assigned for today: ${chosenWord.word}`);
        return chosenWord;

    } catch (err) {
        console.error('Error selecting today\'s word:', err.message);
        throw err;
    }
};

module.exports = { getTodaysWord };