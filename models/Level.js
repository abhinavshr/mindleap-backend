const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const Level = sequelize.define('Level', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },
    level_number: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        unique:    true,
    },
    title: {
        type:      DataTypes.STRING(50),
        allowNull: false,
    },
    xp_required: {
        type:      DataTypes.INTEGER,
        allowNull: false,
    },
    total_xp_needed: {
        type:      DataTypes.INTEGER,
        allowNull: false,
    },
    reward_type: {
        type:      DataTypes.STRING(50),
        allowNull: true,
    },
    reward_value: {
        type:      DataTypes.STRING(100),
        allowNull: true,
    },
}, {
    tableName:  'levels',
    timestamps: false,
});

module.exports = Level;