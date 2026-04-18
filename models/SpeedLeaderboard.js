const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');

const SpeedLeaderboard = sequelize.define('SpeedLeaderboard', {
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
    total_speed_wins: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    total_speed_games: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    best_time: {
        type:         DataTypes.INTEGER,
        allowNull:    true,
        defaultValue: null,
        comment:      'Best time in seconds',
    },
    avg_time: {
        type:         DataTypes.DECIMAL(5, 2),
        allowNull:    false,
        defaultValue: 0.00,
    },
    avg_attempts: {
        type:         DataTypes.DECIMAL(4, 2),
        allowNull:    false,
        defaultValue: 0.00,
    },
    total_xp: {
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
    last_played: {
        type:         DataTypes.DATEONLY,
        allowNull:    true,
        defaultValue: null,
    },
    updated_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName:  'speed_leaderboard',
    timestamps: false,
});

// ─── Associations ─────────────────────────────────────────────────────────────
SpeedLeaderboard.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasOne(SpeedLeaderboard,    { foreignKey: 'user_id' });

module.exports = SpeedLeaderboard;