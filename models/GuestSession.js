const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const Word          = require('./Word');

const GuestSession = sequelize.define('GuestSession', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },
    session_token: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        unique:    true,
    },
    word_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: Word, key: 'id' },
    },
    played_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName:  'guest_sessions',
    timestamps: false,
});

GuestSession.belongsTo(Word, { foreignKey: 'word_id', onDelete: 'CASCADE' });
Word.hasMany(GuestSession,   { foreignKey: 'word_id' });

module.exports = GuestSession;