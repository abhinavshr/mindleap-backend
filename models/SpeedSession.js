const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const User          = require('./User');
const Word          = require('./Word');

const SpeedSession = sequelize.define('SpeedSession', {
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
    word_id: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: Word, key: 'id' },
    },
    started_at: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
    },
    status: {
        type:         DataTypes.ENUM('active', 'won', 'lost', 'expired'),
        allowNull:    false,
        defaultValue: 'active',
    },
}, {
    tableName:  'speed_sessions',
    timestamps: false,
});

// ─── Associations ─────────────────────────────────────────────────────────────
SpeedSession.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SpeedSession.belongsTo(Word, { foreignKey: 'word_id', onDelete: 'CASCADE' });

User.hasMany(SpeedSession, { foreignKey: 'user_id' });
Word.hasMany(SpeedSession, { foreignKey: 'word_id' });

module.exports = SpeedSession;