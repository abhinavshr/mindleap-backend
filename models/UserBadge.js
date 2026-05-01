const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');

const UserBadge = sequelize.define('UserBadge', {
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
    badge_key: {
        type:      DataTypes.STRING(50),
        allowNull: false,
    },
    badge_name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
    },
    earned_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName:  'user_badges',
    timestamps: false,
});

UserBadge.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(UserBadge,   { foreignKey: 'user_id' });

module.exports = UserBadge;