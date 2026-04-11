const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const Word = sequelize.define('Word', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },
    word: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        unique:    true,
    },
    date: {
        type:         DataTypes.DATEONLY,
        allowNull:    true,
        defaultValue: null,
    },
    is_used: {
        type:         DataTypes.TINYINT,
        allowNull:    false,
        defaultValue: 0,
    },
}, {
    tableName:  'words',
    timestamps: false,
});

module.exports = Word;