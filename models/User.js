const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    is_verified: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = User;