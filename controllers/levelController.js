const { Op }                                        = require('sequelize');
const { LEVELS, getLevelFromXP }                    = require('../utils/levelCalculator');
const { BADGES }                                    = require('../utils/badgeChecker');
const { User, UserXpLog, UserBadge, UserReward }    = require('../models');

// ─── Get My Level ─────────────────────────────────────────────────────────────
const getMyLevel = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'total_xp', 'current_level', 'current_title'],
        });

        if (!user) return res.status(404).json({ message: 'User not found.' });

        const levelInfo = getLevelFromXP(user.total_xp || 0);

        const recentXpLog = await UserXpLog.findAll({
            where: { user_id: req.user.id },
            limit: 10,
            order: [['earned_at', 'DESC']],
        });

        return res.status(200).json({
            username:       user.username,
            currentLevel:   levelInfo.level,
            currentTitle:   levelInfo.title,
            totalXp:        levelInfo.totalXp,
            currentLevelXp: levelInfo.currentLevelXp,
            nextLevelXp:    levelInfo.nextLevelXp,
            xpToNextLevel:  levelInfo.xpToNextLevel,
            progressPercent:levelInfo.progressPercent,
            isMaxLevel:     levelInfo.isMaxLevel,
            recentXpLog,
        });

    } catch (err) {
        console.error('GetMyLevel error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get My Badges ────────────────────────────────────────────────────────────
const getMyBadges = async (req, res) => {
    try {
        const earned = await UserBadge.findAll({
            where: { user_id: req.user.id },
            order: [['earned_at', 'DESC']],
        });

        const earnedKeys = earned.map(b => b.badge_key);

        // ── Show all badges, mark locked ones ────────────────────────
        const allBadges = BADGES.map(badge => ({
            ...badge,
            earned:     earnedKeys.includes(badge.key),
            earned_at:  earned.find(b => b.badge_key === badge.key)?.earned_at || null,
        }));

        return res.status(200).json({
            total_earned: earned.length,
            total_badges: BADGES.length,
            badges:       allBadges,
        });

    } catch (err) {
        console.error('GetMyBadges error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get My Rewards ───────────────────────────────────────────────────────────
const getMyRewards = async (req, res) => {
    try {
        const rewards = await UserReward.findAll({
            where: { user_id: req.user.id },
            order: [['unlocked_at', 'DESC']],
        });

        return res.status(200).json({
            total:   rewards.length,
            rewards,
        });

    } catch (err) {
        console.error('GetMyRewards error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get Level Definitions ────────────────────────────────────────────────────
const getLevelDefinitions = async (req, res) => {
    try {
        return res.status(200).json({
            total:  LEVELS.length,
            levels: LEVELS,
        });
    } catch (err) {
        console.error('GetLevelDefinitions error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─── Get XP Leaderboard ───────────────────────────────────────────────────────
const getXpLeaderboard = async (req, res) => {
    try {
        const users = await User.findAll({
            limit:      20,
            order:      [['total_xp', 'DESC']],
            attributes: ['id', 'username', 'total_xp', 'current_level', 'current_title'],
        });

        // ── Add badge count per user ──────────────────────────────────
        const ranked = await Promise.all(users.map(async (user, index) => {
            const badgeCount = await UserBadge.count({ where: { user_id: user.id } });
            return {
                rank:          index + 1,
                username:      user.username,
                level:         user.current_level,
                title:         user.current_title,
                total_xp:      user.total_xp,
                badge_count:   badgeCount,
            };
        }));

        return res.status(200).json({
            leaderboard: ranked,
            total:       ranked.length,
        });

    } catch (err) {
        console.error('GetXpLeaderboard error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { getMyLevel, getMyBadges, getMyRewards, getLevelDefinitions, getXpLeaderboard };