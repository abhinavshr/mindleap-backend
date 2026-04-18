const User             = require('./User');
const Word             = require('./Word');
const Game             = require('./Game');
const Leaderboard      = require('./Leaderboard');
const GuestSession     = require('./GuestSession');
const SpeedSession     = require('./SpeedSession');
const SpeedGame        = require('./SpeedGame');
const SpeedLeaderboard = require('./SpeedLeaderboard');

// ─── Classic Game Associations ────────────────────────────────────────────────
User.hasMany(Game,         { foreignKey: 'user_id' });
Game.belongsTo(User,       { foreignKey: 'user_id', onDelete: 'CASCADE' });

Word.hasMany(Game,         { foreignKey: 'word_id' });
Game.belongsTo(Word,       { foreignKey: 'word_id', onDelete: 'CASCADE' });

User.hasOne(Leaderboard,   { foreignKey: 'user_id' });
Leaderboard.belongsTo(User,{ foreignKey: 'user_id', onDelete: 'CASCADE' });

Word.hasMany(GuestSession,        { foreignKey: 'word_id' });
GuestSession.belongsTo(Word,      { foreignKey: 'word_id', onDelete: 'CASCADE' });

// ─── Speed Mode Associations ──────────────────────────────────────────────────
User.hasMany(SpeedSession,        { foreignKey: 'user_id' });
SpeedSession.belongsTo(User,      { foreignKey: 'user_id', onDelete: 'CASCADE' });

Word.hasMany(SpeedSession,        { foreignKey: 'word_id' });
SpeedSession.belongsTo(Word,      { foreignKey: 'word_id', onDelete: 'CASCADE' });

User.hasMany(SpeedGame,           { foreignKey: 'user_id' });
SpeedGame.belongsTo(User,         { foreignKey: 'user_id', onDelete: 'CASCADE' });

Word.hasMany(SpeedGame,           { foreignKey: 'word_id' });
SpeedGame.belongsTo(Word,         { foreignKey: 'word_id', onDelete: 'CASCADE' });

SpeedSession.hasOne(SpeedGame,    { foreignKey: 'session_id' });
SpeedGame.belongsTo(SpeedSession, { foreignKey: 'session_id', onDelete: 'CASCADE' });

User.hasOne(SpeedLeaderboard,        { foreignKey: 'user_id' });
SpeedLeaderboard.belongsTo(User,     { foreignKey: 'user_id', onDelete: 'CASCADE' });

// ─── Export all models ────────────────────────────────────────────────────────
module.exports = {
    User,
    Word,
    Game,
    Leaderboard,
    GuestSession,
    SpeedSession,
    SpeedGame,
    SpeedLeaderboard,
};