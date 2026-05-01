const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');

const UserXpLog = sequelize.define('UserXpLog', {
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
    source: {
        type:      DataTypes.ENUM(
            'classic_win',
            'classic_lose',
            'speed_win',
            'speed_lose',
            'streak_bonus',
            'first_game',
            'first_win',
            'level_up_bonus',
            'profile_complete',
            'login_streak'
        ),
        allowNull: false,
    },
    xp_amount: {
        type:      DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type:      DataTypes.STRING(255),
        allowNull: true,
    },
    earned_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName:  'user_xp_log',
    timestamps: false,
});

UserXpLog.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(UserXpLog,   { foreignKey: 'user_id' });

module.exports = UserXpLog;