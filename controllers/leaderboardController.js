const { Op }        = require('sequelize');
const sequelize     = require('../config/db');
const Leaderboard   = require('../models/Leaderboard');
const User          = require('../models/User');

// ─── Get Leaderboard ──────────────────────────────────────────────────────────
const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Leaderboard.findAll({
            limit:   20,
            order:   [
                ['total_wins',   'DESC'],
                ['avg_attempts', 'ASC'],
                ['max_streak',   'DESC'],
            ],
            include: [{
                model:      User,
                attributes: ['username'],
            }],
            attributes: [
                'id',
                'user_id',
                'total_wins',
                'total_games',
                'current_streak',
                'max_streak',
                'avg_attempts',
                'last_played',
            ],
        });

        // ── Add rank to each entry ────────────────────────────────────
        const ranked = leaderboard.map((entry, index) => ({
            rank:           index + 1,
            username:       entry.User.username,
            total_wins:     entry.total_wins,
            total_games:    entry.total_games,
            current_streak: entry.current_streak,
            max_streak:     entry.max_streak,
            avg_attempts:   entry.avg_attempts,
            last_played:    entry.last_played,
            win_rate:       entry.total_games > 0
                ? parseFloat((entry.total_wins / entry.total_games * 100).toFixed(1))
                : 0,
        }));

        return res.status(200).json({
            leaderboard: ranked,
            total:       ranked.length,
        });

    } catch (err) {
        console.error('GetLeaderboard error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get My Rank ──────────────────────────────────────────────────────────────
// Logged-in user's rank and stats
const getMyRank = async (req, res) => {
    try {
        // ── Get user's own stats ──────────────────────────────────────
        const myStats = await Leaderboard.findOne({
            where:   { user_id: req.user.id },
            include: [{
                model:      User,
                attributes: ['username'],
            }],
        });

        if (!myStats) {
            return res.status(200).json({
                message:  'You have not played any games yet.',
                hasPlayed: false,
            });
        }

        // ── Count how many users have more wins ───────────────────────
        const usersAbove = await Leaderboard.count({
            where: {
                [Op.or]: [
                    // More wins
                    { total_wins: { [Op.gt]: myStats.total_wins } },
                    // Same wins but better avg attempts
                    {
                        total_wins:   myStats.total_wins,
                        avg_attempts: { [Op.lt]: myStats.avg_attempts },
                    },
                    // Same wins, same avg but higher max streak
                    {
                        total_wins:   myStats.total_wins,
                        avg_attempts: myStats.avg_attempts,
                        max_streak:   { [Op.gt]: myStats.max_streak },
                    },
                ],
            },
        });

        const myRank = usersAbove + 1;

        return res.status(200).json({
            hasPlayed:      true,
            rank:           myRank,
            username:       myStats.User.username,
            total_wins:     myStats.total_wins,
            total_games:    myStats.total_games,
            current_streak: myStats.current_streak,
            max_streak:     myStats.max_streak,
            avg_attempts:   myStats.avg_attempts,
            last_played:    myStats.last_played,
            win_rate:       myStats.total_games > 0
                ? parseFloat((myStats.total_wins / myStats.total_games * 100).toFixed(1))
                : 0,
        });

    } catch (err) {
        console.error('GetMyRank error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { getLeaderboard, getMyRank };