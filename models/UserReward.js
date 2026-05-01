const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');

const UserReward = sequelize.define('UserReward', {
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
    reward_type: {
        type:      DataTypes.ENUM('theme', 'title', 'badge_frame'),
        allowNull: false,
    },
    reward_value: {
        type:      DataTypes.STRING(100),
        allowNull: false,
    },
    unlocked_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName:  'user_rewards',
    timestamps: false,
});

UserReward.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(UserReward,   { foreignKey: 'user_id' });

module.exports = UserReward;