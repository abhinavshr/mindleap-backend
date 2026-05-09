const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');

const DailyMission = sequelize.define('DailyMission', {
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
    mission_key: {
        type:      DataTypes.STRING(50),
        allowNull: false,
    },
    mission_name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type:      DataTypes.STRING(255),
        allowNull: false,
    },
    xp_reward: {
        type:      DataTypes.INTEGER,
        allowNull: false,
    },
    mission_type: {
        type:         DataTypes.ENUM('daily', 'weekly'),
        allowNull:    false,
        defaultValue: 'daily',
    },
    progress: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
    },
    target: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 1,
    },
    completed: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
    },
    completed_at: {
        type:         DataTypes.DATE,
        allowNull:    true,
        defaultValue: null,
    },
    assigned_date: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
    },
}, {
    tableName:  'daily_missions',
    timestamps: false,
});

DailyMission.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(DailyMission,   { foreignKey: 'user_id' });

module.exports = DailyMission;