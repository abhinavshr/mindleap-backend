const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');
const Word          = require('./Word');

const Game = sequelize.define('Game', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },
    user_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: {
            model: User,
            key:   'id',
        },
    },
    word_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: {
            model: Word,
            key:   'id',
        },
    },
    guesses: {
        type:      DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    won: {
        type:         DataTypes.TINYINT,
        allowNull:    false,
        defaultValue: 0,
    },
    attempts: {
        type:         DataTypes.TINYINT,
        allowNull:    false,
        defaultValue: 0,
    },
}, {
    tableName:  'games',
    timestamps: true,
    createdAt:  'played_at',
    updatedAt:  false,
});

// ─── Associations ─────────────────────────────────────────────────────────────
Game.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Game.belongsTo(Word, { foreignKey: 'word_id', onDelete: 'CASCADE' });

User.hasMany(Game, { foreignKey: 'user_id' });
Word.hasMany(Game, { foreignKey: 'word_id' });

module.exports = Game;