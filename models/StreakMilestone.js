const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');

const StreakMilestone = sequelize.define('StreakMilestone', {
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
    mode: {
        type:      DataTypes.ENUM('classic', 'speed', 'combined'),
        allowNull: false,
    },
    streak_reached: {
        type:      DataTypes.INTEGER,
        allowNull: false,
    },
    milestone_title: {
        type:      DataTypes.STRING(100),
        allowNull: false,
    },
    xp_awarded: {
        type:      DataTypes.INTEGER,
        allowNull: false,
    },
    reached_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName:  'streak_milestones',
    timestamps: false,
});

StreakMilestone.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(StreakMilestone,   { foreignKey: 'user_id' });

module.exports = StreakMilestone;