const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');

const Leaderboard = sequelize.define('Leaderboard', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },
    user_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        unique:     true,
        references: { model: User, key: 'id' },
    },
    total_wins: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    total_games: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    current_streak: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    max_streak: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    avg_attempts: {
        type:         DataTypes.DECIMAL(4, 2),
        allowNull:    false,
        defaultValue: 0.00,
    },
    last_played: {
        type:         DataTypes.DATE,
        allowNull:    true,
        defaultValue: null,
    },
}, {
    tableName:  'leaderboard',
    timestamps: false,
});

Leaderboard.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasOne(Leaderboard,    { foreignKey: 'user_id' });

module.exports = Leaderboard;