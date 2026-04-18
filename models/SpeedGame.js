const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');
const Word          = require('./Word');
const SpeedSession  = require('./SpeedSession');

const SpeedGame = sequelize.define('SpeedGame', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },
    user_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: User, key: 'id' },
    },
    word_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: Word, key: 'id' },
    },
    session_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: SpeedSession, key: 'id' },
    },
    guesses: {
        type:         DataTypes.JSON,
        allowNull:    false,
        defaultValue: [],
    },
    won: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
    },
    attempts: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    time_taken: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
        comment:      'Time taken in seconds',
    },
    xp_earned: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    played_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName:  'speed_games',
    timestamps: false,
});

// ─── Associations ─────────────────────────────────────────────────────────────
SpeedGame.belongsTo(User,         { foreignKey: 'user_id',    onDelete: 'CASCADE' });
SpeedGame.belongsTo(Word,         { foreignKey: 'word_id',    onDelete: 'CASCADE' });
SpeedGame.belongsTo(SpeedSession, { foreignKey: 'session_id', onDelete: 'CASCADE' });

User.hasMany(SpeedGame,         { foreignKey: 'user_id' });
Word.hasMany(SpeedGame,         { foreignKey: 'word_id' });
SpeedSession.hasMany(SpeedGame, { foreignKey: 'session_id' });

module.exports = SpeedGame;